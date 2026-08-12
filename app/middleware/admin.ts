export default defineNuxtRouteMiddleware(async (to) => {
  const { session, refresh } = useAppSession();
  await refresh();
  if (!session.value.user || !session.value.isAdmin) return navigateTo(`/admin/login?next=${encodeURIComponent(to.fullPath)}`);
});
