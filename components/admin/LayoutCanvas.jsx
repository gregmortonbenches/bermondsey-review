"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { savePageLayout } from "@/lib/layout";
import { SECTION_REGISTRY } from "@/lib/sections";
import { usePublishOutline } from "./EditorOutlineContext";
import ArticleCarousel from "@/components/ArticleCarousel";
import PuzzlesSection, { PUZZLE_DEFAULTS } from "@/components/PuzzlesSection";
import CarouselCountControl from "./CarouselCountControl";
import { ImageDropzone } from "./BlockEditor";
import { uploadMedia } from "@/lib/posts";
import { MOBILE_ITEM_COUNT_OPTIONS, DESKTOP_ITEM_COUNT_OPTIONS } from "@/lib/carouselLayout";
import { GripIcon, ChevronUpIcon, ChevronDownIcon, GearIcon } from "./icons";
import { useReorderSensors } from "./dnd";
import { suppressCanvasNavigation } from "./canvasNav";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const AUTOSAVE_DELAY_MS = 1200;

/**
 * The homepage layout builder as a true canvas, same philosophy as
 * BlockEditor: this renders the actual homepage — real Masthead, real
 * ThemeVars (so accent colours match), real section content (the actual
 * featured post, actual carousel, actual newsletter band), real Footer —
 * with reorder/show-hide controls layered on hover, instead of a list on
 * one side and an iframe of the real thing on the other.
 *
 * Masthead/Footer/ThemeVars and most sections' real content are Server
 * Components, so they're rendered by the server page (app/admin/(dashboard)/
 * layout/page.jsx) and passed in here as already-rendered elements — a
 * Client Component can't import and render a Server Component itself, but
 * it can place one it was handed. Carousel and puzzles are the exceptions:
 * ArticleCarousel and PuzzlesSection both have no server-only dependencies
 * (just plain props — `articles` fetched once server-side and handed down
 * via `carouselArticles`; puzzle card text living directly on the section
 * object), so both are rendered directly, here, from this section's own
 * live state — their settings panels (item counts, card copy) need to
 * preview instantly as you type/click, which a pre-rendered opaque
 * element handed down as a prop can't do.
 */
