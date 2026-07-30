export const FIELD_TYPES = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "email", label: "Email" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
];

export async function listFormsForAdmin(supabase) {
  const { data, error } = await supabase
    .from("forms")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getFormById(supabase, id) {
  const { data, error } = await supabase.from("forms").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPublishedFormBySlug(supabase, slug) {
  const { data, error } = await supabase
    .from("forms")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createForm(supabase, form) {
  const { data, error } = await supabase.from("forms").insert(form).select().single();
  if (error) throw error;
  return data;
}

export async function updateForm(supabase, id, updates) {
  const { data, error } = await supabase
    .from("forms")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteForm(supabase, id) {
  const { error } = await supabase.from("forms").delete().eq("id", id);
  if (error) throw error;
}

export async function submitForm(supabase, formId, data) {
  const { error } = await supabase.from("form_submissions").insert({ form_id: formId, data });
  if (error) throw error;
}

export async function listSubmissions(supabase, formId) {
  const { data, error } = await supabase
    .from("form_submissions")
    .select("*")
    .eq("form_id", formId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data;
}
