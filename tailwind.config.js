/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FFFFFF",   // page background — fixed, not admin-editable (readability floor)
        ink: "#1C1B17",     // near-black, warm — fixed, not admin-editable
        // brick/river are the two accents the theme editor can change
        // (see components/ThemeVars.jsx) — the var() fallback means
        // nothing breaks if site_settings hasn't loaded or doesn't exist.
        brick: "var(--color-brick, #9C6B42)",
        river: "var(--color-river, #2B4C73)",
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
    },
  },
  plugins: [],
};
