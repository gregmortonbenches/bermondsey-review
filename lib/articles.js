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
