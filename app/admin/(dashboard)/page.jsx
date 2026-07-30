import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllPostsForAdmin } from "@/lib/posts";
import { getCurrentUserRole } from "@/lib/profile";

const TYPE_LABELS = {
  article: "Article",
  video: "Video",
  podcast: "Podcast",
  cartoon: "Cartoon",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const [posts, role] = await Promise.all([
    getAllPostsForAdmin(supabase),
    getCurrentUserRole(supabase),
  ]);
  const isAdmin = role === "admin";

  return (
    <main className="min-h-screen bg-paper">
      <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-700 text-3xl text-ink">Posts</h1>
              {!isAdmin && (
                <span className="font-sans text-[11px] uppercase tracking-[0.08em] text-steel border border-steel/30 rounded-full px-2.5 py-1">
                  Contributor
                </span>
              )}
            </div>
            <p className="font-sans text-sm text-steel mt-1">
              Every article, video, podcast, and cartoon — draft and published.
            </p>
            <p className="font-sans text-xs text-steel mt-2 max-w-md">
              {isAdmin
                ? "Click \"New post\" to start writing. Your changes save themselves as you go — there's nothing to remember. Publish immediately, or pick a date to have it go live on its own."
                : "Click \"New post\" to start writing — your changes save themselves as you go. As a contributor you can write and save drafts; an admin will need to publish them."}
            </p>
          </div>
          <Link
            href="/admin/posts/new"
            className="font-sans text-sm font-600 bg-brick text-paper px-4 py-2 rounded-sm hover:bg-ink transition-colors shrink-0"
          >
            New post
          </Link>
        </div>

        {posts.length === 0 ? (
          <p className="font-body text-steel py-12 text-center">
            Nothing here yet — click "New post" to write the first one.
          </p>
        ) : (
          <div className="border-t border-steel/20">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/admin/posts/${post.id}/edit`}
                className="flex items-center justify-between gap-4 py-4 border-b border-steel/20 hover:bg-river/[0.04] px-2 -mx-2 rounded-sm transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-display font-700 text-ink truncate">
                    {post.title || <span className="text-steel italic">Untitled</span>}
                  </p>
                  <p className="font-sans text-xs text-steel mt-1">
                    {post.category || "Uncategorised"} · {post.author || "No author set"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-sans text-[11px] uppercase tracking-[0.08em] text-steel border border-steel/30 rounded-full px-2.5 py-1">
                    {TYPE_LABELS[post.type] || post.type}
                  </span>
                  {(() => {
                    const now = new Date();
                    const scheduledFuture = post.scheduled_for && new Date(post.scheduled_for) > now;
                    const isLive =
                      post.status === "published" ||
                      (post.status === "scheduled" && post.scheduled_for && new Date(post.scheduled_for) <= now);
                    const label = isLive
                      ? "Published"
                      : scheduledFuture
                      ? `Scheduled — ${new Date(post.scheduled_for).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}`
                      : "Draft";
                    const color = isLive
                      ? "bg-river/[0.1] text-river"
                      : scheduledFuture
                      ? "bg-mustard/25 text-ink"
                      : "bg-steel/[0.12] text-steel";
                    return (
                      <span className={`font-sans text-[11px] uppercase tracking-[0.08em] rounded-full px-2.5 py-1 ${color}`}>
                        {label}
                      </span>
                    );
                  })()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
