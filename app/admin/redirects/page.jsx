import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/profile";
import RedirectsManager from "@/components/admin/RedirectsManager";

export default async function AdminRedirectsPage() {
  const supabase = await createClient();
  const role = await getCurrentUserRole(supabase);

  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h1 className="font-display font-700 text-xl text-ink mb-2">Admins only</h1>
          <p className="font-sans text-sm text-steel mb-4">
            Redirects affect the whole site's URLs, so only admins can manage them.
          </p>
          <Link href="/admin" className="font-sans text-sm text-river hover:text-ink underline underline-offset-4">
            ← Back to posts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-paper">
      <div className="border-b border-steel/20 px-5 py-3">
        <Link href="/admin" className="font-sans text-sm text-steel hover:text-ink">
          ← Back to posts
        </Link>
      </div>
      <RedirectsManager />
    </main>
  );
}
