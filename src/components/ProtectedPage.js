import { useEffect } from "react";
import { useRouter } from "next/router";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "@/context/AuthContext";

export function ProtectedPage({ children }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <Box
        className="app-shell"
        sx={{ display: "grid", placeItems: "center", p: 3 }}
      >
        <Box
          className="glass-card"
          sx={{ p: 3, borderRadius: 3, textAlign: "center" }}
        >
          <CircularProgress size={24} sx={{ color: "#FFC850", mb: 2 }} />
          <Typography variant="body1">Checking your session...</Typography>
        </Box>
      </Box>
    );
  }

  return children;
}
