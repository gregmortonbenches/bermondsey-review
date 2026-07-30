import { createClient } from "@/lib/supabase/server";
import { getPageLayout } from "@/lib/layout";
import { getCurrentUserRole } from "@/lib/profile";
import LayoutEditor from "@/components/admin/LayoutEditor";

export default async function AdminLayoutPage() {
  const supabase = await createClient();
  const role = await getCurrentUserRole(supabase);

  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <p className="font-sans text-sm text-steel">
          The homepage layout affects the whole site, so only admins can change it. Ask an admin
          if you think this should be changed.
        </p>
      </div>
    );
  }

  const sections = await getPageLayout(supabase, "home");

  return <LayoutEditor pageKey="home" initialSections={sections} />;
}
