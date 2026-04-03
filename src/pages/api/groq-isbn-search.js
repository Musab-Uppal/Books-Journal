import { groqIsbnConfig } from "@/lib/groq-isbn-config";

function cleanIsbn(raw) {
  return String(raw || "").replace(/\D/g, "");
}

function isValidIsbn(isbn) {
  return /^\d{13}$/.test(isbn);
}

function safeNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function shouldRetryWithLowerTokens(errorText) {
  const normalized = String(errorText || "").toLowerCase();
  return (
    normalized.includes("tokens per minute") ||
    normalized.includes("rate_limit_exceeded") ||
    normalized.includes("request too large")
  );
}

function extractContentFromStreamText(streamText) {
  const lines = String(streamText || "").split(/\r?\n/);
  let content = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) {
      continue;
    }

    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") {
      continue;
    }

    try {
      const chunk = JSON.parse(payload);
      const delta = chunk?.choices?.[0]?.delta?.content;
      if (typeof delta === "string") {
        content += delta;
      }
    } catch {
      // Ignore malformed streaming chunks.
    }
  }

  return content.trim();
}

async function readGroqContent(response, streamEnabled) {
  if (streamEnabled) {
    const streamText = await response.text();
    return extractContentFromStreamText(streamText);
  }

  const payload = await response.json();
  return payload?.choices?.[0]?.message?.content || "";
}

function extractIsbn13FromText(content) {
  const text = String(content || "");

  const tokenCandidates =
    text.match(/(?:97[89][\s-]?(?:\d[\s-]?){10}|\b(?:\d[\s-]?){13}\b)/g) || [];

  for (const candidate of tokenCandidates) {
    const isbn = cleanIsbn(candidate);
    if (isValidIsbn(isbn)) {
      return isbn;
    }
  }

  const flattened = cleanIsbn(text);
  const prefixed = flattened.match(/97[89]\d{10}/);
  if (prefixed) {
    return prefixed[0];
  }

  const generic = flattened.match(/\d{13}/);
  if (generic) {
    return generic[0];
  }

  return "";
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const title = String(req.query.title || "").trim();
  const author = String(req.query.author || "").trim();

  if (!title && !author) {
    return res.status(400).json({ error: "Provide at least title or author" });
  }

  if (!groqIsbnConfig.apiKey || !groqIsbnConfig.model) {
    return res.status(500).json({
      error:
        "Groq is not configured. Fill src/lib/groq-isbn-config.js (apiKey and model) or set GROQ_API_KEY and GROQ_MODEL.",
    });
  }

  const promptTemplate =
    "return me 13 or 10 digit isbn number for book {book} by {author}";
  const userPrompt = promptTemplate
    .replace("{book}", title || "")
    .replace("{author}", author || "");

  try {
    const streamEnabled = Boolean(groqIsbnConfig.stream);
    const configuredMax = safeNumber(groqIsbnConfig.maxCompletionTokens, 512);
    const cappedMax = Math.min(Math.max(configuredMax, 128), 700);

    const buildRequestBody = (maxCompletionTokens) => ({
      model: groqIsbnConfig.model,
      messages: [{ role: "user", content: userPrompt }],
      stream: streamEnabled,
      temperature: groqIsbnConfig.temperature,
      max_completion_tokens: maxCompletionTokens,
      top_p: groqIsbnConfig.topP,
      reasoning_effort: groqIsbnConfig.reasoningEffort,
    });

    const requestOnce = async (maxCompletionTokens) => {
      const requestBody = buildRequestBody(maxCompletionTokens);
      return fetch(groqIsbnConfig.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqIsbnConfig.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });
    };

    let response = await requestOnce(cappedMax);

    if (!response.ok) {
      const details = await response.text();
      if (shouldRetryWithLowerTokens(details) && cappedMax > 192) {
        response = await requestOnce(192);
      } else {
        return res
          .status(502)
          .json({ error: details || "Groq request failed" });
      }
    }

    if (!response.ok) {
      const details = await response.text();
      return res.status(502).json({ error: details || "Groq request failed" });
    }

    const content = await readGroqContent(response, streamEnabled);
    if (!content) {
      return res.status(502).json({ error: "Empty Groq response" });
    }

    const isbn = extractIsbn13FromText(content);
    if (!isbn) {
      return res.status(200).json({ results: [] });
    }

    return res.status(200).json({
      results: [
        {
          title: title || "Untitled",
          author: author || "Unknown",
          isbn,
        },
      ],
    });
  } catch {
    return res.status(500).json({ error: "Could not search books right now" });
  }
}
