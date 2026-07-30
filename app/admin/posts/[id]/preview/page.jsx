import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPostById } from "@/lib/posts";
import DevicePreview from "@/components/admin/DevicePreview";

export default async function PreviewPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const post = await getPostById(supabase, id);

  if (!post) notFound();

  return (
    <div className="min-h-screen bg-paper">
      <div className="bg-mustard/20 border-b border-mustard/40 text-center py-2 font-sans text-sm text-ink">
        {post.status === "published" ? "This post is live." : "This is a preview — it isn't published yet."}{" "}
        <Link href={`/admin/posts/${post.id}/edit`} className="underline underline-offset-4 hover:text-brick">
          Back to editing
        </Link>
      </div>
      <DevicePreview src={`/admin/posts/${post.id}/preview/frame`} />
    </div>
  );
}
