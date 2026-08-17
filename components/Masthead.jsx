import { createClient } from "@/lib/supabase/public";
import { getSiteSettingsSafe, DEFAULT_SITE_SETTINGS } from "@/lib/theme";
import { getSiteNavLinks } from "@/lib/pages";
import MastheadNav from "./MastheadNav";
import Newsletter from "./Newsletter";

// Fetches identity/nav from site_settings (title, logo, nav links — see
// /admin/site) rather than hardcoding them, so the "Identity" admin
// section actually controls what every visitor sees here. The tagline is fetched
// separately, by Newsletter.jsx — see its own comment for where that
// moved and why.
//
// Newsletter (the sign-up drawer MastheadNav's Subscribe button opens)
// mounts here too, once per masthead — see its own comment for why this
// is the right place for it rather than a per-page opt-in like Footer.
//
// The one illustrated flourish — brick viaduct arches, the actual
// railway out of London Bridge through Bermondsey, with an occasional
// train crossing in front of the title — lives inside MastheadNav's own
// wordmark rows now (see components/HeaderArches.jsx), not as a
// separate strip here. That's a change from an earlier version: a full
// extra strip stacked above the wordmark made the whole masthead
// noticeably taller for what was, in the end, a fairly small
// illustration; layering it behind the wordmark instead — an absolutely
// positioned background, so it adds no extra layout height — gets the
// same illustration without the extra height, with the title reading as
// if it's sitting on top of the bridge deck.
export default async function Masthead({ isHomepage = false }) {
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
    <>
      {/* Visually hidden until focused — the first tab stop on every
          page, so keyboard/screen-reader users can jump straight past
          the masthead and nav to the actual content instead of tabbing
          through every nav link first each time. Targets #main-content,
          which every top-level page wrapper sets on its own real
          content div (see e.g. HomePageBody.jsx, ArchiveBody.jsx,
          GeoguesserBody.jsx, and the article/page/crossword/forms
          routes). */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-river focus:text-paper focus:font-sans focus:text-sm focus:font-600 focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <header className="bg-paper">
        {/* No max-w-wide/mx-auto here, unlike the rest of the page —
            the masthead runs full-bleed edge-to-edge on purpose (the
            arch illustration tiles to fill whatever width it's given,
            and MastheadNav's own grid/flex centring already centres the
            wordmark and nav links regardless of the container's actual
            width), while everything below it stays in a boxed
            max-w-wider column. Padding only, so the title/nav text
            still keeps a margin from the literal edge of the screen. */}
        <div className="px-4 sm:px-6 lg:px-12">
          <MastheadNav
            logoUrl={settings.logo_url}
            siteTitle={settings.site_title}
            links={navLinks}
            isHomepage={isHomepage}
          />
        </div>
      </header>
      <Newsletter />
    </>
  );
}
