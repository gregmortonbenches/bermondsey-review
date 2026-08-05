import PageViewTracker from "@/components/PageViewTracker";
import GeoguesserBody from "@/components/GeoguesserBody";

export const metadata = {
  title: "Bermy on the Map, SE1 — Bermy Review",
};

export default function GeoGuesserPage() {
  return (
    <>
      {/* Tracked here, not inside GeoguesserBody — that component is
          shared with the admin layout builder's preview, and previews
          shouldn't count as real visits. */}
      <PageViewTracker path="/geoguesser" />
      <GeoguesserBody />
    </>
  );
}
