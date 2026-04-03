import { z } from "zod";

const isbnRegex = /^(?:\d{10}|\d{13})$/;

export const authSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password is too long"),
});

export const bookSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title is too long"),
  isbn: z
    .string()
    .trim()
    .regex(isbnRegex, "ISBN must be exactly 10 or 13 digits"),
  rating: z.coerce
    .number()
    .int("Rating must be a whole number")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be 5 or below"),
  date_read: z.string().trim().min(1, "Date read is required"),
});

export const noteSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Note title is required")
    .max(150, "Title is too long"),
  content: z
    .string()
    .trim()
    .min(1, "Note content is required")
    .max(5000, "Content is too long"),
});
