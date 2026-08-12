export default defineNuxtRouteMiddleware(async (to) => {
  const { session, loaded, refresh } = useAppSession();
  if (!loaded.value) await refresh();
  if (!session.value.user) return navigateTo(`/login?next=${encodeURIComponent(to.fullPath)}`);
});
