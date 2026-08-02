import { notFound } from "next/navigation";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import PageViewTracker from "@/components/PageViewTracker";
import ThemeVars from "@/components/ThemeVars";
import PageRenderer from "@/components/PageRenderer";
import { createClient } from "@/lib/supabase/public";
import { getAllPublishedPages, getPublishedPageBySlug } from "@/lib/pages";
import { getSiteSettingsSafe } from "@/lib/theme";

// Next.js always prefers a specific route (e.g. /latest, /admin) over
// this catch-all, so a page can never shadow one of the site's built-in
// routes — see RESERVED_SLUGS in lib/pages.js for where that's enforced
// at save time too.
export async function generateStaticParams() {
  try {
    const supabase = await createClient();
    const pages = await getAllPublishedPages(supabase);
    return pages.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const supabase = await createClient();
  const page = await getPublishedPageBySlug(supabase, slug);
  if (!page) return {};

  const settings = await getSiteSettingsSafe(supabase);
  return {
    title: `${page.title || "Untitled"} — ${settings.site_title}`,
    description: page.meta_description || undefined,
    openGraph: { title: page.title, images: page.og_image_url ? [page.og_image_url] : undefined },
  };
}

export default async function CustomPage({ params }) {
  const { slug } = await params;
  const supabase = await createClient();
  const page = await getPublishedPageBySlug(supabase, slug);
  if (!page) notFound();

  return (
    <main className="bg-paper min-h-screen flex flex-col">
      <ThemeVars />
      <PageViewTracker path={`/${page.slug}`} />
      <Masthead />
      <div className="flex-1">
        <PageRenderer page={page} />
      </div>
      <Footer />
    </main>
  );
}
