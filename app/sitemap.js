import { createClient } from "@/lib/supabase/public";
import { getPublishedPosts } from "@/lib/posts";
import { getAllPublishedPages } from "@/lib/pages";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

export default async function sitemap() {
  const staticRoutes = ["", "/latest", "/crossword", "/geoguesser"].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));

  let postRoutes = [];
  try {
    const supabase = await createClient();
    const posts = await getPublishedPosts(supabase);
    // Only article/cartoon types have a live route today (/article/[slug]).
    // Add video/podcast here once /watch and /listen exist (build order
    // steps 8–9) — including them now would list pages that 404.
    postRoutes = posts
      .filter((p) => p.type === "article" || p.type === "cartoon")
      .map((post) => ({
        url: `${SITE_URL}/article/${post.slug}`,
        lastModified: post.updated_at,
      }));
  } catch {
    // Supabase not configured yet, or the table's empty — sitemap just
    // covers the static routes rather than failing to build.
  }

  let pageRoutes = [];
  try {
    const supabase = await createClient();
    const pages = await getAllPublishedPages(supabase);
    pageRoutes = pages.map((page) => ({
      url: `${SITE_URL}/${page.slug}`,
      lastModified: page.updated_at,
    }));
  } catch {
    // Same fallback as above.
  }

  return [...staticRoutes, ...postRoutes, ...pageRoutes];
}
