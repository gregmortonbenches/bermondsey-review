import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// For pages/components that only ever read publicly-visible data — the
// homepage, article/page routes, the archive, sitemap, and the shared
// Masthead/Footer/ThemeVars every public page renders — and never need
// to know who (if anyone) is signed in. RLS on every table already
// scopes what the anon key can see; this client just doesn't carry a
// session at all, unlike lib/supabase/server.js's createClient.
//
// That distinction matters beyond just "simpler": this one deliberately
// never touches next/headers' cookies(), a Next.js dynamic API. A route
// with generateStaticParams (like app/[slug] and app/article/[slug])
// serves any param it doesn't know about at build time — e.g. anything
// published after the last deploy — through an on-demand render Next.js
// treats as cacheable, and calling a dynamic API during that render trips
// a DYNAMIC_SERVER_USAGE bailout. A stateless client sidesteps that
// entirely, since there's no per-request cookie state to read in the
// first place.
export function createClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
