import { notFound } from "next/navigation";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import ThemeVars from "@/components/ThemeVars";
import PageViewTracker from "@/components/PageViewTracker";
import PublicForm from "@/components/PublicForm";
import { createClient } from "@/lib/supabase/public";
import { getPublishedFormBySlug } from "@/lib/forms";

export default async function PublicFormPage({ params }) {
  const { slug } = await params;
  const supabase = await createClient();
  const form = await getPublishedFormBySlug(supabase, slug);
  if (!form) notFound();

  return (
    <main className="bg-paper min-h-screen flex flex-col">
      <ThemeVars />
      <PageViewTracker path={`/forms/${form.slug}`} />
      <Masthead />
      {/* w-full: a direct flex-col child with mx-auto shrink-to-fits its
          content instead of filling the available width without this —
          see the matching comment in components/HomePageBody.jsx. */}
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-12 py-10 flex-1 w-full">
        <h1 className="font-display font-700 text-3xl sm:text-4xl text-ink">{form.title}</h1>
        {form.description && <p className="font-body text-lg text-steel mt-3">{form.description}</p>}
        <div className="mt-8">
          <PublicForm form={form} />
        </div>
      </div>
      <Footer />
    </main>
  );
}
