/* Makes try-standalone.html: try.html with the component inlined.
 *
 * try.html loads the component as `<script type="module" src="...">`, and a
 * module served from file:// is blocked by CORS — origin "null" can't fetch a
 * sibling file. So double-clicking try.html gets you the no-JS fallback and no
 * rack, which is exactly the thing it promises to do. Inlining the module
 * sidesteps the fetch entirely, and the result genuinely opens from a desktop.
 *
 *   node build-try.mjs
 *
 * Re-run it after changing spinner-rack.js, or the standalone goes stale.
 */
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const html = fs.readFileSync(path.join(here, 'try.html'), 'utf8');
const js = fs.readFileSync(path.join(here, 'spinner-rack.js'), 'utf8');

const tag = '<script type="module" src="spinner-rack.js"></script>';
if (!html.includes(tag)) throw new Error('try.html no longer loads the component the expected way');

const out = html.replace(
  tag,
  '<!-- spinner-rack.js, inlined so this file works opened from disk -->\n' +
    '<script type="module">\n' + js.split('</script').join('<\\/script') + '\n</script>'
);

const dest = path.join(here, 'try-standalone.html');
fs.writeFileSync(dest, out);
console.log(`try-standalone.html — ${(Buffer.byteLength(out) / 1024).toFixed(0)}KB`);
