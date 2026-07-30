import FormBuilder from "@/components/admin/FormBuilder";

export default function NewFormPage() {
  return (
    <main className="min-h-screen bg-paper">
      <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 pt-8">
        <h1 className="font-display font-700 text-2xl text-ink">New form</h1>
      </div>
      <FormBuilder mode="create" />
    </main>
  );
}
