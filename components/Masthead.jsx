import { createClient } from "@/lib/supabase/public";
import { getSiteSettingsSafe, DEFAULT_SITE_SETTINGS } from "@/lib/theme";
import { getSiteNavLinks } from "@/lib/pages";
import MastheadNav from "./MastheadNav";

// Fetches identity/nav from site_settings (title, tagline, logo, nav
// links — see /admin/site) rather than hardcoding them, so the "Site"
// admin section actually controls what every visitor sees here.
//
// Deliberately plain: no illustration, no accent bar — a centred serif
// wordmark and a centred nav row under a hairline, closer to a
// newspaper's own restrained masthead than a brand mark competing with
// it. Colour lives in the content below (the category-tinted article
// band, the Subscribe button) rather than the masthead itself.
export default async function Masthead() {
  let settings = DEFAULT_SITE_SETTINGS;
  let navLinks = DEFAULT_SITE_SETTINGS.nav_links;
  try {
    const supabase = await createClient();
    settings = await getSiteSettingsSafe(supabase);
    const baseLinks = settings.nav_links?.length ? settings.nav_links : DEFAULT_SITE_SETTINGS.nav_links;
    navLinks = await getSiteNavLinks(supabase, baseLinks);
  } catch {
    settings = DEFAULT_SITE_SETTINGS;
  }

  return (
    <header className="bg-paper">
      <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12">
        <MastheadNav
          logoUrl={settings.logo_url}
          siteTitle={settings.site_title}
          siteTagline={settings.site_tagline}
          links={navLinks}
        />
      </div>
    </header>
  );
}
