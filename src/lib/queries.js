import { supabase } from "@/lib/supabase";

function requireUserId(userId) {
  if (!userId) {
    throw new Error("Missing user context");
  }

  return userId;
}

export async function fetchBooksByUser(userId, search = "") {
  const scopedUserId = requireUserId(userId);

  let query = supabase
    .from("books")
    .select(
      "id, isbn, title, rating, date_read, cover_url, user_id, created_at, updated_at",
    )
    .eq("user_id", scopedUserId)
    .order("created_at", { ascending: false });

  if (search.trim()) {
    const token = search.trim();
    query = query.or(`title.ilike.%${token}%,isbn.ilike.%${token}%`);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return (data || []).filter((book) => book.user_id === scopedUserId);
}

export async function fetchBookById(bookId, userId) {
  const scopedUserId = requireUserId(userId);

  const { data, error } = await supabase
    .from("books")
    .select(
      "id, isbn, title, rating, date_read, cover_url, user_id, created_at, updated_at",
    )
    .eq("id", bookId)
    .eq("user_id", scopedUserId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function insertBook(payload) {
  const { data, error } = await supabase
    .from("books")
    .insert(payload)
    .select(
      "id, isbn, title, rating, date_read, cover_url, user_id, created_at, updated_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateBook(id, userId, payload) {
  const scopedUserId = requireUserId(userId);

  const { data, error } = await supabase
    .from("books")
    .update(payload)
    .eq("id", id)
    .eq("user_id", scopedUserId)
    .select(
      "id, isbn, title, rating, date_read, cover_url, user_id, created_at, updated_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteBook(id, userId) {
  const scopedUserId = requireUserId(userId);

  const { error } = await supabase
    .from("books")
    .delete()
    .eq("id", id)
    .eq("user_id", scopedUserId);
  if (error) {
    throw error;
  }
}

export async function fetchBookNotes(bookId, userId) {
  const scopedUserId = requireUserId(userId);

  const { data, error } = await supabase
    .from("book_notes")
    .select("id, book_id, user_id, title, content, created_at, updated_at")
    .eq("book_id", bookId)
    .eq("user_id", scopedUserId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).filter((note) => note.user_id === scopedUserId);
}

export async function insertNote(payload) {
  const { data, error } = await supabase
    .from("book_notes")
    .insert(payload)
    .select("id, book_id, user_id, title, content, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateNote(noteId, userId, payload) {
  const scopedUserId = requireUserId(userId);

  const { data, error } = await supabase
    .from("book_notes")
    .update(payload)
    .eq("id", noteId)
    .eq("user_id", scopedUserId)
    .select("id, book_id, user_id, title, content, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteNote(noteId, userId) {
  const scopedUserId = requireUserId(userId);

  const { error } = await supabase
    .from("book_notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", scopedUserId);

  if (error) {
    throw error;
  }
}
