const isBrowser = typeof window !== "undefined";

const runtimeEnv = isBrowser && window?.__ENV__ ? window.__ENV__ : {};

function pickValue(...values) {
  for (const value of values) {
    if (typeof value === "string" && value) {
      return value;
    }
  }

  return "";
}

export const env = {
  supabaseUrl: pickValue(
    runtimeEnv.NEXT_PUBLIC_SUPABASE_URL,
    runtimeEnv.VITE_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.VITE_SUPABASE_URL,
  ),
  supabaseAnonKey: pickValue(
    runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    runtimeEnv.VITE_SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.VITE_SUPABASE_ANON_KEY,
  ),
  publishableKey: pickValue(
    runtimeEnv.NEXT_PUBLIC_PUBLISHABLE_KEY,
    runtimeEnv.VITE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
    process.env.VITE_PUBLISHABLE_KEY,
  ),
  callbackUrl: pickValue(
    runtimeEnv.NEXT_PUBLIC_CALLBACK_URL,
    runtimeEnv.VITE_CALLBACK_URL,
    process.env.NEXT_PUBLIC_CALLBACK_URL,
    process.env.VITE_CALLBACK_URL,
  ),
  openLibraryUrl: pickValue(
    runtimeEnv.NEXT_PUBLIC_OPEN_LIBRARY_URL,
    runtimeEnv.VITE_OPEN_LIBRARY_URL,
    process.env.NEXT_PUBLIC_OPEN_LIBRARY_URL,
    process.env.VITE_OPEN_LIBRARY_URL,
  ),
};

export function resolveCallbackUrl() {
  const configured = env.callbackUrl?.trim();

  if (configured) {
    if (isBrowser) {
      try {
        return new URL(configured, window.location.origin).toString();
      } catch {
        return `${window.location.origin}/auth/callback`;
      }
    }

    return configured;
  }

  if (isBrowser) {
    return `${window.location.origin}/auth/callback`;
  }

  return "http://localhost:3000/auth/callback";
}

export function getOpenLibraryBaseUrl() {
  return env.openLibraryUrl || "https://covers.openlibrary.org/b/isbn";
}
