"use client";

import { suppressCanvasNavigation } from "./canvasNav";

const statusCopy = { saved: "✓ Saved", unsaved: "Unsaved changes…", saving: "Saving…", error: "Couldn't save" };
const statusColor = { saved: "text-river", unsaved: "text-steel", saving: "text-steel", error: "text-brick" };

/**
 * A lighter true-canvas than LayoutCanvas — for a page that has no
 * reorderable sections of its own (Archive, Guess the Spot), just a
 * heading and one-line description. Same "click what you see" principle
 * as everywhere else in this admin: the heading/description are real
 * <input>/<textarea> styled to match the page's actual heading, not a
 * form bolted above it. `children` is whatever read-only content the
 * real page shows below that (the post list, the current round's photo)
 * — shown for context, not editable here; editing an individual post or
 * publishing a round has its own screen already.
 */
export default function PageCopyEditCanvas({
  pageLabel,
  previewHref,
  copy,
  saveState,
  onChange,
  masthead,
  footer,
  themeVars,
  children,
}) {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <div className="sticky top-0 z-30 bg-paper/95 backdrop-blur border-b border-steel/20">
        <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 py-3 flex items-center gap-3">
          <h1 className="font-display font-700 text-lg text-ink">{pageLabel}</h1>
          <span className={`font-sans text-xs ${statusColor[saveState]}`}>{statusCopy[saveState]}</span>
          <a
            href={previewHref}
            target="_blank"
            rel="noreferrer"
            className="ml-auto font-sans text-sm font-600 bg-river text-paper px-3 py-1.5 rounded-sm hover:bg-ink transition-colors whitespace-nowrap"
          >
            Preview ↗
          </a>
        </div>
      </div>

      <p className="font-sans text-xs text-steel text-center py-2.5 bg-river/[0.04] border-b border-steel/10">
        This is the actual {pageLabel} page, in <strong className="text-ink">edit mode</strong> — click
        the heading or description below to edit it, and links here won't navigate away. To click
        around it as a real visitor would, use <strong className="text-ink">Preview</strong> above.
      </p>

      <div className="theme-canvas flex flex-col flex-1" onClickCapture={suppressCanvasNavigation}>
        {themeVars}
        {masthead}

        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-12 py-8 flex-1 w-full">
          <input
            value={copy.title || ""}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Heading"
            className="w-full font-display font-700 text-3xl sm:text-4xl text-ink bg-transparent outline-none border-2 border-transparent hover:border-steel/20 focus:border-river rounded-sm px-2 -mx-2"
          />
          <textarea
            value={copy.description || ""}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={2}
            placeholder="One-line description"
            className="w-full font-body text-steel mt-2 bg-transparent outline-none border-2 border-transparent hover:border-steel/20 focus:border-river rounded-sm px-2 -mx-2 resize-y"
          />

          {children && <div className="mt-6">{children}</div>}
        </div>

        {footer}
      </div>
    </div>
  );
}
