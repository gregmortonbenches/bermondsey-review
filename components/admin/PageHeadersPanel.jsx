"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveSiteSettings, DEFAULT_SITE_SETTINGS } from "@/lib/theme";

const AUTOSAVE_DELAY_MS = 1200;

// Standalone pages that aren't a posts/pages row (so they get no editing
// surface anywhere else) but still show a heading + one-line
// description at the top — this is the one place that copy can be
// changed without editing code. Lives here, alongside the homepage
// layout builder, rather than in the "Site" settings screen — "Site" is
// identity and navigation (title, logo, nav links, footer); this is
// about how an individual page presents itself, the same territory as
// the homepage section builder below it. Add a new entry here (and a
// matching key in DEFAULT_SITE_SETTINGS.page_copy, lib/theme.js) as
// more of these pages get built out, e.g. the Crossword once it exists.
const PAGE_COPY_TARGETS = [
  { key: "archive", label: "Archive", path: "/archive" },
  { key: "geoguesser", label: "Guess the Spot", path: "/geoguesser" },
];

export default function PageHeadersPanel({ initialPageCopy }) {
  const supabase = createClient();
  const [pageCopy, setPageCopy] = useState({ ...DEFAULT_SITE_SETTINGS.page_copy, ...initialPageCopy });
  const [saveState, setSaveState] = useState("saved");
  const autosaveTimer = useRef(null);
  const lastSavedRef = useRef(JSON.stringify(initialPageCopy || DEFAULT_SITE_SETTINGS.page_copy));
  const isFirstRender = useRef(true);

  function setField(pageKey, field, value) {
    setPageCopy((pc) => ({ ...pc, [pageKey]: { ...pc[pageKey], [field]: value } }));
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const json = JSON.stringify(pageCopy);
    if (json === lastSavedRef.current) return;

    setSaveState("unsaved");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        await saveSiteSettings(supabase, { page_copy: pageCopy });
        lastSavedRef.current = json;
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(autosaveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCopy]);

  const statusCopy = { saved: "✓ Saved", unsaved: "Unsaved changes…", saving: "Saving…", error: "Couldn't save" };
  const statusColor = { saved: "text-river", unsaved: "text-steel", saving: "text-steel", error: "text-brick" };

  return (
    <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 py-6 border-b border-steel/20">
      <div className="flex items-center gap-3 mb-1">
        <h2 className="font-display font-700 text-lg text-ink">Other pages</h2>
        <span className={`font-sans text-xs ${statusColor[saveState]}`}>{statusCopy[saveState]}</span>
      </div>
      <p className="font-sans text-xs text-steel mb-4">
        The heading and one-line description at the top of these standalone pages — not part of the
        homepage below, but the closest thing to a layout concern they have.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {PAGE_COPY_TARGETS.map((page) => (
          <div key={page.key} className="border border-steel/20 rounded-sm p-3">
            <p className="font-sans text-xs font-600 text-ink mb-2">
              {page.label} <span className="text-steel font-400">({page.path})</span>
            </p>
            <input
              value={pageCopy[page.key]?.title || ""}
              onChange={(e) => setField(page.key, "title", e.target.value)}
              placeholder="Heading"
              className="w-full font-sans text-sm border border-steel/25 rounded-sm px-2 py-1.5 mb-1.5"
            />
            <textarea
              value={pageCopy[page.key]?.description || ""}
              onChange={(e) => setField(page.key, "description", e.target.value)}
              rows={2}
              placeholder="One-line description"
              className="w-full font-sans text-sm border border-steel/25 rounded-sm px-2 py-1.5 resize-y"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
