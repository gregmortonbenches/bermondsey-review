/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FFFFFF",   // page background — fixed, not admin-editable (readability floor)
        ink: "#1C1B17",     // near-black, warm — fixed, not admin-editable
        // brick/river are the two accents the theme editor can change
        // (see components/ThemeVars.jsx) — the var() fallback means
        // nothing breaks if site_settings hasn't loaded or doesn't exist
        // (or, for admin chrome, where ThemeVars is deliberately never
        // included at all — see its own comment for why).
        //
        // Defined via the RGB-channels variable + <alpha-value>, not the
        // plain hex `var(--color-brick, #9C6B42)` form, so that opacity
        // modifiers (`bg-brick/[0.1]`, used all over the admin UI for
        // active/highlighted states) actually generate CSS — Tailwind can
        // only blend an arbitrary alpha into a colour it can decompose
        // into channels, and a colour given as a raw hex-valued CSS
        // variable string can't be decomposed, so every `/`-modified
        // brick/river utility silently produced nothing before this. The
        // fallback numbers (156 107 66 / 43 76 115) are the RGB channels
        // of lib/theme.js's DEFAULT_SITE_SETTINGS hex values — keep them
        // in sync if those defaults ever change. See hexToRgbChannels in
        // lib/color.js and the --color-brick-rgb/--color-river-rgb
        // variables components/ThemeVars.jsx writes.
        brick: "rgb(var(--color-brick-rgb, 156 107 66) / <alpha-value>)",
        river: "rgb(var(--color-river-rgb, 43 76 115) / <alpha-value>)",
        mustard: "#D3A121", // dockside signage yellow, used sparingly
        steel: "#6E6C63",   // hairlines, captions — fixed, not admin-editable
      },
      fontFamily: {
        // --font-display/--font-body are only set when the theme editor
        // picks something other than the default — otherwise this falls
        // through to the next/font-loaded defaults from app/layout.jsx.
        display: ["var(--font-display, var(--font-zilla))", "Georgia", "serif"],
        body: ["var(--font-body, var(--font-source-serif))", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontWeight: {
        600: "600",
        700: "700",
      },
      maxWidth: {
        content: "780px",
        wide: "1180px",
      },
      // "xs" isn't one of Tailwind's default breakpoints — without this,
      // `xs:` was already in use (ArticleCarousel.jsx, CartoonsSection.jsx)
      // as if it existed, but silently generated no CSS at all: Tailwind's
      // JIT only emits a rule for a variant it actually recognizes, so
      // every `xs:w-[...]` was dead, and those elements just kept their
      // base (smallest-phone) width all the way up to `sm:` (640px)
      // instead of stepping down partway there as intended. 480px sits
      // between typical phone widths and `sm:`, matching what both of
      // those call sites were already written assuming existed.
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [],
};
