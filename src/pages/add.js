import { useState } from "react";
import { useRouter } from "next/router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { PageLayout } from "@/components/PageLayout";
import { ProtectedPage } from "@/components/ProtectedPage";
import { BookForm } from "@/components/BookForm";
import { useAuth } from "@/context/AuthContext";
import { buildCoverUrl } from "@/lib/book-utils";
import { insertBook } from "@/lib/queries";

export default function AddBookPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");

  const mutation = useMutation({
    mutationFn: (values) => {
      const payload = {
        title: values.title,
        isbn: values.isbn,
        rating: Number(values.rating),
        date_read: values.date_read,
        cover_url: buildCoverUrl(values.isbn),
        user_id: user.id,
      };

      return insertBook(payload);
    },
    onSuccess: (book) => {
      queryClient.invalidateQueries({ queryKey: ["books", user.id] });
      toast.success("Book added");
      router.push(`/book/${book.id}`);
    },
    onError: (error) => {
      const message = error?.message || "Could not add book";
      setErrorMessage(message);
      toast.error(message);
    },
  });

  return (
    <ProtectedPage>
      <PageLayout>
        <BookForm
          title="Add Book"
          subtitle="Save title, ISBN, rating, and date read"
          submitText="Save Book"
          onSubmit={(values) => {
            setErrorMessage("");
            mutation.mutate(values);
          }}
          loading={mutation.isPending}
          errorMessage={errorMessage}
        />
      </PageLayout>
    </ProtectedPage>
  );
}
