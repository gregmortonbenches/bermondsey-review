"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveSiteSettings, DEFAULT_SITE_SETTINGS } from "@/lib/theme";
import { uploadMedia } from "@/lib/posts";
import { ImageDropzone } from "./BlockEditor";
import DevicePreview from "./DevicePreview";
import { GripIcon, CloseIcon } from "./icons";
import { useReorderSensors } from "./dnd";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const AUTOSAVE_DELAY_MS = 1200;
const SOCIAL_PLATFORMS = [
  { key: "twitter", label: "Twitter / X", placeholder: "https://x.com/yourhandle" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourhandle" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourpage" },
];

function newLink() {
  return { id: crypto.randomUUID().slice(0, 8), label: "", href: "" };
}

// Nav links are stored without the temporary `id` used for React keys and
// drag-reordering here — see toStoredLinks.
function toEditableLinks(links) {
  return (links?.length ? links : DEFAULT_SITE_SETTINGS.nav_links).map((l) => ({
    id: crypto.randomUUID().slice(0, 8),
    ...l,
  }));
}
function toStoredLinks(links) {
  return links.map(({ label, href }) => ({ label, href }));
}

export default function SiteSettingsEditor({ initialSettings }) {
  const supabase = createClient();
  const [settings, setSettings] = useState({ ...DEFAULT_SITE_SETTINGS, ...initialSettings });
  const [navLinks, setNavLinks] = useState(() => toEditableLinks(initialSettings?.nav_links));
  const [logoUploading, setLogoUploading] = useState(false);
  const [saveState, setSaveState] = useState("saved");
  const [error, setError] = useState(null);

  const reorderSensors = useReorderSensors();
  const autosaveTimer = useRef(null);
  const lastSavedRef = useRef(JSON.stringify({ ...initialSettings, nav_links: toStoredLinks(toEditableLinks(initialSettings?.nav_links)) }));
  const isFirstRender = useRef(true);

  function set(field, value) {
    setSettings((s) => ({ ...s, [field]: value }));
  }
  function setSocial(key, value) {
    setSettings((s) => ({ ...s, social_links: { ...s.social_links, [key]: value } }));
  }

  function updateLink(index, updates) {
    setNavLinks((links) => links.map((l, i) => (i === index ? { ...l, ...updates } : l)));
  }
  function removeLink(index) {
    setNavLinks((links) => links.filter((_, i) => i !== index));
  }
  function addLink() {
    setNavLinks((links) => [...links, newLink()]);
  }
  function handleLinkDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setNavLinks((links) => {
      const from = links.findIndex((l) => l.id === active.id);
      const to = links.findIndex((l) => l.id === over.id);
      if (from === -1 || to === -1) return links;
      return arrayMove(links, from, to);
    });
  }

  async function handleLogoUpload(file) {
    if (!file) return;
    setLogoUploading(true);
    try {
      const url = await uploadMedia(supabase, file);
      set("logo_url", url);
    } catch (err) {
      setError(`Logo upload failed: ${err.message}`);
    } finally {
      setLogoUploading(false);
    }
  }

  const payload = { ...settings, nav_links: toStoredLinks(navLinks) };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const json = JSON.stringify(payload);
    if (json === lastSavedRef.current) return;

    setSaveState("unsaved");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        await saveSiteSettings(supabase, payload);
        lastSavedRef.current = json;
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(autosaveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, navLinks]);

  const statusCopy = { saved: "✓ Saved", unsaved: "Unsaved changes…", saving: "Saving…", error: "Couldn't save" };
  const statusColor = { saved: "text-river", unsaved: "text-steel", saving: "text-steel", error: "text-brick" };

  return (
    <div className="grid lg:grid-cols-[420px_1fr] h-full">
      <div className="border-r border-steel/20 overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-700 text-lg text-ink">Identity</h2>
          <span className={`font-sans text-xs ${statusColor[saveState]}`}>{statusCopy[saveState]}</span>
        </div>
        <p className="font-sans text-xs text-steel mb-5">
          Your site's identity, navigation, and footer — shown on every public page.
        </p>

        {error && (
          <p className="font-sans text-sm text-brick bg-brick/[0.08] rounded-sm px-3 py-2 mb-6">{error}</p>
        )}

        <div className="space-y-6">
          <div>
            <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-1">
              Site title
            </label>
            <input
              value={settings.site_title}
              onChange={(e) => set("site_title", e.target.value)}
              className="w-full font-sans text-sm border border-steel/25 rounded-sm px-3 py-2 focus-visible:outline-2 focus-visible:outline-river"
            />
          </div>

          <div>
            <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-1">
              Tagline
            </label>
            <input
              value={settings.site_tagline}
              onChange={(e) => set("site_tagline", e.target.value)}
              className="w-full font-sans text-sm border border-steel/25 rounded-sm px-3 py-2 focus-visible:outline-2 focus-visible:outline-river"
            />
            <p className="font-sans text-xs text-steel mt-1">
              Shown under the title in the masthead — hidden automatically if you add a logo.
            </p>
          </div>

          <div>
            <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-2">
              Logo
            </label>
            <p className="font-sans text-xs text-steel mb-2">
              Replaces the text title in the masthead once uploaded.
            </p>
            <div className="max-w-[220px]">
              <ImageDropzone
                url={settings.logo_url}
                uploading={logoUploading}
                onFile={handleLogoUpload}
                aspect="aspect-[2.5/1]"
              />
            </div>
            {settings.logo_url && (
              <button
                type="button"
                onClick={() => set("logo_url", "")}
                className="font-sans text-xs text-river hover:text-ink underline underline-offset-4 mt-2"
              >
                Remove logo, use text title instead
              </button>
            )}
          </div>

          <div className="border-t border-steel/20 pt-5">
            <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-2">
              Navigation
            </label>
            <p className="font-sans text-xs text-steel mb-3">
              Shown in the masthead and footer, in this order. Drag to reorder. A link can point
              to a page, an external URL, or a section of the homepage (e.g. <code>/#puzzles</code>)
              — grab the exact link for any section from its "Copy link" control in{" "}
              <a href="/admin/layout" className="underline underline-offset-4 hover:text-river">
                Layout
              </a>
              .
            </p>
            <DndContext id="site-nav-links" sensors={reorderSensors} collisionDetection={closestCenter} onDragEnd={handleLinkDragEnd}>
              <SortableContext items={navLinks.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {navLinks.map((link, index) => (
                    <NavLinkRow
                      key={link.id}
                      link={link}
                      onChange={(updates) => updateLink(index, updates)}
                      onRemove={() => removeLink(index)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <button
              type="button"
              onClick={addLink}
              className="font-sans text-sm font-600 border border-steel/40 text-ink px-3 py-1.5 rounded-sm hover:border-river hover:text-river transition-colors mt-2"
            >
              + Add link
            </button>
          </div>

          <div className="border-t border-steel/20 pt-5">
            <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-2">
              Social links
            </label>
            <p className="font-sans text-xs text-steel mb-3">
              Shown as icons in the footer — leave blank to hide any of them.
            </p>
            <div className="space-y-2">
              {SOCIAL_PLATFORMS.map((p) => (
                <div key={p.key}>
                  <label className="block font-sans text-xs text-steel mb-1">{p.label}</label>
                  <input
                    value={settings.social_links?.[p.key] || ""}
                    onChange={(e) => setSocial(p.key, e.target.value)}
                    placeholder={p.placeholder}
                    className="w-full font-sans text-sm border border-steel/25 rounded-sm px-2 py-1.5"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-steel/20 pt-5">
            <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-1">
              Footer note
            </label>
            <textarea
              value={settings.footer_text || ""}
              onChange={(e) => set("footer_text", e.target.value)}
              rows={2}
              placeholder="An address, a registered charity number, whatever belongs in small print (optional)"
              className="w-full font-sans text-sm border border-steel/25 rounded-sm px-3 py-2 resize-y"
            />
          </div>
        </div>
      </div>

      <DevicePreview src="/admin/layout/preview/frame" heightClass="h-full" />
    </div>
  );
}

function NavLinkRow({ link, onChange, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-sm border p-2 bg-paper transition-colors ${
        isDragging ? "border-river bg-river/[0.04] shadow-lg z-10 relative" : "border-steel/25"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-sm text-steel/50 hover:text-steel cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
      >
        <GripIcon />
      </button>
      <input
        value={link.label}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder="Label"
        className="w-1/3 font-sans text-sm border border-steel/25 rounded-sm px-2 py-1"
      />
      <input
        value={link.href}
        onChange={(e) => onChange({ href: e.target.value })}
        placeholder="/latest, /#puzzles, or https://…"
        className="flex-1 min-w-0 font-sans text-sm border border-steel/25 rounded-sm px-2 py-1"
      />
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-sm border border-steel/25 text-steel hover:text-brick hover:border-brick"
        aria-label="Remove link"
      >
        <CloseIcon />
      </button>
    </div>
  );
}
