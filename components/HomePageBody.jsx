import Masthead from "@/components/Masthead";
import ArticleCard from "@/components/ArticleCard";
import PuzzlesSection from "@/components/PuzzlesSection";
import ArticleCarousel from "@/components/ArticleCarousel";
import Newsletter from "@/components/Newsletter";
import ThemeVars from "@/components/ThemeVars";
import { createClient } from "@/lib/supabase/server";
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

  const [featured, ...rest] = posts;

  const enabled = layout.filter((s) => s.enabled);
  const newsletterOn = enabled.some((s) => s.type === "newsletter");
  const mainSections = enabled.filter((s) => s.type !== "newsletter"); // newsletter is full-bleed, outside the constrained-width wrapper

  function renderSection(section) {
    switch (section.type) {
      case "featured":
        return (
          <section key={section.id} className="pt-8">
            {featured ? (
              <ArticleCard article={featured} size="featured" />
            ) : (
              <p className="font-body text-steel py-8">Nothing published yet — check back soon.</p>
            )}
          </section>
        );
      case "puzzles":
        return <PuzzlesSection key={section.id} />;
      case "carousel":
        return <ArticleCarousel key={section.id} articles={rest} />;
      default:
        return null;
    }
  }

  return (
    <main className="bg-paper min-h-screen">
      <ThemeVars />
      <Masthead />
      <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12">
        {mainSections.map(renderSection)}
      </div>
      {newsletterOn && <Newsletter />}
    </main>
  );
}
