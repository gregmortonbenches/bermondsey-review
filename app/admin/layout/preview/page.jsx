import Link from "next/link";
import DevicePreview from "@/components/admin/DevicePreview";

// The main /admin/layout editor is a fixed-width canvas (like the post
// and page editors) — this is where you check it across device sizes,
// same pattern as .../posts/[id]/preview and .../pages/[id]/preview.
export default function LayoutPreviewPage() {
  return (
    <div className="min-h-screen bg-paper">
      <div className="bg-mustard/20 border-b border-mustard/40 text-center py-2 font-sans text-sm text-ink">
        Previewing the homepage across devices.{" "}
        <Link href="/admin/layout" className="underline underline-offset-4 hover:text-brick">
          Back to editing
        </Link>
      </div>
      <DevicePreview src="/admin/layout/preview/frame" />
    </div>
  );
}
