export function useAppSession() {
  const session = useState<{ user: null | { id: string; name: string; email: string; image?: string | null }; isAdmin: boolean; role?: string | null }>("app-session", () => ({ user: null, isAdmin: false }));
  const loaded = useState("app-session-loaded", () => false);
  async function refresh() {
    // During SSR, useRequestFetch keeps the parent H3 event context attached to
    // the internal request. Cloudflare bindings (notably D1's `DB`) and the
    // OAuth session cookie would otherwise be lost by a plain global $fetch.
    session.value = await useRequestFetch()("/api/session");
    loaded.value = true;
    return session.value;
  }
  return { session, loaded, refresh };
}
