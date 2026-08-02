// A confident divider between homepage sections — a hairline, a
// centred uppercase title, and an optional italic one-line description
// below it. Reused by every reorderable homepage section (Featured,
// Article Carousel, Puzzles & Games, Cartoons) so the boundary between
// "new post" and "older posts" and "games" and "cartoons" reads the
// same way each time, rather than each section inventing its own
// header treatment (or, as with Featured/Carousel before this, having
// none at all). No illustration above the title yet — the site doesn't
// have artwork for one — just the rule and the type.
export default function SectionHeader({ title, description }) {
  return (
    <div className="hairline pt-10 pb-8 text-center">
      <h2 className="font-display font-700 text-2xl sm:text-3xl tracking-[0.06em] uppercase text-ink">
        {title}
      </h2>
      {description && (
        <p className="font-body italic text-steel mt-2 max-w-md mx-auto">{description}</p>
      )}
    </div>
  );
}
