import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/profile";
import { listRoundsForAdmin } from "@/lib/geoguesser";
import EmptyState from "@/components/admin/EmptyState";

export default async function AdminGeoguesserPage() {
  const supabase = await createClient();
  const role = await getCurrentUserRole(supabase);

  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <p className="font-sans text-sm text-steel">Guess the Spot rounds are visible to admins only.</p>
      </div>
    );
  }

  const rounds = await listRoundsForAdmin(supabase);

  return (
    <main className="min-h-screen bg-paper">
      <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="font-display font-700 text-3xl text-ink">Guess the Spot</h1>
            <p className="font-sans text-sm text-steel mt-1">
              One round is live at a time — the most recently published one below. Older rounds stay
              here as history.
            </p>
          </div>
          <Link
            href="/admin/geoguesser/new"
            className="font-sans text-sm font-600 bg-brick text-paper px-4 py-2 rounded-sm hover:bg-ink transition-colors shrink-0"
          >
            New round
          </Link>
        </div>

        {rounds.length === 0 ? (
          <EmptyState
            title="No rounds yet"
            message="Add a photo and mark the correct spot on the map — it goes live on /geoguesser as soon as you save it."
            actionLabel="New round"
            actionHref="/admin/geoguesser/new"
          />
        ) : (
          <div className="border-t border-steel/20">
            {rounds.map((round, index) => (
              <Link
                key={round.id}
                href={`/admin/geoguesser/${round.id}/edit`}
                className="flex items-center gap-4 py-4 border-b border-steel/20 hover:bg-river/[0.04] px-2 -mx-2 rounded-sm transition-colors"
              >
                <div className="relative w-20 h-14 rounded-sm overflow-hidden bg-steel/[0.1] shrink-0">
                  <Image src={round.photo_url} alt="" fill sizes="80px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-700 text-ink truncate">
                    {round.location_name || <span className="text-steel italic">No location name set</span>}
                  </p>
                  <p className="font-sans text-xs text-steel mt-1">
                    {new Date(round.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
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
