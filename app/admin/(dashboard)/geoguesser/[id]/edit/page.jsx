import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRoundById } from "@/lib/geoguesser";
import GeoguesserRoundForm from "@/components/admin/GeoguesserRoundForm";

export default async function EditGeoguesserRoundPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const round = await getRoundById(supabase, id);
  if (!round) notFound();

  return (
    <main className="min-h-screen bg-paper">
      <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 pt-8">
        <h1 className="font-display font-700 text-2xl text-ink">Edit round</h1>
      </div>
      <GeoguesserRoundForm mode="edit" initialRound={round} />
    </main>
  );
}
