import PageViewTracker from "@/components/PageViewTracker";
import SubmissionsBody from "@/components/SubmissionsBody";
import { createClient } from "@/lib/supabase/public";
import { getSiteSettingsSafe, DEFAULT_SITE_SETTINGS } from "@/lib/theme";

export async function generateMetadata() {
  let settings = DEFAULT_SITE_SETTINGS;
  try {
    const supabase = await createClient();
    settings = await getSiteSettingsSafe(supabase);
  } catch {
    settings = DEFAULT_SITE_SETTINGS;
  }
  const copy = settings.page_copy?.submissions || DEFAULT_SITE_SETTINGS.page_copy.submissions;
  return {
    title: `${copy.title} — ${settings.site_title}`,
    description: copy.description,
  };
}

export default function SubmissionsPage() {
  return (
    <>
      <PageViewTracker path="/submissions" />
      <SubmissionsBody />
    </>
  );
}
