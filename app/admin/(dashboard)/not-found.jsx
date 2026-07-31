import Link from "next/link";

// Renders inside AdminDashboardLayout (the parent (dashboard) layout
// supplies AdminShell's sidebar), so this is just the content area — for
// an edit/preview URL whose post, page, or form id no longer exists (see
// the notFound() calls in .../[id]/edit and .../[id]/preview), rather
// than Next's bare default breaking out of the admin chrome entirely.
export default function AdminNotFound() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="font-display font-700 text-2xl text-ink">Couldn't find that</p>
        <p className="font-sans text-sm text-steel mt-2">
          Whatever this was — a post, a page, a form — it's gone, or it never existed.
        </p>
        <Link
          href="/admin"
          className="inline-block mt-5 font-sans text-sm font-600 bg-brick text-paper px-4 py-2 rounded-sm hover:bg-ink transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
