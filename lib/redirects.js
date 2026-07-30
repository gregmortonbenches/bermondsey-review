export async function listRedirects(supabase) {
  const { data, error } = await supabase
    .from("redirects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createRedirect(supabase, fromPath, toPath) {
  const { error } = await supabase
    .from("redirects")
    .upsert({ from_path: fromPath, to_path: toPath }, { onConflict: "from_path" });
  if (error) throw error;
}

export async function deleteRedirect(supabase, id) {
  const { error } = await supabase.from("redirects").delete().eq("id", id);
  if (error) throw error;
}
