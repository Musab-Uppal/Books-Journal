import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { PageLayout } from "@/components/PageLayout";

export default function AuthCallbackPage() {
  const router = useRouter();

  const queryInfo = useMemo(
    () => ({
      code: typeof router.query.code === "string" ? router.query.code : "",
      error: typeof router.query.error === "string" ? router.query.error : "",
      errorDescription:
        typeof router.query.error_description === "string"
          ? router.query.error_description
          : "",
    }),
    [router.query],
  );

  useEffect(() => {
    let cancelled = false;

    async function completeAuth() {
      async function finalizeWithSession(fallbackErrorMessage) {
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (!cancelled && data?.session) {
          toast.success("Signed in successfully");
          router.replace("/dashboard");
          return;
        }

        if (!cancelled) {
          toast.error(
            sessionError?.message ||
              fallbackErrorMessage ||
              "Session not available",
          );
          router.replace("/login");
        }
      }

      if (!router.isReady) {
        return;
      }

      if (queryInfo.error) {
        if (!cancelled) {
          toast.error(queryInfo.errorDescription || queryInfo.error);
          router.replace("/login");
        }
        return;
      }

      if (queryInfo.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(
          queryInfo.code,
        );

        await finalizeWithSession(error?.message || "Could not complete login");
        return;
      }

      await finalizeWithSession("Could not complete login");
    }

    completeAuth();

    return () => {
      cancelled = true;
    };
  }, [router, queryInfo]);

  return (
    <PageLayout withNav={false}>
      <Box sx={{ minHeight: "78vh", display: "grid", placeItems: "center" }}>
        <Paper
          className="glass-card fade-up"
          sx={{ p: 3.5, textAlign: "center" }}
        >
          <CircularProgress sx={{ color: "#FFC850", mb: 2 }} />
          <Typography variant="h6">Completing sign in...</Typography>
        </Paper>
      </Box>
    </PageLayout>
  );
}
