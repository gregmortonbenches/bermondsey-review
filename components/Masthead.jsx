import { createClient } from "@/lib/supabase/public";
import { getSiteSettingsSafe, DEFAULT_SITE_SETTINGS } from "@/lib/theme";
import { getSiteNavLinks } from "@/lib/pages";
import MastheadNav from "./MastheadNav";
import HeaderArches from "./HeaderArches";

// Fetches identity/nav from site_settings (title, tagline, logo, nav
// links — see /admin/site) rather than hardcoding them, so the "Site"
// admin section actually controls what every visitor sees here.
//
// The wordmark/nav rows below stay deliberately plain — a centred serif
// wordmark and a centred nav row under a hairline, closer to a
// newspaper's own restrained masthead than a brand mark competing with
// it. The one illustrated flourish is HeaderArches above them: a strip
// of brick viaduct arches (the actual railway out of London Bridge,
// Bermondsey's own landmark) with an occasional train crossing it — kept
// separate from the wordmark row itself rather than folded into it, so
// that restraint holds even though the page as a whole isn't fully
// illustration-free any more.
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
      <HeaderArches />
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
