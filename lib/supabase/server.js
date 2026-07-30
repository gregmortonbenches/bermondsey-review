import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Used inside server components and route handlers (e.g. app/admin/page.jsx,
// the edit page's initial data fetch) — reads the editor's session from
// cookies rather than needing a token passed around manually.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component that can't set cookies directly —
            // safe to ignore as long as proxy.js is also refreshing sessions.
          }
        },
      },
    }
  );
}
