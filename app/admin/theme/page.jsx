import Link from "next/link";
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
        <div className="text-center max-w-sm">
          <h1 className="font-display font-700 text-xl text-ink mb-2">Admins only</h1>
          <p className="font-sans text-sm text-steel mb-4">
            The site's design affects every visitor, so only admins can change it.
          </p>
          <Link href="/admin" className="font-sans text-sm text-river hover:text-ink underline underline-offset-4">
            ← Back to posts
          </Link>
        </div>
      </div>
    );
  }

  const settings = await getSiteSettings(supabase);

  return (
    <div className="min-h-screen bg-paper">
      <div className="border-b border-steel/20 px-5 py-3">
        <Link href="/admin" className="font-sans text-sm text-steel hover:text-ink">
          ← Back to posts
        </Link>
      </div>
      <ThemeEditor initialSettings={settings} />
    </div>
  );
}
