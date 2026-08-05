import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostById } from "@/lib/posts";
import Masthead from "@/components/Masthead";
import PostRenderer from "@/components/PostRenderer";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const post = await getPostById(supabase, id);
  if (!post) return {};

  const description = post.meta_description || post.dek || undefined;
  const image = post.og_image_url || post.cover_image_url || undefined;

  return {
    title: `${post.title || "Untitled"} — The Worm`,
    description,
    openGraph: { title: post.title, description, images: image ? [image] : undefined },
  };
}

export default async function PreviewFramePage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const post = await getPostById(supabase, id);

  if (!post) notFound();

  return (
    <main className="min-h-screen bg-paper">
      <Masthead />
      <PostRenderer post={post} />
    </main>
  );
}
