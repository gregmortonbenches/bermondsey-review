import HomePageBody from "@/components/HomePageBody";
import PageViewTracker from "@/components/PageViewTracker";
import { createClient } from "@/lib/supabase/public";
import { getSiteSettingsSafe, DEFAULT_SITE_SETTINGS } from "@/lib/theme";

// The root layout's own `metadata` export is a static, generic
// fallback — this overrides it with the actual live site_title/tagline
// (admin-editable via /admin/site), so the homepage's own title/
// description in search results and social shares reflects what's
// really configured rather than a hardcoded default that could drift
// out of sync with it.
export async function generateMetadata() {
  let settings = DEFAULT_SITE_SETTINGS;
  try {
    const supabase = await createClient();
    settings = await getSiteSettingsSafe(supabase);
  } catch {
    settings = DEFAULT_SITE_SETTINGS;
  }
  return {
    title: settings.site_title,
    description: settings.site_tagline || undefined,
  };
}

export default function HomePage() {
  return (
    <>
      {/* Tracked here, not inside HomePageBody — that component is
          shared with the admin layout-builder's preview, and previews
          shouldn't count as real visits. */}
      <PageViewTracker path="/" />
      <HomePageBody />
    </>
  );
}
