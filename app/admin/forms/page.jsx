import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/profile";
import { listFormsForAdmin } from "@/lib/forms";

export default async function AdminFormsPage() {
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

  const forms = await listFormsForAdmin(supabase);

  return (
    <main className="min-h-screen bg-paper">
      <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="font-display font-700 text-3xl text-ink">Forms</h1>
            <p className="font-sans text-sm text-steel mt-1">
              Build a form beyond the newsletter signup — a contact form, a callout for tips, a
              reader survey.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="font-sans text-sm text-steel hover:text-ink">
              ← Back to posts
            </Link>
            <Link
              href="/admin/forms/new"
              className="font-sans text-sm font-600 bg-brick text-paper px-4 py-2 rounded-sm hover:bg-ink transition-colors"
            >
              New form
            </Link>
          </div>
        </div>

        {forms.length === 0 ? (
          <p className="font-body text-steel py-12 text-center">
            No forms yet — click "New form" to build one.
          </p>
        ) : (
          <div className="border-t border-steel/20">
            {forms.map((form) => (
              <Link
                key={form.id}
                href={`/admin/forms/${form.id}/edit`}
                className="flex items-center justify-between gap-4 py-4 border-b border-steel/20 hover:bg-river/[0.04] px-2 -mx-2 rounded-sm transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-display font-700 text-ink truncate">
                    {form.title || <span className="text-steel italic">Untitled</span>}
                  </p>
                  <p className="font-sans text-xs text-steel mt-1">
                    {form.fields?.length || 0} field{form.fields?.length === 1 ? "" : "s"}
                  </p>
                </div>
                <span
                  className={`font-sans text-[11px] uppercase tracking-[0.08em] rounded-full px-2.5 py-1 shrink-0 ${
                    form.published ? "bg-river/[0.1] text-river" : "bg-steel/[0.12] text-steel"
                  }`}
                >
                  {form.published ? "Published" : "Draft"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
