"use client";

import { useMemo, useState } from "react";
import { rankRows, categoriesIn } from "@/lib/rankedList";

// Only a row's raw name/category/count and the block's shared
// totalResponses are ever passed in — rank and percentage are always
// derived (see lib/rankedList.js), so sorting/filtering here never risks
// disagreeing with what's actually stored.
const SORT_DEFAULT_DIR = { rank: "asc", name: "asc", category: "asc", percentage: "desc" };
const COLUMNS = [
  { key: "rank", label: "Rank" },
  { key: "name", label: "Venue" },
  { key: "category", label: "Type" },
  { key: "percentage", label: "Included" },
];

/**
 * A sortable, filterable leaderboard table — click a column header to
 * sort by it (click again to reverse), or a category pill to filter down
 * to just that type. Reused as-is by both the public renderer
 * (BlockContent.jsx) and the admin block editor's own live preview
 * (BlockEditor.jsx's RankedListField), so what an admin sees while
 * editing rows is the exact same interactive component a reader gets,
 * not a static mockup of it.
 *
 * Rendered as a real <table> with overflow-x-auto (min-w forces a
 * horizontal scrollbar on narrow screens rather than squeezing every
 * column unreadably thin) — the same "scroll rather than shrink" call
 * already made for the crossword's own clue lists and the homepage
 * carousels, not a new pattern invented for this one block.
 */
export default function RankedListBlock({ title, rows, totalResponses, accentHex = "var(--color-river, #1D4ED8)" }) {
  const [sortKey, setSortKey] = useState("rank");
  const [sortDir, setSortDir] = useState("asc");
  const [activeCategory, setActiveCategory] = useState(null);

  const ranked = useMemo(() => rankRows(rows, totalResponses), [rows, totalResponses]);
  const categories = useMemo(() => categoriesIn(rows), [rows]);

  const visible = useMemo(() => {
    const filtered = activeCategory ? ranked.filter((row) => row.category === activeCategory) : ranked;
    const factor = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === "name" || sortKey === "category") {
        return factor * a[sortKey].localeCompare(b[sortKey]);
      }
      return factor * (a[sortKey] - b[sortKey]);
    });
  }, [ranked, activeCategory, sortKey, sortDir]);

  function handleSort(key) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(SORT_DEFAULT_DIR[key]);
    }
  }

  if (ranked.length === 0) return null;

  return (
    <div>
      {title && <p className="font-display font-700 text-xl text-ink mb-3">{title}</p>}

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`font-sans text-xs font-600 px-3 py-1.5 border transition-colors ${
              activeCategory === null ? "border-ink text-ink" : "border-steel/30 text-steel hover:border-ink hover:text-ink"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`font-sans text-xs font-600 px-3 py-1.5 border transition-colors ${
                activeCategory === cat ? "border-ink text-ink" : "border-steel/30 text-steel hover:border-ink hover:text-ink"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[480px]">
          <thead>
            <tr className="border-b border-steel/25">
              {COLUMNS.map((col) => (
                <th key={col.key} scope="col" className="pb-2 pr-4 font-sans">
                  <button
                    type="button"
                    onClick={() => handleSort(col.key)}
                    className={`inline-flex items-center gap-1 text-xs uppercase tracking-[0.08em] font-600 transition-colors ${
                      sortKey === col.key ? "text-ink" : "text-steel hover:text-ink"
                    }`}
                  >
                    {col.label}
                    {sortKey === col.key && <span aria-hidden="true">{sortDir === "asc" ? "↑" : "↓"}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr key={`${row.name}-${i}`} className="border-b border-steel/10">
                <td className="py-2.5 pr-4 font-sans text-sm text-steel tabular-nums">{row.rank}</td>
                <td className="py-2.5 pr-4 font-body text-sm text-ink">{row.name}</td>
                <td className="py-2.5 pr-4 font-sans text-xs text-steel whitespace-nowrap">{row.category}</td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 sm:w-24 shrink-0 bg-steel/[0.12]">
                      <div className="h-full" style={{ width: `${row.percentage}%`, backgroundColor: accentHex }} />
                    </div>
                    <span className="font-sans text-sm font-600 text-ink tabular-nums whitespace-nowrap">
                      {row.percentage.toFixed(1)}%
                    </span>
                    <span className="font-sans text-xs text-steel whitespace-nowrap">
                      ({row.count}/{totalResponses})
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
