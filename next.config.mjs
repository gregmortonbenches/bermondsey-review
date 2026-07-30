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
};
export default nextConfig;
