export function useAppSession() {
  const session = useState<{ user: null | { id: string; name: string; email: string; image?: string | null }; isAdmin: boolean; role?: string | null }>("app-session", () => ({ user: null, isAdmin: false }));
  const loaded = useState("app-session-loaded", () => false);
  async function refresh() {
    session.value = await $fetch("/api/session");
    loaded.value = true;
    return session.value;
  }
  return { session, loaded, refresh };
}
