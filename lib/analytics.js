export async function recordPageView(supabase, path) {
  try {
    await supabase.from("page_views").insert({
      path,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
    });
  } catch {
    // Never let tracking break the page.
  }
}

// Aggregates client-side rather than with a SQL group-by — simple and
// fast enough at the scale of a fortnightly publication; worth revisiting
// with a proper aggregate query if traffic ever gets large.
export async function getViewStats(supabase) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("page_views")
    .select("path, viewed_at")
    .gte("viewed_at", since);
  if (error) throw error;

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const byPath = {};
  for (const row of data) {
    if (!byPath[row.path]) byPath[row.path] = { path: row.path, last7: 0, last30: 0 };
    byPath[row.path].last30 += 1;
    if (new Date(row.viewed_at).getTime() >= sevenDaysAgo) byPath[row.path].last7 += 1;
  }
  return Object.values(byPath).sort((a, b) => b.last30 - a.last30);
}
