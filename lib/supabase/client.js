import { createBrowserClient } from "@supabase/ssr";

// Used inside "use client" components — the admin post form, the login
// form, anywhere we need to read/write as the logged-in editor from
// the browser.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
