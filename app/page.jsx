import HomePageBody from "@/components/HomePageBody";
import PageViewTracker from "@/components/PageViewTracker";

export default function HomePage() {
  return (
    <>
      {/* Tracked here, not inside HomePageBody — that component is
          shared with the admin layout-builder's preview, and previews
          shouldn't count as real visits. */}
      <PageViewTracker path="/" />
      <HomePageBody />
    </>
  );
}
