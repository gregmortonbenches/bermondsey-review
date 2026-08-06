import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/profile";
import { listCrosswordsForAdmin } from "@/lib/crossword";
import EmptyState from "@/components/admin/EmptyState";

export default async function AdminCrosswordPage() {
  const supabase = await createClient();
  const role = await getCurrentUserRole(supabase);

  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <p className="font-sans text-sm text-steel">Crosswords are visible to admins only.</p>
      </div>
    );
  }

  const crosswords = await listCrosswordsForAdmin(supabase);

  return (
    <main className="min-h-screen bg-paper">
      <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="font-display font-700 text-3xl text-ink">The Crossword</h1>
            <p className="font-sans text-sm text-steel mt-1">
              One puzzle is live at a time — the most recently published one below. Older puzzles
              stay here as history.
            </p>
          </div>
          <Link
            href="/admin/crossword/new"
            className="font-sans text-sm font-600 bg-brick text-paper px-4 py-2 rounded-sm hover:bg-ink transition-colors shrink-0"
          >
            New puzzle
          </Link>
        </div>

        {crosswords.length === 0 ? (
          <EmptyState
            title="No puzzles yet"
            message="Design a grid and add clues — it goes live on /crossword as soon as you save it."
            actionLabel="New puzzle"
            actionHref="/admin/crossword/new"
          />
        ) : (
          <div className="border-t border-steel/20">
            {crosswords.map((crossword, index) => (
              <Link
                key={crossword.id}
                href={`/admin/crossword/${crossword.id}/edit`}
                className="flex items-center gap-4 py-4 border-b border-steel/20 hover:bg-river/[0.04] px-2 -mx-2 rounded-sm transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display font-700 text-ink truncate">
                    {crossword.grid_json?.rows || "?"}×{crossword.grid_json?.cols || "?"} grid
                  </p>
                  <p className="font-sans text-xs text-steel mt-1">
                    {new Date(crossword.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                {index === 0 && (
                  <span className="font-sans text-[11px] uppercase tracking-[0.08em] text-river bg-river/[0.1] rounded-full px-2.5 py-1 shrink-0">
                    Current
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
