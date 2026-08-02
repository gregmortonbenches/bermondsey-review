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
// (a white card, their own input/button/copy) — can't be restyled from
// here. The white rounded wrapper keeps that from reading as a stray
// rectangle against the blue band; the height below matches Substack's
// documented default embed size. If the live widget ends up with extra
// whitespace or gets clipped once this is deployed, adjust the iframe's
// `height` — that's the one number Substack's own docs say to tune per
// publication.
const SUBSTACK_EMBED_URL = "https://thebermondseyreview.substack.com/embed";

export default function Newsletter() {
  return (
    <section id="newsletter" className="bg-river text-paper scroll-mt-24">
      <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16 grid sm:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <h2 className="font-display font-700 text-2xl sm:text-3xl">
            Get the next issue in your inbox
          </h2>
        </div>
        <div className="bg-paper rounded-sm overflow-hidden w-full sm:w-auto">
          <iframe
            src={SUBSTACK_EMBED_URL}
            width="480"
            height="320"
            style={{ border: "none", background: "white", display: "block", width: "100%", maxWidth: 480 }}
            frameBorder="0"
            scrolling="no"
            title="Subscribe to The Bermondsey Review on Substack"
          />
        </div>
      </div>
    </section>
  );
}
