// Shared by the ranked-list block's public renderer (RankedListBlock.jsx)
// and its admin editor field (BlockEditor.jsx) — a block only stores each
// row's raw name/category/count plus one shared totalResponses, never a
// rank or percentage: both are always derived, so reordering/editing rows
// in the admin can't leave a stale rank or percentage sitting in the
// stored data that then has to be kept in sync by hand.
//
// Competition ranking (1, 2, 2, 4 — not 1, 2, 2, 3), matching the "=2"/
// "=4" convention a tied leaderboard is normally printed with: two rows
// with the same count share the same rank, and the next distinct count
// resumes at its actual 1-based position rather than the next integer.
export function rankRows(rows, totalResponses) {
  const withPercentage = (rows || []).map((row) => ({
    ...row,
    percentage: totalResponses > 0 ? (row.count / totalResponses) * 100 : 0,
  }));
  const sorted = [...withPercentage].sort((a, b) => b.count - a.count);

  let rank = 0;
  let prevCount = null;
  return sorted.map((row, i) => {
    if (row.count !== prevCount) {
      rank = i + 1;
      prevCount = row.count;
    }
    return { ...row, rank };
  });
}

// Distinct categories, in the order each first appears — drives the
// filter toggle without hardcoding "Pub"/"Beer Mile" or any other
// specific set of values, so this generalises to whatever categories an
// admin actually types in.
export function categoriesIn(rows) {
  const seen = [];
  for (const row of rows || []) {
    if (row.category && !seen.includes(row.category)) seen.push(row.category);
  }
  return seen;
}

// Bulk-import for the admin editor's "Paste multiple rows" field — typing
// name/category/count into three inputs per row, one row at a time, is
// fine for a handful of rows but not for a ~40-row survey result someone
// already has in a spreadsheet. One venue per line, split on a tab if the
// line has one (what pasting straight out of a spreadsheet produces) or a
// comma otherwise (typed by hand). A count written as "36/39" — the
// format this kind of survey data is often already written up in — is
// accepted too: the numerator becomes the row's count, and the largest
// denominator seen across all pasted lines comes back as
// `suggestedTotal`, so the caller can offer to fill in the block's
// totalResponses field too rather than making someone type the same
// denominator a second time.
export function parseBulkRows(text) {
  const rows = [];
  let suggestedTotal = 0;
  for (const rawLine of (text || "").split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const fields = (line.includes("\t") ? line.split("\t") : line.split(","))
      .map((field) => field.trim().replace(/^"|"$/g, ""));
    const [name, category, countField] = fields;
    if (!name) continue;

    const fraction = (countField || "").match(/^(\d+)\s*\/\s*(\d+)$/);
    let count;
    if (fraction) {
      count = Number(fraction[1]);
      suggestedTotal = Math.max(suggestedTotal, Number(fraction[2]));
    } else {
      count = Number((countField || "").replace(/[^\d.]/g, "")) || 0;
    }
    rows.push({ name, category: category || "", count });
  }
  return { rows, suggestedTotal };
}
