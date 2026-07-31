"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createPost, updatePost, deletePost, uploadMedia } from "@/lib/posts";
import { slugify } from "@/lib/slugify";
import { categoryFamily } from "@/lib/articles";
import BlockEditor, { ImageDropzone } from "./BlockEditor";
import RevisionHistory from "./RevisionHistory";
import ConfirmDialog from "./ConfirmDialog";
import { CloseIcon, ChevronRightIcon } from "./icons";
import { createRevision } from "@/lib/revisions";
import { getCurrentUserRole } from "@/lib/profile";

const TYPES = [
  {
    value: "article",
    label: "Article",
    description: "Words and pictures",
    icon: (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="5" width="18" height="22" rx="1.5" />
        <line x1="11" y1="12" x2="21" y2="12" />
        <line x1="11" y1="17" x2="21" y2="17" />
        <line x1="11" y1="22" x2="17" y2="22" />
      </svg>
    ),
  },
  {
    value: "video",
    label: "Video",
    description: "Embed a YouTube video",
    icon: (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="8" width="22" height="16" rx="1.5" />
        <path d="M14 13 L20 16 L14 19 Z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    value: "podcast",
    label: "Podcast",
    description: "Upload an audio episode",
    icon: (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="12" y="5" width="8" height="14" rx="4" />
        <path d="M8 15 a8 8 0 0 0 16 0" />
        <line x1="16" y1="23" x2="16" y2="27" />
      </svg>
    ),
  },
  {
    value: "cartoon",
    label: "Cartoon",
    description: "A single illustration",
    icon: (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16" cy="16" r="11" />
        <circle cx="12.5" cy="13.5" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="19.5" cy="13.5" r="1.2" fill="currentColor" stroke="none" />
        <path d="M11 19 Q16 23.5 21 19" />
      </svg>
    ),
  },
];

const CATEGORIES = ["Bermondsey", "Books", "Film", "Culture"];
const AUTOSAVE_DELAY_MS = 1500;

const emptyPost = {
  type: "article",
  title: "",
  dek: "",
  body: [],
  cover_image_url: "",
  cover_image_alt: "",
  media_url: "",
  category: "Bermondsey",
  author: "",
  status: "draft",
  scheduled_for: null,
  meta_description: "",
  og_image_url: "",
};

function friendlyError(message) {
  if (message?.includes("duplicate key") && message.includes("slug")) {
    return "A post with a very similar title already exists — try tweaking the title slightly and it'll sort itself out.";
  }
  if (message?.includes("row-level security")) {
    return "Only admins can publish, schedule, or delete — nothing was saved. Try \"Save draft\" instead, or ask an admin.";
  }
  return message;
}

// <input type="datetime-local"> works in local time with no timezone
// info, so these convert to/from the ISO string Postgres expects.
function toDatetimeLocalValue(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromDatetimeLocalValue(value) {
  return value ? new Date(value).toISOString() : null;
}

export default function PostForm({ mode, initialPost, themeVars }) {
  const router = useRouter();
  const supabase = createClient();
  const [post, setPost] = useState(initialPost || emptyPost);
  const [error, setError] = useState(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [role, setRole] = useState(null); // "admin" | "contributor" | null (loading)

  useEffect(() => {
    getCurrentUserRole(supabase).then(setRole);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const isAdmin = role === "admin";

  // "idle" (nothing to save, e.g. brand new form) | "unsaved" | "saving" | "saved" | "error"
  const [saveState, setSaveState] = useState("idle");
  const lastSavedRef = useRef(JSON.stringify(initialPost || null));
  const autosaveTimer = useRef(null);
  const isFirstRender = useRef(true);

  function set(field, value) {
    setPost((p) => ({ ...p, [field]: value }));
  }

  async function persist(payload, { redirectOnCreate = false } = {}) {
    setError(null);
    try {
      if (!payload.id) {
        const created = await createPost(supabase, payload);
        lastSavedRef.current = JSON.stringify(created);
        setPost(created);
        setSaveState("saved");
        if (redirectOnCreate) {
          router.push(`/admin/posts/${created.id}/edit`);
        }
        return created;
      } else {
        const updated = await updatePost(supabase, payload.id, payload);
        lastSavedRef.current = JSON.stringify(updated);
        setSaveState("saved");
        return updated;
      }
    } catch (err) {
      setSaveState("error");
      setError(friendlyError(err.message));
      throw err;
    }
  }

  // Autosave: once a post exists (has an id), any change quietly saves
  // itself a second and a half after typing stops — no risk of losing
  // work by forgetting to click a button.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!post.id) return; // nothing to autosave until the first manual "Save draft"

    const json = JSON.stringify(post);
    if (json === lastSavedRef.current) return;

    setSaveState("unsaved");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        await persist(post);
      } catch {
        // error state already set inside persist()
      }
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(autosaveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post]);

  async function handleCoverUpload(file) {
    if (!file) return;
    setCoverUploading(true);
    try {
      const url = await uploadMedia(supabase, file);
      set("cover_image_url", url);
    } catch (err) {
      setError(`Cover image upload failed: ${friendlyError(err.message)}`);
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleManualSave(nextStatus) {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setSaveState("saving");

    const payload = { ...post, status: nextStatus };
    if (nextStatus === "published") {
      payload.published_at = post.published_at || new Date().toISOString();
      payload.scheduled_for = null; // no longer relevant once actually live
    } else if (nextStatus === "scheduled") {
      payload.published_at = null; // not live yet — scheduled_for carries the future date
    }
    // draft: leave published_at/scheduled_for untouched, so a picked date isn't lost

    if (!payload.slug) {
      payload.slug = slugify(payload.title || "untitled");
    }

    try {
      const saved = await persist(payload, { redirectOnCreate: true });
      if (saved) {
        setPost(saved);
        try {
          await createRevision(supabase, saved);
        } catch {
          // not fatal — the save itself already succeeded
        }
      }
    } catch {
      // error already shown
    }
  }

  // Restores a version's *content* (title, body, images, etc.) without
  // touching the post's current lifecycle state (status, slug,
  // published_at, scheduled_for) — restoring an old draft shouldn't be
  // able to accidentally un-publish a post that's since gone live, or
  // reintroduce a schedule date that's already passed.
  async function handleRestore(snapshot) {
    const restored = {
      ...post,
      type: snapshot.type,
      title: snapshot.title,
      dek: snapshot.dek,
      body: snapshot.body,
      cover_image_url: snapshot.cover_image_url,
      cover_image_alt: snapshot.cover_image_alt,
      media_url: snapshot.media_url,
      category: snapshot.category,
      author: snapshot.author,
      meta_description: snapshot.meta_description,
      og_image_url: snapshot.og_image_url,
    };
    setShowHistory(false);
    setPost(restored);
    setSaveState("saving");
    try {
      const saved = await persist(restored);
      if (saved) {
        setPost(saved);
        try {
          await createRevision(supabase, saved);
        } catch {
          // not fatal
        }
      }
    } catch {
      // error already shown
    }
  }

  // The main call-to-action becomes "Schedule" instead of "Publish"
  // whenever a future date is picked — same pattern as most CMSs, so
  // there's only one button to think about, not two separate flows.
  function handlePrimaryAction() {
    const scheduling = post.scheduled_for && new Date(post.scheduled_for) > new Date();
    handleManualSave(scheduling ? "scheduled" : "published");
  }

  async function handleDelete() {
    if (!post.id) return;
    setConfirmDeleteOpen(false);
    setDeleting(true);
    try {
      await deletePost(supabase, post.id);
      router.push("/admin/posts");
    } catch (err) {
      setDeleting(false);
      setError(`Couldn't delete this: ${friendlyError(err.message)}`);
    }
  }

  const statusCopy = {
    idle: "Not saved yet",
    unsaved: "Unsaved changes…",
    saving: "Saving…",
    saved: "\u2713 Saved",
    error: "Couldn't save",
  };
  const statusColor = {
    idle: "text-steel",
    unsaved: "text-steel",
    saving: "text-steel",
    saved: "text-river",
    error: "text-brick",
  };

  const now = new Date();
  const scheduledFuture = post.scheduled_for && new Date(post.scheduled_for) > now;
  const isLive =
    post.status === "published" ||
    (post.status === "scheduled" && post.scheduled_for && new Date(post.scheduled_for) <= now);

  // Same accent PostRenderer uses, so the block canvas's drop cap, quote
  // border, and buttons match how the published piece will actually look.
  const accent = categoryFamily(post.category);
  const accentHex = accent === "brick" ? "var(--color-brick, #9C6B42)" : "var(--color-river, #2B4C73)";

  return (
    <div>
      {/* Sticky action bar — always visible while scrolling, the way a
          Squarespace-style editor keeps Save/Publish in reach at all times. */}
      <div className="sticky top-0 z-20 bg-paper/95 backdrop-blur border-b border-steel/20">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-12 py-3 flex items-center gap-3 flex-wrap">
          <span className={`font-sans text-xs ${statusColor[saveState]}`}>{statusCopy[saveState]}</span>

          {post.id && (
            <span
              className={`font-sans text-[11px] uppercase tracking-[0.06em] rounded-full px-2.5 py-1 ${
                isLive
                  ? "bg-river/[0.1] text-river"
                  : scheduledFuture
                  ? "bg-mustard/25 text-ink"
                  : "bg-steel/[0.12] text-steel"
              }`}
            >
              {isLive
                ? "Live"
                : scheduledFuture
                ? `Scheduled for ${new Date(post.scheduled_for).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Draft"}
            </span>
          )}

          {isAdmin && (
            <label className="flex items-center gap-1.5 font-sans text-xs text-steel">
              Schedule for
              <input
                type="datetime-local"
                value={toDatetimeLocalValue(post.scheduled_for)}
                onChange={(e) => set("scheduled_for", fromDatetimeLocalValue(e.target.value))}
                className="border-b border-steel/30 focus:border-river outline-none bg-transparent text-ink py-0.5"
              />
              {post.scheduled_for && (
                <button
                  type="button"
                  onClick={() => set("scheduled_for", null)}
                  title="Clear schedule"
                  className="text-steel hover:text-brick"
                >
                  <CloseIcon />
                </button>
              )}
            </label>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {post.id && (
              <button
                type="button"
                onClick={() => setShowHistory(true)}
                className="font-sans text-sm text-steel hover:text-ink underline underline-offset-4"
              >
                History
              </button>
            )}
            {post.id && (
              <a
                href={`/admin/posts/${post.id}/preview`}
                target="_blank"
                rel="noreferrer"
                className="font-sans text-sm text-river hover:text-ink underline underline-offset-4"
              >
                Preview
              </a>
            )}
            {isLive && post.slug && (
              <a
                href={`/article/${post.slug}`}
                target="_blank"
                rel="noreferrer"
                className="font-sans text-sm text-steel hover:text-ink underline underline-offset-4"
              >
                View live
              </a>
            )}
            <button
              type="button"
              onClick={() => handleManualSave("draft")}
              className="font-sans text-sm font-600 border border-steel/40 text-ink px-3 py-1.5 rounded-sm hover:border-ink transition-colors"
            >
              Save draft
            </button>
            {isAdmin ? (
              <button
                type="button"
                onClick={handlePrimaryAction}
                className="font-sans text-sm font-600 bg-brick text-paper px-3 py-1.5 rounded-sm hover:bg-ink transition-colors"
              >
                {scheduledFuture ? "Schedule" : isLive ? "Update live post" : "Publish"}
              </button>
            ) : (
              role && (
                <span className="font-sans text-xs text-steel italic">
                  An admin needs to publish this
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Scoped to .theme-canvas rather than :root — real accent
          colours/fonts for fidelity, without leaking into the sticky
          action bar above (also part of this page) or the surrounding
          admin sidebar, both of which use the same --color-brick/
          --color-river variables for their own, fixed-theme purposes.
          See the scope prop on components/ThemeVars.jsx. */}
      <div className="theme-canvas max-w-content mx-auto px-4 sm:px-6 lg:px-12 py-8">
        {themeVars}
        {error && (
          <p className="font-sans text-sm text-brick bg-brick/[0.08] rounded-sm px-3 py-2 mb-6">
            {error}
          </p>
        )}

        {/* Type picker — a card per type, with a plain-language description
            rather than jargon, since this is the very first decision an
            editor has to make. */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => set("type", t.value)}
              className={`flex flex-col items-center text-center gap-1.5 rounded-sm border-2 px-3 py-4 transition-colors ${
                post.type === t.value
                  ? "border-brick bg-brick/[0.06] text-ink"
                  : "border-steel/25 text-steel hover:border-steel/50"
              }`}
            >
              {t.icon}
              <span className="font-sans text-sm font-600">{t.label}</span>
              <span className="font-sans text-xs">{t.description}</span>
            </button>
          ))}
        </div>

        {/* Title and dek are styled exactly like the real headline and
            standfirst on the published page — so this looks like the
            page you're building, not a generic form. */}
        <input
          value={post.title}
          onChange={(e) => set("title", e.target.value)}
          className="w-full font-display font-700 text-3xl sm:text-4xl leading-tight text-ink border-2 border-transparent hover:border-steel/20 focus:border-river rounded-sm px-2 py-1 -mx-2 mb-2 outline-none placeholder:text-steel/50"
          placeholder="Headline"
        />
        <input
          value={post.dek || ""}
          onChange={(e) => set("dek", e.target.value)}
          className="w-full font-body text-lg sm:text-xl text-steel border-2 border-transparent hover:border-steel/20 focus:border-river rounded-sm px-2 py-1 -mx-2 mb-6 outline-none placeholder:text-steel/50"
          placeholder="One or two sentences under the headline…"
        />

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-6 font-sans text-sm">
          <label className="flex items-center gap-2 text-steel">
            Category
            <select
              value={post.category || ""}
              onChange={(e) => set("category", e.target.value)}
              className="text-ink border-b border-steel/30 focus:border-river outline-none py-0.5 bg-transparent"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-steel">
            Author
            <input
              value={post.author || ""}
              onChange={(e) => set("author", e.target.value)}
              placeholder="Who wrote or made this"
              className="text-ink border-b border-steel/30 focus:border-river outline-none py-0.5 bg-transparent w-44"
            />
          </label>
        </div>

        <div className="mb-8">
          <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-1">
            Cover image
          </label>
          <p className="font-sans text-xs text-steel mb-2">
            Shown wherever this post is listed — homepage, archive, and the top of the piece itself.
          </p>
          <ImageDropzone
            url={post.cover_image_url}
            uploading={coverUploading}
            onFile={handleCoverUpload}
            onSelectUrl={(url) => set("cover_image_url", url)}
            supabase={supabase}
          />
          {post.cover_image_url && (
            <input
              value={post.cover_image_alt || ""}
              onChange={(e) => set("cover_image_alt", e.target.value)}
              placeholder="Describe this image for screen readers…"
              className="w-full font-sans text-xs text-steel border-b border-transparent hover:border-steel/20 focus:border-river outline-none mt-1.5 py-1 placeholder:text-steel/40"
            />
          )}
        </div>

        {/* Type-specific fields */}
        {post.type === "article" && (
          <div className="mb-6">
            <BlockEditor
              blocks={post.body || []}
              onChange={(b) => set("body", b)}
              supabase={supabase}
              accentHex={accentHex}
            />
          </div>
        )}

        {(post.type === "video" || post.type === "podcast") && (
          <div className="mb-6">
            <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-1">
              {post.type === "video" ? "Video link (paste a YouTube URL)" : "Podcast audio file URL"}
            </label>
            <input
              value={post.media_url || ""}
              onChange={(e) => set("media_url", e.target.value)}
              className="w-full font-sans text-sm border border-steel/25 rounded-sm px-3 py-2 focus-visible:outline-2 focus-visible:outline-river"
              placeholder={
                post.type === "video" ? "https://youtube.com/watch?v=…" : "https://…/episode.mp3"
              }
            />
            <p className="font-sans text-xs text-steel mt-2">
              {post.type === "video"
                ? "Just paste the normal YouTube link from the address bar — it'll be embedded automatically."
                : "Upload the audio file to Storage first and paste its public URL here."}
            </p>
          </div>
        )}

        {/* SEO & sharing — collapsed by default since it's optional/advanced,
            but real: these fields drive the actual <title>/meta tags,
            see generateMetadata in the preview frame route. */}
        <div className="mb-6 border-t border-steel/20 pt-4">
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
                <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-1">
                  URL
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-sans text-sm text-steel">/article/</span>
                  <input
                    value={post.slug || ""}
                    onChange={(e) => set("slug", slugify(e.target.value))}
                    placeholder={slugify(post.title || "untitled")}
                    className="flex-1 font-sans text-sm border border-steel/25 rounded-sm px-2 py-1.5 focus-visible:outline-2 focus-visible:outline-river"
                  />
                  <button
                    type="button"
                    onClick={() => set("slug", slugify(post.title || "untitled"))}
                    className="font-sans text-xs text-river hover:text-ink underline underline-offset-4 shrink-0"
                  >
                    Reset from title
                  </button>
                </div>
                <p className="font-sans text-xs text-steel mt-1">
                  Leave blank to generate this automatically from the title.
                </p>
              </div>

              <div>
                <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-1">
                  Meta description
                </label>
                <textarea
                  value={post.meta_description || ""}
                  onChange={(e) => set("meta_description", e.target.value)}
                  rows={2}
                  placeholder="What shows under the title in search results — falls back to the dek if left blank."
                  className="w-full font-sans text-sm border border-steel/25 rounded-sm px-3 py-2 focus-visible:outline-2 focus-visible:outline-river resize-y"
                />
                <p
                  className={`font-sans text-xs mt-1 ${
                    (post.meta_description || "").length > 155 ? "text-brick" : "text-steel"
                  }`}
                >
                  {(post.meta_description || "").length}/155 characters
                </p>
              </div>

              <div>
                <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-1">
                  Social share image
                </label>
                <p className="font-sans text-xs text-steel mb-2">
                  Shown when this post is shared on social media. Falls back to the cover image
                  if left blank.
                </p>
                <ImageDropzone
                  url={post.og_image_url}
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

        {post.id && isAdmin && (
          <div className="pt-6 mt-6 border-t border-steel/20">
            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={deleting}
              className="font-sans text-xs text-steel hover:text-brick underline underline-offset-4 disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete this post"}
            </button>
          </div>
        )}
      </div>

      {showHistory && post.id && (
        <RevisionHistory
          supabase={supabase}
          postId={post.id}
          onRestore={handleRestore}
          onClose={() => setShowHistory(false)}
        />
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete this post?"
        message={`"${post.title || "This post"}" will be gone for good — this can't be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
