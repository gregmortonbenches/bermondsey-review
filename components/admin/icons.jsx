// A small, consistent line-icon set for the admin's editing canvases —
// replaces the unicode/emoji glyphs (⠿ ↑ ↓ ✕ 🔗 🎨) that used to stand
// in for these, which render differently (or not at all) across
// OS/browser emoji fonts and read as a placeholder rather than a
// finished interface. Same stroke-based style as the post-type icons in
// PostForm.jsx (round caps/joins, currentColor), just smaller and
// simpler, since these live in a compact toolbar rather than a card.
//
// Every icon takes just `className` — sizing is controlled by the
// caller via Tailwind (w-3.5 h-3.5 etc.), matching how the rest of this
// codebase sizes SVGs rather than baking a fixed size into the icon
// itself.

export function GripIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor">
      <circle cx="5" cy="3" r="1.3" />
      <circle cx="11" cy="3" r="1.3" />
      <circle cx="5" cy="8" r="1.3" />
      <circle cx="11" cy="8" r="1.3" />
      <circle cx="5" cy="13" r="1.3" />
      <circle cx="11" cy="13" r="1.3" />
    </svg>
  );
}

export function ChevronUpIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 10.5 L8 6 L12.5 10.5" />
    </svg>
  );
}

export function ChevronDownIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 5.5 L8 10 L12.5 5.5" />
    </svg>
  );
}

export function ChevronLeftIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 3.5 L6 8 L10.5 12.5" />
    </svg>
  );
}

export function ChevronRightIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.5 3.5 L10 8 L5.5 12.5" />
    </svg>
  );
}

export function MenuIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M2.5 4.5 H13.5" />
      <path d="M2.5 8 H13.5" />
      <path d="M2.5 11.5 H13.5" />
    </svg>
  );
}

export function CloseIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4 L12 12 M12 4 L4 12" />
    </svg>
  );
}

export function TrashIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4.5 H13" />
      <path d="M5.5 4.5 V3 a1 1 0 0 1 1 -1 h3 a1 1 0 0 1 1 1 v1.5" />
      <path d="M4.5 4.5 L5 13 a1 1 0 0 0 1 1 h4 a1 1 0 0 0 1 -1 l0.5 -8.5" />
      <path d="M6.5 7.5 V11" />
      <path d="M9.5 7.5 V11" />
    </svg>
  );
}

export function LinkIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 9.5 L9.5 6.5" />
      <path d="M7 4.5 L8.2 3.3 a2.4 2.4 0 0 1 3.5 3.5 L10.2 8" />
      <path d="M9 11.5 L7.8 12.7 a2.4 2.4 0 0 1 -3.5 -3.5 L5.8 8" />
    </svg>
  );
}

export function GearIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2.3" />
      <path d="M8 2.2 V3.6 M8 12.4 V13.8 M13.8 8 H12.4 M3.6 8 H2.2 M12.1 3.9 L11.1 4.9 M4.9 11.1 L3.9 12.1 M12.1 12.1 L11.1 11.1 M4.9 4.9 L3.9 3.9" />
    </svg>
  );
}

export function PaletteIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2 a6 6 0 1 0 0.5 12 c0.7 0 1 -0.4 1 -1 s-0.4 -0.9 -0.4 -1.4 c0 -0.7 0.6 -1.1 1.2 -1.1 H11 a3 3 0 0 0 3 -3 c0 -3 -2.7 -5.5 -6 -5.5 Z" />
      <circle cx="5.4" cy="7" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="8" cy="5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="10.6" cy="7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
