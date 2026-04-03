import { useRouter } from "next/router";
import { useEffect } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const { code, error, error_description: errorDescription } = router.query;

    if (code || error || errorDescription) {
      router.replace({
        pathname: "/auth/callback",
        query: router.query,
      });
      return;
    }

    router.replace("/dashboard");
  }, [router]);

  return (
    <Box
      className="app-shell"
      sx={{
        display: "grid",
        placeItems: "center",
      }}
    >
      <Box
        className="glass-card fade-up"
        sx={{ px: 4, py: 3, borderRadius: 3 }}
      >
        <CircularProgress size={24} sx={{ color: "#FFC850", mb: 2 }} />
        <Typography variant="body1">Routing...</Typography>
      </Box>
    </Box>
  );
}
