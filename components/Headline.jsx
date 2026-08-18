// A linked headline that safely underlines on hover — including when
// it's clamped to a fixed number of lines. -webkit-line-clamp puts its
// element in display:-webkit-box, and a hover underline painted
// directly on that box only renders under the first line in Chrome/
// Safari (see ArticleGrid.jsx's git history — this exact bug shipped
// and had to be fixed there once already). The clamp class always goes
// on the outer tag; the underline always goes on an inner span, which
// stays genuinely inline no matter what the outer element's display is.
//
// Every "linked headline that underlines on hover" in the codebase
// renders through this now (ArticleCard's two sizes, ArticleGrid's
// tiles, CartoonsSection's caption), rather than each one hand-rolling
// the same two classes independently — so the fix stays fixed
// everywhere at once, instead of only wherever someone remembered to
// copy it. Expects a `group` class on some ancestor (the surrounding
// <Link>, in every current use) to drive the hover/active state.
export default function Headline({ as: Tag = "h3", lineClampClassName = "", className = "", children }) {
  return (
    <Tag className={`${lineClampClassName} ${className}`.trim()}>
      <span className="underline-offset-4 group-hover:underline group-active:underline">{children}</span>
    </Tag>
  );
}
