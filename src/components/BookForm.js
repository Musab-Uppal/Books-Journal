import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Alert,
  Box,
  Button,
  Grid,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { bookSchema } from "@/lib/schemas";

const RATINGS = [1, 2, 3, 4, 5];

export function BookForm({
  title,
  subtitle,
  submitText,
  initialValues,
  onSubmit,
  loading,
  errorMessage,
}) {
  const defaults = useMemo(
    () => ({
      title: initialValues?.title || "",
      isbn: initialValues?.isbn || "",
      rating: initialValues?.rating ?? 1,
      date_read:
        initialValues?.date_read || new Date().toISOString().slice(0, 10),
    }),
    [initialValues],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bookSchema),
    defaultValues: defaults,
  });

  const [lookupAuthor, setLookupAuthor] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [lookupNotice, setLookupNotice] = useState("");
  const titleValue = watch("title");

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  async function lookupByTitleAndAuthor() {
    const titleQuery = String(titleValue || "").trim();
    const authorQuery = String(lookupAuthor || "").trim();

    if (!titleQuery && !authorQuery) {
      setLookupError("Enter at least title or author to search");
      return;
    }

    setLookupLoading(true);
    setLookupError("");
    setLookupNotice("");

    try {
      const params = new URLSearchParams();
      if (titleQuery) {
        params.set("title", titleQuery);
      }
      if (authorQuery) {
        params.set("author", authorQuery);
      }
      params.set("limit", "1");

      const response = await fetch(
        `/api/open-library-search?${params.toString()}`,
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Search failed");
      }

      if (!Array.isArray(payload?.results) || !payload.results.length) {
        setLookupError("No matching books with ISBN found");
        return;
      }

      const bestMatch = payload.results[0];
      applyLookupResult(bestMatch);
      setLookupNotice("Best match auto-filled into the ISBN box.");
    } catch (error) {
      setLookupError(error?.message || "Could not search right now");
    } finally {
      setLookupLoading(false);
    }
  }

  function applyLookupResult(result) {
    setValue("title", result.title, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("isbn", result.isbn, { shouldDirty: true, shouldValidate: true });
    setLookupError("");
  }

  return (
    <Paper className="glass-card fade-up" sx={{ p: 2.25, borderRadius: 2.5 }}>
      <Stack spacing={0.6} sx={{ mb: 1.8 }}>
        <Typography variant="h5">{title}</Typography>
        <Typography color="text.secondary">{subtitle}</Typography>
      </Stack>

      {errorMessage ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      ) : null}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Title"
              fullWidth
              size="small"
              {...register("title")}
              error={Boolean(errors.title)}
              helperText={errors.title?.message}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Quick ISBN lookup: provide title and author to auto-fill the
                best match.
              </Typography>
              <Grid container spacing={1}>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <TextField
                    label="Author name"
                    value={lookupAuthor}
                    onChange={(event) => setLookupAuthor(event.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Button
                    type="button"
                    variant="outlined"
                    color="warning"
                    startIcon={<SearchRoundedIcon />}
                    onClick={lookupByTitleAndAuthor}
                    disabled={lookupLoading}
                    fullWidth
                  >
                    {lookupLoading ? "Searching..." : "Find ISBN"}
                  </Button>
                </Grid>
              </Grid>
              {lookupError ? (
                <Alert severity="warning" sx={{ py: 0 }}>
                  {lookupError}
                </Alert>
              ) : null}
              {lookupNotice ? (
                <Alert severity="info" sx={{ py: 0 }}>
                  {lookupNotice}
                </Alert>
              ) : null}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="ISBN"
              fullWidth
              size="small"
              placeholder="Optional (auto-fill with Find ISBN)"
              {...register("isbn")}
              error={Boolean(errors.isbn)}
              helperText={errors.isbn?.message || "10 or 13 digits"}
            />
            <Link href="/what-is-isbn" underline="hover" sx={{ fontSize: 13 }}>
              What is ISBN?
            </Link>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              label="Rating"
              fullWidth
              size="small"
              defaultValue={defaults.rating}
              {...register("rating")}
              error={Boolean(errors.rating)}
              helperText={errors.rating?.message}
            >
              {RATINGS.map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              type="date"
              label="Date Read"
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              {...register("date_read")}
              error={Boolean(errors.date_read)}
              helperText={errors.date_read?.message}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Button
              type="submit"
              variant="contained"
              color="warning"
              startIcon={<SaveRoundedIcon />}
              disabled={loading}
            >
              {loading ? "Saving..." : submitText}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
