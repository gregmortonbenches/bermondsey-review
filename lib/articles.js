// Place-rooted pieces (Bermondsey reporting, cartoons about the area) read
// warm brown, like the local brick. Culture pieces (books, film, wider
// culture) read dockside blue. This is the palette's real job — not
// decoration, but a quiet signal of what kind of piece you're looking at.
export function categoryFamily(category) {
  return category === "Bermondsey" || category === "Cartoon" ? "brick" : "river";
}
