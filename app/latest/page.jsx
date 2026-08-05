import PageViewTracker from "@/components/PageViewTracker";
import ArchiveBody from "@/components/ArchiveBody";
import { createClient } from "@/lib/supabase/public";
import { getSiteSettingsSafe, DEFAULT_SITE_SETTINGS } from "@/lib/theme";

// Reflects the actual page_copy.archive title/description ArchiveBody
// itself renders (admin-editable via /admin/layout) — the same reasoning
// as the homepage's own generateMetadata in app/page.jsx.
export async function generateMetadata() {
  let settings = DEFAULT_SITE_SETTINGS;
  try {
    const supabase = await createClient();
    settings = await getSiteSettingsSafe(supabase);
  } catch {
    settings = DEFAULT_SITE_SETTINGS;
  }
  const copy = settings.page_copy?.archive || DEFAULT_SITE_SETTINGS.page_copy.archive;
  return {
    title: `${copy.title} — ${settings.site_title}`,
    description: copy.description || undefined,
  };
}

// Reads ?category= from the URL so the pill filter below is a real link,
// not client-side state — keeps this page a plain server component.
export default async function ArchivePage({ searchParams }) {
  const params = await searchParams;
  const activeCategory = params?.category || "All";

  return (
    <>
      {/* Tracked here, not inside ArchiveBody — that component is shared
          with the admin layout builder's preview, and previews shouldn't
          count as real visits. */}
      <PageViewTracker path="/latest" />
      <ArchiveBody activeCategory={activeCategory} />
    </>
  );
}
