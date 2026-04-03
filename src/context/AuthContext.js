import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { resolveCallbackUrl } from "@/lib/env";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        toast.error(error.message);
      }

      if (mounted) {
        setSession(data?.session ?? null);
        setUser(data?.session?.user ?? null);
        setLoading(false);
      }
    }

    bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession ?? null);
        setUser(nextSession?.user ?? null);
        setLoading(false);
      },
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      async signInWithGoogle() {
        const redirectTo = resolveCallbackUrl();

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            skipBrowserRedirect: true,
          },
        });

        if (error) {
          toast.error(error.message || "Google sign-in failed");
          throw error;
        }

        if (typeof window !== "undefined" && data?.url) {
          window.location.assign(data.url);
          return;
        }

        const redirectError = new Error("Google redirect URL was not returned");
        toast.error(redirectError.message);
        throw redirectError;
      },
      async signInWithEmail(email, password) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast.error(error.message || "Sign-in failed");
          throw error;
        }
      },
      async signUpWithEmail(email, password) {
        const redirectTo = resolveCallbackUrl();

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
          },
        });

        if (error) {
          toast.error(error.message || "Sign-up failed");
          throw error;
        }
      },
      async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) {
          toast.error(error.message || "Sign-out failed");
          throw error;
        }
      },
    }),
    [loading, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
