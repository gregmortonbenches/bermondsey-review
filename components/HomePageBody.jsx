import Masthead from "@/components/Masthead";
import ArticleCard from "@/components/ArticleCard";
import PuzzlesSection from "@/components/PuzzlesSection";
import ArticleCarousel from "@/components/ArticleCarousel";
import Newsletter from "@/components/Newsletter";
import ThemeVars from "@/components/ThemeVars";
import { articles } from "@/lib/articles";
import { createClient } from "@/lib/supabase/server";
import { getPageLayoutSafe, DEFAULT_HOME_SECTIONS } from "@/lib/layout";

export default async function HomePageBody() {
  let layout = DEFAULT_HOME_SECTIONS;
  try {
    const supabase = await createClient();
    layout = await getPageLayoutSafe(supabase, "home");
  } catch {
    layout = DEFAULT_HOME_SECTIONS;
  }

  // Content is still mock data (step 4 of the build order) — this
  // component is only responsible for *which sections* appear and in
  // *what order*, which is now controlled by the layout builder rather
  // than hardcoded here.
  const [featured, ...rest] = articles;

  const enabled = layout.filter((s) => s.enabled);
  const newsletterOn = enabled.some((s) => s.type === "newsletter");
  const mainSections = enabled.filter((s) => s.type !== "newsletter"); // newsletter is full-bleed, outside the constrained-width wrapper

  function renderSection(section) {
    switch (section.type) {
      case "featured":
        return (
          <section key={section.id} className="pt-8">
            <ArticleCard article={featured} size="featured" />
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
