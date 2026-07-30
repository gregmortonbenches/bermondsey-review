import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFormById, listSubmissions } from "@/lib/forms";

export default async function FormSubmissionsPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const form = await getFormById(supabase, id);
  if (!form) notFound();
  const submissions = await listSubmissions(supabase, id);

  return (
    <main className="min-h-screen bg-paper">
      <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <Link href={`/admin/forms/${id}/edit`} className="font-sans text-sm text-steel hover:text-ink">
          ← Back to form
        </Link>
        <h1 className="font-display font-700 text-3xl text-ink mt-3">
          Responses — {form.title || "Untitled"}
        </h1>
        <p className="font-sans text-sm text-steel mt-1">{submissions.length} response{submissions.length === 1 ? "" : "s"}</p>

        {submissions.length === 0 ? (
          <p className="font-body text-steel py-12 text-center">No responses yet.</p>
        ) : (
          <div className="mt-6 space-y-3">
            {submissions.map((sub) => (
              <div key={sub.id} className="border border-steel/20 rounded-sm p-4">
                <p className="font-sans text-xs text-steel mb-2">
                  {new Date(sub.submitted_at).toLocaleString("en-GB")}
                </p>
                <dl className="space-y-1">
                  {Object.entries(sub.data).map(([key, value]) => (
                    <div key={key} className="flex gap-2 text-sm font-sans">
                      <dt className="text-steel shrink-0">{key}:</dt>
                      <dd className="text-ink">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
