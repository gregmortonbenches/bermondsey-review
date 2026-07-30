"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { listMedia, deleteMediaItem } from "@/lib/media";
import { uploadMedia } from "@/lib/posts";
import { getCurrentUserRole } from "@/lib/profile";

export default function MediaLibraryManager() {
  const supabase = createClient();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  function refresh() {
    listMedia(supabase)
      .then(setItems)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    refresh();
    getCurrentUserRole(supabase).then((role) => setIsAdmin(role === "admin"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload(file) {
    if (!file) return;
    setUploading(true);
    try {
      await uploadMedia(supabase, file);
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(item) {
    const sure = window.confirm(
      `Delete this image for good? If it's still used anywhere on the site, that image will break.`
    );
    if (!sure) return;
    setDeletingId(item.id);
    try {
      await deleteMediaItem(supabase, item);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 py-8">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
        <div>
          <h1 className="font-display font-700 text-3xl text-ink">Media library</h1>
          <p className="font-sans text-sm text-steel mt-1">
            Every image uploaded anywhere in the editor. Reuse one from here via "Choose from
            library" wherever you're adding an image.
          </p>
        </div>
        <label className="font-sans text-sm font-600 bg-brick text-paper px-4 py-2 rounded-sm hover:bg-ink transition-colors cursor-pointer">
          {uploading ? "Uploading…" : "Upload image"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files?.[0])}
          />
        </label>
      </div>

      {error && (
        <p className="font-sans text-sm text-brick bg-brick/[0.08] rounded-sm px-3 py-2 my-4">
          {error}
        </p>
      )}

      {items === null && <p className="font-sans text-sm text-steel mt-8">Loading…</p>}

      {items?.length === 0 && (
        <p className="font-sans text-sm text-steel mt-12 text-center">
          Nothing uploaded yet — upload an image above, or add one from within an article.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6">
        {items?.map((item) => (
          <div key={item.id} className="group relative">
            <div className="aspect-square rounded-sm overflow-hidden bg-steel/[0.08] relative">
              <Image src={item.url} alt="" fill sizes="200px" className="object-cover" />
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => handleDelete(item)}
                disabled={deletingId === item.id}
                className="absolute inset-0 bg-ink/0 group-hover:bg-ink/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
              >
                <span className="font-sans text-xs font-600 text-paper bg-brick/90 px-2.5 py-1 rounded-sm">
                  {deletingId === item.id ? "Deleting…" : "Delete"}
                </span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
