import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/profile";
import { getPageById } from "@/lib/pages";
import PageForm from "@/components/admin/PageForm";
import ThemeVars from "@/components/ThemeVars";

export default async function EditPagePage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const role = await getCurrentUserRole(supabase);

  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <p className="font-sans text-sm text-steel">
          Pages are a site-structure concern, so only admins can edit them.
        </p>
      </div>
    );
  }

  const page = await getPageById(supabase, id);
  if (!page) notFound();

  return (
    <main className="min-h-screen bg-paper">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-12 pt-8">
        <h1 className="font-display font-700 text-2xl text-ink">Edit page</h1>
      </div>
      <PageForm initialPage={page} themeVars={<ThemeVars scope=".theme-canvas" />} />
    </main>
  );
}
