import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import { formatDate } from "@/lib/book-utils";

export function BookCard({ book }) {
  return (
    <Card
      className="fade-up"
      sx={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <CardActionArea
        component={Link}
        href={`/book/${book.id}`}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          height: "100%",
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: 150,
            borderBottom: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <Image
            src={book.cover_url || "/next.svg"}
            alt={book.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            style={{ objectFit: "cover" }}
            unoptimized
          />
        </Box>
        <CardContent sx={{ flex: 1, p: 1.4, width: "100%" }}>
          <Stack spacing={0.7}>
            <Typography variant="subtitle1" sx={{ lineHeight: 1.3 }}>
              {book.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ISBN: {book.isbn}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip
                label={`Rating: ${book.rating}`}
                color="warning"
                size="small"
              />
              <Chip label={formatDate(book.date_read)} size="small" />
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
