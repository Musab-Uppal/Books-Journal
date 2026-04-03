/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_PUBLISHABLE_KEY ||
      process.env.VITE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CALLBACK_URL:
      process.env.NEXT_PUBLIC_CALLBACK_URL || process.env.VITE_CALLBACK_URL,
    NEXT_PUBLIC_OPEN_LIBRARY_URL:
      process.env.NEXT_PUBLIC_OPEN_LIBRARY_URL ||
      process.env.VITE_OPEN_LIBRARY_URL,
    VITE_SUPABASE_URL:
      process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY:
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    VITE_PUBLISHABLE_KEY:
      process.env.VITE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
    VITE_CALLBACK_URL:
      process.env.VITE_CALLBACK_URL || process.env.NEXT_PUBLIC_CALLBACK_URL,
    VITE_OPEN_LIBRARY_URL:
      process.env.VITE_OPEN_LIBRARY_URL ||
      process.env.NEXT_PUBLIC_OPEN_LIBRARY_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
    ],
  },
};

export default nextConfig;
