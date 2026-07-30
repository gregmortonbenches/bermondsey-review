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
 */
export default async function ThemeVars() {
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

  const css = `
    :root {
      --color-brick: ${settings.brick_color};
      --color-river: ${settings.river_color};
      ${settings.display_font !== DEFAULT_SITE_SETTINGS.display_font ? `--font-display: '${settings.display_font}', Georgia, serif;` : ""}
      ${settings.body_font !== DEFAULT_SITE_SETTINGS.body_font ? `--font-body: '${settings.body_font}', Georgia, serif;` : ""}
    }
    ${settings.custom_css || ""}
  `;

  return (
    <>
      {fontsHref && <link rel="stylesheet" href={fontsHref} />}
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {settings.custom_js && (
        // eslint-disable-next-line react/no-danger
        <script dangerouslySetInnerHTML={{ __html: settings.custom_js }} />
      )}
    </>
  );
}
