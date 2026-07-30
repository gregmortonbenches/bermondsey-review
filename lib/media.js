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
