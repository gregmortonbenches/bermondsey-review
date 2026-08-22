"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveSiteSettings } from "@/lib/theme";
import LayoutCanvas from "./LayoutCanvas";
import PageCopyEditCanvas from "./PageCopyEditCanvas";
import { resolveCanvasNav } from "./canvasNav";

const AUTOSAVE_DELAY_MS = 1200;

const TABS = [
  { key: "home", label: "Home" },
  { key: "archive", label: "Articles" },
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
  cartoons,
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
  // Set when a same-page anchor (e.g. "Puzzles") is clicked from a tab
  // other than Home — there's nothing to scroll to until Home's own
  // canvas actually mounts, so the scroll happens in the effect below,
  // once switching tabs has had a chance to render it.
  const [pendingScrollId, setPendingScrollId] = useState(null);
  const autosaveTimer = useRef(null);
  const lastSavedRef = useRef(JSON.stringify(initialPageCopy));
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (activeTab !== "home" || !pendingScrollId) return;
    const id = pendingScrollId;
    setPendingScrollId(null);
    // rAF, not a plain synchronous call: the previous tab's canvas just
    // unmounted and Home's just mounted in the same render pass, so
    // there's no guarantee the browser has actually laid it out yet —
    // waiting a frame is what makes scrollIntoView find the section
    // where it's really going to end up rather than wherever a
    // still-mid-layout page happened to have it a moment ago.
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [activeTab, pendingScrollId]);

  // Runs in the capture phase, same as suppressCanvasNavigation (which
  // still runs afterward, on each canvas's own wrapper, for anything
  // this doesn't resolve) — tries to turn a click on a real link
  // (a nav item, an article card, "Puzzles") into an actual jump to
  // wherever that content lives inside this admin, before falling back
  // to plain suppression. data-canvas-allow links (a post's own editor,
  // /admin/crossword, etc.) are left alone entirely — those already
  // navigate for real, on purpose.
  function handleCanvasNav(e) {
    const link = e.target.closest("a");
    if (!link || link.dataset.canvasAllow) return;
    const action = resolveCanvasNav(link.getAttribute("href"));
    if (!action) return;
    e.preventDefault();
    if (action.type === "tab") {
      setActiveTab(action.tab);
    } else if (action.type === "scroll") {
      if (activeTab === "home") {
        document.getElementById(action.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        setPendingScrollId(action.id);
        setActiveTab("home");
      }
    }
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

      <div onClickCapture={handleCanvasNav}>
        {activeTab === "home" && (
          <LayoutCanvas
            pageKey="home"
            initialSections={initialSections}
            sectionContent={sectionContent}
            carouselArticles={carouselArticles}
            cartoons={cartoons}
            masthead={masthead}
            footer={footer}
            themeVars={themeVars}
          />
        )}
        {activeTab === "archive" && (
          <PageCopyEditCanvas
            pageLabel="Articles"
            previewHref="/admin/layout/preview?tab=archive"
            copy={pageCopy.archive || {}}
            saveState={saveState}
            onChange={(updates) => updatePageCopy("archive", updates)}
            masthead={masthead}
            footer={footer}
            themeVars={themeVars}
            showDescription={false}
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
    </div>
  );
}
