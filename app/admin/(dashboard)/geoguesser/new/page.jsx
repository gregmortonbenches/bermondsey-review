import GeoguesserRoundForm from "@/components/admin/GeoguesserRoundForm";

export default function NewGeoguesserRoundPage() {
  return (
    <main className="min-h-screen bg-paper">
      <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 pt-8">
        <h1 className="font-display font-700 text-2xl text-ink">New round</h1>
      </div>
      <GeoguesserRoundForm mode="create" />
    </main>
  );
}
