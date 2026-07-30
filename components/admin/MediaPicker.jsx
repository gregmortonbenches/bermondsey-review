"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { listMedia } from "@/lib/media";
import { uploadMedia } from "@/lib/posts";

export default function MediaPicker({ supabase, onSelect, onClose }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    listMedia(supabase)
      .then(setItems)
      .catch((err) => setError(err.message));
  }, [supabase]);

  async function handleUpload(file) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadMedia(supabase, file);
      onSelect(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-paper rounded-sm w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-steel/20">
          <h2 className="font-display font-700 text-lg text-ink">Media library</h2>
          <button
            type="button"
            onClick={onClose}
            className="font-sans text-sm text-steel hover:text-ink"
          >
            Close ✕
          </button>
        </div>

        <div className="px-5 py-3 border-b border-steel/20">
          <label className="font-sans text-sm font-600 border border-steel/40 text-ink px-3 py-1.5 rounded-sm hover:border-river hover:text-river transition-colors cursor-pointer inline-block">
            {uploading ? "Uploading…" : "Upload new image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files?.[0])}
            />
          </label>
        </div>

        <div className="overflow-y-auto p-5 flex-1">
          {error && <p className="font-sans text-sm text-brick mb-3">{error}</p>}

          {items === null && <p className="font-sans text-sm text-steel">Loading…</p>}

          {items?.length === 0 && (
            <p className="font-sans text-sm text-steel text-center py-8">
              Nothing uploaded yet — anything you upload anywhere in the editor will show up here
              for reuse.
            </p>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {items?.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.url)}
                className="relative aspect-square rounded-sm overflow-hidden border-2 border-transparent hover:border-river transition-colors"
                title={item.filename}
              >
                <Image src={item.url} alt="" fill sizes="150px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
