import { format } from "date-fns";
import { getOpenLibraryBaseUrl } from "@/lib/env";

export function buildCoverUrl(isbn) {
  const base = getOpenLibraryBaseUrl().replace(/\/$/, "");
  return `${base}/${isbn}-M.jpg`;
}

export function formatDate(dateString) {
  if (!dateString) {
    return "-";
  }

  try {
    return format(new Date(dateString), "MMM dd, yyyy");
  } catch {
    return dateString;
  }
}

export function calculateAverageRating(books) {
  if (!books.length) {
    return 0;
  }

  const total = books.reduce((sum, book) => sum + Number(book.rating || 0), 0);
  return Number((total / books.length).toFixed(2));
}
