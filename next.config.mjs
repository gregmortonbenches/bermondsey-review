/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Supabase Storage public URLs look like
    // https://<project-ref>.supabase.co/storage/v1/object/public/media/...
    // — this lets next/image fetch, resize, and serve them as
    // compressed, responsive, lazy-loaded images instead of raw
    // uploads, without needing any separate image service.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // /archive was the page's URL before it was renamed to /latest — a
  // permanent redirect here (checked at the edge, no DB round-trip)
  // keeps any old bookmarks/search results/external links working,
  // unlike the admin's own /admin/redirects feature, which is scoped
  // deliberately to /article/* only (see proxy.js).
  async redirects() {
    return [{ source: "/archive", destination: "/latest", permanent: true }];
  },
};
export default nextConfig;
