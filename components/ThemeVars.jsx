import { createClient } from "@/lib/supabase/server";
import { getSiteSettingsSafe, DEFAULT_SITE_SETTINGS } from "@/lib/theme";

/**
 * Renders a <style> tag setting --color-brick/--color-river (and
 * --font-display/--font-body, only when they differ from the default —
 * see tailwind.config.js for the fallback chain), loads Google Fonts
 * for any non-default font choice, appends any custom CSS, and injects
 * any custom JS.
 *
 * Deliberately used only inside public-facing pages (HomePageBody,
 * archive, article, etc.) — never inside /admin's own dashboard pages,
 * which should stay on the fixed default design system regardless of
 * how the public site is themed. See each public page for where this
 * is included.
 *
 * Custom CSS/JS here come from site_settings, editable only by admins
 * (enforced by RLS) — but it still executes directly in every visitor's
 * browser. Treat it like editing the codebase, not like writing a post.
 *
 * `scope`: pass a CSS selector (e.g. ".theme-canvas") to scope the colour
 * and font variables to that selector instead of :root, and skip
 * custom_css/custom_js entirely. This is what the post/page/homepage
 * canvases use — they're inside /admin, but unlike the rest of the
 * dashboard they're meant to be a true mirror of the live page, so they
 * need real accent colours and fonts. :root would leak those into the
 * surrounding admin chrome too (the sidebar's active-link colour, say),
 * which is exactly what "stay on the fixed default design system" rules
 * out — and custom_css/custom_js are arbitrary code written assuming
 * they're running on the actual public site (a `body { ... }` rule, a
 * script querying the real masthead's markup), not safely scopable to a
 * sub-tree of the admin UI, so they're left out of this mode rather than
 * risk them doing something to the dashboard around the canvas.
 */
export default async function ThemeVars({ scope } = {}) {
  let settings = DEFAULT_SITE_SETTINGS;
  try {
    const supabase = await createClient();
    settings = await getSiteSettingsSafe(supabase);
  } catch {
    return null; // Supabase not configured at all — just use the coded-in defaults
  }

  const nonDefaultFonts = [
    settings.display_font !== DEFAULT_SITE_SETTINGS.display_font ? settings.display_font : null,
    settings.body_font !== DEFAULT_SITE_SETTINGS.body_font ? settings.body_font : null,
  ].filter(Boolean);

  const fontsHref = nonDefaultFonts.length
    ? `https://fonts.googleapis.com/css2?${nonDefaultFonts
        .map((f) => `family=${encodeURIComponent(f)}:wght@400;600;700`)
        .join("&")}&display=swap`
    : null;

  const selector = scope || ":root";
  const css = `
    ${selector} {
      --color-brick: ${settings.brick_color};
      --color-river: ${settings.river_color};
      ${settings.display_font !== DEFAULT_SITE_SETTINGS.display_font ? `--font-display: '${settings.display_font}', Georgia, serif;` : ""}
      ${settings.body_font !== DEFAULT_SITE_SETTINGS.body_font ? `--font-body: '${settings.body_font}', Georgia, serif;` : ""}
    }
    ${scope ? "" : settings.custom_css || ""}
  `;

  return (
    <>
      {fontsHref && <link rel="stylesheet" href={fontsHref} />}
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {!scope && settings.custom_js && (
        // eslint-disable-next-line react/no-danger
        <script dangerouslySetInnerHTML={{ __html: settings.custom_js }} />
      )}
    </>
  );
}
