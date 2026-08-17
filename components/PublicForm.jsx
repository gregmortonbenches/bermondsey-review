"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { submitForm } from "@/lib/forms";

export default function PublicForm({ form }) {
  const [values, setValues] = useState({});
  const [honeypot, setHoneypot] = useState(""); // real users never see or fill this in
  const [status, setStatus] = useState("idle"); // idle | submitting | done | error

  function set(fieldId, value) {
    setValues((v) => ({ ...v, [fieldId]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (honeypot) return; // silently drop — almost certainly a bot
    setStatus("submitting");
    try {
      await submitForm(createClient(), form.id, values);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="border border-river/30 bg-river/[0.06] p-6 text-center">
        <p className="font-display font-700 text-lg text-ink">Thanks — got it.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot field — hidden from real visitors via CSS, most bots fill it in anyway */}
      <input
        type="text"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px]"
        aria-hidden="true"
      />

      {form.fields.map((field) => (
        <div key={field.id}>
          <label className="block font-sans text-sm font-600 text-ink mb-1">
            {field.label} {field.required && <span className="text-brick">*</span>}
          </label>

          {field.type === "text" && (
            <input
              type="text"
              required={field.required}
              value={values[field.id] || ""}
              onChange={(e) => set(field.id, e.target.value)}
              className="w-full font-sans text-sm border border-steel/30 px-3 py-2 focus-visible:outline-2 focus-visible:outline-river"
            />
          )}
          {field.type === "email" && (
            <input
              type="email"
              required={field.required}
              value={values[field.id] || ""}
              onChange={(e) => set(field.id, e.target.value)}
              className="w-full font-sans text-sm border border-steel/30 px-3 py-2 focus-visible:outline-2 focus-visible:outline-river"
            />
          )}
          {field.type === "textarea" && (
            <textarea
              required={field.required}
              value={values[field.id] || ""}
              onChange={(e) => set(field.id, e.target.value)}
              rows={4}
              className="w-full font-sans text-sm border border-steel/30 px-3 py-2 focus-visible:outline-2 focus-visible:outline-river resize-y"
            />
          )}
          {field.type === "select" && (
            <select
              required={field.required}
              value={values[field.id] || ""}
              onChange={(e) => set(field.id, e.target.value)}
              className="w-full font-sans text-sm border border-steel/30 px-3 py-2"
            >
              <option value="" disabled>
                Choose one
              </option>
              {(field.options || []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
          {field.type === "checkbox" && (
            <label className="flex items-center gap-2 font-sans text-sm text-ink">
              <input
                type="checkbox"
                required={field.required}
                checked={!!values[field.id]}
                onChange={(e) => set(field.id, e.target.checked)}
                className="w-4 h-4 accent-river"
              />
              Yes
            </label>
          )}
        </div>
      ))}

      {status === "error" && (
        <p className="font-sans text-sm text-brick">Something went wrong — try again.</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="font-sans text-sm font-600 bg-river text-paper px-5 py-2.5 hover:bg-ink transition-colors disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : "Submit"}
      </button>
    </form>
  );
}
