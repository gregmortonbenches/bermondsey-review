"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createRound, updateRound, deleteRound } from "@/lib/geoguesser";
import { uploadMedia } from "@/lib/posts";
import { ImageDropzone } from "./BlockEditor";
import ConfirmDialog from "./ConfirmDialog";

const GeoMap = dynamic(() => import("../GeoMap"), {
  ssr: false,
  loading: () => (
    <div className="h-80 rounded-sm border border-steel/25 bg-steel/[0.06] flex items-center justify-center">
      <p className="font-sans text-sm text-steel">Loading map…</p>
    </div>
  ),
});

const AUTOSAVE_DELAY_MS = 1500;
const BERMONDSEY_CENTER = [51.497, -0.063];

const emptyRound = {
  photo_url: "",
  photo_alt: "",
  location_name: "",
  hint: "",
  correct_lat: null,
  correct_lng: null,
};

export default function GeoguesserRoundForm({ mode, initialRound }) {
  const router = useRouter();
  const supabase = createClient();
  const [round, setRound] = useState(initialRound || emptyRound);
  const [saveState, setSaveState] = useState("idle");
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [error, setError] = useState(null);
  const autosaveTimer = useRef(null);
  const lastSavedRef = useRef(JSON.stringify(initialRound || null));
  const isFirstRender = useRef(true);

  function set(field, value) {
    setRound((r) => ({ ...r, [field]: value }));
  }

  async function handlePhotoUpload(file) {
    if (!file) return;
    setPhotoUploading(true);
    try {
      const url = await uploadMedia(supabase, file);
      set("photo_url", url);
    } catch (err) {
      setError(`Photo upload failed: ${err.message}`);
    } finally {
      setPhotoUploading(false);
    }
  }

  async function persist(payload, { redirectOnCreate = false } = {}) {
    if (!payload.id) {
      const created = await createRound(supabase, payload);
      lastSavedRef.current = JSON.stringify(created);
      setRound(created);
      if (redirectOnCreate) router.push(`/admin/geoguesser/${created.id}/edit`);
      return created;
    }
    const updated = await updateRound(supabase, payload.id, payload);
    lastSavedRef.current = JSON.stringify(updated);
    return updated;
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!round.id) return;
    const json = JSON.stringify(round);
    if (json === lastSavedRef.current) return;

    setSaveState("unsaved");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        await persist(round);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(autosaveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const canSave = round.photo_url && round.correct_lat != null && round.correct_lng != null;

  async function handleSave() {
    if (!canSave) {
      setError("Add a photo and set the correct spot on the map before saving.");
      return;
    }
    setError(null);
    setSaveState("saving");
    try {
      const saved = await persist(round, { redirectOnCreate: true });
      if (saved) setRound(saved);
      setSaveState("saved");
    } catch (err) {
      setSaveState("error");
      setError(err.message);
    }
  }

  async function handleDelete() {
    if (!round.id) return;
    setConfirmDeleteOpen(false);
    setDeleting(true);
    try {
      await deleteRound(supabase, round.id);
      router.push("/admin/geoguesser");
    } catch (err) {
      setDeleting(false);
      setError(`Couldn't delete this: ${err.message}`);
    }
  }

  const statusCopy = { idle: "Not saved yet", unsaved: "Unsaved changes…", saving: "Saving…", saved: "✓ Saved", error: "Couldn't save" };
  const statusColor = { idle: "text-steel", unsaved: "text-steel", saving: "text-steel", saved: "text-river", error: "text-brick" };

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-12 py-8">
      {error && (
        <p className="font-sans text-sm text-brick bg-brick/[0.08] rounded-sm px-3 py-2 mb-6">{error}</p>
      )}
      <div className="flex items-center gap-3 mb-6">
        <span className={`font-sans text-xs ${statusColor[saveState]}`}>{statusCopy[saveState]}</span>
        <div className="ml-auto">
          <button
            type="button"
            onClick={handleSave}
            className="font-sans text-sm font-600 bg-brick text-paper px-4 py-2 rounded-sm hover:bg-ink transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-1">
        Photo
      </label>
      <p className="font-sans text-xs text-steel mb-2">
        The photo visitors see before guessing — a recognisable-but-not-too-obvious shot works best.
      </p>
      <ImageDropzone
        url={round.photo_url}
        uploading={photoUploading}
        onFile={handlePhotoUpload}
        onSelectUrl={(url) => set("photo_url", url)}
        supabase={supabase}
        aspect="aspect-[16/9]"
      />
      {round.photo_url && (
        <input
          value={round.photo_alt || ""}
          onChange={(e) => set("photo_alt", e.target.value)}
          placeholder="Describe this photo for screen readers…"
          className="w-full font-sans text-xs text-steel border-b border-transparent hover:border-steel/20 focus:border-river outline-none mt-1.5 py-1 placeholder:text-steel/40"
        />
      )}

      <div className="mt-6">
        <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-1">
          Hint
        </label>
        <p className="font-sans text-xs text-steel mb-2">
          Optional — shown to visitors before they guess.
        </p>
        <textarea
          value={round.hint || ""}
          onChange={(e) => set("hint", e.target.value)}
          rows={2}
          placeholder="e.g. “Somewhere you've probably walked past a hundred times”"
          className="w-full font-body text-base border border-steel/25 rounded-sm px-3 py-2 outline-none focus:border-river resize-y"
        />
      </div>

      <div className="mt-6">
        <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-1">
          Location name
        </label>
        <p className="font-sans text-xs text-steel mb-2">
          Revealed to a visitor only after they've guessed — e.g. "Shad Thames".
        </p>
        <input
          value={round.location_name || ""}
          onChange={(e) => set("location_name", e.target.value)}
          placeholder="Where this photo was actually taken"
          className="w-full font-sans text-sm border border-steel/25 rounded-sm px-3 py-2 outline-none focus:border-river"
        />
      </div>

      <div className="mt-6">
        <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-1">
          Correct spot
        </label>
        <p className="font-sans text-xs text-steel mb-2">
          Click the map where the photo was actually taken (or tab to it, arrow keys to move, Enter
          to drop it on the crosshair). This is never sent to the public page — a guess is scored on
          the server instead (see app/api/geoguesser/guess).
        </p>
        <GeoMap
          center={BERMONDSEY_CENTER}
          marker={round.correct_lat != null ? { lat: round.correct_lat, lng: round.correct_lng } : null}
          onPick={(lat, lng) => setRound((r) => ({ ...r, correct_lat: lat, correct_lng: lng }))}
        />
        {round.correct_lat != null && (
          <p className="font-sans text-xs text-steel mt-1.5">
            {round.correct_lat.toFixed(5)}, {round.correct_lng.toFixed(5)}
          </p>
        )}
      </div>

      {round.id && (
        <div className="pt-6 mt-6 border-t border-steel/20">
          <button
            type="button"
            onClick={() => setConfirmDeleteOpen(true)}
            disabled={deleting}
            className="font-sans text-xs text-steel hover:text-brick underline underline-offset-4 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete this round"}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete this round?"
        message="This can't be undone. If it's the current round, the most recent one remaining becomes the new current round."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
