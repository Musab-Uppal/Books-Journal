import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { PageLayout } from "@/components/PageLayout";

export function AuthCard({
  title,
  subtitle,
  children,
  googleLabel,
  onGoogle,
  footer,
  loading,
}) {
  return (
    <PageLayout withNav={false}>
      <Box sx={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
        <Paper
          className="glass-card fade-up"
          sx={{ width: "100%", maxWidth: 500, p: 2.6 }}
        >
          <Stack spacing={0.8} sx={{ mb: 1.8 }}>
            <Typography variant="h5">{title}</Typography>
            <Typography color="text.secondary">{subtitle}</Typography>
          </Stack>

          <Stack spacing={1.4}>
            <Button
              variant="contained"
              color="warning"
              startIcon={<GoogleIcon />}
              onClick={onGoogle}
              disabled={loading}
            >
              {googleLabel}
            </Button>
            {children}
          </Stack>

          {footer ? <Box sx={{ mt: 3 }}>{footer}</Box> : null}
        </Paper>
      </Box>
    </PageLayout>
  );
}
