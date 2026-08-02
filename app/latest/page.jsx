import PageViewTracker from "@/components/PageViewTracker";
import ArchiveBody from "@/components/ArchiveBody";

// Reads ?category= from the URL so the pill filter below is a real link,
// not client-side state — keeps this page a plain server component.
export default async function ArchivePage({ searchParams }) {
  const params = await searchParams;
  const activeCategory = params?.category || "All";

  return (
    <>
      {/* Tracked here, not inside ArchiveBody — that component is shared
          with the admin layout builder's preview, and previews shouldn't
          count as real visits. */}
      <PageViewTracker path="/latest" />
      <ArchiveBody activeCategory={activeCategory} />
    </>
  );
}
