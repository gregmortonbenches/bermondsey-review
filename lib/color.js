// Tailwind can only apply an opacity modifier (e.g. `bg-brick/[0.1]`) to a
// colour it can decompose into RGB channels at build time — a colour
// defined as a raw `var(--color-brick, #9C6B42)` string can't be blended
// with an arbitrary alpha value, so Tailwind silently generates no CSS at
// all for `/`-modified brick/river utilities (see tailwind.config.js's
// `brick`/`river` colours, and the `-rgb` variables this writes alongside
// the existing hex ones). This turns a hex string into the space-separated
// "R G B" form Tailwind's `rgb(var(...) / <alpha-value>)` pattern expects.
export function hexToRgbChannels(hex) {
  const clean = (hex || "").replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const int = parseInt(full, 16);
  if (full.length !== 6 || Number.isNaN(int)) return "0 0 0";
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`;
}
