export async function listRoundsForAdmin(supabase) {
  const { data, error } = await supabase
    .from("geoguesser_rounds")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getRoundById(supabase, id) {
  const { data, error } = await supabase.from("geoguesser_rounds").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

// One puzzle at a time, like the crossword — the most recently created
// row is "the current round". Publishing a new one supersedes the last
// automatically; there's no separate "is this the current one" flag to
// manage.
export async function getCurrentRound(supabase) {
  const { data, error } = await supabase
    .from("geoguesser_rounds")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createRound(supabase, round) {
  const { data, error } = await supabase.from("geoguesser_rounds").insert(round).select().single();
  if (error) throw error;
  return data;
}

export async function updateRound(supabase, id, updates) {
  const { data, error } = await supabase
    .from("geoguesser_rounds")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRound(supabase, id) {
  const { error } = await supabase.from("geoguesser_rounds").delete().eq("id", id);
  if (error) throw error;
}
