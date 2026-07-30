import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/profile";
import AdminShell from "@/components/admin/AdminShell";

// Wraps every admin dashboard page (post/page/form lists and editors,
// media, analytics, redirects, design, site, homepage layout) in a
// persistent sidebar — deliberately NOT applied to /admin/login or any
// */preview/frame route, both of which live outside this route group
// (see app/admin/login and app/admin/posts/[id]/preview, for example) so
// neither the sign-in screen nor an iframe rendering the public site ever
// picks up admin chrome.
export default async function AdminDashboardLayout({ children }) {
  const supabase = await createClient();
  const role = await getCurrentUserRole(supabase);

  return <AdminShell role={role}>{children}</AdminShell>;
}
