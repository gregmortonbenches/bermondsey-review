import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/profile";
import { listPagesForAdmin } from "@/lib/pages";
import EmptyState from "@/components/admin/EmptyState";

export default async function AdminPagesPage() {
  const supabase = await createClient();
  const role = await getCurrentUserRole(supabase);

  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <p className="font-sans text-sm text-steel">
          Pages are a site-structure concern, so only admins can manage them.
        </p>
      </div>
    );
  }

  const pages = await listPagesForAdmin(supabase);

  return (
    <main className="min-h-screen bg-paper">
      <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="font-display font-700 text-3xl text-ink">Pages</h1>
            <p className="font-sans text-sm text-steel mt-1">
              Standalone pages like About or Contact — not part of the fortnightly issue cycle.
            </p>
          </div>
          <Link
            href="/admin/pages/new"
            className="font-sans text-sm font-600 bg-brick text-paper px-4 py-2 rounded-sm hover:bg-ink transition-colors"
          >
            New page
          </Link>
        </div>

        {pages.length === 0 ? (
          <EmptyState
            title="No pages yet"
            message="Standalone pages like About or Contact — anything outside the fortnightly issue cycle — show up here."
            actionLabel="New page"
            actionHref="/admin/pages/new"
          />
        ) : (
          <div className="border-t border-steel/20">
            {pages.map((page) => (
              <Link
                key={page.id}
                href={`/admin/pages/${page.id}/edit`}
                className="flex items-center justify-between gap-4 py-4 border-b border-steel/20 hover:bg-river/[0.04] px-2 -mx-2 rounded-sm transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-display font-700 text-ink truncate">
                    {page.title || <span className="text-steel italic">Untitled</span>}
                  </p>
                  <p className="font-sans text-xs text-steel mt-1">
                    /{page.slug} {page.show_in_nav ? "· in navigation" : ""}
                  </p>
                </div>
                <span
                  className={`font-sans text-[11px] uppercase tracking-[0.08em] rounded-full px-2.5 py-1 shrink-0 ${
                    page.published ? "bg-river/[0.1] text-river" : "bg-steel/[0.12] text-steel"
                  }`}
                >
                  {page.published ? "Published" : "Draft"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
