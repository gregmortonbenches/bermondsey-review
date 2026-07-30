import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostById } from "@/lib/posts";
import PostForm from "@/components/admin/PostForm";

export default async function EditPostPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const post = await getPostById(supabase, id);

  if (!post) notFound();

  return (
    <main className="min-h-screen bg-paper">
      <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 pt-8">
        <h1 className="font-display font-700 text-2xl text-ink">Edit post</h1>
      </div>
      <PostForm mode="edit" initialPost={post} />
    </main>
  );
}
