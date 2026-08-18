// NO LONGER USED — nothing calls this any more, and it is kept only
// because it records a decision worth being able to find again.
//
// Place-rooted pieces (Bermondsey reporting, cartoons about the area)
// used to read in one colour and culture pieces (books, film) in
// another, the idea being that the palette carried a quiet signal of
// what kind of piece you were looking at. In practice it didn't: the
// signal was spent as large pale background washes on hero bands, cards
// and cover art, which read as decoration rather than as information,
// and made the whole site look colourful without anyone learning what
// the two colours meant. The site is black, white and grey now with a
// single accent, so category and colour are no longer connected.
//
// Safe to delete outright; left here so the reasoning above isn't lost
// with it.
export function categoryFamily(category) {
  return category === "Bermondsey" || category === "Cartoon" ? "brick" : "river";
}

// "1 Jun 2026" — a card-scale dateline, short enough to sit on the same
// line as a byline without forcing it to wrap. ArticleSidebar.jsx's own
// article-page date stays the fuller "1 June 2026" (day, full month,
// year) it always was; that's a roomier, single-purpose slot, not a
// tight credit line shared with a name.
export function formatCardDate(dateString) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
