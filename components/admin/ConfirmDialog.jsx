"use client";

import { useEffect } from "react";

// Replaces window.confirm() for destructive actions (deleting a post,
// page, form, or redirect) — a native browser confirm() breaks the
// illusion of an actual app the moment it appears, styled by the OS
// rather than the site. Same purpose, in-house look: a modal matching
// everything else here, Escape/backdrop-click to cancel, and a distinct
// "danger" button style so a delete confirmation doesn't read the same
// as a routine "are you sure."
export default function ConfirmDialog({ open, title, message, confirmLabel = "Delete", onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-paper rounded-sm shadow-lg border border-steel/20 w-full max-w-sm p-5"
      >
        <p id="confirm-dialog-title" className="font-display font-700 text-lg text-ink mb-1.5">
          {title}
        </p>
        <p className="font-sans text-sm text-steel mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="font-sans text-sm font-600 text-ink border border-steel/30 px-3 py-1.5 rounded-sm hover:bg-steel/[0.08] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="font-sans text-sm font-600 bg-brick text-paper px-3 py-1.5 rounded-sm hover:bg-ink transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
