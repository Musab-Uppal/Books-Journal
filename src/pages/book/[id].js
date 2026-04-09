import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { PageLayout } from "@/components/PageLayout";
import { ProtectedPage } from "@/components/ProtectedPage";
import { NoteEditor } from "@/components/NoteEditor";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/book-utils";
import { noteSchema } from "@/lib/schemas";
import {
  deleteBook,
  deleteNote,
  fetchBookById,
  fetchBookNotes,
  insertNote,
  updateNote,
} from "@/lib/queries";

function normalizeSummaryForDisplay(value) {
  const text = String(value || "");

  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>|<\/div>|<\/h[1-6]>/gi, "\n")
    .replace(/<li>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function BookDetailsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const routeId = router.query?.id;
  const id = Array.isArray(routeId) ? routeId[0] : routeId;
  const [detailsError, setDetailsError] = useState("");
  const [summaryText, setSummaryText] = useState("");
  const [summaryError, setSummaryError] = useState("");

  const bookQuery = useQuery({
    queryKey: ["book", id, user?.id],
    queryFn: () => fetchBookById(id, user.id),
    enabled: Boolean(id && user?.id),
  });

  const notesQuery = useQuery({
    queryKey: ["book-notes", id, user?.id],
    queryFn: () => fetchBookNotes(id, user.id),
    enabled: Boolean(id && user?.id),
  });

  const addForm = useForm({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: (values) =>
      insertNote({
        book_id: id,
        user_id: user.id,
        title: values.title,
        content: values.content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-notes", id, user.id] });
      addForm.reset();
      toast.success("Note added");
    },
    onError: (error) => {
      toast.error(error?.message || "Could not add note");
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, values }) => updateNote(noteId, user.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-notes", id, user.id] });
      toast.success("Note updated");
    },
    onError: (error) => {
      toast.error(error?.message || "Could not update note");
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId) => deleteNote(noteId, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-notes", id, user.id] });
      toast.success("Note deleted");
    },
    onError: (error) => {
      toast.error(error?.message || "Could not delete note");
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: () => deleteBook(id, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books", user.id] });
      toast.success("Book deleted");
      router.push("/dashboard");
    },
    onError: (error) => {
      const message = error?.message || "Could not delete book";
      setDetailsError(message);
      toast.error(message);
    },
  });

  const summarizeNotesMutation = useMutation({
    mutationFn: async ({ bookTitle, notes }) => {
      const response = await fetch("/api/groq-summarize-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          book: bookTitle,
          author: "Unknown",
          notes,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Could not summarize notes");
      }

      return payload;
    },
    onSuccess: (payload) => {
      setSummaryError("");
      setSummaryText(normalizeSummaryForDisplay(payload?.summary || ""));
      toast.success("Notes summerized");
    },
    onError: (error) => {
      const message = error?.message || "Could not summarize notes";
      setSummaryError(message);
      toast.error(message);
    },
  });

  const loading = bookQuery.isLoading || notesQuery.isLoading;
  const book = bookQuery.data;
  const notes = notesQuery.data || [];

  return (
    <ProtectedPage>
      <PageLayout>
        {loading ? (
          <Box sx={{ py: 8, display: "grid", placeItems: "center" }}>
            <CircularProgress sx={{ color: "#FFC850" }} />
          </Box>
        ) : null}

        {bookQuery.error ? (
          <Alert severity="error">{bookQuery.error.message}</Alert>
        ) : null}

        {book ? (
          <Stack spacing={1.6}>
            <Paper
              className="glass-card fade-up"
              sx={{ p: { xs: 1.6, sm: 2 } }}
            >
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      maxWidth: { xs: 210, sm: 230, md: 200 },
                      minHeight: { xs: 210, sm: 230 },
                      aspectRatio: "2 / 3",
                      borderRadius: 2,
                      overflow: "hidden",
                      bgcolor: "rgba(0,0,0,0.26)",
                      mx: { xs: "auto", md: 0 },
                    }}
                  >
                    <Image
                      src={book.cover_url || "/next.svg"}
                      alt={book.title}
                      fill
                      loading="eager"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      style={{ objectFit: "contain", padding: 12 }}
                      unoptimized
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 9 }}>
                  <Stack spacing={1.2}>
                    <Stack
                      direction="row"
                      justifyContent="flex-end"
                      spacing={0.5}
                    >
                      <IconButton
                        component={Link}
                        href={{
                          pathname: "/edit/[id]",
                          query: { id: String(book.id) },
                        }}
                        color="warning"
                        size="small"
                      >
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => {
                          if (
                            window.confirm("Delete this book and its notes?")
                          ) {
                            deleteBookMutation.mutate();
                          }
                        }}
                        disabled={deleteBookMutation.isPending}
                      >
                        <DeleteRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>

                    <Typography variant="h4">{book.title}</Typography>
                    <Typography color="text.secondary">
                      ISBN: {book.isbn}
                    </Typography>
                    <Typography color="text.secondary">
                      Rating: {book.rating}
                    </Typography>
                    <Typography color="text.secondary">
                      Date Read: {formatDate(book.date_read)}
                    </Typography>

                    {detailsError ? (
                      <Alert severity="error">{detailsError}</Alert>
                    ) : null}
                  </Stack>
                </Grid>
              </Grid>
            </Paper>

            <Paper className="glass-card" sx={{ p: { xs: 1.6, sm: 2 } }}>
              <Stack spacing={1.4}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "stretch", sm: "center" }}
                  spacing={1}
                >
                  <Typography variant="h5">Notes</Typography>
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={() => {
                      setSummaryError("");
                      summarizeNotesMutation.mutate({
                        bookTitle: book.title,
                        notes,
                      });
                    }}
                    disabled={summarizeNotesMutation.isPending || !notes.length}
                    sx={{ alignSelf: { xs: "flex-start", sm: "auto" } }}
                  >
                    {summarizeNotesMutation.isPending
                      ? "Summerizing..."
                      : "Summerize Notes"}
                  </Button>
                </Stack>

                {summaryError ? (
                  <Alert severity="error">{summaryError}</Alert>
                ) : null}

                {summaryText ? (
                  <Paper
                    variant="outlined"
                    sx={{ p: 1.25, borderColor: "rgba(255,255,255,0.18)" }}
                  >
                    <Stack spacing={0.6}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Summary
                      </Typography>
                      <Stack spacing={0.8}>
                        {summaryText.split(/\n\n+/).map((paragraph, index) => (
                          <Typography
                            key={`${index}-${paragraph.slice(0, 12)}`}
                            variant="body2"
                            color="text.secondary"
                            sx={{ whiteSpace: "pre-wrap" }}
                          >
                            {paragraph}
                          </Typography>
                        ))}
                      </Stack>
                    </Stack>
                  </Paper>
                ) : null}

                <Box
                  component="form"
                  onSubmit={addForm.handleSubmit((values) =>
                    addNoteMutation.mutate(values),
                  )}
                >
                  <Stack spacing={1.2}>
                    <TextField
                      label="Note title"
                      {...addForm.register("title")}
                      error={Boolean(addForm.formState.errors.title)}
                      helperText={addForm.formState.errors.title?.message}
                    />
                    <TextField
                      label="Content"
                      multiline
                      minRows={4}
                      {...addForm.register("content")}
                      error={Boolean(addForm.formState.errors.content)}
                      helperText={addForm.formState.errors.content?.message}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      color="warning"
                      sx={{ alignSelf: "flex-start" }}
                      disabled={addNoteMutation.isPending}
                    >
                      {addNoteMutation.isPending ? "Saving..." : "Add Note"}
                    </Button>
                  </Stack>
                </Box>

                <Divider />

                <Stack spacing={1.25}>
                  {notes.map((note) => (
                    <NoteEditor
                      key={note.id}
                      note={note}
                      loading={
                        updateNoteMutation.isPending ||
                        deleteNoteMutation.isPending
                      }
                      onUpdate={(values, done) => {
                        updateNoteMutation.mutate(
                          {
                            noteId: values.id,
                            values: {
                              title: values.title,
                              content: values.content,
                            },
                          },
                          {
                            onSuccess: () => {
                              done();
                            },
                          },
                        );
                      }}
                      onDelete={(noteId, done) => {
                        deleteNoteMutation.mutate(noteId, {
                          onSuccess: () => {
                            done();
                          },
                        });
                      }}
                    />
                  ))}

                  {!notesQuery.isLoading && !notes.length ? (
                    <Typography color="text.secondary">
                      No notes yet.
                    </Typography>
                  ) : null}
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        ) : null}
      </PageLayout>
    </ProtectedPage>
  );
}
