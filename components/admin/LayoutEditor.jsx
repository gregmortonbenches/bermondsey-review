"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { savePageLayout } from "@/lib/layout";
import { SECTION_REGISTRY } from "@/lib/sections";
import DevicePreview from "./DevicePreview";

const AUTOSAVE_DELAY_MS = 1200;

export default function LayoutEditor({ pageKey, initialSections }) {
  const supabase = createClient();
  const [sections, setSections] = useState(initialSections);
  const [saveState, setSaveState] = useState("saved"); // "saved" | "unsaved" | "saving" | "error"
  const [refreshToken, setRefreshToken] = useState(0);

  const dragIndex = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const autosaveTimer = useRef(null);
  const lastSavedRef = useRef(JSON.stringify(initialSections));
  const isFirstRender = useRef(true);

  function reorder(from, to) {
    if (from === to) return;
    setSections((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function moveSection(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    setSections((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function toggleEnabled(index) {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, enabled: !s.enabled } : s))
    );
  }

  // Autosave, same pattern as the post editor — save a beat after the
  // last change, then refresh the preview iframe so the change is
  // actually visible, not just recorded.
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
        setRefreshToken((t) => t + 1);
      } catch {
        setSaveState("error");
      }
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(autosaveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  const statusCopy = {
    saved: "\u2713 Saved",
    unsaved: "Unsaved changes…",
    saving: "Saving…",
    error: "Couldn't save — try again",
  };
  const statusColor = {
    saved: "text-river",
    unsaved: "text-steel",
    saving: "text-steel",
    error: "text-brick",
  };

  return (
    <div className="grid lg:grid-cols-[380px_1fr] h-full">
      {/* Section list — drag to reorder, toggle to show/hide */}
      <div className="border-r border-steel/20 overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-700 text-lg text-ink">Homepage layout</h2>
          <span className={`font-sans text-xs ${statusColor[saveState]}`}>{statusCopy[saveState]}</span>
        </div>
        <p className="font-sans text-xs text-steel mb-4">
          Drag ⠿ to reorder sections. Untick a section to hide it from the homepage — nothing
          is deleted, just switched off.
        </p>

        <div className="space-y-2">
          {sections.map((section, index) => {
            const meta = SECTION_REGISTRY[section.type] || { label: section.type, description: "" };
            return (
              <div
                key={section.id}
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
                className={`flex items-start gap-2 rounded-sm border p-3 transition-colors ${
                  dragOverIndex === index ? "border-river bg-river/[0.04]" : "border-steel/25"
                } ${!section.enabled ? "opacity-50" : ""}`}
              >
                <div
                  className="shrink-0 flex flex-col items-center pt-1 cursor-grab active:cursor-grabbing text-steel/50 hover:text-steel select-none"
                  title="Drag to reorder"
                >
                  <span className="text-lg leading-none">⠿</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-sans text-sm font-600 text-ink truncate">{meta.label}</p>
                    <label className="flex items-center gap-1.5 shrink-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={section.enabled}
                        onChange={() => toggleEnabled(index)}
                        className="w-4 h-4 accent-river"
                      />
                      <span className="font-sans text-xs text-steel">
                        {section.enabled ? "Shown" : "Hidden"}
                      </span>
                    </label>
                  </div>
                  <p className="font-sans text-xs text-steel mt-0.5">{meta.description}</p>

                  <div className="flex items-center gap-1 mt-2">
                    <button
                      type="button"
                      onClick={() => moveSection(index, -1)}
                      disabled={index === 0}
                      className="w-6 h-6 flex items-center justify-center rounded-sm border border-steel/25 text-steel hover:text-ink hover:border-ink disabled:opacity-30"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(index, 1)}
                      disabled={index === sections.length - 1}
                      className="w-6 h-6 flex items-center justify-center rounded-sm border border-steel/25 text-steel hover:text-ink hover:border-ink disabled:opacity-30"
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live preview — the same device switcher used for post previews */}
      <DevicePreview
        src="/admin/layout/preview/frame"
        refreshToken={refreshToken}
        heightClass="h-full"
      />
    </div>
  );
}
