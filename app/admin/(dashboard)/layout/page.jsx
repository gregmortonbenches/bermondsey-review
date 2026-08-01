import { createClient } from "@/lib/supabase/server";
import { getPageLayout } from "@/lib/layout";
import { getCurrentUserRole } from "@/lib/profile";
import { getPublishedPosts } from "@/lib/posts";
import { getSiteSettingsSafe } from "@/lib/theme";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import ThemeVars from "@/components/ThemeVars";
import ArticleCard from "@/components/ArticleCard";
import Newsletter from "@/components/Newsletter";
import CartoonsSection from "@/components/CartoonsSection";
import LayoutCanvas from "@/components/admin/LayoutCanvas";
import PageHeadersPanel from "@/components/admin/PageHeadersPanel";

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

  const [sections, posts, settings] = await Promise.all([
    getPageLayout(supabase, "home"),
    getPublishedPosts(supabase).catch(() => []),
    getSiteSettingsSafe(supabase),
  ]);
  const cartoons = posts.filter((p) => p.type === "cartoon");
  const articlePosts = posts.filter((p) => p.type !== "cartoon");
  const [featured, ...rest] = articlePosts;

  // Real content for each section type, rendered server-side (these are
  // Server Components — LayoutCanvas, a Client Component, can't import
  // and render them itself, only place ones it's handed) and passed to
  // the canvas as pre-rendered elements. Carousel and puzzles are the
  // exceptions — see LayoutCanvas's own doc comment for why they're
  // rendered live by the canvas itself instead, so their settings
  // (carousel item counts, puzzle card text) preview instantly.
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
    newsletter: <Newsletter />,
    cartoons: <CartoonsSection cartoons={cartoons} />,
  };

  return (
    <>
      <PageHeadersPanel initialPageCopy={settings.page_copy} />
      <LayoutCanvas
        pageKey="home"
        initialSections={sections}
        sectionContent={sectionContent}
        carouselArticles={rest}
        masthead={<Masthead />}
        footer={<Footer />}
        themeVars={<ThemeVars scope=".theme-canvas" />}
      />
    </>
  );
}