export default function LayoutCanvas({ pageKey, initialSections, sectionContent, carouselArticles, masthead, footer, themeVars }) {
  const supabase = createClient();
  const [sections, setSections] = useState(initialSections);
  const [saveState, setSaveState] = useState("saved");

  const reorderSensors = useReorderSensors();
  const autosaveTimer = useRef(null);
  const lastSavedRef = useRef(JSON.stringify(initialSections));
  const isFirstRender = useRef(true);

  // Each section's real content (sectionContent[section.type]) already
  // carries a DOM id matching section.id — the same one CopyLinkButton
  // hands out as `/#${section.id}` — so the outline can point jumpToElement
  // straight at it without this canvas needing ids of its own.
  usePublishOutline(
    "Homepage sections",
    sections.map((s) => ({
      id: s.id,
      label: SECTION_REGISTRY[s.type]?.label || s.type,
      hint: s.enabled ? undefined : "Hidden from homepage",
      muted: !s.enabled,
    }))
  );

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
  function updateSection(id, updates) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
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
  function handleSectionDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSections((prev) => {
      const from = prev.findIndex((s) => s.id === active.id);
      const to = prev.findIndex((s) => s.id === over.id);
      if (from === -1 || to === -1) return prev;
      return arrayMove(prev, from, to);
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
            className="ml-auto font-sans text-sm font-600 bg-river text-paper px-3 py-1.5 rounded-sm hover:bg-ink transition-colors whitespace-nowrap"
          >
            Preview ↗
          </a>
        </div>
      </div>

      <p className="font-sans text-xs text-steel text-center py-2.5 bg-river/[0.04] border-b border-steel/10">
        This is the actual homepage, in <strong className="text-ink">edit mode</strong> — hover a
        section for its controls, untick one to hide it (nothing is deleted, just switched off),
        and links here won't navigate away. To click around it as a real visitor would, use{" "}
        <strong className="text-ink">Preview</strong> above.
      </p>

      {/* Scoped to .theme-canvas rather than :root (see the scope prop on
          ThemeVars) — real accent colours/fonts for fidelity, without
          leaking into the surrounding admin sidebar's own use of the same
          --color-brick/--color-river variables (its active-link colour,
          for one). */}
      <div className="theme-canvas flex flex-col flex-1" onClickCapture={suppressCanvasNavigation}>
        {themeVars}
        {masthead}

        <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 flex-1 w-full">
          <DndContext id={`layout-sections-${pageKey}`} sensors={reorderSensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
            <SortableContext items={orderable.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {orderable.map((section, index) => (
                <SortableSectionSlot
                  key={section.id}
                  section={section}
                  index={index}
                  total={orderable.length}
                  onToggle={() => toggleEnabled(section.id)}
                  onMoveUp={() => moveSection(section.id, -1)}
                  onMoveDown={() => moveSection(section.id, 1)}
                  onUpdateSection={(updates) => updateSection(section.id, updates)}
                  supabase={supabase}
                >
                  {section.type === "carousel" ? (
                    <ArticleCarousel
                      articles={carouselArticles}
                      mobileCount={section.mobileCount}
                      desktopCount={section.desktopCount}
                    />
                  ) : section.type === "puzzles" ? (
                    <PuzzlesSection overrides={{ crossword: section.crossword, geoguesser: section.geoguesser }} />
                  ) : (
                    sectionContent[section.type]
                  )}
                </SortableSectionSlot>
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {newsletterSection && (
          <SectionSlot section={newsletterSection} fixed onToggle={() => toggleEnabled(newsletterSection.id)}>
            {sectionContent.newsletter}
          </SectionSlot>
        )}

        {footer}
      </div>
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

// Wraps SectionSlot with dnd-kit's sortable behaviour — split out from
// SectionSlot itself because useSortable can only be called for a section
// that's actually inside the SortableContext below, and the fixed
// (non-reorderable) newsletter slot is rendered outside it entirely; a
// single component that sometimes calls the hook and sometimes doesn't
// would break the rules of hooks.
function SortableSectionSlot(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.section.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <SectionSlot
      {...props}
      setNodeRef={setNodeRef}
      style={style}
      dragHandleProps={{ ...attributes, ...listeners }}
      isDragging={isDragging}
    />
  );
}

function SectionSlot({
  section,
  index,
  total,
  setNodeRef,
  style,
  dragHandleProps,
  isDragging,
  onToggle,
  onMoveUp,
  onMoveDown,
  onUpdateSection,
  fixed,
  children,
  supabase,
}) {
  const meta = SECTION_REGISTRY[section.type] || { label: section.type };
  const [settingsOpen, setSettingsOpen] = useState(false);
  const hasSettings = section.type === "carousel" || section.type === "puzzles";
  const settingsTitle =
    section.type === "carousel" ? "How many articles show at once, mobile vs desktop" : "Edit the crossword/Bermy on the Map card text";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative transition-shadow ${
        isDragging ? "outline outline-2 outline-river outline-offset-4 z-10 bg-paper" : ""
      }`}
    >
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <span className="font-sans text-[10px] uppercase tracking-[0.06em] text-steel bg-paper border border-steel/25 rounded-sm px-1.5 py-1 mr-1 shadow-sm">
          {meta.label}
        </span>
        {!fixed && (
          <>
            <ControlButton
              {...dragHandleProps}
              title="Drag to reorder"
              className="cursor-grab active:cursor-grabbing touch-none"
            >
              <GripIcon />
            </ControlButton>
            <ControlButton onClick={onMoveUp} disabled={index === 0} title="Move up">
              <ChevronUpIcon />
            </ControlButton>
            <ControlButton onClick={onMoveDown} disabled={index === total - 1} title="Move down">
              <ChevronDownIcon />
            </ControlButton>
          </>
        )}
        {hasSettings && (
          <ControlButton
            onClick={() => setSettingsOpen((v) => !v)}
            title={settingsTitle}
            className={settingsOpen ? "border-river text-river" : ""}
          >
            <GearIcon />
          </ControlButton>
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

      {settingsOpen && hasSettings && section.type === "carousel" && (
        <div className="absolute right-2 top-10 z-20 bg-paper border border-steel/25 rounded-sm shadow-lg p-3 w-64 space-y-3">
          <CarouselCountControl
            label="Articles visible on mobile"
            value={section.mobileCount}
            options={MOBILE_ITEM_COUNT_OPTIONS}
            onChange={(mobileCount) => onUpdateSection({ mobileCount })}
          />
          <CarouselCountControl
            label="Articles visible on desktop"
            value={section.desktopCount}
            options={DESKTOP_ITEM_COUNT_OPTIONS}
            onChange={(desktopCount) => onUpdateSection({ desktopCount })}
          />
        </div>
      )}

      {settingsOpen && hasSettings && section.type === "puzzles" && (
        <div className="absolute right-2 top-10 z-20 bg-paper border border-steel/25 rounded-sm shadow-lg p-3 w-72 space-y-4 max-h-[70vh] overflow-y-auto">
          <PuzzleCardFields
            label="The Crossword card"
            values={section.crossword}
            defaults={PUZZLE_DEFAULTS.crossword}
            onChange={(crossword) => onUpdateSection({ crossword })}
            supabase={supabase}
          />
          <PuzzleCardFields
            label="Bermy on the Map card"
            values={section.geoguesser}
            defaults={PUZZLE_DEFAULTS.geoguesser}
            onChange={(geoguesser) => onUpdateSection({ geoguesser })}
            supabase={supabase}
          />
        </div>
      )}

      {!section.enabled && (
        <div className="absolute left-2 top-2 z-10 font-sans text-[10px] uppercase tracking-[0.06em] text-paper bg-ink/70 rounded-sm px-2 py-1">
          Hidden from homepage
        </div>
      )}

      <div className={section.enabled ? "" : "opacity-40"}>{children}</div>
    </div>
  );
}

// Title/description/CTA/image for one Puzzles & Games card. Text
// placeholders show the actual default copy (from PUZZLE_DEFAULTS)
// rather than a generic "Title" hint, so it's obvious what ships if a
// field is left blank — same reasoning as CarouselCountControl's "Auto"
// option elsewhere on this canvas. The image is optional in the same
// way: left unset, the card keeps its hand-drawn illustration (see
// PuzzlesSection.jsx) instead of showing a blank square.
function PuzzleCardFields({ label, values, defaults, onChange, supabase }) {
  const [uploading, setUploading] = useState(false);

  async function handleImageUpload(file) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadMedia(supabase, file);
      onChange({ ...values, imageUrl: url });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <p className="font-sans text-[10px] uppercase tracking-[0.08em] text-steel mb-1.5">{label}</p>
      <div className="space-y-1.5">
        <input
          value={values?.title || ""}
          onChange={(e) => onChange({ ...values, title: e.target.value })}
          placeholder={defaults.title}
          className="w-full font-sans text-xs border border-steel/25 rounded-sm px-2 py-1.5 outline-none focus:border-river placeholder:text-steel/50"
        />
        <textarea
          value={values?.description || ""}
          onChange={(e) => onChange({ ...values, description: e.target.value })}
          placeholder={defaults.description}
          rows={2}
          className="w-full font-sans text-xs border border-steel/25 rounded-sm px-2 py-1.5 outline-none focus:border-river placeholder:text-steel/50 resize-none"
        />
        <input
          value={values?.cta || ""}
          onChange={(e) => onChange({ ...values, cta: e.target.value })}
          placeholder={defaults.cta}
          className="w-full font-sans text-xs border border-steel/25 rounded-sm px-2 py-1.5 outline-none focus:border-river placeholder:text-steel/50"
        />
        <div>
          <p className="font-sans text-[10px] text-steel mb-1">
            Card image — optional, replaces the illustration
          </p>
          <ImageDropzone
            url={values?.imageUrl}
            uploading={uploading}
            onFile={handleImageUpload}
            onSelectUrl={(url) => onChange({ ...values, imageUrl: url })}
            supabase={supabase}
            aspect="aspect-square"
          />
          {values?.imageUrl && (
            <button
              type="button"
              onClick={() => onChange({ ...values, imageUrl: "" })}
              className="font-sans text-[11px] text-steel hover:text-brick underline underline-offset-2 mt-1"
            >
              Remove, use the illustration instead
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
