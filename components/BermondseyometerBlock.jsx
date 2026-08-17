"use client";

import { useState } from "react";
import { scorePoint, classify, TOTAL } from "@/lib/bermondseyometer";

function formatPostcode(value) {
  return value.trim().toUpperCase().replace(/\s+/g, " ");
}

/**
 * A postcode-in, percentage-out widget built from 39 respondents' own
 * hand-drawn "where is Bermondsey" boundaries (see the article this
 * accompanies) — ported from a standalone prototype, stripped down to
 * just the essentials for sitting inline in an article body: a postcode,
 * a percentage, and a one-line verdict. No meter bar, no "compare to
 * Bermondsey Street" cards — see lib/bermondseyometer.js's own comment
 * for what else the prototype had that didn't come with it.
 *
 * A fixed, non-configurable block (see BLOCK_TYPES's "bermondseyometer"
 * entry in admin/BlockEditor.jsx) — the boundary data lives in
 * lib/bermondseyometer.js, not in this block's own stored JSON, since
 * nobody's re-entering 39 hand-drawn shapes through an admin form.
 * Inserting the block is the only thing an admin does with it.
 *
 * postcodes.io is a free, keyless public API — the postcode a visitor
 * types goes straight from their browser to postcodes.io, never through
 * this site's own server, so there's genuinely nothing of theirs to
 * store even if this app wanted to.
 */
export default function BermondseyometerBlock({ accentHex = "var(--color-river, #1D4ED8)" }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const postcode = formatPostcode(value);
    setError("");
    setResult(null);

    if (!postcode) {
      setError("Enter a full UK postcode first.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "That postcode could not be found. Check it and try again."
            : "The postcode lookup is unavailable at the moment. Try again shortly."
        );
      }
      const data = await response.json();
      const found = data && data.result;
      if (!found || typeof found.longitude !== "number" || typeof found.latitude !== "number") {
        throw new Error("That postcode did not return a usable location.");
      }
      const { count, pct } = scorePoint(found.longitude, found.latitude);
      const [label, copy] = classify(pct);
      setResult({ postcode: found.postcode || postcode, count, pct, label, copy });
    } catch (err) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-steel/25 p-5 sm:p-6">
      <p className="font-display font-700 text-lg text-ink">The Bermondseyometer</p>
      <p className="font-body text-sm text-steel mt-1">
        Enter a postcode to see what share of our 39 respondents drew that spot inside <em>their</em> Bermondsey.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. SE16 4QZ"
          maxLength={9}
          aria-label="UK postcode"
          className="flex-1 min-w-0 font-sans text-base font-600 uppercase border border-steel/30 px-3 py-2.5 outline-none focus:border-river text-ink placeholder:normal-case placeholder:text-steel/50"
        />
        <button
          type="submit"
          disabled={loading}
          className="font-sans text-sm font-600 text-paper px-5 py-2.5 hover:bg-ink transition-colors disabled:opacity-50 whitespace-nowrap"
          style={{ backgroundColor: accentHex }}
        >
          {loading ? "Measuring…" : "Measure it"}
        </button>
      </form>

      <p className="font-sans text-xs text-steel mt-2">
        We use the postcode's geographic centre. Nothing about your search is stored.
      </p>

      {error && (
        <p className="font-sans text-sm text-brick mt-3" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-6 pt-6 border-t border-steel/20">
          <p className="font-sans text-xs uppercase tracking-[0.08em] text-steel">{result.postcode}</p>
          <p className="font-display font-700 text-4xl sm:text-5xl text-ink mt-1 leading-none">
            {Math.round(result.pct)}
            <span className="text-2xl sm:text-3xl" style={{ color: accentHex }}>%</span>
          </p>
          <p className="font-display font-700 text-lg text-ink mt-2">{result.label}</p>
          <p className="font-body text-sm text-steel mt-1">{result.copy}</p>
          <p className="font-sans text-xs text-steel mt-3">
            {result.count} of {TOTAL} respondents drew this location inside Bermondsey.
          </p>
        </div>
      )}
    </div>
  );
}
