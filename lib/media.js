export async function listMedia(supabase) {
  const { data, error } = await supabase
    .from("media_library")
    .select("*")
    .order("uploaded_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function deleteMediaItem(supabase, item) {
  const { error: storageError } = await supabase.storage.from("media").remove([item.path]);
  if (storageError) throw storageError;
  const { error } = await supabase.from("media_library").delete().eq("id", item.id);
  if (error) throw error;
}

// A post's cover image shows at very different aspect ratios — a square
// archive thumbnail, a 4:5 carousel card, a 4:3 hero — so a plain
// `object-cover` (always centred) can crop out the actual subject of a
// photo that isn't centred itself. `post.cover_image_focal_x/y` (0-100,
// set in the cover image's focal point picker in PostForm.jsx) is
// applied as `object-position` wherever that image renders with
// object-cover, so every one of those crops centres on the same point
// instead of the image's geometric middle. Falls back to CSS's own
// "center" default when unset, so an existing post with no focal point
// saved looks exactly as it did before this existed.
export function focalPointStyle(item) {
  if (item?.cover_image_focal_x == null || item?.cover_image_focal_y == null) return undefined;
  return { objectPosition: `${item.cover_image_focal_x}% ${item.cover_image_focal_y}%` };
}
