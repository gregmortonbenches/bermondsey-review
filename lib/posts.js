// Shared post queries. Every function takes a `supabase` client as its
// first argument rather than importing one directly, so the same code
// works from a server component (lib/supabase/server.js) or a client
// component (lib/supabase/client.js).

// Matches the RLS policy on posts: a post counts as visible if it's
// actually published, or scheduled with a scheduled_for time that's
// already passed. Kept as a shared filter string so the two query
// functions below (and anything added later) can't drift apart.
const VISIBLE_FILTER = `status.eq.published,and(status.eq.scheduled,scheduled_for.lte.${new Date().toISOString()})`;

export async function getPublishedPosts(supabase) {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .or(VISIBLE_FILTER)
    .order("published_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPublishedPostBySlug(supabase, slug) {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .or(VISIBLE_FILTER)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Admin-only: every post regardless of status, for the /admin list.
export async function getAllPostsForAdmin(supabase) {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPostById(supabase, id) {
  const { data, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createPost(supabase, post) {
  const { data, error } = await supabase.from("posts").insert(post).select().single();
  if (error) throw error;
  return data;
}

export async function updatePost(supabase, id, updates) {
  // If the slug is changing, leave a redirect behind from the old path
  // to the new one, so old links and search results don't just 404.
  if (updates.slug) {
    try {
      const { data: existing } = await supabase
        .from("posts")
        .select("slug")
        .eq("id", id)
        .maybeSingle();
      if (existing?.slug && existing.slug !== updates.slug) {
        await supabase.from("redirects").upsert(
          { from_path: `/article/${existing.slug}`, to_path: `/article/${updates.slug}` },
          { onConflict: "from_path" }
        );
      }
    } catch {
      // Not fatal — worst case, the old URL 404s instead of redirecting.
      // The save itself should still go through.
    }
  }

  const { data, error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePost(supabase, id) {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}

// Uploads a File to the public "media" storage bucket, records it in the
// media_library table (so it shows up in the media picker for reuse
// elsewhere), and returns its public URL.
export async function uploadMedia(supabase, file) {
  const path = `${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("media").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  const url = data.publicUrl;

  // Not fatal if this insert fails (e.g. RLS misconfigured) — the upload
  // itself already succeeded, so don't block the caller over a library
  // bookkeeping row.
  try {
    await supabase.from("media_library").insert({ path, url, filename: file.name });
  } catch {
    // ignore
  }

  return url;
}
