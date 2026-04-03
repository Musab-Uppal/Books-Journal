# Keep It Booked

Book tracker frontend built with Next.js Pages Router (JavaScript), MUI, Supabase, React Query, React Hook Form, and Zod.

## Environment variables

Use your existing keys (already provided):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PUBLISHABLE_KEY`
- `VITE_CALLBACK_URL`
- `VITE_OPEN_LIBRARY_URL` (optional)

Compatibility is implemented so client code checks `NEXT_PUBLIC_*` first and then falls back to the `VITE_*` names.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Routes

- `/` redirects to `/auth/callback` when OAuth params are present, otherwise to `/dashboard`
- `/login`
- `/signup`
- `/auth/callback`
- `/what-is-isbn`
- `/dashboard` (protected)
- `/add` (protected)
- `/edit/[id]` (protected)
- `/book/[id]` (protected)

## Notes

- Google auth uses Supabase PKCE OAuth redirect flow.
- Protected routes wait for auth initialization and then redirect to `/login` if unauthenticated.
- Cover URLs are generated with `IMG_URL + "/" + isbn + "-M.jpg"`.
