"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { uploadMedia } from "@/lib/posts";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import MediaPicker from "./MediaPicker";
import CarouselCountControl from "./CarouselCountControl";
import { usePublishOutline } from "./EditorOutlineContext";
import { GripIcon, ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, TrashIcon, LinkIcon, PaletteIcon } from "./icons";
import {
  BACKGROUND_OPTIONS,
  PADDING_OPTIONS,
  ALIGN_OPTIONS,
  VISIBILITY_OPTIONS,
  ALIGNABLE_BLOCK_TYPES,
  UNSTYLABLE_BLOCK_TYPES,
  blockStyleClasses,
} from "@/lib/blockStyle";
import { MOBILE_ITEM_COUNT_OPTIONS, DESKTOP_ITEM_COUNT_OPTIONS } from "@/lib/carouselLayout";

const DEFAULT_ACCENT = "var(--color-river, #2B4C73)";

const BLOCK_TYPES = [
  { type: "paragraph", label: "Text" },
  { type: "heading", label: "Heading" },
  { type: "image", label: "Image" },
  { type: "hero-carousel", label: "Image carousel" },
  { type: "video", label: "Video" },
  { type: "quote", label: "Quote" },
  { type: "button", label: "Button" },
  { type: "embed", label: "Embed" },
  { type: "spacer", label: "Spacer" },
  { type: "divider", label: "Divider" },
  { type: "columns", label: "Columns" },
];

