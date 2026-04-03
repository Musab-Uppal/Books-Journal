import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, CircularProgress } from "@mui/material";
import toast from "react-hot-toast";
import { PageLayout } from "@/components/PageLayout";
import { ProtectedPage } from "@/components/ProtectedPage";
import { BookForm } from "@/components/BookForm";
import { useAuth } from "@/context/AuthContext";
import { buildCoverUrl } from "@/lib/book-utils";
import { fetchBookById, updateBook } from "@/lib/queries";

export default function EditBookPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState("");

  const bookQuery = useQuery({
    queryKey: ["book", id, user?.id],
    queryFn: () => fetchBookById(id, user.id),
    enabled: Boolean(id && user?.id),
  });

  const mutation = useMutation({
    mutationFn: (values) =>
      updateBook(id, user.id, {
        title: values.title,
        isbn: values.isbn,
        rating: Number(values.rating),
        date_read: values.date_read,
        cover_url: buildCoverUrl(values.isbn),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books", user.id] });
      queryClient.invalidateQueries({ queryKey: ["book", id, user.id] });
      toast.success("Book updated");
      router.push(`/book/${id}`);
    },
    onError: (error) => {
      const message = error?.message || "Could not update book";
      setErrorMessage(message);
      toast.error(message);
    },
  });

  const initialValues = useMemo(() => {
    const book = bookQuery.data;
    if (!book) {
      return null;
    }

    return {
      ...book,
      date_read: String(book.date_read).slice(0, 10),
    };
  }, [bookQuery.data]);

  return (
    <ProtectedPage>
      <PageLayout>
        {bookQuery.isLoading ? (
          <Box sx={{ py: 8, display: "grid", placeItems: "center" }}>
            <CircularProgress sx={{ color: "#FFC850" }} />
          </Box>
        ) : null}

        {bookQuery.error ? (
          <Alert severity="error">{bookQuery.error.message}</Alert>
        ) : null}

        {initialValues ? (
          <BookForm
            title="Edit Book"
            subtitle="Update book details"
            submitText="Update Book"
            initialValues={initialValues}
            onSubmit={(values) => {
              setErrorMessage("");
              mutation.mutate(values);
            }}
            loading={mutation.isPending}
            errorMessage={errorMessage}
          />
        ) : null}
      </PageLayout>
    </ProtectedPage>
  );
}
