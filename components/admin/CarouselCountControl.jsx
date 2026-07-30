"use client";

// A small "Auto / 1 / 2 / 3…" button group for picking how many items a
// carousel shows at once — shared by the hero-carousel block
// (BlockEditor.jsx) and the homepage's article carousel section
// (LayoutCanvas.jsx), since both are the exact same control over the
// exact same underlying mechanism (see lib/carouselLayout.js). "Auto"
// keeps that carousel's own default peek-width look.
export default function CarouselCountControl({ label, value, options, onChange }) {
  return (
    <div>
      <p className="font-sans text-[10px] uppercase tracking-[0.08em] text-steel mb-1.5">{label}</p>
      <div className="flex gap-1">
        {options.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.value ?? undefined)}
            className={`font-sans text-xs px-2.5 py-1 rounded-sm border transition-colors ${
              (value || null) === opt.value ? "border-river text-river bg-river/[0.06]" : "border-steel/25 text-steel hover:text-ink"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