// A short, human-readable label for the "on this page" outline — text
// blocks get their own (stripped-of-markup, truncated) content so the
// list actually helps you find something, rather than a wall of
// identical "Text" entries.
function plainText(html) {
  return (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function truncate(text, max = 40) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}
function outlineLabelFor(block) {
  const typeLabel = BLOCK_TYPES.find((t) => t.type === block.type)?.label || block.type;
  switch (block.type) {
    case "paragraph":
    case "quote": {
      const text = plainText(block.text);
      return text ? truncate(text) : `${typeLabel} (empty)`;
    }
    case "heading":
      return block.text ? truncate(block.text) : `${typeLabel} (empty)`;
    case "button":
      return block.label ? `Button: ${truncate(block.label, 30)}` : "Button (empty)";
    case "image":
      return block.alt ? `Image: ${truncate(block.alt, 30)}` : typeLabel;
    case "hero-carousel":
      return `${typeLabel} (${(block.images || []).length})`;
    case "columns": {
      const count = (block.columns || []).reduce((n, col) => n + col.length, 0);
      return count ? `${typeLabel} (${count} blocks)` : `${typeLabel} (empty)`;
    }
    default:
      return typeLabel;
  }
}

function emptyBlockFor(type) {
  switch (type) {
    case "paragraph":
      return { type, text: "" };
    case "heading":
      return { type, text: "" };
    case "image":
      return { type, url: "", alt: "" };
    case "hero-carousel":
      return { type, images: [] };
    case "video":
      return { type, url: "" };
    case "quote":
      return { type, text: "", attribution: "" };
    case "button":
      return { type, label: "", url: "" };
    case "embed":
      return { type, html: "" };
    case "spacer":
      return { type, size: "medium" };
    case "divider":
      return { type };
    case "columns":
      return { type, columns: [[], []] };
    default:
      return { type };
  }
}

function withId(block) {
  return { ...block, _id: crypto.randomUUID() };
}
function stripIds(items) {
  return items.map(({ _id, ...rest }) => rest);
}

/**
 * `blocks` is the same array-of-blocks shape stored in posts.body/pages.body:
 *   [{ type: "paragraph", text }, { type: "image", url },
 *    { type: "heading", text }, { type: "quote", text, attribution },
 *    { type: "divider" }, { type: "button", label, url }]
 *
 * This is a true visual canvas, not a form describing the content: every
 * block renders using the same classes as components/BlockContent.jsx
 * (the actual public-facing renderer), so what you're editing already
 * looks like the finished page — headline size, drop cap, quote border,
 * button colour, all real. Hover a block for its controls (drag handle,
 * move, delete — plus bold/italic/link for text); hover the gap between
 * two blocks for the "+" inserter.
 *
 * Blocks are keyed by a client-side-only `_id` (stripped before calling
 * onChange, so it never reaches posts.body/pages.body), not array index —
 * a contentEditable paragraph re-associated with a *different* block after
 * a reorder, because React reused its DOM node for "whatever's now at
 * index 2," would show stale content or scramble mid-edit. `blocks` is
 * only re-synced from props when it's genuinely different content (e.g.
 * a revision restore) rather than the parent simply echoing back what
 * this component just sent it — otherwise every keystroke's round trip
 * through parent state would re-seed dangerouslySetInnerHTML and reset
 * the caret to the start, which is exactly the "typed text comes out
 * reversed" bug this guards against.
 *
 * `nested`: set by a "columns" block for each of its own two columns —
 * every column is edited by its own independent BlockEditor instance,
 * reusing this whole component rather than a second, parallel
 * implementation. `nested` suppresses the things that only make sense
 * once per page: publishing to the "on this page" outline (a column's
 * blocks are part of the outer canvas's own outline entry, not a second
 * page), the `block-${index}` DOM id (would collide with the outer
 * canvas's own ids), and native drag-to-reorder (nesting a second
 * independent HTML5 drag zone inside a block that's itself a drag source
 * for the outer canvas's reordering is the same "conflicting drag events"
 * problem HeroCarouselField's own comment already avoids, one level up —
 * arrow buttons still work). It also drops "Columns" from the insert
 * menu, so a column can't contain another columns block.
 */
export default function BlockEditor({ blocks, onChange, supabase, accentHex = DEFAULT_ACCENT, nested = false }) {
  const [items, setItems] = useState(() => blocks.map(withId));
  const lastPushedRef = useRef(JSON.stringify(blocks));

  useEffect(() => {
    const incoming = JSON.stringify(blocks);
    if (incoming === lastPushedRef.current) return; // our own echo — DOM already reflects this
    setItems(blocks.map(withId));
    lastPushedRef.current = incoming;
  }, [blocks]);

  const dragId = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [openInserterAt, setOpenInserterAt] = useState(null);

  // Keyed by render-order index, not `_id` — `_id` comes from
  // crypto.randomUUID() inside this component's own lazy useState
  // initializer, which runs once during the server render and again,
  // independently, during client hydration, so it comes out different
  // each time; baking it into a real DOM `id` attribute (rather than
  // just a React `key`, which is never serialized) would mismatch
  // between server and client HTML. Index is deterministic from the
  // array itself, so it hydrates consistently.
  usePublishOutline(
    "Content",
    items.map((b, i) => ({
      id: `block-${i}`,
      label: outlineLabelFor(b),
      hint: b.style?.visibility === "mobile" ? "Mobile only" : b.style?.visibility === "desktop" ? "Desktop only" : undefined,
      muted: b.style?.visibility && b.style.visibility !== "all",
    })),
    { enabled: !nested }
  );

  const insertableTypes = nested ? BLOCK_TYPES.filter((t) => t.type !== "columns") : BLOCK_TYPES;

  function commit(next) {
    setItems(next);
    const stripped = stripIds(next);
    lastPushedRef.current = JSON.stringify(stripped);
    onChange(stripped);
  }

  function updateBlock(id, updates) {
    commit(items.map((b) => (b._id === id ? { ...b, ...updates } : b)));
  }
  function removeBlock(id) {
    commit(items.filter((b) => b._id !== id));
  }
  function moveBlock(id, direction) {
    const index = items.findIndex((b) => b._id === id);
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  }
  function reorder(fromId, toId) {
    if (fromId === toId) return;
    const from = items.findIndex((b) => b._id === fromId);
    const to = items.findIndex((b) => b._id === toId);
    if (from === -1 || to === -1) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    commit(next);
  }
  function insertAt(index, type) {
    const next = [...items];
    next.splice(index, 0, withId(emptyBlockFor(type)));
    commit(next);
    setOpenInserterAt(null);
  }

  async function uploadImageToBlock(id, file) {
    if (!file) return;
    updateBlock(id, { uploading: true, uploadError: undefined });
    try {
      const url = await uploadMedia(supabase, file);
      updateBlock(id, { url, uploading: false });
    } catch (err) {
      updateBlock(id, { uploading: false, uploadError: `Upload failed: ${err.message}` });
    }
  }

  return (
    <div>
      {!nested && (
        <>
          <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-1">
            Body
          </label>
          <p className="font-sans text-xs text-steel mb-2">
            This is the actual page — edit it in place. Hover a block for its controls, or the gap
            above/below it to insert something new.
          </p>
        </>
      )}

      {items.length === 0 ? (
        <Inserter
          open={openInserterAt === 0}
          onToggle={() => setOpenInserterAt((v) => (v === 0 ? null : 0))}
          onInsert={(type) => insertAt(0, type)}
          types={insertableTypes}
        />
      ) : (
        <Gap
          open={openInserterAt === 0}
          onToggle={() => setOpenInserterAt((v) => (v === 0 ? null : 0))}
          onInsert={(type) => insertAt(0, type)}
          types={insertableTypes}
        />
      )}

      {items.map((block, index) => {
        const isFirstParagraph =
          block.type === "paragraph" && items.slice(0, index).every((b) => b.type !== "paragraph");
        return (
          <div key={block._id}>
            <BlockCanvasItem
              block={block}
              index={index}
              total={items.length}
              accentHex={accentHex}
              isFirstParagraph={isFirstParagraph}
              nested={nested}
              dragOver={dragOverId === block._id}
              onDragStart={() => {
                dragId.current = block._id;
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverId(block._id);
              }}
              onDragLeave={() => setDragOverId((v) => (v === block._id ? null : v))}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId.current !== null) reorder(dragId.current, block._id);
                dragId.current = null;
                setDragOverId(null);
              }}
              onChange={(updates) => updateBlock(block._id, updates)}
              onRemove={() => removeBlock(block._id)}
              onMoveUp={() => moveBlock(block._id, -1)}
              onMoveDown={() => moveBlock(block._id, 1)}
              onUploadImage={(file) => uploadImageToBlock(block._id, file)}
              onSelectImageUrl={(url) => updateBlock(block._id, { url })}
              supabase={supabase}
            />
            <Gap
              open={openInserterAt === index + 1}
              onToggle={() => setOpenInserterAt((v) => (v === index + 1 ? null : index + 1))}
              onInsert={(type) => insertAt(index + 1, type)}
              types={insertableTypes}
            />
          </div>
        );
      })}
    </div>
  );
}

