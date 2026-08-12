"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createPage, updatePage, deletePage, RESERVED_SLUGS } from "@/lib/pages";
import { uploadMedia } from "@/lib/posts";
import { slugify } from "@/lib/slugify";
import BlockEditor, { ImageDropzone } from "./BlockEditor";
import ConfirmDialog from "./ConfirmDialog";
import { ChevronRightIcon } from "./icons";

const AUTOSAVE_DELAY_MS = 1500;
// Same fixed accent PageRenderer uses — pages aren't categorised the way
// posts are, so there's no per-page colour to derive.
const ACCENT_HEX = "var(--color-river, #1D4ED8)";
const emptyPage = {
  title: "",
  slug: "",
  body: [],
  meta_description: "",
  og_image_url: "",
  show_in_nav: false,
  published: false,
};

function friendlyError(message) {
  if (message?.includes("duplicate key") && message.includes("slug")) {
    return "A page with a very similar title already exists — try tweaking the title slightly.";
  }
  return message;
}

export default function PageForm({ initialPage, themeVars }) {
  const router = useRouter();
  const supabase = createClient();
  const [page, setPage] = useState(initialPage || emptyPage);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);

  const [saveState, setSaveState] = useState("idle");
  const lastSavedRef = useRef(JSON.stringify(initialPage || null));
  const autosaveTimer = useRef(null);
  const isFirstRender = useRef(true);

  function set(field, value) {
    setPage((p) => ({ ...p, [field]: value }));
  }

  async function persist(payload, { redirectOnCreate = false } = {}) {
    setError(null);
    if (RESERVED_SLUGS.includes(payload.slug)) {
      const message = `"/${payload.slug}" is already used by the site itself — try a different address.`;
      setSaveState("error");
      setError(message);
      throw new Error(message);
    }
    try {
      if (!payload.id) {
        const created = await createPage(supabase, payload);
        lastSavedRef.current = JSON.stringify(created);
        setPage(created);
        setSaveState("saved");
        if (redirectOnCreate) router.push(`/admin/pages/${created.id}/edit`);
        return created;
      }
      const updated = await updatePage(supabase, payload.id, payload);
      lastSavedRef.current = JSON.stringify(updated);
      setSaveState("saved");
      return updated;
    } catch (err) {
      setSaveState("error");
      setError(friendlyError(err.message));
      throw err;
    }
  }

  // Autosave, same pattern as PostForm — once a page exists, changes save
  // themselves a beat after typing stops.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!page.id) return;

    const json = JSON.stringify(page);
    if (json === lastSavedRef.current) return;

    setSaveState("unsaved");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        await persist(page);
      } catch {
        // error state already set inside persist()
      }
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(autosaveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function handleSave() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setSaveState("saving");

    const payload = { ...page };
    if (!payload.slug) payload.slug = slugify(payload.title || "untitled");

    try {
      const saved = await persist(payload, { redirectOnCreate: true });
      if (saved) setPage(saved);
    } catch {
      // error already shown
    }
  }

  async function handleDelete() {
    if (!page.id) return;
    setConfirmDeleteOpen(false);
    setDeleting(true);
    try {
      await deletePage(supabase, page.id);
      router.push("/admin/pages");
    } catch (err) {
      setDeleting(false);
      setError(`Couldn't delete this: ${friendlyError(err.message)}`);
    }
  }

  const statusCopy = { idle: "Not saved yet", unsaved: "Unsaved changes…", saving: "Saving…", saved: "✓ Saved", error: "Couldn't save" };
  const statusColor = { idle: "text-steel", unsaved: "text-steel", saving: "text-steel", saved: "text-river", error: "text-brick" };

  return (
    <div>
      <div className="sticky top-0 z-20 bg-paper/95 backdrop-blur border-b border-steel/20">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-12 py-3 flex items-center gap-3 flex-wrap">
          <span className={`font-sans text-xs ${statusColor[saveState]}`}>{statusCopy[saveState]}</span>

          {page.id && (
            <span
              className={`font-sans text-[11px] uppercase tracking-[0.06em] rounded-full px-2.5 py-1 ${
                page.published ? "bg-river/[0.1] text-river" : "bg-steel/[0.12] text-steel"
              }`}
            >
              {page.published ? "Published" : "Draft"}
            </span>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {page.id && (
              <a
                href={`/admin/pages/${page.id}/preview`}
                target="_blank"
                rel="noreferrer"
                className="font-sans text-sm text-river hover:text-ink underline underline-offset-4"
              >
                Preview
              </a>
            )}
            {page.published && page.slug && (
              <a
                href={`/${page.slug}`}
                target="_blank"
                rel="noreferrer"
                className="font-sans text-sm text-steel hover:text-ink underline underline-offset-4"
              >
                View live
              </a>
            )}
            <label className="flex items-center gap-1.5 font-sans text-sm text-ink">
              <input
                type="checkbox"
                checked={page.published}
                onChange={(e) => set("published", e.target.checked)}
                className="w-4 h-4 accent-river"
              />
              Published
            </label>
            <button
              type="button"
              onClick={handleSave}
              className="font-sans text-sm font-600 bg-brick text-paper px-3 py-1.5 rounded-sm hover:bg-ink transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Scoped to .theme-canvas — see the matching comment in
          PostForm.jsx and the scope prop on components/ThemeVars.jsx. */}
      <div className="theme-canvas max-w-content mx-auto px-4 sm:px-6 lg:px-12 py-8">
        {themeVars}
        {error && (
          <p className="font-sans text-sm text-brick bg-brick/[0.08] rounded-sm px-3 py-2 mb-6">{error}</p>
        )}

        <input
          value={page.title}
          onChange={(e) => set("title", e.target.value)}
          className="w-full font-display font-700 text-3xl sm:text-4xl leading-tight text-ink border-2 border-transparent hover:border-steel/20 focus:border-river rounded-sm px-2 py-1 -mx-2 mb-6 outline-none placeholder:text-steel/50"
          placeholder="Page title, e.g. “About us”"
        />

        <label className="flex items-center gap-2 font-sans text-sm text-ink mb-6">
          <input
            type="checkbox"
            checked={page.show_in_nav}
            onChange={(e) => set("show_in_nav", e.target.checked)}
            className="w-4 h-4 accent-river"
          />
          Show in site navigation
        </label>

        <BlockEditor
          blocks={page.body || []}
          onChange={(b) => set("body", b)}
          supabase={supabase}
          accentHex={ACCENT_HEX}
        />

        <div className="mt-6 border-t border-steel/20 pt-4">
          <button
            type="button"
            onClick={() => setSeoOpen((v) => !v)}
            className="font-sans text-sm font-600 text-steel hover:text-ink flex items-center gap-1.5"
          >
            <ChevronRightIcon className={`w-3.5 h-3.5 transition-transform ${seoOpen ? "rotate-90" : ""}`} />
            SEO &amp; sharing
          </button>

          {seoOpen && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-1">URL</label>
                <div className="flex items-center gap-2">
                  <span className="font-sans text-sm text-steel">/</span>
                  <input
                    value={page.slug || ""}
                    onChange={(e) => set("slug", slugify(e.target.value))}
                    placeholder={slugify(page.title || "untitled")}
                    className="flex-1 font-sans text-sm border border-steel/25 rounded-sm px-2 py-1.5 focus-visible:outline-2 focus-visible:outline-river"
                  />
                  <button
                    type="button"
                    onClick={() => set("slug", slugify(page.title || "untitled"))}
                    className="font-sans text-xs text-river hover:text-ink underline underline-offset-4 shrink-0"
                  >
                    Reset from title
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-1">
                  Meta description
                </label>
                <textarea
                  value={page.meta_description || ""}
                  onChange={(e) => set("meta_description", e.target.value)}
                  rows={2}
                  className="w-full font-sans text-sm border border-steel/25 rounded-sm px-3 py-2 focus-visible:outline-2 focus-visible:outline-river resize-y"
                />
              </div>

              <div>
                <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-1">
                  Social share image
                </label>
                <ImageDropzone
                  url={page.og_image_url}
                  uploading={false}
                  onFile={async (file) => {
                    const url = await uploadMedia(supabase, file);
                    set("og_image_url", url);
                  }}
                  onSelectUrl={(url) => set("og_image_url", url)}
                  supabase={supabase}
                  aspect="aspect-[1.91/1]"
                />
              </div>
            </div>
          )}
        </div>

        {page.id && (
          <div className="pt-6 mt-6 border-t border-steel/20">
            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={deleting}
              className="font-sans text-xs text-steel hover:text-brick underline underline-offset-4 disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete this page"}
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete this page?"
        message={`"${page.title || "This page"}" will be gone for good — this can't be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
