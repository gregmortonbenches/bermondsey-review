"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveSiteSettings, DEFAULT_SITE_SETTINGS, DISPLAY_FONT_OPTIONS, BODY_FONT_OPTIONS } from "@/lib/theme";
import DevicePreview from "./DevicePreview";

const AUTOSAVE_DELAY_MS = 1200;

// Accepts "9C6B42", "#9c6b42", or the 3-digit shorthand "#96C" — anything
// else (mid-typing, a stray character, a non-hex word) returns null
// rather than a guess, so the caller can tell "not done typing yet" apart
// from "this is a real colour".
function normalizeHex(input) {
  let v = input.trim();
  if (!v.startsWith("#")) v = `#${v}`;
  const short = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/.exec(v);
  if (short) v = `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toUpperCase() : null;
}

// Pairs the native <input type="color"> swatch (which only ever holds a
// valid 6-digit hex, and is the easiest way to actually pick a colour)
// with a free-text field for typing/pasting one in directly. The two
// stay in sync via `value`/`onChange` — typing keeps its own local state
// rather than writing straight into `value`, so an in-progress, not-yet-
// valid string ("#9C6" while still typing) doesn't get force-corrected
// or fed to the swatch input, which would reject it outright. A value
// that's still invalid on blur reverts to the last real colour, rather
// than leaving the field stuck showing something that was never saved.
function ColorField({ value, onChange }) {
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  function handleTextChange(e) {
    const next = e.target.value;
    setText(next);
    const normalized = normalizeHex(next);
    if (normalized) onChange(normalized);
  }

  function handleBlur() {
    setText(value);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={text}
        onChange={handleTextChange}
        onBlur={handleBlur}
        placeholder="#000000"
        spellCheck={false}
        maxLength={7}
        className="w-[5.5rem] font-mono text-xs border border-steel/25 rounded-sm px-2 py-2 uppercase focus-visible:outline-2 focus-visible:outline-river"
      />
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 rounded-sm border border-steel/25 cursor-pointer bg-transparent shrink-0"
      />
    </div>
  );
}

export default function ThemeEditor({ initialSettings }) {
  const supabase = createClient();
  const [settings, setSettings] = useState({ ...DEFAULT_SITE_SETTINGS, ...initialSettings });
  const [saveState, setSaveState] = useState("saved");
  const [refreshToken, setRefreshToken] = useState(0);
  const [codeOpen, setCodeOpen] = useState(false);

  const autosaveTimer = useRef(null);
  const lastSavedRef = useRef(JSON.stringify(initialSettings));
  const isFirstRender = useRef(true);

  function set(field, value) {
    setSettings((s) => ({ ...s, [field]: value }));
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const json = JSON.stringify(settings);
    if (json === lastSavedRef.current) return;

    setSaveState("unsaved");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        await saveSiteSettings(supabase, settings);
        lastSavedRef.current = json;
        setSaveState("saved");
        setRefreshToken((t) => t + 1);
      } catch {
        setSaveState("error");
      }
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(autosaveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const statusCopy = { saved: "\u2713 Saved", unsaved: "Unsaved changes…", saving: "Saving…", error: "Couldn't save" };
  const statusColor = { saved: "text-river", unsaved: "text-steel", saving: "text-steel", error: "text-brick" };

  return (
    <div className="grid lg:grid-cols-[380px_1fr] h-full">
      <div className="border-r border-steel/20 overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-700 text-lg text-ink">Style</h2>
          <span className={`font-sans text-xs ${statusColor[saveState]}`}>{statusCopy[saveState]}</span>
        </div>
        <p className="font-sans text-xs text-steel mb-5">
          Changes apply to the live site. Paper, ink, and hairline colours stay fixed to keep
          text readable — these two accents are the ones worth playing with.
        </p>

        <div className="space-y-5">
          {/* These two swapped jobs when the palette went black-and-white
              with a single accent (see lib/theme.js): river is now the
              one accent the whole site spends, and brick is only ever
              an error/alert colour. The labels said the opposite, which
              is worse than saying nothing — river is listed first now,
              since it's the one anyone actually comes here to change. */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-sans text-sm font-600 text-ink">Accent</p>
              <p className="font-sans text-xs text-steel">
                Category labels, links, drop caps, Subscribe, the newsletter drawer
              </p>
            </div>
            <ColorField value={settings.river_color} onChange={(v) => set("river_color", v)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-sans text-sm font-600 text-ink">Alerts</p>
              <p className="font-sans text-xs text-steel">
                Errors, required fields, a wrong crossword letter — nothing decorative
              </p>
            </div>
            <ColorField value={settings.brick_color} onChange={(v) => set("brick_color", v)} />
          </div>

          {(settings.brick_color !== DEFAULT_SITE_SETTINGS.brick_color ||
            settings.river_color !== DEFAULT_SITE_SETTINGS.river_color) && (
            <button
              type="button"
              onClick={() => {
                set("brick_color", DEFAULT_SITE_SETTINGS.brick_color);
                set("river_color", DEFAULT_SITE_SETTINGS.river_color);
              }}
              className="font-sans text-xs text-river hover:text-ink underline underline-offset-4"
            >
              Reset colours to default
            </button>
          )}

          <div>
            <label className="block font-sans text-sm font-600 text-ink mb-1">Headline font</label>
            <select
              value={settings.display_font}
              onChange={(e) => set("display_font", e.target.value)}
              className="w-full font-sans text-sm border border-steel/25 rounded-sm px-2 py-1.5"
            >
              {DISPLAY_FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-sans text-sm font-600 text-ink mb-1">Body font</label>
            <select
              value={settings.body_font}
              onChange={(e) => set("body_font", e.target.value)}
              className="w-full font-sans text-sm border border-steel/25 rounded-sm px-2 py-1.5"
            >
              {BODY_FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-steel/20 pt-4">
            <button
              type="button"
              onClick={() => setCodeOpen((v) => !v)}
              className="font-sans text-sm font-600 text-steel hover:text-ink flex items-center gap-1.5"
            >
              <span className={`transition-transform ${codeOpen ? "rotate-90" : ""}`}>›</span>
              Advanced: Code injection
            </button>

            {codeOpen && (
              <div className="mt-4 space-y-4">
                <p className="font-sans text-xs text-brick bg-brick/[0.08] rounded-sm px-3 py-2">
                  This runs directly on the live site for every visitor. Treat it like editing
                  the codebase, not like writing a post — a mistake here can break the page.
                </p>
                <div>
                  <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-1">
                    Custom CSS
                  </label>
                  <textarea
                    value={settings.custom_css || ""}
                    onChange={(e) => set("custom_css", e.target.value)}
                    rows={6}
                    placeholder=".some-class { color: red; }"
                    className="w-full font-mono text-xs border border-steel/25 rounded-sm px-3 py-2 resize-y"
                  />
                </div>
                <div>
                  <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-1">
                    Custom JS
                  </label>
                  <textarea
                    value={settings.custom_js || ""}
                    onChange={(e) => set("custom_js", e.target.value)}
                    rows={6}
                    placeholder="console.log('loaded');"
                    className="w-full font-mono text-xs border border-steel/25 rounded-sm px-3 py-2 resize-y"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <DevicePreview src="/admin/layout/preview/frame" refreshToken={refreshToken} heightClass="h-full" />
    </div>
  );
}
