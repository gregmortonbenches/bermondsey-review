"use client";

import { createContext, useContext, useEffect, useState } from "react";

const EditorOutlineContext = createContext(null);

/**
 * Lets whatever canvas is currently mounted (BlockEditor, for a post or
 * page; LayoutCanvas, for the homepage) publish an "on this page" outline
 * — an ordered list of its blocks/sections — up to AdminShell's sidebar,
 * without AdminShell needing to know anything about blocks, sections, or
 * which specific editor is on screen. AdminShell renders the sidebar;
 * the canvas lives many components below it inside {children}; Context
 * is what lets a value flow from one to the other without prop-drilling
 * through every layout/page in between.
 *
 * `setOutline(null)` (or letting the publishing component unmount, via
 * its own cleanup effect) clears it — pages that aren't a content canvas
 * (the post list, media library, forms list, and so on) never publish
 * one, so the sidebar just shows its normal site navigation there.
 */
export function EditorOutlineProvider({ children }) {
  const [outline, setOutline] = useState(null);
  return <EditorOutlineContext.Provider value={{ outline, setOutline }}>{children}</EditorOutlineContext.Provider>;
}

export function useEditorOutline() {
  return useContext(EditorOutlineContext);
}

// Scrolls to and briefly highlights the element with this id — used for
// both block ids (BlockEditor) and section ids (LayoutCanvas). A plain
// DOM lookup + a classList toggle rather than piping "which item is
// highlighted" through React state, since the highlight is a one-off
// visual pulse, not something anything else needs to read.
export function jumpToElement(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("outline-jump-highlight");
  setTimeout(() => el.classList.remove("outline-jump-highlight"), 1200);
}

// A small hook for canvases to publish their outline and clean up on
// unmount — `items` is `[{ id, label, hint? }]`, already in the order
// they should display (and already what jumpToElement's ids point at).
// Re-publishes whenever the outline's actual shape changes (not on every
// render, since `items` is a fresh array each time) and clears it again
// on unmount, so navigating away from a canvas doesn't leave a stale
// outline showing in the sidebar.
export function usePublishOutline(title, items) {
  const { setOutline } = useEditorOutline() || {};
  const itemsKey = JSON.stringify(items);

  useEffect(() => {
    setOutline?.({ title, items: JSON.parse(itemsKey) });
    return () => setOutline?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, itemsKey, setOutline]);
}
