import Link from "next/link";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  Alert,
  Box,
  Button,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AuthCard } from "@/components/AuthCard";
import { useAuth } from "@/context/AuthContext";
import { authSchema } from "@/lib/schemas";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithGoogle, signInWithEmail } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values) {
    try {
      await signInWithEmail(values.email, values.password);
      toast.success("Welcome back");
      router.push("/dashboard");
    } catch {
      // Toast handled in context.
    }
  }

  async function onGoogle() {
    try {
      await signInWithGoogle();
    } catch {
      // Toast handled in context.
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to continue tracking your reading"
      googleLabel="Continue with Google"
      onGoogle={onGoogle}
      loading={isSubmitting}
      footer={
        <Typography color="text.secondary">
          No account yet?{" "}
          <Typography component={Link} href="/signup" color="warning.main">
            Create one
          </Typography>
        </Typography>
      }
    >
      <Divider>or sign in with email</Divider>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            {...register("email")}
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            {...register("password")}
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
          />
          {router.query.error ? (
            <Alert severity="error">
              {String(router.query.error_description || router.query.error)}
            </Alert>
          ) : null}
          <Button
            type="submit"
            variant="contained"
            color="warning"
            size="large"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </Stack>
      </Box>
    </AuthCard>
  );
}
