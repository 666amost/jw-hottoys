"use client";

import { GoogleLogo } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function GoogleLoginButton({ next = "/account" }: { next?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login() {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
    } catch {
      setError("Login belum dapat dimulai. Periksa konfigurasi Google Auth.");
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={login} disabled={loading} size="lg" className="w-full">
        <GoogleLogo size={21} weight="bold" />
        {loading ? "Mengarahkan ke Google..." : "Lanjutkan dengan Google"}
      </Button>
      {error && <p className="mt-3 text-center text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}

