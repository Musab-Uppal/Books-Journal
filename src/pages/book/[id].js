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

export default function BookDetailsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { id } = router.query;
  const [detailsError, setDetailsError] = useState("");

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

  const loading = bookQuery.isLoading || notesQuery.isLoading;
  const book = bookQuery.data;

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
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      minHeight: 200,
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      src={book.cover_url || "/next.svg"}
                      alt={book.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      style={{ objectFit: "cover" }}
                      unoptimized
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                  <Stack spacing={1.2}>
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

                    <Stack direction="row" spacing={1.2} sx={{ pt: 1 }}>
                      <Button
                        component={Link}
                        href={`/edit/${book.id}`}
                        variant="contained"
                        color="warning"
                        startIcon={<EditRoundedIcon />}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteRoundedIcon />}
                        onClick={() => {
                          if (
                            window.confirm("Delete this book and its notes?")
                          ) {
                            deleteBookMutation.mutate();
                          }
                        }}
                        disabled={deleteBookMutation.isPending}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>

            <Paper className="glass-card" sx={{ p: { xs: 1.6, sm: 2 } }}>
              <Stack spacing={1.4}>
                <Typography variant="h5">Notes</Typography>
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
                  {(notesQuery.data || []).map((note) => (
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

                  {!notesQuery.isLoading && !(notesQuery.data || []).length ? (
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
