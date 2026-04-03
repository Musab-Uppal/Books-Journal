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

const NON_ORIGINAL_TITLE_MARKERS = [
  "sparknotes",
  "cliffsnotes",
  "study guide",
  "study guides",
  "teacher guide",
  "teachers guide",
  "analysis",
  "summary",
  "summaries",
  "workbook",
  "graphic novel",
  "illustrated",
  "adaptation",
  "adapted",
  "retold",
  "abridged",
  "comic",
  "manga",
  "bookrags",
  "lesson plan",
  "test prep",
  "exam prep",
  "quick study",
  "companion guide",
  "lit chart",
  "litcharts",
  "maxnotes",
  "supersummary",
  "omnibus",
  "collection",
  "boxed set",
  "complete novels",
];

function hasNonOriginalMarker(title) {
  const titleNorm = normalizeText(title);
  return NON_ORIGINAL_TITLE_MARKERS.some((marker) =>
    titleNorm.includes(normalizeText(marker)),
  );
}

function countExtraTitleTokens(titleNorm, docTitleNorm) {
  const queryTokens = new Set(titleNorm.split(" ").filter(Boolean));
  const docTokens = [...new Set(docTitleNorm.split(" ").filter(Boolean))];

  let extra = 0;
  for (const token of docTokens) {
    if (!queryTokens.has(token)) {
      extra += 1;
    }
  }

  return extra;
}

function hasStrongAuthorMatch(doc, authorNorm) {
  if (!authorNorm) {
    return true;
  }

  const docAuthor = Array.isArray(doc?.author_name)
    ? doc.author_name.join(" ")
    : "";
  const docAuthorNorm = normalizeText(docAuthor);

  if (!docAuthorNorm) {
    return false;
  }

  if (docAuthorNorm === authorNorm) {
    return true;
  }

  if (
    docAuthorNorm.includes(authorNorm) ||
    authorNorm.includes(docAuthorNorm)
  ) {
    return true;
  }

  return tokenOverlapScore(authorNorm, docAuthorNorm) >= 0.45;
}

function hasStrongTitleMatch(doc, titleNorm) {
  if (!titleNorm) {
    return true;
  }

  const docTitleNorm = normalizeText(doc?.title || "");
  if (!docTitleNorm) {
    return false;
  }

  if (docTitleNorm === titleNorm) {
    return true;
  }

  const overlap = tokenOverlapScore(titleNorm, docTitleNorm);
  const extraTitleTokens = countExtraTitleTokens(titleNorm, docTitleNorm);

  if (overlap >= 0.6) {
    return true;
  }

  if (docTitleNorm.startsWith(titleNorm) && extraTitleTokens <= 4) {
    return true;
  }

  return titleNorm.includes(docTitleNorm) && overlap >= 0.5;
}

function dedupeCandidateDocs(docs) {
  const seen = new Set();
  const uniqueDocs = [];

  for (const doc of docs) {
    const key = String(doc?.key || "");
    const title = normalizeText(doc?.title || "");
    const author = normalizeText(
      Array.isArray(doc?.author_name) ? doc.author_name[0] || "" : "",
    );
    const year = String(doc?.first_publish_year || "");
    const identity = key || `${title}|${author}|${year}`;

    if (!identity || seen.has(identity)) {
      continue;
    }

    seen.add(identity);
    uniqueDocs.push(doc);
  }

  return uniqueDocs;
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
    const titleOverlap = tokenOverlapScore(titleNorm, docTitleNorm);
    const extraTitleTokens = countExtraTitleTokens(titleNorm, docTitleNorm);

    if (docTitleNorm === titleNorm) {
      score += 24;
    }
    if (docTitleNorm.startsWith(titleNorm)) {
      score += 6;
    }
    if (docTitleNorm.includes(titleNorm) || titleNorm.includes(docTitleNorm)) {
      score += 4;
    }
    score += titleOverlap * 12;

    if (titleOverlap < 0.35) {
      score -= 12;
    }

    const extraTitleLength = Math.max(
      docTitleNorm.length - titleNorm.length,
      0,
    );
    score -= Math.min(extraTitleLength / 12, 4);
    score -= extraTitleTokens * 1.8;

    if (extraTitleTokens >= 5) {
      score -= 8;
    }
  }

  if (authorNorm) {
    const authorOverlap = tokenOverlapScore(authorNorm, docAuthorNorm);

    if (docAuthorNorm === authorNorm) {
      score += 14;
    }
    if (
      docAuthorNorm.includes(authorNorm) ||
      authorNorm.includes(docAuthorNorm)
    ) {
      score += 8;
    }
    score += authorOverlap * 10;

    if (authorOverlap < 0.25) {
      score -= 10;
    }
  }

  if (hasNonOriginalMarker(docTitleNorm)) {
    score -= 20;
  }

  if (Array.isArray(doc?.isbn) && doc.isbn.length) {
    score += 1;
  }

  return score;
}

function isEnglishDoc(doc) {
  const languages = Array.isArray(doc?.language) ? doc.language : [];
  for (const language of languages) {
    const value = String(language || "").toLowerCase();
    if (value === "eng" || value === "en" || value.includes("/languages/eng")) {
      return true;
    }
  }

  return false;
}

async function fetchOpenLibraryDocs(params) {
  if (!params.has("fields")) {
    params.set(
      "fields",
      "key,title,author_name,first_publish_year,isbn,ia,language",
    );
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

    const uniqueCandidateDocs = dedupeCandidateDocs(candidateDocs);

    const authorFilteredDocs = normalizedAuthor
      ? uniqueCandidateDocs.filter((doc) =>
          hasStrongAuthorMatch(doc, normalizedAuthor),
        )
      : uniqueCandidateDocs;

    const titleFilteredDocs = normalizedTitle
      ? authorFilteredDocs.filter((doc) =>
          hasStrongTitleMatch(doc, normalizedTitle),
        )
      : authorFilteredDocs;

    const docsForRanking = titleFilteredDocs.length
      ? titleFilteredDocs
      : authorFilteredDocs.length
        ? authorFilteredDocs
        : uniqueCandidateDocs;

    const rankedDocs = docsForRanking
      .map((doc) => ({
        doc,
        score: scoreDoc(doc, title, author),
        english: isEnglishDoc(doc),
      }))
      .sort((a, b) => {
        if (a.english !== b.english) {
          return a.english ? -1 : 1;
        }
        return b.score - a.score;
      });

    const hasEnglishMatches = rankedDocs.some((entry) => entry.english);
    const docs = rankedDocs
      .filter((entry) => (hasEnglishMatches ? entry.english : true))
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
