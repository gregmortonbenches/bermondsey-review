"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { savePageLayout } from "@/lib/layout";
import { SECTION_REGISTRY } from "@/lib/sections";

const AUTOSAVE_DELAY_MS = 1200;

/**
 * The homepage layout builder as a true canvas, same philosophy as
 * BlockEditor: this renders the actual homepage — real Masthead, real
 * ThemeVars (so accent colours match), real section content (the actual
 * featured post, actual carousel, actual newsletter band), real Footer —
 * with reorder/show-hide controls layered on hover, instead of a list on
 * one side and an iframe of the real thing on the other.
 *
 * Masthead/Footer/ThemeVars and each section's real content are Server
 * Components, so they're rendered by the server page (app/admin/(dashboard)/
 * layout/page.jsx) and passed in here as already-rendered elements — a
 * Client Component can't import and render a Server Component itself, but
 * it can place one it was handed.
 */
export default function LayoutCanvas({ pageKey, initialSections, sectionContent, masthead, footer, themeVars }) {
  const supabase = createClient();
  const [sections, setSections] = useState(initialSections);
  const [saveState, setSaveState] = useState("saved");

  const dragId = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);
  const autosaveTimer = useRef(null);
  const lastSavedRef = useRef(JSON.stringify(initialSections));
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const json = JSON.stringify(sections);
    if (json === lastSavedRef.current) return;

    setSaveState("unsaved");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        await savePageLayout(supabase, pageKey, sections);
        lastSavedRef.current = json;
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(autosaveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  function toggleEnabled(id) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  }
  function moveSection(id, direction) {
    setSections((prev) => {
      const index = prev.findIndex((s) => s.id === id);
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  function reorder(fromId, toId) {
    if (fromId === toId) return;
    setSections((prev) => {
      const from = prev.findIndex((s) => s.id === fromId);
      const to = prev.findIndex((s) => s.id === toId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  const statusCopy = { saved: "✓ Saved", unsaved: "Unsaved changes…", saving: "Saving…", error: "Couldn't save" };
  const statusColor = { saved: "text-river", unsaved: "text-steel", saving: "text-steel", error: "text-brick" };

  // Newsletter always renders last on the real homepage regardless of its
  // position here — it's full-bleed, outside the constrained-width column
  // the other sections share (see components/HomePageBody.jsx) — so it's
  // shown separately, toggleable but not reorderable, rather than offering
  // a drag handle that wouldn't actually change anything.
  const orderable = sections.filter((s) => s.type !== "newsletter");
  const newsletterSection = sections.find((s) => s.type === "newsletter");

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <div className="sticky top-0 z-30 bg-paper/95 backdrop-blur border-b border-steel/20">
        <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 py-3 flex items-center gap-3">
          <h1 className="font-display font-700 text-lg text-ink">Homepage layout</h1>
          <span className={`font-sans text-xs ${statusColor[saveState]}`}>{statusCopy[saveState]}</span>
          <a
            href="/admin/layout/preview"
            target="_blank"
            rel="noreferrer"
            className="ml-auto font-sans text-sm text-river hover:text-ink underline underline-offset-4"
          >
            Preview on mobile/tablet ↗
          </a>
        </div>
      </div>

      <p className="font-sans text-xs text-steel text-center py-2.5 bg-river/[0.04] border-b border-steel/10">
        This is the actual homepage. Hover a section for its controls, or untick one to hide it —
        nothing is deleted, just switched off.
      </p>

      {themeVars}
      {masthead}

      <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 flex-1 w-full">
        {orderable.map((section, index) => (
          <SectionSlot
            key={section.id}
            section={section}
            index={index}
            total={orderable.length}
            dragOver={dragOverId === section.id}
            onDragStart={() => {
              dragId.current = section.id;
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverId(section.id);
            }}
            onDragLeave={() => setDragOverId((v) => (v === section.id ? null : v))}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId.current !== null) reorder(dragId.current, section.id);
              dragId.current = null;
              setDragOverId(null);
            }}
            onToggle={() => toggleEnabled(section.id)}
            onMoveUp={() => moveSection(section.id, -1)}
            onMoveDown={() => moveSection(section.id, 1)}
          >
            {sectionContent[section.type]}
          </SectionSlot>
        ))}
      </div>

      {newsletterSection && (
        <SectionSlot section={newsletterSection} fixed onToggle={() => toggleEnabled(newsletterSection.id)}>
          {sectionContent.newsletter}
        </SectionSlot>
      )}

      {footer}
    </div>
  );
}

function ControlButton({ className = "", ...props }) {
  return (
    <button
      type="button"
      className={`w-6 h-6 flex items-center justify-center rounded-sm bg-paper border border-steel/25 text-steel/70 hover:text-ink text-xs shadow-sm disabled:opacity-30 ${className}`}
      {...props}
    />
  );
}

// Every section's id doubles as its anchor — `/#puzzles`, `/#newsletter`,
// etc. — so it can be linked to directly from a nav item, a footer link,
// or a button block anywhere on the site (see components/PuzzlesSection.jsx
// and Newsletter.jsx, which already had ids the masthead's own Puzzles nav
// link and Subscribe button rely on; this just makes every section
// linkable, and the link itself copyable without reading source to find it).
function CopyLinkButton({ anchor }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(`/${anchor}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this link:", `/${anchor}`);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Copy a link to this section — paste it into a nav link, footer link, or button"
      className={`h-6 px-2 flex items-center justify-center rounded-sm bg-paper border text-xs shadow-sm whitespace-nowrap ${
        copied ? "border-river text-river" : "border-steel/25 text-steel/70 hover:text-ink"
      }`}
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}

function SectionSlot({
  section,
  index,
  total,
  dragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onToggle,
  onMoveUp,
  onMoveDown,
  fixed,
  children,
}) {
  const meta = SECTION_REGISTRY[section.type] || { label: section.type };

  return (
    <div
      draggable={!fixed}
      onDragStart={fixed ? undefined : onDragStart}
      onDragOver={fixed ? undefined : onDragOver}
      onDragLeave={fixed ? undefined : onDragLeave}
      onDrop={fixed ? undefined : onDrop}
      className={`group relative transition-shadow ${
        dragOver ? "outline outline-2 outline-river outline-offset-4" : ""
      }`}
    >
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="font-sans text-[10px] uppercase tracking-[0.06em] text-steel bg-paper border border-steel/25 rounded-sm px-1.5 py-1 mr-1 shadow-sm">
          {meta.label}
        </span>
        {!fixed && (
          <>
            <ControlButton title="Drag to reorder" className="cursor-grab active:cursor-grabbing">
              ⠿
            </ControlButton>
            <ControlButton onClick={onMoveUp} disabled={index === 0} title="Move up">
              ↑
            </ControlButton>
            <ControlButton onClick={onMoveDown} disabled={index === total - 1} title="Move down">
              ↓
            </ControlButton>
          </>
        )}
        <CopyLinkButton anchor={`#${section.id}`} />
        <ControlButton
          onClick={onToggle}
          title={section.enabled ? "Hide from homepage" : "Show on homepage"}
          className={section.enabled ? "" : "border-river text-river"}
        >
          {section.enabled ? "Hide" : "Show"}
        </ControlButton>
      </div>

      {!section.enabled && (
        <div className="absolute left-2 top-2 z-10 font-sans text-[10px] uppercase tracking-[0.06em] text-paper bg-ink/70 rounded-sm px-2 py-1">
          Hidden from homepage
        </div>
      )}

      <div className={section.enabled ? "" : "opacity-40"}>{children}</div>
    </div>
  );
}
