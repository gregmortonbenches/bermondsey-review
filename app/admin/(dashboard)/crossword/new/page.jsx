import CrosswordForm from "@/components/admin/CrosswordForm";

export default function NewCrosswordPage() {
  return (
    <main className="min-h-screen bg-paper">
      <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 pt-8">
        <h1 className="font-display font-700 text-2xl text-ink">New puzzle</h1>
      </div>
      <CrosswordForm mode="create" />
    </main>
  );
}
