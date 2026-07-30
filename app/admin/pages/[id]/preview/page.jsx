import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPageById } from "@/lib/pages";
import DevicePreview from "@/components/admin/DevicePreview";

export default async function PagePreviewPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const page = await getPageById(supabase, id);

  if (!page) notFound();

  return (
    <div className="min-h-screen bg-paper">
      <div className="bg-mustard/20 border-b border-mustard/40 text-center py-2 font-sans text-sm text-ink">
        {page.published ? "This page is live." : "This is a preview — it isn't published yet."}{" "}
        <Link href={`/admin/pages/${page.id}/edit`} className="underline underline-offset-4 hover:text-brick">
          Back to editing
        </Link>
      </div>
      <DevicePreview src={`/admin/pages/${page.id}/preview/frame`} />
    </div>
  );
}
