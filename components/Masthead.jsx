import { createClient } from "@/lib/supabase/server";
import { getSiteSettingsSafe, DEFAULT_SITE_SETTINGS } from "@/lib/theme";
import { getSiteNavLinks } from "@/lib/pages";
import MastheadNav from "./MastheadNav";

/**
 * Hand-drawn-style skyline strip: crane, warehouse chimneys, the Shard,
 * and a river wave — inked in the site's blue, since this mark identifies
 * the whole paper, not any one piece of content. The solid brick bar
 * directly beneath it is the wharf line: the one place brown and blue
 * meet edge-to-edge, on every page.
 */
function SkylineStrip() {
  return (
    <svg
      viewBox="0 0 1200 90"
      preserveAspectRatio="none"
      className="w-full h-[52px] sm:h-[70px] text-river"
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* river wave baseline */}
        <path d="M0 80 Q 30 72 60 80 T 120 80 T 180 80 T 240 80 T 300 80 T 360 80 T 420 80 T 480 80 T 540 80 T 600 80 T 660 80 T 720 80 T 780 80 T 840 80 T 900 80 T 960 80 T 1020 80 T 1080 80 T 1140 80 T 1200 80" />

        {/* warehouse block, left */}
        <rect x="40" y="40" width="70" height="40" />
        <path d="M40 40 L75 20 L110 40" />
        <rect x="60" y="55" width="14" height="18" />
        <rect x="82" y="55" width="14" height="18" />

        {/* crane */}
        <line x1="180" y1="80" x2="180" y2="20" />
        <line x1="180" y1="20" x2="240" y2="20" />
        <line x1="180" y1="30" x2="205" y2="20" />
        <line x1="230" y1="20" x2="230" y2="35" />

        {/* row of chimneys */}
        <rect x="290" y="50" width="10" height="30" />
        <rect x="308" y="42" width="10" height="38" />
        <rect x="326" y="55" width="10" height="25" />

        {/* the Shard, right of centre */}
        <path d="M560 80 L595 12 L630 80 Z" />
        <line x1="580" y1="80" x2="580" y2="35" />
        <line x1="610" y1="80" x2="610" y2="35" />

        {/* second small crane, right side */}
        <line x1="820" y1="80" x2="820" y2="25" />
        <line x1="820" y1="25" x2="870" y2="25" />
        <line x1="855" y1="25" x2="855" y2="45" />

        {/* terraced roofline, far right */}
        <path d="M950 80 L950 55 L970 55 L970 45 L990 45 L990 55 L1010 55 L1010 80" />
        <path d="M1030 80 L1030 60 L1050 60 L1050 80" />
      </g>
    </svg>
  );
}

// Fetches identity/nav from site_settings (title, tagline, logo, nav
// links — see /admin/site) rather than hardcoding them, so the "Site"
// admin section actually controls what every visitor sees here.
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
      <SkylineStrip />
      <div className="h-[5px] bg-brick" aria-hidden="true" />
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
