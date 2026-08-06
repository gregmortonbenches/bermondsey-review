import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCrosswordById } from "@/lib/crossword";
import CrosswordForm from "@/components/admin/CrosswordForm";

export default async function EditCrosswordPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const crossword = await getCrosswordById(supabase, id);
  if (!crossword) notFound();

  return (
    <main className="min-h-screen bg-paper">
      <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 pt-8">
        <h1 className="font-display font-700 text-2xl text-ink">Edit puzzle</h1>
      </div>
      <CrosswordForm mode="edit" initialCrossword={crossword} />
    </main>
  );
}
