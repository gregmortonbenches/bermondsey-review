import BlockContent from "./BlockContent";

// Pages aren't categorised the way posts are, so there's no brick/river
// accent to pick — river is the site's general-purpose secondary colour
// elsewhere (see categoryFamily's own fallback in lib/articles.js), so it
// does the same job here for the drop cap, quote border, and buttons.
const ACCENT_HEX = "var(--color-river, #1D4ED8)";

export default function PageRenderer({ page }) {
  return (
    <article className="max-w-content mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display font-700 text-4xl sm:text-5xl text-ink leading-[1.05]">
        {page.title || "Untitled"}
      </h1>

      <div className="mt-10">
        <BlockContent
          blocks={page.body}
          accentHex={ACCENT_HEX}
          emptyText="This page doesn't have any content yet."
        />
      </div>
    </article>
  );
}
