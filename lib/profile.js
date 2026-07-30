// Returns "admin" | "contributor" | null (not signed in). Defaults to
// "contributor" if a profile row is somehow missing, since that's the
// safer failure mode — never silently grant admin powers.
export async function getCurrentUserRole(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return "contributor";
  return data.role;
}
