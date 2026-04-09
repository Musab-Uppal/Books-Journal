import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { PageLayout } from "@/components/PageLayout";
import { ProtectedPage } from "@/components/ProtectedPage";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { BookCard } from "@/components/BookCard";
import { useAuth } from "@/context/AuthContext";
import { calculateAverageRating } from "@/lib/book-utils";
import { fetchBooksByUser } from "@/lib/queries";

function StatCard({ icon, label, value }) {
  return (
    <Card>
      <CardContent sx={{ py: 1.6, "&:last-child": { pb: 1.6 } }}>
        <Stack direction="row" alignItems="center" spacing={1.2}>
          {icon}
          <Box>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h6">{value}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function CurrentlyReadingCard({ books }) {
  const featured = useMemo(() => {
    if (!books.length) {
      return null;
    }

    const minute = new Date().getMinutes();
    const index = minute % books.length;
    return books[index];
  }, [books]);

  if (!featured) {
    return (
      <Paper className="glass-card" sx={{ p: 1.8 }}>
        <Typography variant="subtitle1">Currently Reading</Typography>
        <Typography color="text.secondary">No books yet.</Typography>
      </Paper>
    );
  }

  return (
    <Paper className="glass-card" sx={{ p: 1.8 }}>
      <Typography variant="subtitle1" sx={{ mb: 0.4 }}>
        Currently Reading
      </Typography>
      <Typography variant="h6" sx={{ mb: 0.3 }}>
        {featured.title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        ISBN: {featured.isbn}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Rating: {featured.rating}
      </Typography>
      <Typography
        component={Link}
        href={{ pathname: "/book/[id]", query: { id: String(featured.id) } }}
        color="warning.main"
        sx={{ mt: 0.8, display: "inline-block", fontSize: 14 }}
      >
        Open details
      </Typography>
    </Paper>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const booksQuery = useQuery({
    queryKey: ["books", user?.id, search],
    queryFn: () => fetchBooksByUser(user.id, search),
    enabled: Boolean(user?.id),
  });

  const books = (booksQuery.data || []).filter(
    (book) => book.user_id === user?.id,
  );
  const averageRating = calculateAverageRating(books);

  return (
    <ProtectedPage>
      <PageLayout>
        <Stack spacing={1.6}>
          <Paper className="glass-card fade-up" sx={{ p: { xs: 1.6, sm: 2 } }}>
            <Stack spacing={1.2}>
              <Typography variant="h4">Your Reading Dashboard</Typography>
              <TextField
                label="Search by title or ISBN"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                fullWidth
                size="small"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Stack>
          </Paper>

          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatCard
                icon={<MenuBookRoundedIcon sx={{ color: "#FFC850" }} />}
                label="Books"
                value={books.length}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatCard
                icon={<StarRoundedIcon sx={{ color: "#FF8C42" }} />}
                label="Average Rating"
                value={averageRating}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <CurrentlyReadingCard books={books} />
            </Grid>
          </Grid>

          {booksQuery.isLoading ? (
            <Box sx={{ py: 8, display: "grid", placeItems: "center" }}>
              <CircularProgress sx={{ color: "#FFC850" }} />
            </Box>
          ) : null}

          {booksQuery.error ? (
            <Alert severity="error">{booksQuery.error.message}</Alert>
          ) : null}

          {!booksQuery.isLoading && !books.length ? (
            <Paper className="glass-card" sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h6">No books found</Typography>
              <Typography color="text.secondary">
                Add your first book to start tracking your reading.
              </Typography>
            </Paper>
          ) : null}

          <Grid container spacing={1.5}>
            {books.map((book) => (
              <Grid key={book.id} size={{ xs: 12, sm: 6, md: 3 }}>
                <BookCard book={book} />
              </Grid>
            ))}
          </Grid>
        </Stack>
        <FloatingAddButton />
      </PageLayout>
    </ProtectedPage>
  );
}
