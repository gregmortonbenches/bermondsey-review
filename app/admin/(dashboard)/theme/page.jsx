import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/profile";
import { getSiteSettings } from "@/lib/theme";
import ThemeEditor from "@/components/admin/ThemeEditor";

export default async function AdminThemePage() {
  const supabase = await createClient();
  const role = await getCurrentUserRole(supabase);

  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <p className="font-sans text-sm text-steel">
          The site's design affects every visitor, so only admins can change it.
        </p>
      </div>
    );
  }

  const settings = await getSiteSettings(supabase);

  return <ThemeEditor initialSettings={settings} />;
}
