"use client";

import { useEffect, useState } from "react";
import { listRevisions } from "@/lib/revisions";

const STATUS_LABEL = { draft: "Draft saved", scheduled: "Scheduled", published: "Published" };

export default function RevisionHistory({ supabase, postId, onRestore, onClose }) {
  const [revisions, setRevisions] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    listRevisions(supabase, postId)
      .then(setRevisions)
      .catch((err) => setError(err.message));
  }, [supabase, postId]);

  return (
    <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-paper rounded-sm w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-steel/20">
          <h2 className="font-display font-700 text-lg text-ink">Version history</h2>
          <button type="button" onClick={onClose} className="font-sans text-sm text-steel hover:text-ink">
            Close ✕
          </button>
        </div>

        <div className="overflow-y-auto p-5 flex-1">
          {error && <p className="font-sans text-sm text-brick mb-3">{error}</p>}
          {revisions === null && <p className="font-sans text-sm text-steel">Loading…</p>}
          {revisions?.length === 0 && (
            <p className="font-sans text-sm text-steel text-center py-8">
              No earlier versions yet — one is saved every time you click Save draft, Publish,
              Schedule, or Update.
            </p>
          )}

          <div className="space-y-2">
            {revisions?.map((rev, i) => (
              <div
                key={rev.id}
                className="flex items-center justify-between gap-3 border border-steel/20 rounded-sm px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="font-sans text-sm text-ink truncate">
                    {rev.snapshot.title || <span className="italic text-steel">Untitled</span>}
                  </p>
                  <p className="font-sans text-xs text-steel mt-0.5">
                    {new Date(rev.created_at).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" · "}
                    {STATUS_LABEL[rev.snapshot.status] || rev.snapshot.status}
                    {i === 0 && " · Most recent"}
                  </p>
                </div>
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => onRestore(rev.snapshot)}
                    className="font-sans text-xs font-600 shrink-0 border border-steel/40 text-ink px-2.5 py-1 rounded-sm hover:border-river hover:text-river transition-colors"
                  >
                    Restore
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
