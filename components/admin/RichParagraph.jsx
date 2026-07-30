"use client";

import { useRef } from "react";

/**
 * A contentEditable paragraph styled exactly like the real article body
 * (same font, size, and line height as PostRenderer), with a tiny
 * formatting toolbar for bold/italic/links — so editors are looking at
 * something close to the finished page while they write, not a plain
 * textarea.
 *
 * Stores simple inline HTML (<strong>, <em>, <a>) in the block's `text`
 * field. This uses the browser's built-in execCommand, which is old but
 * still works everywhere for this narrow a job (bold/italic/link) —
 * swapping in a proper editor (Tiptap etc.) later is a drop-in
 * replacement since it targets the same { type: "paragraph", text } shape.
 */
export default function RichParagraph({ html, onChange, placeholder }) {
  const ref = useRef(null);

  function exec(command, value = null) {
    ref.current?.focus();
    document.execCommand(command, false, value);
    onChange(ref.current.innerHTML);
  }

  function handleLink() {
    const url = window.prompt("Link to:");
    if (url) exec("createLink", url);
  }

  const isEmpty = !html || html === "<br>";

  return (
    <div className="relative">
      <div className="flex gap-1 mb-1.5">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("bold")}
          className="w-7 h-7 flex items-center justify-center rounded-sm border border-steel/25 text-ink font-bold text-sm hover:border-river hover:text-river"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("italic")}
          className="w-7 h-7 flex items-center justify-center rounded-sm border border-steel/25 text-ink italic text-sm hover:border-river hover:text-river"
          title="Italic"
        >
          i
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleLink}
          className="w-7 h-7 flex items-center justify-center rounded-sm border border-steel/25 text-ink text-xs hover:border-river hover:text-river"
          title="Add link"
        >
          🔗
        </button>
      </div>

      <div className="relative">
        {isEmpty && placeholder && (
          <span className="absolute top-1 left-2 font-body text-lg text-steel/60 pointer-events-none">
            {placeholder}
          </span>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={() => onChange(ref.current.innerHTML)}
          dangerouslySetInnerHTML={{ __html: html || "" }}
          className="font-body text-lg leading-relaxed text-ink min-h-[3.5rem] px-2 py-1 rounded-sm border border-transparent hover:border-steel/20 focus:border-river outline-none"
        />
      </div>
    </div>
  );
}
