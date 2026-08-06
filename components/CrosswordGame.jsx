"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { computeCrosswordLayout } from "@/lib/crossword";

function findSlot(slots, direction, row, col) {
  return slots.find((s) => s.direction === direction && s.cellCoords.some(([r, c]) => r === row && c === col));
}

function blankGuesses(rows, cols) {
  return Array.from({ length: rows }, () => Array(cols).fill(""));
}

// The full solution ships to the browser with the puzzle (see the RLS
// policy comment in supabase/schema.sql) — deliberately, unlike Guess
// the Spot's coordinates: a crossword's fun is the solving itself, not
// keeping the answer secret, and instant per-letter feedback (the
// whole point of a web crossword over a printed one) needs the answer
// available locally rather than round-tripping to a server on every
// keystroke.
export default function CrosswordGame({ crossword }) {
  const { grid_json: grid, clues_json: clues } = crossword;
  const layout = useMemo(() => computeCrosswordLayout(grid), [grid]);

  const [guesses, setGuesses] = useState(() => blankGuesses(grid.rows, grid.cols));
  const [selected, setSelected] = useState(() => {
    const first = layout.slots[0];
    return first ? { row: first.row, col: first.col } : { row: 0, col: 0 };
  });
  const [direction, setDirection] = useState(layout.slots[0]?.direction || "across");
  const [wrongCells, setWrongCells] = useState(() => new Set());
  const [revealed, setRevealed] = useState(false);
  const hiddenInputRef = useRef(null);
  // The very first cell is pre-selected on load (so the grid doesn't
  // look inert and the first clue shows immediately) — but that's a
  // default, not a real click. Without this, a visitor whose first
  // action happens to be clicking that same already-highlighted cell
  // gets the "click the selected cell again" toggle behaviour on their
  // very first interaction, flipping to "down" before they've typed
  // anything. Once real interaction has happened, same-cell clicks
  // toggle as expected.
  const hasInteractedRef = useRef(false);

  const activeSlot = findSlot(layout.slots, direction, selected.row, selected.col) || layout.slots[0];

  const isBlocked = (r, c) => r < 0 || r >= grid.rows || c < 0 || c >= grid.cols || grid.cells[r][c] === "#";

  const isComplete = useMemo(
    () => grid.cells.every((row, r) => row.every((cell, c) => cell === "#" || guesses[r][c] !== "")),
    [grid, guesses]
  );
  const isCorrect = useMemo(
    () => grid.cells.every((row, r) => row.every((cell, c) => cell === "#" || guesses[r][c] === cell)),
    [grid, guesses]
  );
  const solved = isComplete && isCorrect;

  function focusInput() {
    hiddenInputRef.current?.focus();
  }

  function selectCell(row, col, preferredDirection) {
    setSelected({ row, col });
    if (preferredDirection) {
      if (findSlot(layout.slots, preferredDirection, row, col)) setDirection(preferredDirection);
      return;
    }
    if (!findSlot(layout.slots, direction, row, col)) {
      const other = direction === "across" ? "down" : "across";
      if (findSlot(layout.slots, other, row, col)) setDirection(other);
    }
  }

  function handleCellClick(row, col) {
    if (isBlocked(row, col)) return;
    if (hasInteractedRef.current && selected.row === row && selected.col === col) {
      const other = direction === "across" ? "down" : "across";
      if (findSlot(layout.slots, other, row, col)) setDirection(other);
    } else {
      selectCell(row, col);
    }
    hasInteractedRef.current = true;
    focusInput();
  }

  function handleClueClick(slot) {
    setSelected({ row: slot.row, col: slot.col });
    setDirection(slot.direction);
    hasInteractedRef.current = true;
    focusInput();
  }

  function setGuess(row, col, value) {
    setGuesses((g) => {
      const next = g.map((r) => r.slice());
      next[row][col] = value;
      return next;
    });
    setWrongCells((prev) => {
      if (!prev.has(`${row},${col}`)) return prev;
      const next = new Set(prev);
      next.delete(`${row},${col}`);
      return next;
    });
  }

  function advance() {
    const { row, col } = selected;
    const [dr, dc] = direction === "across" ? [0, 1] : [1, 0];
    const nextR = row + dr;
    const nextC = col + dc;
    if (!isBlocked(nextR, nextC) && findSlot(layout.slots, direction, nextR, nextC)?.number === activeSlot?.number) {
      setSelected({ row: nextR, col: nextC });
    }
  }

  function retreat() {
    const { row, col } = selected;
    const [dr, dc] = direction === "across" ? [0, -1] : [-1, 0];
    const prevR = row + dr;
    const prevC = col + dc;
    if (!isBlocked(prevR, prevC) && findSlot(layout.slots, direction, prevR, prevC)?.number === activeSlot?.number) {
      setSelected({ row: prevR, col: prevC });
    }
  }

  function handleHiddenInputChange(e) {
    const raw = e.target.value;
    const letter = raw.slice(-1).toUpperCase();
    e.target.value = "";
    if (!/^[A-Z]$/.test(letter)) return;
    hasInteractedRef.current = true;
    setGuess(selected.row, selected.col, letter);
    advance();
  }

  function handleHiddenInputKeyDown(e) {
    hasInteractedRef.current = true;
    const { row, col } = selected;
    if (e.key === "Backspace") {
      e.preventDefault();
      if (guesses[row][col]) {
        setGuess(row, col, "");
      } else {
        retreat();
        // Clear whatever we just moved back onto as well, matching the
        // usual "backspace eats the previous letter" crossword feel.
        const { row: pr, col: pc } = selectedAfterRetreat(row, col);
        setGuess(pr, pc, "");
      }
      return;
    }
    if (e.key === " ") {
      e.preventDefault();
      const other = direction === "across" ? "down" : "across";
      if (findSlot(layout.slots, other, row, col)) setDirection(other);
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (!isBlocked(row, col + 1)) selectCell(row, col + 1, "across");
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (!isBlocked(row, col - 1)) selectCell(row, col - 1, "across");
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isBlocked(row + 1, col)) selectCell(row + 1, col, "down");
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isBlocked(row - 1, col)) selectCell(row - 1, col, "down");
    }
  }

  // Backspace's "clear the cell we land on too" step needs to know
  // where retreat() is about to move to, computed the same way it does
  // internally — duplicated rather than having retreat() return a
  // value, since it's also called on its own (Backspace on an empty
  // cell) where that return value would go unused.
  function selectedAfterRetreat(row, col) {
    const [dr, dc] = direction === "across" ? [0, -1] : [-1, 0];
    const prevR = row + dr;
    const prevC = col + dc;
    if (!isBlocked(prevR, prevC) && findSlot(layout.slots, direction, prevR, prevC)?.number === activeSlot?.number) {
      return { row: prevR, col: prevC };
    }
    return { row, col };
  }

  function handleCheck() {
    const wrong = new Set();
    grid.cells.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (cell !== "#" && guesses[r][c] && guesses[r][c] !== cell) wrong.add(`${r},${c}`);
      })
    );
    setWrongCells(wrong);
  }

  function handleReveal() {
    setGuesses(grid.cells.map((row) => row.map((cell) => (cell === "#" ? "" : cell))));
    setWrongCells(new Set());
    setRevealed(true);
  }

  function handleClear() {
    setGuesses(blankGuesses(grid.rows, grid.cols));
    setWrongCells(new Set());
    setRevealed(false);
  }

  useEffect(() => {
    focusInput();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const acrossSlots = layout.slots.filter((s) => s.direction === "across");
  const downSlots = layout.slots.filter((s) => s.direction === "down");

  return (
    <div>
      {solved && (
        <div className="bg-river/[0.08] border border-river/20 rounded-sm px-5 py-4 mb-6 text-center">
          <p className="font-display font-700 text-xl text-river">
            {revealed ? "Here's the finished grid." : "Solved it! 🐛"}
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-[minmax(0,480px)_1fr] gap-8 items-start">
        <div className="w-full max-w-[480px] mx-auto lg:mx-0">
          <input
            ref={hiddenInputRef}
            onChange={handleHiddenInputChange}
            onKeyDown={handleHiddenInputKeyDown}
            // Deliberately not `sr-only` — Tailwind's sr-only hides via
            // `clip: rect(0,0,0,0)`, which mobile Safari (and some Android
            // browsers) treat as "not really on the page," so tapping a
            // cell would call .focus() on this input successfully (it did
            // become document.activeElement) without ever raising the
            // on-screen keyboard. A real, unclipped 1px box hidden with
            // opacity instead reads as a genuine focusable element, so the
            // keyboard opens the same as it would for an ordinary input.
            className="absolute w-px h-px opacity-0 pointer-events-none -z-10"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck="false"
            aria-label="Type a letter for the selected crossword square"
          />
          <div
            className="grid gap-[2px] bg-steel/25 p-[2px] rounded-sm w-full"
            style={{ gridTemplateColumns: `repeat(${grid.cols}, 1fr)`, aspectRatio: `${grid.cols} / ${grid.rows}` }}
          >
            {grid.cells.map((rowCells, r) =>
              rowCells.map((cellValue, c) => {
                const blocked = cellValue === "#";
                const isSelected = selected.row === r && selected.col === c;
                const inActiveWord = !blocked && activeSlot?.cellCoords.some(([sr, sc]) => sr === r && sc === c);
                const number = layout.numbers[r][c];
                const isWrong = wrongCells.has(`${r},${c}`);
                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    tabIndex={-1}
                    onClick={() => handleCellClick(r, c)}
                    className={`relative flex items-center justify-center font-sans text-base sm:text-lg font-600 aspect-square ${
                      blocked
                        ? "bg-ink"
                        : isSelected
                        ? "bg-[#F5C518]"
                        : inActiveWord
                        ? "bg-river/[0.12]"
                        : "bg-paper hover:bg-steel/[0.08]"
                    } ${isWrong ? "text-brick" : "text-ink"}`}
                  >
                    {number && (
                      <span className="absolute top-[2px] left-[3px] text-[9px] sm:text-[10px] font-sans font-400 text-steel leading-none">
                        {number}
                      </span>
                    )}
                    {!blocked && guesses[r][c]}
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              onClick={handleCheck}
              className="font-sans text-sm font-600 border border-steel/40 text-ink px-4 py-2 rounded-sm hover:border-river hover:text-river transition-colors"
            >
              Check
            </button>
            <button
              type="button"
              onClick={handleReveal}
              className="font-sans text-sm text-steel hover:text-brick underline underline-offset-4"
            >
              Reveal puzzle
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="font-sans text-sm text-steel hover:text-brick underline underline-offset-4"
            >
              Clear
            </button>
          </div>
          {activeSlot && (
            <p className="font-body text-steel mt-4">
              <span className="font-600 text-ink">
                {activeSlot.number} {activeSlot.direction === "across" ? "Across" : "Down"}
              </span>{" "}
              — {clues[activeSlot.direction]?.[activeSlot.number] || <span className="italic">No clue set</span>}
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-8">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.1em] text-steel mb-2">Across</p>
            <div className="space-y-1.5">
              {acrossSlots.map((slot) => (
                <button
                  key={slot.number}
                  type="button"
                  onClick={() => handleClueClick(slot)}
                  className={`block text-left w-full font-body text-sm rounded-sm px-1.5 py-0.5 -mx-1.5 transition-colors ${
                    activeSlot?.number === slot.number && activeSlot?.direction === "across"
                      ? "bg-river/[0.1] text-ink font-600"
                      : "text-steel hover:text-ink"
                  }`}
                >
                  <span className="font-600">{slot.number}.</span> {clues.across?.[slot.number] || <span className="italic">No clue set</span>}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.1em] text-steel mb-2">Down</p>
            <div className="space-y-1.5">
              {downSlots.map((slot) => (
                <button
                  key={slot.number}
                  type="button"
                  onClick={() => handleClueClick(slot)}
                  className={`block text-left w-full font-body text-sm rounded-sm px-1.5 py-0.5 -mx-1.5 transition-colors ${
                    activeSlot?.number === slot.number && activeSlot?.direction === "down"
                      ? "bg-river/[0.1] text-ink font-600"
                      : "text-steel hover:text-ink"
                  }`}
                >
                  <span className="font-600">{slot.number}.</span> {clues.down?.[slot.number] || <span className="italic">No clue set</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
