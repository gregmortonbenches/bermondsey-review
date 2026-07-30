import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/profile";
import { getViewStats } from "@/lib/analytics";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const role = await getCurrentUserRole(supabase);

  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h1 className="font-display font-700 text-xl text-ink mb-2">Admins only</h1>
          <Link href="/admin" className="font-sans text-sm text-river hover:text-ink underline underline-offset-4">
            ← Back to posts
          </Link>
        </div>
      </div>
    );
  }

  let stats = [];
  let loadError = null;
  try {
    stats = await getViewStats(supabase);
  } catch (err) {
    loadError = err.message;
  }

  const maxViews = Math.max(1, ...stats.map((s) => s.last30));

  return (
    <main className="min-h-screen bg-paper">
      <div className="border-b border-steel/20 px-5 py-3">
        <Link href="/admin" className="font-sans text-sm text-steel hover:text-ink">
          ← Back to posts
        </Link>
      </div>

      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <h1 className="font-display font-700 text-3xl text-ink">Analytics</h1>
        <p className="font-sans text-sm text-steel mt-1">
          Views per page over the last 30 days. No cookies, no per-visitor tracking — just how
          many times each page loaded.
        </p>

        {loadError && (
          <p className="font-sans text-sm text-brick bg-brick/[0.08] rounded-sm px-3 py-2 mt-4">
            {loadError}
          </p>
        )}

        {!loadError && stats.length === 0 && (
          <p className="font-sans text-sm text-steel mt-8">
            No views recorded yet — this fills in once the site has real visitors.
          </p>
        )}

        <div className="mt-8 space-y-3">
          {stats.map((row) => (
            <div key={row.path} className="border-b border-steel/15 pb-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-sans text-sm text-ink truncate">{row.path}</p>
                <p className="font-sans text-xs text-steel shrink-0">
                  {row.last7} last 7 days · {row.last30} last 30 days
                </p>
              </div>
              <div className="h-1.5 bg-steel/[0.1] rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-river rounded-full"
                  style={{ width: `${(row.last30 / maxViews) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
