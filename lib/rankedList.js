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
