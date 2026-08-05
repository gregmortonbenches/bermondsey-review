import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/public";
import { getLatestPublishedPost } from "@/lib/posts";

// Every article has its own slug, so there's no fixed href that could
// ever BE "the latest one" the way /latest (the full listing) or a
// specific /article/[slug] are — this route exists purely so the nav's
// "The Latest" link has something stable to point to. Looks up whatever
// post is newest right now and 307s straight to its real article page.
// A temporary (307), not permanent, redirect deliberately: a 301/308
// here would risk a browser or CDN caching *this issue's* article as
// the permanent target, which is exactly wrong the moment a newer one
// publishes.
//
// force-dynamic + revalidate 0: without both, this being a plain GET
// route handler with no cookies()/headers() read makes it a candidate
// for Next's static/ISR caching — which would freeze the redirect
// target at whatever was newest at build time, the one thing this route
// can never be allowed to do.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request) {
  try {
    const supabase = await createClient();
    const latest = await getLatestPublishedPost(supabase);
    if (latest?.slug) {
      return NextResponse.redirect(new URL(`/article/${latest.slug}`, request.url), 307);
    }
  } catch {
    // Supabase unreachable, or genuinely no posts yet — fall through to
    // the homepage rather than a broken redirect.
  }
  return NextResponse.redirect(new URL("/", request.url), 307);
}
