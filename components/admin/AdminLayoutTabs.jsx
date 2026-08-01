"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveSiteSettings } from "@/lib/theme";
import LayoutCanvas from "./LayoutCanvas";
import PageCopyEditCanvas from "./PageCopyEditCanvas";

const AUTOSAVE_DELAY_MS = 1200;

const TABS = [
  { key: "home", label: "Home" },
  { key: "archive", label: "Archive" },
  { key: "geoguesser", label: "Guess the Spot" },
];

/**
 * /admin/layout's outer shell: a tab strip choosing which page's canvas
 * shows below. Home gets the full reorderable-sections canvas
 * (LayoutCanvas); Archive and Guess the Spot have no sections of their
 * own to reorder, just a heading/description (site_settings.page_copy)
 * — PageCopyEditCanvas is the equivalent "click what you see" canvas
 * for those. The tab strip itself isn't sticky (each canvas below
 * already has its own sticky status bar+Preview link at top-0 — a
 * second sticky bar stacked above it would either need pixel-perfect
 * offset math or fight it for the same z-index), so switching pages
 * means scrolling back to the top first — an acceptable cost for
 * something you do occasionally, not while scrolling through content.
 *
 * page_copy's autosave lives here rather than in PageCopyEditCanvas
 * itself, since Archive's and Guess the Spot's copy both live in the
 * *same* site_settings.page_copy column — saving one page's slice
 * without also re-sending the other's would silently wipe it (a plain
 * JSONB column update replaces the whole value, it doesn't merge), so
 * this component holds both together as one object and always saves
 * the full thing, same fix as the focal-point/cover-image pattern
 * elsewhere in this admin.
 */
export default function AdminLayoutTabs({
  initialSections,
  sectionContent,
  carouselArticles,
  initialPageCopy,
  archiveExtra,
  geoguesserExtra,
  masthead,
  footer,
  themeVars,
}) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("home");
  const [pageCopy, setPageCopy] = useState(initialPageCopy);
  const [saveState, setSaveState] = useState("saved");
  const autosaveTimer = useRef(null);
  const lastSavedRef = useRef(JSON.stringify(initialPageCopy));
  const isFirstRender = useRef(true);

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

  function updatePageCopy(pageKey, updates) {
    setPageCopy((pc) => ({ ...pc, [pageKey]: { ...pc[pageKey], ...updates } }));
  }

  return (
    <div>
      <div className="bg-ink">
        <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`font-sans text-sm px-3 py-2.5 border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-paper text-paper"
                  : "border-transparent text-paper/60 hover:text-paper"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "home" && (
        <LayoutCanvas
          pageKey="home"
          initialSections={initialSections}
          sectionContent={sectionContent}
          carouselArticles={carouselArticles}
          masthead={masthead}
          footer={footer}
          themeVars={themeVars}
        />
      )}
      {activeTab === "archive" && (
        <PageCopyEditCanvas
          pageLabel="Archive"
          previewHref="/admin/layout/preview?tab=archive"
          copy={pageCopy.archive || {}}
          saveState={saveState}
          onChange={(updates) => updatePageCopy("archive", updates)}
          masthead={masthead}
          footer={footer}
          themeVars={themeVars}
        >
          {archiveExtra}
        </PageCopyEditCanvas>
      )}
      {activeTab === "geoguesser" && (
        <PageCopyEditCanvas
          pageLabel="Guess the Spot"
          previewHref="/admin/layout/preview?tab=geoguesser"
          copy={pageCopy.geoguesser || {}}
          saveState={saveState}
          onChange={(updates) => updatePageCopy("geoguesser", updates)}
          masthead={masthead}
          footer={footer}
          themeVars={themeVars}
        >
          {geoguesserExtra}
        </PageCopyEditCanvas>
      )}
    </div>
  );
}
