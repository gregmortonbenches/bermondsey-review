"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { listRedirects, createRedirect, deleteRedirect } from "@/lib/redirects";
import ConfirmDialog from "./ConfirmDialog";
import EmptyState from "./EmptyState";

export default function RedirectsManager() {
  const supabase = createClient();
  const [redirects, setRedirects] = useState(null);
  const [error, setError] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDeleteRedirect, setConfirmDeleteRedirect] = useState(null);

  function refresh() {
    listRedirects(supabase)
      .then(setRedirects)
      .catch((err) => setError(err.message));
  }

  useEffect(refresh, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd(e) {
    e.preventDefault();
    if (!from.trim() || !to.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const normalise = (p) => (p.startsWith("/") ? p : `/${p}`);
      await createRedirect(supabase, normalise(from.trim()), normalise(to.trim()));
      setFrom("");
      setTo("");
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setConfirmDeleteRedirect(null);
    try {
      await deleteRedirect(supabase, id);
      setRedirects((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-12 py-8">
      <h1 className="font-display font-700 text-3xl text-ink">Redirects</h1>
      <p className="font-sans text-sm text-steel mt-1">
        When you rename a post's URL in the editor, a redirect from the old address is added here
        automatically. Add one manually below for anything else — an old external link, say.
      </p>

      {error && (
        <p className="font-sans text-sm text-brick bg-brick/[0.08] rounded-sm px-3 py-2 mt-4">
          {error}
        </p>
      )}

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 mt-6 mb-8">
        <div>
          <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-1">
            From
          </label>
          <input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="/article/old-slug"
            className="font-sans text-sm border border-steel/25 rounded-sm px-3 py-2 w-56 focus-visible:outline-2 focus-visible:outline-river"
          />
        </div>
        <div>
          <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-1">
            To
          </label>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="/article/new-slug"
            className="font-sans text-sm border border-steel/25 rounded-sm px-3 py-2 w-56 focus-visible:outline-2 focus-visible:outline-river"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="font-sans text-sm font-600 bg-brick text-paper px-4 py-2 rounded-sm hover:bg-ink transition-colors disabled:opacity-60"
        >
          {saving ? "Adding…" : "Add redirect"}
        </button>
      </form>

      {redirects === null && <p className="font-sans text-sm text-steel">Loading…</p>}
      {redirects?.length === 0 && (
        <EmptyState
          title="No redirects yet"
          message="Rename a post's URL in the editor and one appears here automatically — or add one manually above for an old external link."
        />
      )}

      <div className="space-y-2">
        {redirects?.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between gap-3 border border-steel/20 rounded-sm px-3 py-2.5"
          >
            <p className="font-sans text-sm text-ink">
              <span className="text-steel">{r.from_path}</span>
              <span className="mx-2 text-steel">→</span>
              {r.to_path}
            </p>
            <button
              type="button"
              onClick={() => setConfirmDeleteRedirect(r)}
              className="font-sans text-xs text-steel hover:text-brick underline underline-offset-4 shrink-0"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!confirmDeleteRedirect}
        title="Remove this redirect?"
        message={
          confirmDeleteRedirect
            ? `Anyone visiting ${confirmDeleteRedirect.from_path} will just get a 404 after this.`
            : ""
        }
        confirmLabel="Remove"
        onConfirm={() => handleDelete(confirmDeleteRedirect.id)}
        onCancel={() => setConfirmDeleteRedirect(null)}
      />
    </div>
  );
}
