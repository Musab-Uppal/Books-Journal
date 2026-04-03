import Link from "next/link";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
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

export default function SignupPage() {
  const router = useRouter();
  const { signInWithGoogle, signUpWithEmail } = useAuth();

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
      await signUpWithEmail(values.email, values.password);
      toast.success(
        "Account created. Check your inbox if email confirmation is enabled.",
      );
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
      title="Create account"
      subtitle="Start your reading journal"
      googleLabel="Sign up with Google"
      onGoogle={onGoogle}
      loading={isSubmitting}
      footer={
        <Typography color="text.secondary">
          Already have an account?{" "}
          <Typography component={Link} href="/login" color="warning.main">
            Log in
          </Typography>
        </Typography>
      }
    >
      <Divider>or sign up with email</Divider>
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
          <Button
            type="submit"
            variant="contained"
            color="warning"
            size="large"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create account"}
          </Button>
        </Stack>
      </Box>
    </AuthCard>
  );
}
