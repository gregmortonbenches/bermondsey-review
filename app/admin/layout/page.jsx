import Link from "next/link";
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
        <div className="text-center max-w-sm">
          <h1 className="font-display font-700 text-xl text-ink mb-2">Admins only</h1>
          <p className="font-sans text-sm text-steel mb-4">
            The homepage layout affects the whole site, so only admins can change it. Ask an
            admin if you think this should be changed.
          </p>
          <Link href="/admin" className="font-sans text-sm text-river hover:text-ink underline underline-offset-4">
            ← Back to posts
          </Link>
        </div>
      </div>
    );
  }

  const sections = await getPageLayout(supabase, "home");

  return (
    <div className="min-h-screen bg-paper">
      <div className="border-b border-steel/20 px-5 py-3 flex items-center gap-4">
        <Link href="/admin" className="font-sans text-sm text-steel hover:text-ink">
          ← Back to posts
        </Link>
      </div>
      <LayoutEditor pageKey="home" initialSections={sections} />
    </div>
  );
}
