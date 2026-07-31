import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllPostsForAdmin, getPostStatusInfo } from "@/lib/posts";
import { listPagesForAdmin } from "@/lib/pages";
import { getCurrentUserRole } from "@/lib/profile";
import { getSiteSettingsSafe } from "@/lib/theme";

function StatCard({ label, value }) {
  return (
    <div className="border border-steel/20 rounded-sm px-5 py-4">
      <p className="font-display font-700 text-3xl text-ink">{value}</p>
      <p className="font-sans text-xs text-steel mt-1">{label}</p>
    </div>
  );
}

// The first thing you see after logging in — a proper overview rather
// than landing straight on the post list, so there's an actual sense of
// "here's the state of the site" before diving into any one thing.
export default async function DashboardPage() {
  const supabase = await createClient();
  const [posts, role, settings, pages] = await Promise.all([
    getAllPostsForAdmin(supabase),
    getCurrentUserRole(supabase),
    getSiteSettingsSafe(supabase),
    listPagesForAdmin(supabase), // "Editors can read all pages" — every signed-in role, not just admin
  ]);
  const isAdmin = role === "admin";

  const published = posts.filter((p) => getPostStatusInfo(p).label === "Published").length;
  const scheduled = posts.filter((p) => getPostStatusInfo(p).label.startsWith("Scheduled")).length;
  const drafts = posts.length - published - scheduled;
  const recent = posts.slice(0, 5);

  return (
    <main className="min-h-screen bg-paper">
      <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <div className="mb-8">
          <h1 className="font-display font-700 text-3xl text-ink">Welcome back</h1>
          <p className="font-sans text-sm text-steel mt-1">{settings.site_title}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Published" value={published} />
          <StatCard label="Drafts" value={drafts} />
          <StatCard label="Scheduled" value={scheduled} />
          {isAdmin ? <StatCard label="Pages" value={pages.length} /> : <StatCard label="Total posts" value={posts.length} />}
        </div>

        <div className="flex flex-wrap gap-2 mb-10">
          <Link
            href="/admin/posts/new"
            className="font-sans text-sm font-600 bg-brick text-paper px-4 py-2 rounded-sm hover:bg-ink transition-colors"
          >
            New post
          </Link>
          {isAdmin && (
            <Link
              href="/admin/pages/new"
              className="font-sans text-sm font-600 text-ink border border-steel/30 px-4 py-2 rounded-sm hover:bg-steel/[0.08] transition-colors"
            >
              New page
            </Link>
          )}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="font-sans text-sm font-600 text-ink border border-steel/30 px-4 py-2 rounded-sm hover:bg-steel/[0.08] transition-colors"
          >
            View site ↗
          </a>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-700 text-lg text-ink">Recently edited</h2>
            <Link href="/admin/posts" className="font-sans text-sm text-river hover:text-ink underline underline-offset-4">
              See all posts
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="font-body text-steel py-8 text-center border-t border-steel/20">
              Nothing here yet — click "New post" to write the first one.
            </p>
          ) : (
            <div className="border-t border-steel/20">
              {recent.map((post) => {
                const status = getPostStatusInfo(post);
                return (
                  <Link
                    key={post.id}
                    href={`/admin/posts/${post.id}/edit`}
                    className="flex items-center justify-between gap-4 py-3 border-b border-steel/20 hover:bg-river/[0.04] px-2 -mx-2 rounded-sm transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-display font-700 text-ink truncate">
                        {post.title || <span className="text-steel italic">Untitled</span>}
                      </p>
                      <p className="font-sans text-xs text-steel mt-0.5">
                        Updated {new Date(post.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <span className={`font-sans text-[11px] uppercase tracking-[0.08em] rounded-full px-2.5 py-1 shrink-0 ${status.color}`}>
                      {status.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
