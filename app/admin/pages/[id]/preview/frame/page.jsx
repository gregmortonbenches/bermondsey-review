import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPageById } from "@/lib/pages";
import { getSiteSettingsSafe } from "@/lib/theme";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import PageRenderer from "@/components/PageRenderer";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const page = await getPageById(supabase, id);
  if (!page) return {};

  const settings = await getSiteSettingsSafe(supabase);
  return {
    title: `${page.title || "Untitled"} — ${settings.site_title}`,
    description: page.meta_description || undefined,
    openGraph: { title: page.title, images: page.og_image_url ? [page.og_image_url] : undefined },
  };
}

export default async function PagePreviewFramePage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const page = await getPageById(supabase, id);

  if (!page) notFound();

  return (
    <main className="min-h-screen bg-paper flex flex-col">
      <Masthead />
      <div className="flex-1">
        <PageRenderer page={page} />
      </div>
      <Footer />
    </main>
  );
}
