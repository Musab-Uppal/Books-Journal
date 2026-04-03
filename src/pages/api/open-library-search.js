function cleanIsbn(raw) {
  if (typeof raw !== "string") {
    return "";
  }

  return raw.toUpperCase().replace(/[^0-9X]/g, "");
}

function normalizeText(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenOverlapScore(a, b) {
  const tokensA = new Set(normalizeText(a).split(" ").filter(Boolean));
  const tokensB = new Set(normalizeText(b).split(" ").filter(Boolean));

  if (!tokensA.size || !tokensB.size) {
    return 0;
  }

  let overlap = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      overlap += 1;
    }
  }

  return overlap / Math.max(tokensA.size, tokensB.size);
}

function scoreDoc(doc, title, author) {
  const docTitle = String(doc?.title || "");
  const docAuthor = Array.isArray(doc?.author_name)
    ? doc.author_name.join(" ")
    : "";

  const titleNorm = normalizeText(title);
  const authorNorm = normalizeText(author);
  const docTitleNorm = normalizeText(docTitle);
  const docAuthorNorm = normalizeText(docAuthor);

  let score = 0;

  if (titleNorm) {
    if (docTitleNorm === titleNorm) {
      score += 10;
    }
    if (docTitleNorm.includes(titleNorm) || titleNorm.includes(docTitleNorm)) {
      score += 6;
    }
    score += tokenOverlapScore(titleNorm, docTitleNorm) * 5;
  }

  if (authorNorm) {
    if (
      docAuthorNorm.includes(authorNorm) ||
      authorNorm.includes(docAuthorNorm)
    ) {
      score += 4;
    }
    score += tokenOverlapScore(authorNorm, docAuthorNorm) * 4;
  }

  if (Array.isArray(doc?.isbn) && doc.isbn.length) {
    score += 1;
  }

  return score;
}

async function fetchOpenLibraryDocs(params) {
  if (!params.has("fields")) {
    params.set("fields", "key,title,author_name,first_publish_year,isbn,ia");
  }

  const response = await fetch(
    `https://openlibrary.org/search.json?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    return [];
  }

  const payload = await response.json();
  return Array.isArray(payload?.docs) ? payload.docs : [];
}

function pickIsbn(isbns) {
  if (!Array.isArray(isbns)) {
    return "";
  }

  for (const candidate of isbns) {
    const isbn = cleanIsbn(candidate);
    if (/^\d{10}$/.test(isbn) || /^\d{13}$/.test(isbn)) {
      return isbn;
    }
  }

  return "";
}

function pickIsbnFromIa(iaEntries) {
  if (!Array.isArray(iaEntries)) {
    return "";
  }

  for (const entry of iaEntries) {
    const value = String(entry || "");
    const match = value.match(/^isbn[_-]([0-9Xx-]+)$/);
    if (!match) {
      continue;
    }

    const isbn = cleanIsbn(match[1]);
    if (/^\d{10}$/.test(isbn) || /^\d{13}$/.test(isbn)) {
      return isbn;
    }
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
  const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 12);

  if (!title && !author) {
    return res.status(400).json({ error: "Provide at least title or author" });
  }

  try {
    const normalizedTitle = normalizeText(title);
    const normalizedAuthor = normalizeText(author);
    const combinedRaw = [title, author].filter(Boolean).join(" ").trim();
    const combinedNormalized = [normalizedTitle, normalizedAuthor]
      .filter(Boolean)
      .join(" ")
      .trim();

    const candidateDocs = [];

    const focusedParams = new URLSearchParams();
    if (title) {
      focusedParams.set("title", title);
    }
    if (author) {
      focusedParams.set("author", author);
    }
    focusedParams.set("limit", String(limit * 5));
    candidateDocs.push(...(await fetchOpenLibraryDocs(focusedParams)));

    if (combinedRaw) {
      const broadParams = new URLSearchParams();
      broadParams.set("q", combinedRaw);
      broadParams.set("limit", String(limit * 5));
      candidateDocs.push(...(await fetchOpenLibraryDocs(broadParams)));
    }

    if (combinedNormalized && combinedNormalized !== combinedRaw) {
      const normalizedParams = new URLSearchParams();
      normalizedParams.set("q", combinedNormalized);
      normalizedParams.set("limit", String(limit * 5));
      candidateDocs.push(...(await fetchOpenLibraryDocs(normalizedParams)));
    }

    if (!candidateDocs.length) {
      return res.status(502).json({ error: "Open Library request failed" });
    }

    const docs = candidateDocs
      .map((doc) => ({ doc, score: scoreDoc(doc, title, author) }))
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.doc);

    const unique = new Set();
    const results = [];

    for (const doc of docs) {
      const isbn = pickIsbn(doc?.isbn) || pickIsbnFromIa(doc?.ia);
      if (!isbn) {
        continue;
      }

      if (unique.has(isbn)) {
        continue;
      }

      unique.add(isbn);
      results.push({
        id: `${doc?.key || doc?.title || "book"}-${isbn}`,
        title: doc?.title || "Untitled",
        author: Array.isArray(doc?.author_name)
          ? doc.author_name[0] || "Unknown"
          : "Unknown",
        year: doc?.first_publish_year || null,
        isbn,
        coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
      });

      if (results.length >= limit) {
        break;
      }
    }

    return res.status(200).json({ results });
  } catch {
    return res.status(500).json({ error: "Could not search books right now" });
  }
}
