import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/profile";
import RedirectsManager from "@/components/admin/RedirectsManager";

export default async function AdminRedirectsPage() {
  const supabase = await createClient();
  const role = await getCurrentUserRole(supabase);

  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <p className="font-sans text-sm text-steel">
          Redirects affect the whole site's URLs, so only admins can manage them.
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-paper">
      <RedirectsManager />
    </main>
  );
}
