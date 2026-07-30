const MAX_REVISIONS_PER_POST = 20;

// Called after every explicit Save draft / Publish / Schedule / Update —
// not on every autosave tick, so this stays a meaningful history rather
// than filling up with near-duplicates from continuous typing.
export async function createRevision(supabase, post) {
  const { error } = await supabase
    .from("post_revisions")
    .insert({ post_id: post.id, snapshot: post });
  if (error) throw error;

  // Trim old revisions so this doesn't grow forever — not fatal if it fails.
  try {
    const { data: old } = await supabase
      .from("post_revisions")
      .select("id")
      .eq("post_id", post.id)
      .order("created_at", { ascending: false })
      .range(MAX_REVISIONS_PER_POST, 1000);
    if (old?.length) {
      await supabase
        .from("post_revisions")
        .delete()
        .in("id", old.map((r) => r.id));
    }
  } catch {
    // ignore — trimming is just housekeeping
  }
}

export async function listRevisions(supabase, postId) {
  const { data, error } = await supabase
    .from("post_revisions")
    .select("id, snapshot, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
