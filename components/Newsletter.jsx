// Substack (thebermondseyreview.substack.com) owns the actual subscriber
// list and delivery, so this embeds Substack's own subscribe widget
// (an iframe served from the publication's own /embed route) rather than
// collecting emails into a table here and syncing them across — that
// would just be duplicating list management, double opt-in, and
// unsubscribe handling Substack already does. The trade-off: subscriber
// emails live only in Substack, not queryable from this site's own DB —
// worth it as long as Substack is the only thing that ever needs to
// email this list.
//
// The widget is cross-origin, so it renders with Substack's own styling
// (a serif "Bermondsey review" title, its own tagline, input/button/copy,
// its own logo) — can't be restyled from here, only framed. The first cut
// of this put it on the right of a wide [1fr auto] grid with our own
// headline on the left: on anything wider than a phone that left the two
// stranded a full section-width apart across a solid blue band, with
// nothing tying them together. Centred everything into one narrow column
// instead — headline directly above the card, both sharing the same
// horizontal centre — so it reads as one unit (our call-to-action, then
// the mechanism for it) rather than two unrelated things that happen to
// share a background colour. The shadow + inset padding around the
// iframe are there so the card reads as a deliberately placed object
// resting on the band, not a stray white rectangle.
//
// height="320" matches Substack's own documented default embed size —
// the one number their docs say to tune per publication if the live
// widget shows up with extra whitespace or gets clipped, once actually
// deployed where it's reachable (Substack's /embed blocks the headless
// Chromium this repo's Playwright checks run in — a bot-fingerprinting
// block on their end, not something to route around — so this was
// sized from a real screenshot rather than an automated check here).
const SUBSTACK_EMBED_URL = "https://thebermondseyreview.substack.com/embed";

export default function Newsletter() {
  return (
    <section id="newsletter" className="bg-river text-paper scroll-mt-24">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
        <h2 className="font-display font-700 text-2xl sm:text-3xl mb-6">
          Get the next issue in your inbox
        </h2>
        <div className="bg-paper rounded-sm shadow-lg p-2 mx-auto" style={{ maxWidth: 480 }}>
          <iframe
            src={SUBSTACK_EMBED_URL}
            width="480"
            height="320"
            style={{ border: "none", background: "white", display: "block", width: "100%" }}
            frameBorder="0"
            scrolling="no"
            title="Subscribe to The Bermondsey Review on Substack"
          />
        </div>
      </div>
    </section>
  );
}
