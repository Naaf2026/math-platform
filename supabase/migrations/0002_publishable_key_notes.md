# Supabase API key setup

The browser application should use the Supabase project URL and publishable key through environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Never use a Supabase secret key in browser code or commit secrets to the repository.
