import { notFound } from "next/navigation";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import Newsletter from "@/components/Newsletter";
import PageViewTracker from "@/components/PageViewTracker";
import ThemeVars from "@/components/ThemeVars";
import PostRenderer from "@/components/PostRenderer";
import { createClient } from "@/lib/supabase/server";
import { getPublishedPosts, getPublishedPostBySlug } from "@/lib/posts";
import { getSiteSettingsSafe } from "@/lib/theme";

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

  return (
    <main className="bg-paper min-h-screen flex flex-col">
      <ThemeVars />
      <PageViewTracker path={`/article/${post.slug}`} />
      <Masthead />
      <div className="flex-1">
        <PostRenderer post={post} />
      </div>
      <Newsletter />
      <Footer />
    </main>
  );
}
