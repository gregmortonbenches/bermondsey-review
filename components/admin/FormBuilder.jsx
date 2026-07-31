"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createForm, updateForm, deleteForm, FIELD_TYPES } from "@/lib/forms";
import { slugify } from "@/lib/slugify";
import ConfirmDialog from "./ConfirmDialog";

const AUTOSAVE_DELAY_MS = 1500;
const emptyForm = { title: "", description: "", slug: "", fields: [], published: false };

function newField(type) {
  return {
    id: crypto.randomUUID().slice(0, 8),
    type,
    label: "",
    required: false,
    options: type === "select" ? ["Option 1", "Option 2"] : undefined,
  };
}

export default function FormBuilder({ mode, initialForm }) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState(initialForm || emptyForm);
  const [saveState, setSaveState] = useState("idle");
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [error, setError] = useState(null);
  const autosaveTimer = useRef(null);
  const lastSavedRef = useRef(JSON.stringify(initialForm || null));
  const isFirstRender = useRef(true);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateField(index, updates) {
    setForm((f) => ({
      ...f,
      fields: f.fields.map((field, i) => (i === index ? { ...field, ...updates } : field)),
    }));
  }

  function removeField(index) {
    setForm((f) => ({ ...f, fields: f.fields.filter((_, i) => i !== index) }));
  }

  function moveField(index, direction) {
    const target = index + direction;
    setForm((f) => {
      if (target < 0 || target >= f.fields.length) return f;
      const next = [...f.fields];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...f, fields: next };
    });
  }

  function addField(type) {
    setForm((f) => ({ ...f, fields: [...f.fields, newField(type)] }));
  }

  async function persist(payload, { redirectOnCreate = false } = {}) {
    if (!payload.slug) payload.slug = slugify(payload.title || "untitled-form");
    if (!payload.id) {
      const created = await createForm(supabase, payload);
      lastSavedRef.current = JSON.stringify(created);
      setForm(created);
      if (redirectOnCreate) router.push(`/admin/forms/${created.id}/edit`);
      return created;
    }
    const updated = await updateForm(supabase, payload.id, payload);
    lastSavedRef.current = JSON.stringify(updated);
    return updated;
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!form.id) return;
    const json = JSON.stringify(form);
    if (json === lastSavedRef.current) return;

    setSaveState("unsaved");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        await persist(form);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(autosaveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  async function handleSave() {
    setSaveState("saving");
    try {
      const saved = await persist(form, { redirectOnCreate: true });
      if (saved) setForm(saved);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  async function handleDelete() {
    if (!form.id) return;
    setConfirmDeleteOpen(false);
    setDeleting(true);
    try {
      await deleteForm(supabase, form.id);
      router.push("/admin/forms");
    } catch (err) {
      setDeleting(false);
      setError(`Couldn't delete this: ${err.message}`);
    }
  }

  const statusCopy = { idle: "Not saved yet", unsaved: "Unsaved changes…", saving: "Saving…", saved: "\u2713 Saved", error: "Couldn't save" };
  const statusColor = { idle: "text-steel", unsaved: "text-steel", saving: "text-steel", saved: "text-river", error: "text-brick" };

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-12 py-8">
      {error && (
        <p className="font-sans text-sm text-brick bg-brick/[0.08] rounded-sm px-3 py-2 mb-6">{error}</p>
      )}
      <div className="flex items-center gap-3 mb-6">
        <span className={`font-sans text-xs ${statusColor[saveState]}`}>{statusCopy[saveState]}</span>
        <div className="flex items-center gap-2 ml-auto">
          {form.id && form.published && (
            <a
              href={`/forms/${form.slug}`}
              target="_blank"
              rel="noreferrer"
              className="font-sans text-sm text-river hover:text-ink underline underline-offset-4"
            >
              View live
            </a>
          )}
          {form.id && (
            <a
              href={`/admin/forms/${form.id}/submissions`}
              className="font-sans text-sm text-steel hover:text-ink underline underline-offset-4"
            >
              Responses
            </a>
          )}
          <label className="flex items-center gap-1.5 font-sans text-sm text-ink">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => set("published", e.target.checked)}
              className="w-4 h-4 accent-river"
            />
            Published
          </label>
          <button
            type="button"
            onClick={handleSave}
            className="font-sans text-sm font-600 bg-brick text-paper px-4 py-2 rounded-sm hover:bg-ink transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      <input
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        placeholder="Form title, e.g. \u201cContact us\u201d"
        className="w-full font-display font-700 text-2xl border-2 border-transparent hover:border-steel/20 focus:border-river rounded-sm px-2 py-1 -mx-2 mb-3 outline-none"
      />
      <textarea
        value={form.description || ""}
        onChange={(e) => set("description", e.target.value)}
        placeholder="A short line explaining what this form is for (optional)"
        rows={2}
        className="w-full font-body text-base border-2 border-transparent hover:border-steel/20 focus:border-river rounded-sm px-2 py-1 -mx-2 mb-6 outline-none resize-y"
      />

      <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-2">
        Fields
      </label>

      {form.fields.length === 0 && (
        <div className="border border-dashed border-steel/30 rounded-sm px-4 py-6 text-center mb-3">
          <p className="font-body text-steel">No fields yet — add one below.</p>
        </div>
      )}

      <div className="space-y-3">
        {form.fields.map((field, index) => (
          <div key={field.id} className="border border-steel/25 rounded-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-sans text-[11px] uppercase tracking-[0.08em] text-steel">
                {FIELD_TYPES.find((t) => t.value === field.type)?.label || field.type}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => moveField(index, -1)} disabled={index === 0} className="w-6 h-6 flex items-center justify-center rounded-sm border border-steel/25 text-steel hover:text-ink disabled:opacity-30">↑</button>
                <button type="button" onClick={() => moveField(index, 1)} disabled={index === form.fields.length - 1} className="w-6 h-6 flex items-center justify-center rounded-sm border border-steel/25 text-steel hover:text-ink disabled:opacity-30">↓</button>
                <button type="button" onClick={() => removeField(index)} className="ml-1 px-2 h-6 rounded-sm border border-steel/25 text-steel hover:text-brick hover:border-brick text-xs">Remove</button>
              </div>
            </div>

            <input
              value={field.label}
              onChange={(e) => updateField(index, { label: e.target.value })}
              placeholder="Field label, e.g. \u201cYour email\u201d"
              className="w-full font-sans text-sm border border-steel/25 rounded-sm px-2 py-1.5 mb-2"
            />

            {field.type === "select" && (
              <div>
                <label className="block font-sans text-xs text-steel mb-1">Options, one per line</label>
                <textarea
                  value={(field.options || []).join("\n")}
                  onChange={(e) => updateField(index, { options: e.target.value.split("\n") })}
                  rows={3}
                  className="w-full font-sans text-sm border border-steel/25 rounded-sm px-2 py-1.5"
                />
              </div>
            )}

            <label className="flex items-center gap-1.5 font-sans text-xs text-steel mt-2">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateField(index, { required: e.target.checked })}
                className="w-3.5 h-3.5 accent-river"
              />
              Required
            </label>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {FIELD_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => addField(t.value)}
            className="font-sans text-sm font-600 border border-steel/40 text-ink px-3 py-1.5 rounded-sm hover:border-river hover:text-river transition-colors"
          >
            + {t.label}
          </button>
        ))}
      </div>

      {form.id && (
        <div className="pt-6 mt-6 border-t border-steel/20">
          <button
            type="button"
            onClick={() => setConfirmDeleteOpen(true)}
            disabled={deleting}
            className="font-sans text-xs text-steel hover:text-brick underline underline-offset-4 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete this form"}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete this form?"
        message={`"${form.title || "This form"}" and all its responses will be gone for good — this can't be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
