"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Editor accounts are created manually in the Supabase dashboard
// (Authentication → Users → Add user) — there's no public sign-up
// here on purpose, since this is a small trusted team, not an
// open platform.
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-paper flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm border border-steel/25 rounded-sm p-8"
      >
        <h1 className="font-display font-700 text-2xl text-ink mb-1">The Worm</h1>
        <p className="font-sans text-sm text-steel mb-6">Sign in to edit and publish.</p>

        {error && (
          <p className="font-sans text-sm text-brick bg-brick/[0.08] rounded-sm px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-1">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full font-sans text-sm border border-steel/30 rounded-sm px-3 py-2 mb-4 focus-visible:outline-2 focus-visible:outline-river"
        />

        <label className="block font-sans text-xs uppercase tracking-[0.1em] text-steel mb-1">
          Password
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full font-sans text-sm border border-steel/30 rounded-sm px-3 py-2 mb-6 focus-visible:outline-2 focus-visible:outline-river"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full font-sans text-sm font-600 bg-river text-paper px-4 py-2.5 rounded-sm hover:bg-ink transition-colors disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
