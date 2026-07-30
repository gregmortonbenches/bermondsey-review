import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/profile";
import { getSiteSettings } from "@/lib/theme";
import SiteSettingsEditor from "@/components/admin/SiteSettingsEditor";

export default async function AdminSitePage() {
  const supabase = await createClient();
  const role = await getCurrentUserRole(supabase);

  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <p className="font-sans text-sm text-steel">
          Site identity and navigation affect every visitor, so only admins can change them.
        </p>
      </div>
    );
  }

  const settings = await getSiteSettings(supabase);

  return <SiteSettingsEditor initialSettings={settings} />;
}
