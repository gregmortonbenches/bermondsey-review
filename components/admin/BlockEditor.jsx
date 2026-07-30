"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { uploadMedia } from "@/lib/posts";
import RichParagraph from "./RichParagraph";
import MediaPicker from "./MediaPicker";

const BLOCK_LABELS = {
  paragraph: "Paragraph",
  image: "Image",
  heading: "Heading",
  quote: "Quote",
  divider: "Divider",
  button: "Button",
};

/**
 * `blocks` is the same array-of-blocks shape stored in posts.body:
 *   [{ type: "paragraph", text }, { type: "image", url },
 *    { type: "heading", text }, { type: "quote", text, attribution },
 *    { type: "divider" }, { type: "button", label, url }]
 * Paragraphs are edited as rich text (see RichParagraph.jsx); the rest are
 * plain text/URL fields — no formatting needed for a heading or a button
 * label. Blocks can be dragged into a new order, or nudged with the arrow
 * buttons — drag is the quick way, arrows are the reliable fallback.
 */
export default function BlockEditor({ blocks, onChange, supabase }) {
  const dragIndex = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  function updateBlock(index, updates) {
    const next = blocks.map((b, i) => (i === index ? { ...b, ...updates } : b));
    onChange(next);
  }

  function removeBlock(index) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  function moveBlock(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function reorder(from, to) {
    if (from === to) return;
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  function addParagraph() {
    onChange([...blocks, { type: "paragraph", text: "" }]);
  }

  function addImagePlaceholder() {
    onChange([...blocks, { type: "image", url: "" }]);
  }

  function addHeading() {
    onChange([...blocks, { type: "heading", text: "" }]);
  }

  function addQuote() {
    onChange([...blocks, { type: "quote", text: "", attribution: "" }]);
  }

  function addDivider() {
    onChange([...blocks, { type: "divider" }]);
  }

  function addButton() {
    onChange([...blocks, { type: "button", label: "", url: "" }]);
  }

  async function uploadImageToBlock(index, file) {
    if (!file) return;
    updateBlock(index, { uploading: true });
    try {
      const url = await uploadMedia(supabase, file);
      updateBlock(index, { url, uploading: false });
    } catch (err) {
      updateBlock(index, { uploading: false });
      alert(`Image upload failed: ${err.message}`);
    }
  }

  return (
    <div>
      <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-2">
        Body
      </label>
      <p className="font-sans text-xs text-steel mb-3">
        Drag the ⠿ handle to reorder. Select text to bold, italicise, or link it.
      </p>

      {blocks.length === 0 && (
        <div className="border border-dashed border-steel/30 rounded-sm px-4 py-6 text-center mb-3">
          <p className="font-body text-steel">Nothing written yet — start with your first paragraph below.</p>
        </div>
      )}

      <div className="space-y-2">
        {blocks.map((block, index) => (
          <div
            key={index}
            draggable
            onDragStart={() => {
              dragIndex.current = index;
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverIndex(index);
            }}
            onDragLeave={() => setDragOverIndex((v) => (v === index ? null : v))}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex.current !== null) reorder(dragIndex.current, index);
              dragIndex.current = null;
              setDragOverIndex(null);
            }}
            className={`flex gap-2 border rounded-sm p-3 transition-colors ${
              dragOverIndex === index ? "border-river bg-river/[0.04]" : "border-steel/25"
            }`}
          >
            <div
              className="shrink-0 flex flex-col items-center pt-1 cursor-grab active:cursor-grabbing text-steel/50 hover:text-steel select-none"
              title="Drag to reorder"
            >
              <span className="text-lg leading-none">⠿</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-sans text-[11px] uppercase tracking-[0.08em] text-steel">
                  {BLOCK_LABELS[block.type] || block.type}
                </span>
                <div className="flex items-center gap-1 font-sans text-xs">
                  <button
                    type="button"
                    onClick={() => moveBlock(index, -1)}
                    disabled={index === 0}
                    aria-label="Move up"
                    title="Move up"
                    className="w-6 h-6 flex items-center justify-center rounded-sm border border-steel/25 text-steel hover:text-ink hover:border-ink disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBlock(index, 1)}
                    disabled={index === blocks.length - 1}
                    aria-label="Move down"
                    title="Move down"
                    className="w-6 h-6 flex items-center justify-center rounded-sm border border-steel/25 text-steel hover:text-ink hover:border-ink disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBlock(index)}
                    className="ml-1 px-2 h-6 rounded-sm border border-steel/25 text-steel hover:text-brick hover:border-brick"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {block.type === "paragraph" && (
                <RichParagraph
                  html={block.text}
                  onChange={(text) => updateBlock(index, { text })}
                  placeholder="Write a paragraph…"
                />
              )}

              {block.type === "image" && (
                <ImageDropzone
                  url={block.url}
                  uploading={block.uploading}
                  onFile={(file) => uploadImageToBlock(index, file)}
                  onSelectUrl={(url) => updateBlock(index, { url })}
                  supabase={supabase}
                />
              )}

              {block.type === "heading" && (
                <input
                  value={block.text || ""}
                  onChange={(e) => updateBlock(index, { text: e.target.value })}
                  placeholder="Section heading…"
                  className="w-full font-display font-700 text-2xl text-ink border border-steel/25 rounded-sm px-3 py-2 outline-none focus:border-river"
                />
              )}

              {block.type === "quote" && (
                <div className="space-y-2">
                  <textarea
                    value={block.text || ""}
                    onChange={(e) => updateBlock(index, { text: e.target.value })}
                    placeholder="Quote…"
                    rows={2}
                    className="w-full font-display italic text-lg text-ink border border-steel/25 rounded-sm px-3 py-2 outline-none focus:border-river resize-y"
                  />
                  <input
                    value={block.attribution || ""}
                    onChange={(e) => updateBlock(index, { attribution: e.target.value })}
                    placeholder="Attribution (optional)"
                    className="w-full font-sans text-sm text-steel border border-steel/25 rounded-sm px-3 py-1.5 outline-none focus:border-river"
                  />
                </div>
              )}

              {block.type === "divider" && (
                <div className="py-3">
                  <hr className="border-steel/25" />
                </div>
              )}

              {block.type === "button" && (
                <div className="flex gap-2">
                  <input
                    value={block.label || ""}
                    onChange={(e) => updateBlock(index, { label: e.target.value })}
                    placeholder="Button text"
                    className="flex-1 font-sans text-sm border border-steel/25 rounded-sm px-3 py-2 outline-none focus:border-river"
                  />
                  <input
                    value={block.url || ""}
                    onChange={(e) => updateBlock(index, { url: e.target.value })}
                    placeholder="/forms/get-in-touch or https://…"
                    className="flex-1 font-sans text-sm border border-steel/25 rounded-sm px-3 py-2 outline-none focus:border-river"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mt-3">
        <button
          type="button"
          onClick={addParagraph}
          className="font-sans text-sm font-600 border border-steel/40 text-ink px-3 py-1.5 rounded-sm hover:border-river hover:text-river transition-colors"
        >
          + Add paragraph
        </button>
        <button
          type="button"
          onClick={addImagePlaceholder}
          className="font-sans text-sm font-600 border border-steel/40 text-ink px-3 py-1.5 rounded-sm hover:border-river hover:text-river transition-colors"
        >
          + Add image
        </button>
        <button
          type="button"
          onClick={addHeading}
          className="font-sans text-sm font-600 border border-steel/40 text-ink px-3 py-1.5 rounded-sm hover:border-river hover:text-river transition-colors"
        >
          + Add heading
        </button>
        <button
          type="button"
          onClick={addQuote}
          className="font-sans text-sm font-600 border border-steel/40 text-ink px-3 py-1.5 rounded-sm hover:border-river hover:text-river transition-colors"
        >
          + Add quote
        </button>
        <button
          type="button"
          onClick={addButton}
          className="font-sans text-sm font-600 border border-steel/40 text-ink px-3 py-1.5 rounded-sm hover:border-river hover:text-river transition-colors"
        >
          + Add button
        </button>
        <button
          type="button"
          onClick={addDivider}
          className="font-sans text-sm font-600 border border-steel/40 text-ink px-3 py-1.5 rounded-sm hover:border-river hover:text-river transition-colors"
        >
          + Add divider
        </button>
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
