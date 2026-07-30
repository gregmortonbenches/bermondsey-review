"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAllPostsForAdmin } from "@/lib/posts";
import { listPagesForAdmin } from "@/lib/pages";

const POST_EDIT_RE = /^\/admin\/posts\/([^/]+)\/edit/;
const PAGE_EDIT_RE = /^\/admin\/pages\/([^/]+)\/edit/;

function modeFor(pathname) {
  if (pathname === "/admin/posts/new" || POST_EDIT_RE.test(pathname)) return "posts";
  if (pathname === "/admin/pages/new" || PAGE_EDIT_RE.test(pathname)) return "pages";
  return null;
}

function postStatus(post, now) {
  const isLive =
    post.status === "published" ||
    (post.status === "scheduled" && post.scheduled_for && new Date(post.scheduled_for) <= now);
  if (isLive) return "Published";
  if (post.status === "scheduled") return "Scheduled";
  return "Draft";
}

/**
 * A "switch to another post/page" list, shown in AdminShell's sidebar only
 * while a post or page editor is open (homepage layout is a single page,
 * nothing to switch to) — the page-navigation piece of Squarespace's
 * editor sidebar, alongside the "on this page" outline in
 * EditorOutlineContext.jsx.
 *
 * Fetches its own list client-side (same list queries the /admin and
 * /admin/pages index pages use) rather than getting it passed down,
 * since AdminShell is a layout that wraps every dashboard route and has
 * no reason to fetch posts/pages for the ones that aren't this one.
 *
 * Navigating via next/link between two routes that only differ in a
 * dynamic segment's value (e.g. /admin/posts/A/edit → /admin/posts/B/edit)
 * does remount the destination page's Client Components — verified before
 * building this — so PostForm/PageForm's own state always seeds fresh
 * from the newly-fetched post/page, never carries over stale content.
 */
export default function PageSwitcher({ pathname }) {
  const mode = modeFor(pathname);
  const currentId =
    mode === "posts" ? pathname.match(POST_EDIT_RE)?.[1] : mode === "pages" ? pathname.match(PAGE_EDIT_RE)?.[1] : null;

  const [items, setItems] = useState(null); // null = loading

  useEffect(() => {
    if (!mode) return;
    let cancelled = false;
    setItems(null);
    const supabase = createClient();
    const query = mode === "posts" ? getAllPostsForAdmin(supabase) : listPagesForAdmin(supabase);
    query
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  if (!mode) return null;

  const now = new Date();
  const editHref = (id) => (mode === "posts" ? `/admin/posts/${id}/edit` : `/admin/pages/${id}/edit`);
  const newHref = mode === "posts" ? "/admin/posts/new" : "/admin/pages/new";

  return (
    <div className="pt-4 mt-1 border-t border-steel/15 space-y-0.5">
      <p className="px-3 font-sans text-[11px] uppercase tracking-[0.08em] text-steel mb-1.5">
        Switch {mode === "posts" ? "post" : "page"}
      </p>

      {items === null ? (
        <p className="px-3 font-sans text-xs text-steel/70">Loading…</p>
      ) : items.length === 0 ? (
        <p className="px-3 font-sans text-xs text-steel/70">Nothing here yet</p>
      ) : (
        items.map((item) => {
          const active = item.id === currentId;
          const status = mode === "posts" ? postStatus(item, now) : item.published ? "Published" : "Draft";
          return (
            <Link
              key={item.id}
              href={editHref(item.id)}
              className={`flex items-center gap-2 font-sans text-[13px] leading-snug px-3 py-1.5 rounded-sm transition-colors ${
                active ? "bg-river/[0.1] text-river font-600" : "text-ink/80 hover:text-ink hover:bg-steel/[0.08]"
              }`}
            >
              <span className="truncate flex-1">{item.title || "Untitled"}</span>
              <span className="shrink-0 font-sans text-[10px] uppercase tracking-[0.04em] text-steel/70">
                {status}
              </span>
            </Link>
          );
        })
      )}

      <Link
        href={newHref}
        className="block font-sans text-[13px] text-river hover:text-ink px-3 py-1.5 rounded-sm hover:bg-steel/[0.08] transition-colors"
      >
        + New {mode === "posts" ? "post" : "page"}
      </Link>
    </div>
  );
}
