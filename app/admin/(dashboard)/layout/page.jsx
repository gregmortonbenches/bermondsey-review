import { createClient } from "@/lib/supabase/server";
import { getPageLayout } from "@/lib/layout";
import { getCurrentUserRole } from "@/lib/profile";
import { getPublishedPosts } from "@/lib/posts";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import ThemeVars from "@/components/ThemeVars";
import ArticleCard from "@/components/ArticleCard";
import PuzzlesSection from "@/components/PuzzlesSection";
import ArticleCarousel from "@/components/ArticleCarousel";
import Newsletter from "@/components/Newsletter";
import LayoutCanvas from "@/components/admin/LayoutCanvas";

export default async function AdminLayoutPage() {
  const supabase = await createClient();
  const role = await getCurrentUserRole(supabase);

  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <p className="font-sans text-sm text-steel">
          The homepage layout affects the whole site, so only admins can change it. Ask an admin
          if you think this should be changed.
        </p>
      </div>
    );
  }

  const [sections, posts] = await Promise.all([
    getPageLayout(supabase, "home"),
    getPublishedPosts(supabase).catch(() => []),
  ]);
  const [featured, ...rest] = posts;

  // Real content for each section type, rendered server-side (these are
  // Server Components — LayoutCanvas, a Client Component, can't import
  // and render them itself, only place ones it's handed) and passed to
  // the canvas as pre-rendered elements.
  const sectionContent = {
    featured: (
      <section id="featured" className="pt-8 scroll-mt-24">
        {featured ? (
          <ArticleCard article={featured} size="featured" />
        ) : (
          <p className="font-body text-steel py-8">Nothing published yet — check back soon.</p>
        )}
      </section>
    ),
    puzzles: <PuzzlesSection />,
    carousel: <ArticleCarousel articles={rest} />,
    newsletter: <Newsletter />,
  };

  return (
    <LayoutCanvas
      pageKey="home"
      initialSections={sections}
      sectionContent={sectionContent}
      masthead={<Masthead />}
      footer={<Footer />}
      themeVars={<ThemeVars scope=".theme-canvas" />}
    />
  );
}
