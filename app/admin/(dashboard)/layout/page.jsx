import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getPageLayout } from "@/lib/layout";
import { getCurrentUserRole } from "@/lib/profile";
import { getPublishedPosts } from "@/lib/posts";
import { getCurrentRound } from "@/lib/geoguesser";
import { getSiteSettingsSafe, DEFAULT_SITE_SETTINGS } from "@/lib/theme";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import ThemeVars from "@/components/ThemeVars";
import ArticleCard from "@/components/ArticleCard";
import AdminLayoutTabs from "@/components/admin/AdminLayoutTabs";

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

  const [sections, posts, settings, currentRound] = await Promise.all([
    getPageLayout(supabase, "home"),
    getPublishedPosts(supabase).catch(() => []),
    getSiteSettingsSafe(supabase),
    getCurrentRound(supabase).catch(() => null),
  ]);
  const cartoons = posts.filter((p) => p.type === "cartoon");
  const articlePosts = posts.filter((p) => p.type !== "cartoon");
  const [featured, ...rest] = articlePosts;
  const pageCopy = { ...DEFAULT_SITE_SETTINGS.page_copy, ...settings.page_copy };

  // Real content for each section type, rendered server-side (these are
  // Server Components — LayoutCanvas, a Client Component, can't import
  // and render them itself, only place ones it's handed) and passed to
  // the canvas as pre-rendered elements. Carousel, puzzles, and cartoons
  // are the exceptions — see LayoutCanvas's own doc comment for why
  // they're rendered live by the canvas itself instead, so their
  // settings (item counts, card text, section headers) preview
  // instantly rather than needing a save-and-reload.
  const sectionContent = {
    featured: (
      <section id="featured" className="pt-8 pb-10 scroll-mt-24">
        {featured ? (
          <ArticleCard article={featured} size="featured" adminEditable />
        ) : (
          <p className="font-body text-steel py-8">Nothing published yet — check back soon.</p>
        )}
      </section>
    ),
  };

  // Read-only context shown below Archive's/Guess the Spot's own
  // editable heading — the actual post list, the actual current round's
  // photo — same "true canvas" reasoning as the homepage sections above,
  // scaled down: there's nothing to reorder or configure here, just
  // content worth seeing while you edit the copy above it. Editing an
  // individual post, or a round's photo/correct spot, has its own
  // screen already (data-canvas-allow lets that link through the
  // canvas's own link-suppression — see canvasNav.js).
  const archiveExtra = (
    <div>
      <p className="font-sans text-xs text-steel mb-3">
        Every published post shows here, newest first — categories filter this list on the live site.
      </p>
      {articlePosts.length === 0 ? (
        <p className="font-body text-steel py-8">Nothing filed under this section yet.</p>
      ) : (
        articlePosts.map((article) => <ArticleCard key={article.slug} article={article} adminEditable />)
      )}
    </div>
  );

  const geoguesserExtra = (
    <div>
      <p className="font-sans text-xs text-steel mb-3">
        The current round&rsquo;s photo — manage rounds (including the correct spot) in{" "}
        <a href="/admin/geoguesser" data-canvas-allow="true" className="underline underline-offset-4 hover:text-river">
          Guess the Spot
        </a>
        .
      </p>
      {currentRound ? (
        <div className="relative aspect-[16/9] rounded-sm overflow-hidden bg-steel/[0.08] max-w-md">
          <Image
            src={currentRound.photo_url}
            alt={currentRound.photo_alt || ""}
            fill
            sizes="480px"
            className="object-cover"
          />
        </div>
      ) : (
        <p className="font-body text-steel py-8 text-center border-t border-steel/20">
          No round published yet —{" "}
          <a href="/admin/geoguesser/new" data-canvas-allow="true" className="underline underline-offset-4 hover:text-river">
            add one
          </a>
          .
        </p>
      )}
    </div>
  );

  return (
    <AdminLayoutTabs
      initialSections={sections}
      sectionContent={sectionContent}
      carouselArticles={rest}
      cartoons={cartoons}
      initialPageCopy={pageCopy}
      archiveExtra={archiveExtra}
      geoguesserExtra={geoguesserExtra}
      masthead={<Masthead />}
      footer={<Footer />}
      themeVars={<ThemeVars scope=".theme-canvas" />}
    />
  );
}
