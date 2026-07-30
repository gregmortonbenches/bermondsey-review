import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFormById } from "@/lib/forms";
import FormBuilder from "@/components/admin/FormBuilder";

export default async function EditFormPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const form = await getFormById(supabase, id);
  if (!form) notFound();

  return (
    <main className="min-h-screen bg-paper">
      <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 pt-8">
        <h1 className="font-display font-700 text-2xl text-ink">Edit form</h1>
      </div>
      <FormBuilder mode="edit" initialForm={form} />
    </main>
  );
}
