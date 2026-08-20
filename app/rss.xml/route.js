import { createClient } from "@/lib/supabase/public";
import { getPublishedPosts } from "@/lib/posts";
import { getSiteSettingsSafe, DEFAULT_SITE_SETTINGS } from "@/lib/theme";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

// RSS is XML, not HTML — the same title/dek/author text that's safe to
// drop straight into JSX (which escapes it automatically) has to be
// escaped by hand here, or a "&" or "<" in someone's title breaks the
// whole feed for every reader, not just the one post.
function escapeXml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[char]);
}

// Most recent 50 — a feed reader wants "what's new," not the entire
// archive; /sitemap.xml is what carries every URL ever published.
const MAX_ITEMS = 50;

export async function GET() {
  let settings = DEFAULT_SITE_SETTINGS;
  let posts = [];
  try {
    const supabase = await createClient();
    [settings, posts] = await Promise.all([getSiteSettingsSafe(supabase), getPublishedPosts(supabase)]);
  } catch {
    // Supabase not configured yet, or the table's empty — ship an
    // otherwise-valid empty feed rather than a 500.
  }

  // Same route restriction as sitemap.xml: only article/cartoon types
  // have a live page to link to today.
  const items = posts
    .filter((p) => p.type === "article" || p.type === "cartoon")
    .slice(0, MAX_ITEMS)
    .map((post) => {
      const link = `${SITE_URL}/article/${post.slug}`;
      const description = post.meta_description || post.dek || "";
      const pubDate = post.published_at ? new Date(post.published_at).toUTCString() : null;
      return `    <item>
      <title>${escapeXml(post.title || "Untitled")}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ""}
      ${post.category ? `<category>${escapeXml(post.category)}</category>` : ""}
      ${post.author ? `<dc:creator>${escapeXml(post.author)}</dc:creator>` : ""}
      ${description ? `<description>${escapeXml(description)}</description>` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(settings.site_title)}</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(settings.site_tagline)}</description>
    <language>en-gb</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      // A feed only needs to be as fresh as the newest post — an hour's
      // staleness is invisible for a fortnightly publication, and it
      // saves rebuilding the whole thing on every single request.
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
