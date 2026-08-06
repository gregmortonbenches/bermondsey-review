"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createCrossword, updateCrossword, deleteCrossword, blankGrid, computeCrosswordLayout } from "@/lib/crossword";
import ConfirmDialog from "./ConfirmDialog";

const AUTOSAVE_DELAY_MS = 1500;
const DEFAULT_SIZE = 7;

function emptyClues() {
  return { across: {}, down: {} };
}

// Click a cell to select it (for typing); "." or "#" while selected
// toggles block/fillable — the same two-step "select, then a distinct
// key toggles the special state" convention real crossword-construction
// tools use, rather than overloading a single click for both "pick this
// cell" and "block this cell", which is ambiguous the moment you also
// want to click a cell just to type into it.
export default function CrosswordForm({ mode, initialCrossword }) {
  const router = useRouter();
  const supabase = createClient();
  const [grid, setGrid] = useState(() => initialCrossword?.grid_json || blankGrid(DEFAULT_SIZE, DEFAULT_SIZE));
  const [clues, setClues] = useState(() => initialCrossword?.clues_json || emptyClues());
  const [crosswordId, setCrosswordId] = useState(initialCrossword?.id || null);
  const [selected, setSelected] = useState({ row: 0, col: 0 });
  const [saveState, setSaveState] = useState("idle");
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmResizeOpen, setConfirmResizeOpen] = useState(false);
  const [pendingSize, setPendingSize] = useState({ rows: grid.rows, cols: grid.cols });
  const [error, setError] = useState(null);
  // Which way typing auto-advances and Backspace retreats — "across" or
  // "down". Named typeDirection rather than "direction" since setClue's
  // own `direction` parameter (across/down as a *clues_json* key) already
  // uses that name in this file.
  const [typeDirection, setTypeDirection] = useState("across");
  const hiddenInputRef = useRef(null);
  const autosaveTimer = useRef(null);
  const lastSavedRef = useRef(JSON.stringify({ grid_json: initialCrossword?.grid_json, clues_json: initialCrossword?.clues_json }));
  const isFirstRender = useRef(true);
  // Same reasoning as CrosswordGame.jsx's hasInteractedRef: `selected`
  // defaults to (0,0) on mount, so without this guard an admin's very
  // first click — if it happens to land on that default cell — would be
  // read as "click the already-selected cell" and silently flip
  // typeDirection before they've typed anything.
  const hasInteractedRef = useRef(false);

  const layout = useMemo(() => computeCrosswordLayout(grid), [grid]);

  // Clue inputs are keyed by slot number, which shifts whenever the
  // grid's black-square pattern changes upstream of a given word — so
  // this only shows inputs for slots that exist right now, rather than
  // accumulating stale entries under numbers nothing points to anymore.
  const acrossSlots = layout.slots.filter((s) => s.direction === "across");
  const downSlots = layout.slots.filter((s) => s.direction === "down");

  function setCell(row, col, value) {
    setGrid((g) => {
      const cells = g.cells.map((r) => r.slice());
      cells[row][col] = value;
      return { ...g, cells };
    });
  }

  function setClue(direction, number, text) {
    setClues((c) => ({ ...c, [direction]: { ...c[direction], [number]: text } }));
  }

  // Tapping the already-selected cell again switches which way typing
  // advances — the same NYT-style convention the public solver uses
  // (CrosswordGame.jsx's handleCellClick), so an admin can fill a down
  // word by tapping its first cell twice rather than only ever being
  // able to type rightward and having to arrow-key down one row at a
  // time.
  function handleCellClick(row, col) {
    if (hasInteractedRef.current && selected.row === row && selected.col === col) {
      setTypeDirection((d) => (d === "across" ? "down" : "across"));
    } else {
      setSelected({ row, col });
    }
    hasInteractedRef.current = true;
    hiddenInputRef.current?.focus();
  }

  // A direct click-driven equivalent of the "." keyboard shortcut below —
  // added after the keyboard-only version proved unreliable for admins on
  // touch devices (no easy "." key without switching keyboards) and in
  // browsers where a clicked <button> doesn't reliably hand focus to the
  // grid container, both of which would silently make the "." shortcut
  // seem to do nothing. This works the same way either way: toggle the
  // currently selected cell between blocked and empty.
  function toggleSelectedBlocked() {
    const { row, col } = selected;
    setCell(row, col, grid.cells[row][col] === "#" ? "" : "#");
  }

  // Letters are captured via the hidden input's onChange, not onKeyDown —
  // same reasoning as the public solver's CrosswordGame.jsx: a <div>'s
  // keydown handler only ever sees a physical keyboard, so on a touch
  // device (no Bluetooth keyboard attached) clicking a cell selected it
  // but there was no way to actually type into it, since divs never
  // trigger a mobile on-screen keyboard regardless of focus. Routing
  // through a real, focusable <input> fixes that the same way it already
  // does for solving a puzzle.
  function handleHiddenInputChange(e) {
    const raw = e.target.value;
    const letter = raw.slice(-1).toUpperCase();
    e.target.value = "";
    if (!/^[A-Z]$/.test(letter)) return;
    hasInteractedRef.current = true;
    const { row, col } = selected;
    setCell(row, col, letter);
    if (typeDirection === "across") {
      if (col + 1 < grid.cols) setSelected({ row, col: col + 1 });
    } else if (row + 1 < grid.rows) {
      setSelected({ row: row + 1, col });
    }
  }

  function handleHiddenInputKeyDown(e) {
    hasInteractedRef.current = true;
    const { row, col } = selected;
    const blocked = grid.cells[row][col] === "#";

    if (e.key === "." || e.key === "#") {
      e.preventDefault();
      setCell(row, col, blocked ? "" : "#");
      return;
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      setCell(row, col, "");
      if (typeDirection === "across") {
        if (col - 1 >= 0) setSelected({ row, col: col - 1 });
      } else if (row - 1 >= 0) {
        setSelected({ row: row - 1, col });
      }
      return;
    }
    // Arrow keys also set typeDirection to match, so a letter typed right
    // after arrowing continues the way you were just navigating rather
    // than snapping back to across.
    if (e.key === "ArrowRight" && col + 1 < grid.cols) {
      setSelected({ row, col: col + 1 });
      setTypeDirection("across");
    }
    if (e.key === "ArrowLeft" && col - 1 >= 0) {
      setSelected({ row, col: col - 1 });
      setTypeDirection("across");
    }
    if (e.key === "ArrowDown" && row + 1 < grid.rows) {
      setSelected({ row: row + 1, col });
      setTypeDirection("down");
    }
    if (e.key === "ArrowUp" && row - 1 >= 0) {
      setSelected({ row: row - 1, col });
      setTypeDirection("down");
    }
  }

  function applyResize() {
    const { rows, cols } = pendingSize;
    const next = blankGrid(rows, cols);
    for (let r = 0; r < Math.min(rows, grid.rows); r++) {
      for (let c = 0; c < Math.min(cols, grid.cols); c++) {
        next.cells[r][c] = grid.cells[r][c];
      }
    }
    setGrid(next);
    setSelected({ row: 0, col: 0 });
    setConfirmResizeOpen(false);
  }

  async function persist(payload, { redirectOnCreate = false } = {}) {
    if (!crosswordId) {
      const created = await createCrossword(supabase, payload);
      lastSavedRef.current = JSON.stringify({ grid_json: created.grid_json, clues_json: created.clues_json });
      setCrosswordId(created.id);
      if (redirectOnCreate) router.push(`/admin/crossword/${created.id}/edit`);
      return created;
    }
    const updated = await updateCrossword(supabase, crosswordId, payload);
    lastSavedRef.current = JSON.stringify({ grid_json: updated.grid_json, clues_json: updated.clues_json });
    return updated;
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const payload = { grid_json: grid, clues_json: clues };
    const json = JSON.stringify(payload);
    if (json === lastSavedRef.current) return;

    setSaveState("unsaved");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      // A brand-new puzzle (no id yet) only autosaves once there's
      // something worth saving — an empty blank grid autosaving
      // immediately on mount would create a row with nothing in it.
      if (!crosswordId && layout.slots.length === 0) return;
      setSaveState("saving");
      try {
        await persist({ grid_json: grid, clues_json: clues }, { redirectOnCreate: true });
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(autosaveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, clues]);

  async function handleDelete() {
    if (!crosswordId) return;
    setConfirmDeleteOpen(false);
    setDeleting(true);
    try {
      await deleteCrossword(supabase, crosswordId);
      router.push("/admin/crossword");
    } catch (err) {
      setDeleting(false);
      setError(`Couldn't delete this: ${err.message}`);
    }
  }

  const statusCopy = { idle: "Not saved yet", unsaved: "Unsaved changes…", saving: "Saving…", saved: "✓ Saved", error: "Couldn't save" };
  const statusColor = { idle: "text-steel", unsaved: "text-steel", saving: "text-steel", saved: "text-river", error: "text-brick" };

  return (
    <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 py-8">
      {error && (
        <p className="font-sans text-sm text-brick bg-brick/[0.08] rounded-sm px-3 py-2 mb-6">{error}</p>
      )}
      <div className="flex items-center gap-3 mb-6">
        <span className={`font-sans text-xs ${statusColor[saveState]}`}>{statusCopy[saveState]}</span>
      </div>

      <div className="grid lg:grid-cols-[auto_1fr] gap-10 items-start">
        <div>
          <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-1">
            Grid size
          </label>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="number"
              min={2}
              max={21}
              value={pendingSize.rows}
              onChange={(e) => setPendingSize((s) => ({ ...s, rows: Number(e.target.value) }))}
              className="w-16 font-sans text-sm border border-steel/25 rounded-sm px-2 py-1.5"
            />
            <span className="font-sans text-sm text-steel">×</span>
            <input
              type="number"
              min={2}
              max={21}
              value={pendingSize.cols}
              onChange={(e) => setPendingSize((s) => ({ ...s, cols: Number(e.target.value) }))}
              className="w-16 font-sans text-sm border border-steel/25 rounded-sm px-2 py-1.5"
            />
            <button
              type="button"
              onClick={() => setConfirmResizeOpen(true)}
              className="font-sans text-xs font-600 border border-steel/40 text-ink px-3 py-1.5 rounded-sm hover:border-river hover:text-river transition-colors"
            >
              Apply
            </button>
          </div>
          <p className="font-sans text-xs text-steel mb-4 max-w-[220px]">
            Click a cell, then type a letter — typing advances {typeDirection}. Tap the
            selected cell again to switch between across and down. Arrow keys move around
            (and set the direction to match). Use the button below (or press{" "}
            <span className="font-mono">.</span>) to block/unblock the selected cell.
          </p>

          <input
            ref={hiddenInputRef}
            onChange={handleHiddenInputChange}
            onKeyDown={handleHiddenInputKeyDown}
            // Hidden the same way as CrosswordGame.jsx's solving input —
            // opacity, not Tailwind's sr-only, since sr-only hides via
            // `clip: rect(0,0,0,0)`, which mobile browsers treat as not
            // really on the page and won't raise a keyboard for.
            className="absolute w-px h-px opacity-0 pointer-events-none -z-10"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck="false"
            aria-label="Type a letter for the selected crossword square"
          />

          <div
            className="inline-grid gap-[2px] bg-steel/25 p-[2px] rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-river"
            style={{ gridTemplateColumns: `repeat(${grid.cols}, 28px)` }}
          >
            {grid.cells.map((rowCells, r) =>
              rowCells.map((cellValue, c) => {
                const blocked = cellValue === "#";
                const isSelected = selected.row === r && selected.col === c;
                const number = layout.numbers[r][c];
                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => handleCellClick(r, c)}
                    className={`relative w-[28px] h-[28px] flex items-center justify-center font-sans text-sm font-600 ${
                      blocked ? "bg-ink" : isSelected ? "bg-river/[0.18]" : "bg-paper hover:bg-steel/[0.08]"
                    }`}
                  >
                    {number && (
                      <span className="absolute top-[1px] left-[2px] text-[8px] font-sans font-400 text-steel leading-none">
                        {number}
                      </span>
                    )}
                    {!blocked && cellValue}
                  </button>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={toggleSelectedBlocked}
            className="block mt-3 font-sans text-xs font-600 border border-steel/40 text-ink px-3 py-1.5 rounded-sm hover:border-river hover:text-river transition-colors"
          >
            {grid.cells[selected.row][selected.col] === "#" ? "Unblock" : "Block"} cell ({selected.row + 1}, {selected.col + 1})
          </button>
        </div>

        <div>
          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-2">
                Across ({acrossSlots.length})
              </label>
              {acrossSlots.length === 0 ? (
                <p className="font-sans text-xs text-steel/70">No across words yet.</p>
              ) : (
                <div className="space-y-2">
                  {acrossSlots.map((slot) => (
                    <div key={`a-${slot.number}`} className="flex items-start gap-2">
                      <span className="font-sans text-xs text-steel mt-2 w-5 text-right shrink-0">{slot.number}</span>
                      <input
                        value={clues.across[slot.number] || ""}
                        onChange={(e) => setClue("across", slot.number, e.target.value)}
                        placeholder={`${slot.length} letters`}
                        className="w-full font-sans text-sm border border-steel/25 rounded-sm px-2 py-1.5 outline-none focus:border-river"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-2">
                Down ({downSlots.length})
              </label>
              {downSlots.length === 0 ? (
                <p className="font-sans text-xs text-steel/70">No down words yet.</p>
              ) : (
                <div className="space-y-2">
                  {downSlots.map((slot) => (
                    <div key={`d-${slot.number}`} className="flex items-start gap-2">
                      <span className="font-sans text-xs text-steel mt-2 w-5 text-right shrink-0">{slot.number}</span>
                      <input
                        value={clues.down[slot.number] || ""}
                        onChange={(e) => setClue("down", slot.number, e.target.value)}
                        placeholder={`${slot.length} letters`}
                        className="w-full font-sans text-sm border border-steel/25 rounded-sm px-2 py-1.5 outline-none focus:border-river"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {crosswordId && (
        <div className="pt-6 mt-8 border-t border-steel/20">
          <button
            type="button"
            onClick={() => setConfirmDeleteOpen(true)}
            disabled={deleting}
            className="font-sans text-xs text-steel hover:text-brick underline underline-offset-4 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete this puzzle"}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete this puzzle?"
        message="This can't be undone. If it's the current puzzle, the most recent one remaining becomes the new current puzzle."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
      <ConfirmDialog
        open={confirmResizeOpen}
        title="Resize the grid?"
        message="Cells outside the new size are lost. Letters and blocks that still fit are kept."
        confirmLabel="Resize"
        onConfirm={applyResize}
        onCancel={() => setConfirmResizeOpen(false)}
      />
    </div>
  );
}
