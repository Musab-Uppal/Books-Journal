// Fill these parameters with your own values.
// You can hardcode them here or provide them via environment variables.

export const groqIsbnConfig = {
  apiKey: process.env.GROQ_API_KEY || "",
  endpoint:
    process.env.GROQ_ENDPOINT ||
    "https://api.groq.com/openai/v1/chat/completions",

  // Parameters you provided
  model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  temperature: Number(process.env.GROQ_TEMPERATURE || 1),
  maxCompletionTokens: Number(process.env.GROQ_MAX_COMPLETION_TOKENS || 8192),
  topP: Number(process.env.GROQ_TOP_P || 1),
  reasoningEffort: process.env.GROQ_REASONING_EFFORT || "medium",
  stream: String(process.env.GROQ_STREAM || "true") === "true",
};
