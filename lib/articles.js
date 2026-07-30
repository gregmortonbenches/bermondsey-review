// Placeholder data for the design shell (step 1).
// In step 2 this file is replaced by real queries to Supabase —
// the shape below (slug, title, dek, body[], category, author, date)
// is deliberately close to the `articles` table in the tech plan,
// so swapping the data source later is mostly a search-and-replace.

export const articles = [
  {
    slug: "the-last-shift-at-the-biscuit-factory",
    title: "The Last Shift at the Biscuit Factory",
    dek: "Before the last of the old Peek Freans site is redeveloped, three former workers walk us round what's left.",
    category: "Bermondsey",
    author: "Freya Cole",
    date: "2026-07-18",
    body: [
      "The gates on Clements Road have been chained since March, but Pat Nunn still has a key. She worked the packing line for eleven years, from 1988 until the closure, and she still remembers the smell of custard creams at six in the morning better than she remembers most of the following decade.",
      "\"You'd clock in and the whole street smelled of biscuits,\" she says, standing where the gatehouse used to be. \"Now it just smells of wet concrete.\"",
      "The factory closed for the last time in 2019, but the site has sat half-demolished ever since, caught between three different planning applications. What's left is a strange, beautiful ruin: a single kiln chimney, a wall of blocked-up windows, and — improbably — a stretch of the old conveyor still bolted to the floor of what used to be despatch.",
      "This is the first in a short series on the industrial buildings that shaped Bermondsey before the warehouses became flats. Next time: the leather district, and the smell that gave Tanner Street its name.",
    ],
  },
  {
    slug: "reading-the-river-a-summer-list",
    title: "Reading the River: A Summer List",
    dek: "Six books to read on a bench along the Thames Path, from Bermondsey Wall to Cherry Garden Pier.",
    category: "Books",
    author: "Idris Whately",
    date: "2026-07-14",
    body: [
      "There's a particular kind of reading that only works outdoors, with the tide going out and a can of something cold sweating onto the bench beside you. This list is for that reading.",
      "Start with Iain Sinclair's Downriver — dense, difficult, and unreasonably good on the stretch of river directly in front of you. Follow it with something lighter: a Penelope Fitzgerald novel is about the right length for a single low tide.",
      "The full list, with notes on where to sit for each one, runs below.",
    ],
  },
  {
    slug: "in-praise-of-the-unloved-multiplex",
    title: "In Praise of the Unloved Multiplex",
    dek: "The Surrey Quays cinema will never win a design award. Here's why that's exactly the point.",
    category: "Film",
    author: "Nadia Okafor",
    date: "2026-07-04",
    body: [
      "Nobody has ever described the Surrey Quays Cineworld as beautiful. It sits in a retail park next to a DIY superstore, and the carpet has been the same slightly alarming shade of maroon since at least 2011.",
      "And yet: it is never full of anyone trying to impress anyone else, the popcorn is exactly as bad as popcorn should be, and on a wet Tuesday you can watch almost anything for less than the price of a pint two streets over. There is a case to be made for the unglamorous cinema, and this is it.",
    ],
  },
  {
    slug: "who-actually-runs-the-bermondsey-street-market",
    title: "Who Actually Runs the Bermondsey Street Market?",
    dek: "A short investigation into the stallholders' committee nobody elected but everybody listens to.",
    category: "Bermondsey",
    author: "Freya Cole",
    date: "2026-06-27",
    body: [
      "Ask five stallholders who's in charge of the Friday antiques market and you'll get five different answers, three of which involve a man named Terry who technically retired in 2017.",
      "What actually governs the market, it turns out, is a loose and largely unwritten set of rules about pitch order, arrival times, and who owes whom a favour from the winter of 2009. We tried to map it.",
    ],
  },
  {
    slug: "the-cartoon-your-landlord-doesnt-want-you-to-see",
    title: "The Cartoon Your Landlord Doesn't Want You to See",
    dek: "This fortnight's cartoon, on the going rate for a one-bed with a view of a wall.",
    category: "Cartoon",
    author: "Sam Iqbal",
    date: "2026-07-18",
    body: [
      "[Cartoon panel — see illustration]",
      "A one-panel strip on the Bermondsey rental market, drawn in the same cute, linear style as the rest of the site. Swap this entry for a real image URL once cartoons have their own upload flow.",
    ],
  },
];

export function getArticleBySlug(slug) {
  return articles.find((a) => a.slug === slug);
}

// Place-rooted pieces (Bermondsey reporting, cartoons about the area) read
// warm brown, like the local brick. Culture pieces (books, film, wider
// culture) read dockside blue. This is the palette's real job — not
// decoration, but a quiet signal of what kind of piece you're looking at.
export function categoryFamily(category) {
  return category === "Bermondsey" || category === "Cartoon" ? "brick" : "river";
}

export function getArticlesByCategory(category) {
  if (!category) return articles;
  return articles.filter((a) => a.category === category);
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
