import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import PuzzlesSection from "@/components/PuzzlesSection";
import ArticleGrid from "@/components/ArticleGrid";
import CartoonsSection from "@/components/CartoonsSection";
import ThemeVars from "@/components/ThemeVars";
import { createClient } from "@/lib/supabase/public";
import { getPageLayoutSafe, DEFAULT_HOME_SECTIONS } from "@/lib/layout";
import { getPublishedPosts } from "@/lib/posts";

export default async function HomePageBody() {
  let layout = DEFAULT_HOME_SECTIONS;
  let posts = [];
  try {
    const supabase = await createClient();
    [layout, posts] = await Promise.all([
      getPageLayoutSafe(supabase, "home"),
      getPublishedPosts(supabase).catch(() => []),
    ]);
  } catch {
    layout = DEFAULT_HOME_SECTIONS;
  }

  // Cartoons get their own section (see CartoonsSection.jsx) rather than
  // competing for the Featured slot or turning up in the Carousel.
  const cartoons = posts.filter((p) => p.type === "cartoon");
  const articlePosts = posts.filter((p) => p.type !== "cartoon");
  const [featured, ...rest] = articlePosts;

  // type !== "newsletter" is defensive, not load-bearing: newsletter
  // stopped being a homepage section (it's a global drawer now, mounted
  // by Masthead.jsx — see Newsletter.jsx/NewsletterDrawer.jsx), but an
  // already-saved page_layouts row from before that change can still
  // have one in its stored `sections` array. renderSection's switch
  // below has no "newsletter" case any more anyway (falls through to
  // `default: return null`), so this filter isn't strictly needed for
  // correctness — it's here so a stale saved entry doesn't even get a
  // no-op iteration.
  const mainSections = layout.filter((s) => s.enabled && s.type !== "newsletter");

  function renderSection(section) {
    switch (section.type) {
      case "featured":
        return (
          <section key={section.id} id="featured" className="pt-8 pb-10 scroll-mt-24">
            {featured ? (
              <ArticleCard article={featured} size="featured" />
            ) : (
              <p className="font-body text-steel py-8">Nothing published yet — check back soon.</p>
            )}
          </section>
        );
      case "puzzles":
        return (
          <PuzzlesSection
            key={section.id}
            overrides={{ crossword: section.crossword, geoguesser: section.geoguesser }}
            headerTitle={section.headerTitle}
            headerDescription={section.headerDescription}
            hideHeaderDescription={section.hideHeaderDescription}
          />
        );
      // Still typed "carousel" in stored page_layouts rows — the section
      // is the same one, it just renders as a grid of large squares now
      // rather than a horizontal scroll rail. Renaming the type would
      // orphan every already-saved layout, so only the rendering
      // changed. mobileCount/desktopCount aren't passed any more: those
      // were "how many items per view" for the rail, which a fixed
      // 2-up/1-up grid has no equivalent for.
      case "carousel":
        return (
          <ArticleGrid
            key={section.id}
            articles={rest}
            headerTitle={section.headerTitle}
            headerDescription={section.headerDescription}
            hideHeaderDescription={section.hideHeaderDescription}
          />
        );
      case "cartoons":
        return (
          <CartoonsSection
            key={section.id}
            cartoons={cartoons}
            headerTitle={section.headerTitle}
            headerDescription={section.headerDescription}
            hideHeaderDescription={section.hideHeaderDescription}
          />
        );
      default:
        return null;
    }
  }

  return (
    <main className="bg-paper min-h-screen flex flex-col">
      <ThemeVars />
      <Masthead isHomepage />
      {/* w-full matters here, not just cosmetic: this div is a direct
          child of <main>'s flex-col, and `mx-auto` sets auto margins on
          the cross axis — which disables `align-items: stretch` per the
          flexbox spec, so without an explicit width the browser falls
          back to shrink-to-fit sizing based on the content instead of
          filling the available width, silently rendering everything
          inside narrower than the masthead/footer above and below it. */}
      <div id="main-content" className="max-w-wider mx-auto px-4 sm:px-6 lg:px-12 flex-1 w-full">
        {mainSections.map(renderSection)}
      </div>
      <Footer />
    </main>
  );
}
