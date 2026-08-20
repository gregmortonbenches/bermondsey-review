import { notFound } from "next/navigation";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import PageViewTracker from "@/components/PageViewTracker";
import ThemeVars from "@/components/ThemeVars";
import PostRenderer from "@/components/PostRenderer";
import { createClient } from "@/lib/supabase/public";
import { getPublishedPosts, getPublishedPostBySlug } from "@/lib/posts";
import { getSiteSettingsSafe, DEFAULT_SITE_SETTINGS } from "@/lib/theme";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

// schema.org Article — separate from generateMetadata's OpenGraph tags
// above: OG controls how a link looks when *shared* (Slack, X, iMessage
// previews), this controls whether Google can understand the page well
// enough to treat it as an article at all (rich results, Discover
// eligibility). Both read from the same `post`/`settings`, but they're
// two different consumers and neither one substitutes for the other.
function articleJsonLd(post, settings) {
  const image = post.og_image_url || post.cover_image_url;
  const url = `${SITE_URL}/article/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title || "Untitled",
    description: post.meta_description || post.dek || undefined,
    image: image ? [image] : undefined,
    datePublished: post.published_at || undefined,
    dateModified: post.updated_at || post.published_at || undefined,
    author: post.author ? { "@type": "Person", name: post.author } : undefined,
    publisher: { "@type": "Organization", name: settings.site_title },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: post.category || undefined,
  };
}

export async function generateStaticParams() {
  try {
    const supabase = await createClient();
    const posts = await getPublishedPosts(supabase);
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const supabase = await createClient();
  const post = await getPublishedPostBySlug(supabase, slug);
  if (!post) return {};

  const description = post.meta_description || post.dek || undefined;
  const image = post.og_image_url || post.cover_image_url || undefined;
  const settings = await getSiteSettingsSafe(supabase);

  return {
    title: `${post.title || "Untitled"} — ${settings.site_title}`,
    description,
    openGraph: { title: post.title, description, images: image ? [image] : undefined },
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const supabase = await createClient();
  const post = await getPublishedPostBySlug(supabase, slug);
  if (!post) notFound();

  let settings = DEFAULT_SITE_SETTINGS;
  try {
    settings = await getSiteSettingsSafe(supabase);
  } catch {
    settings = DEFAULT_SITE_SETTINGS;
  }

  return (
    <main className="bg-paper min-h-screen flex flex-col">
      <ThemeVars />
      <PageViewTracker path={`/article/${post.slug}`} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(post, settings)) }}
      />
      <Masthead />
      <div id="main-content" className="flex-1">
        <PostRenderer post={post} />
      </div>
      <Footer />
    </main>
  );
}