// The thin hover line + "+" button that sits in the gap between two
// blocks (and above the first one) — click it to insert a new block at
// exactly that position.
function Gap({ open, onToggle, onInsert, types = BLOCK_TYPES }) {
  return (
    <div className="relative group h-3 flex items-center">
      <div
        className={`h-px bg-steel/25 flex-1 transition-opacity ${
          open ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label="Insert block here"
        className={`absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-paper border flex items-center justify-center text-sm leading-none transition-opacity ${
          open
            ? "opacity-100 border-river text-river"
            : "opacity-0 group-hover:opacity-100 border-steel/30 text-steel hover:border-river hover:text-river"
        }`}
      >
        +
      </button>
      {open && <InserterMenu onInsert={onInsert} types={types} />}
    </div>
  );
}

// Same "+" affordance, but always visible (not hover-only) since there's
// nothing yet to hover over.
function Inserter({ open, onToggle, onInsert, types = BLOCK_TYPES }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="w-full border-2 border-dashed border-steel/30 rounded-sm py-10 text-center text-steel hover:border-river hover:text-river transition-colors"
      >
        <span className="text-2xl leading-none block mb-1">+</span>
        <span className="font-sans text-sm">Add your first block</span>
      </button>
      {open && <InserterMenu onInsert={onInsert} types={types} centered />}
    </div>
  );
}

function InserterMenu({ onInsert, types = BLOCK_TYPES, centered }) {
  return (
    <div
      className={`absolute z-10 top-full mt-2 bg-paper border border-steel/25 rounded-sm shadow-lg p-1 flex gap-1 ${
        centered ? "left-1/2 -translate-x-1/2" : "left-1/2 -translate-x-1/2"
      }`}
    >
      {types.map((t) => (
        <button
          key={t.type}
          type="button"
          onClick={() => onInsert(t.type)}
          className="font-sans text-xs text-ink px-2.5 py-2 rounded-sm hover:bg-river/[0.08] whitespace-nowrap"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// Background/padding/alignment/visibility for one block — the same
// options lists components/BlockContent.jsx uses to render the live page,
// via the shared lib/blockStyle.js, so what's picked here is exactly what
// ships. No outside-click dismissal, same as Gap's InserterMenu below —
// toggled by its own toolbar button instead.
//
// `containerStyleable` gates Background/Padding/Alignment — meaningless
// on a spacer/divider — but Visibility always shows: a divider or gap you
// only want on mobile is a real case, so every block type gets it.
function StylePanel({ style, alignable, containerStyleable, onChange }) {
  const current = { background: "none", padding: "none", align: "left", visibility: "all", ...style };

  function set(key, value) {
    onChange({ ...current, [key]: value });
  }

  return (
    <div className="absolute z-20 right-0 top-6 bg-paper border border-steel/25 rounded-sm shadow-lg p-3 w-60 space-y-3">
      {containerStyleable && (
        <>
          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.08em] text-steel mb-1.5">Background</p>
            <div className="flex gap-1.5">
              {BACKGROUND_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => set("background", opt.id)}
                  title={opt.label}
                  className={`w-7 h-7 rounded-sm border flex items-center justify-center text-steel/50 text-xs ${
                    opt.class || "bg-paper"
                  } ${current.background === opt.id ? "border-river ring-1 ring-river" : "border-steel/25"}`}
                >
                  {opt.id === "none" && <CloseIcon className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.08em] text-steel mb-1.5">Padding</p>
            <div className="flex gap-1">
              {PADDING_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => set("padding", opt.id)}
                  className={`flex-1 font-sans text-xs px-2 py-1 rounded-sm border transition-colors ${
                    current.padding === opt.id ? "border-river text-river bg-river/[0.06]" : "border-steel/25 text-steel hover:text-ink"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {alignable && (
            <div>
              <p className="font-sans text-[10px] uppercase tracking-[0.08em] text-steel mb-1.5">Alignment</p>
              <div className="flex gap-1">
                {ALIGN_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => set("align", opt.id)}
                    className={`flex-1 font-sans text-xs px-2 py-1 rounded-sm border transition-colors ${
                      current.align === opt.id ? "border-river text-river bg-river/[0.06]" : "border-steel/25 text-steel hover:text-ink"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div>
        <p className="font-sans text-[10px] uppercase tracking-[0.08em] text-steel mb-1.5">Show on</p>
        <div className="flex gap-1">
          {VISIBILITY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => set("visibility", opt.id)}
              className={`flex-1 font-sans text-xs px-2 py-1 rounded-sm border transition-colors ${
                current.visibility === opt.id ? "border-river text-river bg-river/[0.06]" : "border-steel/25 text-steel hover:text-ink"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({ className = "", ...props }) {
  return (
    <button
      type="button"
      className={`w-6 h-6 flex items-center justify-center rounded-sm bg-paper border border-steel/25 text-steel/70 hover:text-ink text-xs disabled:opacity-30 ${className}`}
      {...props}
    />
  );
}

function BlockCanvasItem({
  block,
  index,
  total,
  accentHex,
  isFirstParagraph,
  nested,
  dragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onUploadImage,
  onSelectImageUrl,
  supabase,
}) {
  const paragraphRef = useRef(null);
  const [styleOpen, setStyleOpen] = useState(false);
  const containerStyleable = !UNSTYLABLE_BLOCK_TYPES.includes(block.type);

  function exec(command, value = null) {
    paragraphRef.current?.focus();
    document.execCommand(command, false, value);
    onChange({ text: paragraphRef.current.innerHTML });
  }
  function handleLink() {
    const url = window.prompt("Link to:");
    if (url) exec("createLink", url);
  }

  return (
    <div
      id={nested ? undefined : `block-${index}`}
      draggable={!nested}
      onDragStart={nested ? undefined : onDragStart}
      onDragOver={nested ? undefined : onDragOver}
      onDragLeave={nested ? undefined : onDragLeave}
      onDrop={nested ? undefined : onDrop}
      className={`group relative rounded-sm transition-shadow scroll-mt-4 ${
        dragOver ? "outline outline-2 outline-river outline-offset-4" : ""
      }`}
    >
      <div className="absolute -right-1 -top-1 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {block.type === "paragraph" && (
          <>
            <ToolbarButton onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} title="Bold" className="font-bold">
              B
            </ToolbarButton>
            <ToolbarButton onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")} title="Italic" className="italic">
              i
            </ToolbarButton>
            <ToolbarButton onMouseDown={(e) => e.preventDefault()} onClick={handleLink} title="Add link">
              <LinkIcon />
            </ToolbarButton>
            <span className="w-px h-4 bg-steel/25 mx-0.5" />
          </>
        )}
        <ToolbarButton
          onClick={() => setStyleOpen((v) => !v)}
          title="Background, padding, alignment, visibility"
          className={styleOpen ? "border-river text-river" : ""}
        >
          <PaletteIcon />
        </ToolbarButton>
        <span className="w-px h-4 bg-steel/25 mx-0.5" />
        {!nested && (
          <ToolbarButton title="Drag to reorder" className="cursor-grab active:cursor-grabbing">
            <GripIcon />
          </ToolbarButton>
        )}
        <ToolbarButton onClick={onMoveUp} disabled={index === 0} title="Move up">
          <ChevronUpIcon />
        </ToolbarButton>
        <ToolbarButton onClick={onMoveDown} disabled={index === total - 1} title="Move down">
          <ChevronDownIcon />
        </ToolbarButton>
        <ToolbarButton onClick={onRemove} title="Delete block" className="hover:text-brick hover:border-brick">
          <TrashIcon />
        </ToolbarButton>
      </div>

      {styleOpen && (
        <StylePanel
          style={block.style}
          alignable={ALIGNABLE_BLOCK_TYPES.includes(block.type)}
          containerStyleable={containerStyleable}
          onChange={(style) => onChange({ style })}
        />
      )}

      <div
        className={`rounded-sm py-1.5 group-hover:bg-river/[0.03] transition-colors ${blockStyleClasses(block.style, block.type)}`}
      >
        {block.type === "paragraph" && (
          <EditableParagraph
            ref={paragraphRef}
            html={block.text}
            onChange={(text) => onChange({ text })}
            isFirst={isFirstParagraph}
            accentHex={accentHex}
          />
        )}
        {block.type === "heading" && (
          <input
            value={block.text || ""}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Section heading…"
            className="w-full font-display font-700 text-2xl sm:text-3xl text-ink bg-transparent outline-none placeholder:text-steel/40"
          />
        )}
        {block.type === "quote" && (
          <QuoteField block={block} onChange={onChange} accentHex={accentHex} />
        )}
        {block.type === "divider" && <hr className="border-steel/25 my-3" />}
        {block.type === "button" && <ButtonField block={block} onChange={onChange} accentHex={accentHex} />}
        {block.type === "image" && (
          <div>
            <ImageDropzone
              url={block.url}
              uploading={block.uploading}
              onFile={onUploadImage}
              onSelectUrl={onSelectImageUrl}
              supabase={supabase}
              aspect="aspect-[3/2]"
            />
            {block.url && (
              <input
                value={block.alt || ""}
                onChange={(e) => onChange({ alt: e.target.value })}
                placeholder="Describe this image for screen readers…"
                className="w-full font-sans text-xs text-steel bg-transparent outline-none mt-1.5 placeholder:text-steel/40"
              />
            )}
            {block.uploadError && <p className="font-sans text-xs text-brick mt-1.5">{block.uploadError}</p>}
          </div>
        )}
        {block.type === "hero-carousel" && (
          <HeroCarouselField block={block} onChange={onChange} supabase={supabase} />
        )}
        {block.type === "video" && <VideoField block={block} onChange={onChange} />}
        {block.type === "embed" && <EmbedField block={block} onChange={onChange} />}
        {block.type === "spacer" && <SpacerField block={block} onChange={onChange} />}
        {block.type === "columns" && (
          <ColumnsField block={block} onChange={onChange} supabase={supabase} accentHex={accentHex} />
        )}
      </div>
    </div>
  );
}

// Two independently-editable sub-canvases side by side, each its own
// nested BlockEditor instance over its own slice of `block.columns` — see
// the `nested` doc comment on BlockEditor above for why nesting needs the
// drag/outline/insert-menu suppression it provides, rather than a
// separate implementation for what's editing the exact same block shape.
function ColumnsField({ block, onChange, supabase, accentHex }) {
  const columns = block.columns && block.columns.length === 2 ? block.columns : [[], []];

  function updateColumn(index, updated) {
    const next = [...columns];
    next[index] = updated;
    onChange({ columns: next });
  }

  return (
    <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
      {columns.map((colBlocks, i) => (
        <div key={i} className="border border-dashed border-steel/25 rounded-sm p-3">
          <BlockEditor
            blocks={colBlocks}
            onChange={(updated) => updateColumn(i, updated)}
            supabase={supabase}
            accentHex={accentHex}
            nested
          />
        </div>
      ))}
    </div>
  );
}

// contentEditable fights React's usual controlled-input model: feeding
// `html` back in via dangerouslySetInnerHTML on every keystroke makes
// React reassign node.innerHTML each time (the string is one character
// longer than last render), which destroys and recreates the text node
// and collapses the caret to the start — typed text comes out reversed,
// one character inserted before the last on every keystroke. So content
// is set imperatively instead: `skipNextSync` marks a change that
// originated from this element's own onInput (the DOM already has it,
// nothing to do), and the effect only writes `innerHTML` for changes
// that came from somewhere else — initial mount, or an external replace
// like a revision restore.
const EditableParagraph = forwardRef(function EditableParagraph({ html, onChange, isFirst, accentHex }, forwardedRef) {
  const innerRef = useRef(null);
  const skipNextSync = useRef(false);
  const isEmpty = !html || html === "<br>";

  useEffect(() => {
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }
    const node = innerRef.current;
    if (node && node.innerHTML !== (html || "")) {
      node.innerHTML = html || "";
    }
  }, [html]);

  function setRefs(node) {
    innerRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  }

  function handleInput(e) {
    skipNextSync.current = true;
    onChange(e.currentTarget.innerHTML);
  }

  return (
    <div className="relative">
      {isEmpty && (
        <span className="absolute top-0 left-0 font-body text-lg text-steel/50 pointer-events-none">
          Write a paragraph…
        </span>
      )}
      <div
        ref={setRefs}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className={`font-body text-lg leading-relaxed text-ink outline-none [&_a]:underline [&_a]:underline-offset-2 ${
          isFirst ? "drop-cap" : ""
        }`}
        style={isFirst ? { "--drop-cap-color": accentHex } : undefined}
      />
    </div>
  );
});

function QuoteField({ block, onChange, accentHex }) {
  const textRef = useRef(null);

  function autoGrow(el) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  useEffect(() => {
    autoGrow(textRef.current);
  }, [block.text]);

  return (
    <div className="border-l-4 pl-5 py-1" style={{ borderColor: accentHex }}>
      <textarea
        ref={textRef}
        value={block.text || ""}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="Quote…"
        rows={1}
        className="w-full font-display italic text-xl sm:text-2xl text-ink leading-snug bg-transparent outline-none resize-none overflow-hidden placeholder:text-steel/40"
      />
      <input
        value={block.attribution || ""}
        onChange={(e) => onChange({ attribution: e.target.value })}
        placeholder="Attribution (optional)"
        className="w-full font-sans text-sm text-steel bg-transparent outline-none mt-2 placeholder:text-steel/40"
      />
    </div>
  );
}

function ButtonField({ block, onChange, accentHex }) {
  const [editingUrl, setEditingUrl] = useState(false);

  return (
    <div className="py-1">
      <div className="inline-block rounded-sm" style={{ backgroundColor: accentHex }}>
        <input
          value={block.label || ""}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Button text"
          size={Math.max((block.label || "Button text").length, 8)}
          className="font-sans text-sm font-600 text-paper bg-transparent outline-none placeholder:text-paper/70 px-5 py-2.5"
        />
      </div>
      <button
        type="button"
        onClick={() => setEditingUrl((v) => !v)}
        className="ml-3 font-sans text-xs text-steel hover:text-river underline underline-offset-4"
      >
        {block.url ? "Edit link" : "Add link"}
      </button>
      {editingUrl && (
        <div className="mt-2 max-w-sm">
          <input
            autoFocus
            value={block.url || ""}
            onChange={(e) => onChange({ url: e.target.value })}
            onBlur={() => setEditingUrl(false)}
            placeholder="/forms/get-in-touch or https://…"
            className="w-full font-sans text-sm border border-steel/25 rounded-sm px-3 py-1.5 outline-none focus:border-river"
          />
        </div>
      )}
    </div>
  );
}

function VideoField({ block, onChange }) {
  const embedUrl = getYouTubeEmbedUrl(block.url);
  return (
    <div>
      <input
        value={block.url || ""}
        onChange={(e) => onChange({ url: e.target.value })}
        placeholder="https://youtube.com/watch?v=…"
        className="w-full font-sans text-sm border border-steel/25 rounded-sm px-3 py-2 outline-none focus:border-river"
      />
      {block.url && (
        <div className="mt-2 aspect-video rounded-sm overflow-hidden bg-ink/5">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <p className="font-sans text-sm text-steel p-6">Add a valid YouTube URL to see the player here.</p>
          )}
        </div>
      )}
    </div>
  );
}

const SPACER_SIZES = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];
const SPACER_HEIGHTS = { small: "h-6", medium: "h-12", large: "h-24" };

function SpacerField({ block, onChange }) {
  const size = block.size || "medium";
  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 rounded-sm border border-dashed border-steel/30 ${SPACER_HEIGHTS[size]}`} />
      <div className="flex gap-1 shrink-0">
        {SPACER_SIZES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => onChange({ size: s.value })}
            className={`font-sans text-xs px-2 py-1 rounded-sm border transition-colors ${
              size === s.value ? "border-river text-river bg-river/[0.06]" : "border-steel/25 text-steel hover:text-ink"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function EmbedField({ block, onChange }) {
  return (
    <div>
      <textarea
        value={block.html || ""}
        onChange={(e) => onChange({ html: e.target.value })}
        placeholder="Paste an embed code — a YouTube/Vimeo/Maps/Spotify iframe, for example"
        rows={4}
        className="w-full font-mono text-xs border border-steel/25 rounded-sm px-3 py-2 outline-none focus:border-river resize-y"
      />
      <p className="font-sans text-xs text-steel mt-1">
        Scripts aren't allowed here — that's what keeps this safe even when a contributor's draft
        is previewed before anyone's reviewed it. Plain iframe embeds from YouTube, Vimeo, Google
        Maps, Spotify, and SoundCloud work; anything else may render stripped down.
      </p>
    </div>
  );
}

/**
 * A small multi-image list within a single block — add/remove/reorder,
 * each with its own alt text. Deliberately arrow-buttons for reordering
 * rather than drag: the block itself is already a native HTML5 drag
 * source (for reordering among other blocks), and nesting a second,
 * independent drag zone inside it is a reliable way to get conflicting
 * drag events from the browser.
 */
function HeroCarouselField({ block, onChange, supabase }) {
  const images = block.images || [];
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef(null);

  function updateImages(next) {
    onChange({ images: next });
  }
  function removeImage(index) {
    updateImages(images.filter((_, i) => i !== index));
  }
  function moveImage(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    updateImages(next);
  }
  function updateImageAlt(index, alt) {
    updateImages(images.map((img, i) => (i === index ? { ...img, alt } : img)));
  }

  async function handleUpload(file) {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadMedia(supabase, file);
      updateImages([...images, { url, alt: "" }]);
    } catch (err) {
      setUploadError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  function handlePickerSelect(url) {
    setPickerOpen(false);
    updateImages([...images, { url, alt: "" }]);
  }

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((img, index) => (
          <div key={index} className="shrink-0 w-32">
            <div className="relative w-32 aspect-video rounded-sm overflow-hidden bg-steel/[0.08]">
              <Image src={img.url} alt="" fill sizes="128px" className="object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                title="Remove"
                className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-sm bg-ink/70 text-paper"
              >
                <CloseIcon className="w-3 h-3" />
              </button>
              <div className="absolute bottom-1 left-1 flex gap-0.5">
                <button
                  type="button"
                  onClick={() => moveImage(index, -1)}
                  disabled={index === 0}
                  title="Move earlier"
                  className="w-5 h-5 flex items-center justify-center rounded-sm bg-ink/70 text-paper disabled:opacity-30"
                >
                  <ChevronLeftIcon className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, 1)}
                  disabled={index === images.length - 1}
                  title="Move later"
                  className="w-5 h-5 flex items-center justify-center rounded-sm bg-ink/70 text-paper disabled:opacity-30"
                >
                  <ChevronRightIcon className="w-3 h-3" />
                </button>
              </div>
            </div>
            <input
              value={img.alt || ""}
              onChange={(e) => updateImageAlt(index, e.target.value)}
              placeholder="Alt text"
              className="w-32 font-sans text-[10px] text-steel bg-transparent outline-none mt-1 placeholder:text-steel/40"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="shrink-0 w-32 aspect-video rounded-sm border-2 border-dashed border-steel/30 hover:border-steel/50 flex items-center justify-center text-steel text-xs text-center px-2"
        >
          {uploading ? "Uploading…" : "+ Add image"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files?.[0])}
        />
      </div>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="font-sans text-xs text-river hover:text-ink underline underline-offset-4 mt-1.5"
      >
        Or choose from library
      </button>
      {pickerOpen && (
        <MediaPicker supabase={supabase} onSelect={handlePickerSelect} onClose={() => setPickerOpen(false)} />
      )}
      {uploadError && <p className="font-sans text-xs text-brick mt-1.5">{uploadError}</p>}

      <div className="mt-3 pt-3 border-t border-steel/15 flex flex-wrap gap-4">
        <CarouselCountControl
          label="Visible on mobile"
          value={block.mobileCount}
          options={MOBILE_ITEM_COUNT_OPTIONS}
          onChange={(mobileCount) => onChange({ mobileCount })}
        />
        <CarouselCountControl
          label="Visible on desktop"
          value={block.desktopCount}
          options={DESKTOP_ITEM_COUNT_OPTIONS}
          onChange={(desktopCount) => onChange({ desktopCount })}
        />
      </div>
    </div>
  );
}

/**
 * A drag-and-drop image dropzone, used for both body image blocks and the
 * cover image field — drop a file straight from the desktop/Finder, or
 * click to browse. This is exported so PostForm's cover image field can
 * reuse it.
 */
export function ImageDropzone({ url, uploading, onFile, onSelectUrl, supabase, aspect = "aspect-[16/10]" }) {
  const [dragActive, setDragActive] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef(null);

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  function handlePickerSelect(pickedUrl) {
    setPickerOpen(false);
    if (onSelectUrl) onSelectUrl(pickedUrl);
  }

  const picker = pickerOpen && supabase && (
    <MediaPicker supabase={supabase} onSelect={handlePickerSelect} onClose={() => setPickerOpen(false)} />
  );

  if (url) {
    return (
      <div className="relative group">
        <div className={`relative w-full ${aspect} rounded-sm overflow-hidden`}>
          <Image src={url} alt="" fill sizes="(max-width: 780px) 100vw, 780px" className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-sans text-sm font-600 text-paper bg-ink/70 px-3 py-1.5 rounded-sm"
          >
            Replace image
          </button>
          {onSelectUrl && (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="font-sans text-sm font-600 text-paper bg-ink/70 px-3 py-1.5 rounded-sm"
            >
              Choose from library
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        {picker}
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`${aspect} rounded-sm border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
          dragActive ? "border-river bg-river/[0.06]" : "border-steel/30 hover:border-steel/50"
        }`}
      >
        {uploading ? (
          <p className="font-sans text-sm text-steel">Uploading…</p>
        ) : (
          <>
            <p className="font-sans text-sm text-ink">Drop an image here, or click to browse</p>
            <p className="font-sans text-xs text-steel mt-1">JPG or PNG</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
      {onSelectUrl && (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="font-sans text-xs text-river hover:text-ink underline underline-offset-4 mt-1.5"
        >
          Or choose from library
        </button>
      )}
      {picker}
    </div>
  );
}
