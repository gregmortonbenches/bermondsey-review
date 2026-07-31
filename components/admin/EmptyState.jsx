import Link from "next/link";

// A shared "nothing here yet" treatment for the admin's list screens —
// a dashed box, a real heading, and (where creating happens on another
// route, e.g. Posts/Pages/Forms) a CTA button — replacing a single line
// of grey text that read as unfinished rather than intentionally empty.
export default function EmptyState({ title, message, actionLabel, actionHref, onAction, className = "" }) {
  const hasAction = actionLabel && (actionHref || onAction);
  return (
    <div className={`border border-dashed border-steel/30 rounded-sm py-14 px-6 text-center ${className}`}>
      <p className="font-display font-700 text-lg text-ink">{title}</p>
      {message && (
        <p className="font-sans text-sm text-steel mt-1.5 max-w-sm mx-auto">{message}</p>
      )}
      {hasAction &&
        (actionHref ? (
          <Link
            href={actionHref}
            className="inline-block mt-5 font-sans text-sm font-600 bg-brick text-paper px-4 py-2 rounded-sm hover:bg-ink transition-colors"
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAction}
            className="mt-5 font-sans text-sm font-600 bg-brick text-paper px-4 py-2 rounded-sm hover:bg-ink transition-colors"
          >
            {actionLabel}
          </button>
        ))}
    </div>
  );
}
