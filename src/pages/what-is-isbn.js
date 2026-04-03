import { Box, Paper, Stack, Typography } from "@mui/material";
import { PageLayout } from "@/components/PageLayout";

export default function WhatIsIsbnPage() {
  return (
    <PageLayout>
      <Paper className="glass-card fade-up" sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Stack spacing={2}>
          <Typography variant="h3">What is an ISBN?</Typography>
          <Typography color="text.secondary">
            ISBN stands for International Standard Book Number. It uniquely
            identifies a specific edition of a book.
          </Typography>

          <Box>
            <Typography variant="h5" sx={{ mb: 1 }}>
              ISBN-10
            </Typography>
            <Typography color="text.secondary">
              A 10-digit format used on older book editions. The last digit can
              be X, acting as a checksum.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" sx={{ mb: 1 }}>
              ISBN-13
            </Typography>
            <Typography color="text.secondary">
              A 13-digit format used worldwide today, often beginning with 978
              or 979. It is fully compatible with modern barcode systems.
            </Typography>
          </Box>

          <Typography color="text.secondary">
            Keep It Booked accepts 10-digit and 13-digit numeric ISBN values to
            build cover image URLs and avoid duplicate entries.
          </Typography>
        </Stack>
      </Paper>
    </PageLayout>
  );
}
