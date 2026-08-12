// Place-rooted pieces (Bermondsey reporting, cartoons about the area) read
// bold yellow. Culture pieces (books, film, wider culture) read bold blue.
// This is the palette's real job — not decoration, but a quiet signal of
// what kind of piece you're looking at. The token names ("brick"/"river")
// are historical — from when they really were warm brick-brown and
// dockside blue — kept as-is to avoid a mechanical rename across every
// file that references them; only the actual colour values changed.
export function categoryFamily(category) {
  return category === "Bermondsey" || category === "Cartoon" ? "brick" : "river";
}
