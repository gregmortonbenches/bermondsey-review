import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Handles two unrelated jobs, since Next.js only allows one proxy
// file: (1) redirect resolution for old article URLs, and (2) admin
// auth. Split by path prefix below.
export async function proxy(request) {
  const pathname = request.nextUrl.pathname;
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // --- Redirects, for renamed article slugs (see lib/posts.js) or any
  // manually-added redirect from /admin/redirects. Scoped to /article/*
  // only, deliberately — resolving this against every single request
  // site-wide would mean a database round-trip on every page load,
  // which isn't worth it for a rarely-used feature.
  if (pathname.startsWith("/article/")) {
    try {
      const { data } = await supabase
        .from("redirects")
        .select("to_path")
        .eq("from_path", pathname)
        .maybeSingle();
      if (data?.to_path) {
        return NextResponse.redirect(new URL(data.to_path, request.url), 301);
      }
    } catch {
      // Supabase not configured yet, or the query failed — fall through
      // and let the page 404 normally rather than breaking the request.
    }
    return response;
  }

  // --- Admin auth: refreshes the session cookie and bounces signed-out
  // visitors to /admin/login before any admin page or its data-fetching
  // even runs.
  if (pathname.startsWith("/admin")) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isLoginPage = pathname === "/admin/login";

    if (!user && !isLoginPage) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (user && isLoginPage) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/article/:path*"],
};
