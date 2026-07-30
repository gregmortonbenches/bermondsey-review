import PostForm from "@/components/admin/PostForm";
import ThemeVars from "@/components/ThemeVars";

export default function NewPostPage() {
  return (
    <main className="min-h-screen bg-paper">
      <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 pt-8">
        <h1 className="font-display font-700 text-2xl text-ink">New post</h1>
      </div>
      <PostForm mode="create" themeVars={<ThemeVars scope=".theme-canvas" />} />
    </main>
  );
}
