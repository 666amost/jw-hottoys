"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function EmailLoginForm({ next = "/account" }: { next?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;

      const { data: isAdmin } = await supabase.rpc("is_admin");
      const destination = next === "/account" && isAdmin ? "/admin" : next;
      router.replace(destination);
      router.refresh();
    } catch {
      setError("Email atau password tidak cocok.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={login} className="space-y-4">
      <label className="field-label">
        Email
        <input
          className="field"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </label>
      <label className="field-label">
        Password
        <input
          className="field"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <Button type="submit" disabled={loading} size="lg" className="w-full">
        {loading ? "Memeriksa akun..." : "Masuk dengan email"}
      </Button>
      {error && <p className="text-center text-xs font-semibold text-red-600">{error}</p>}
    </form>
  );
}
