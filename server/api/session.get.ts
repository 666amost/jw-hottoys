export default defineEventHandler(async (event) => {
  const session = await getAppSession(event);
  if (!session?.user) return { user: null, isAdmin: false };
  const role = await bindings(event).DB.prepare("SELECT role FROM admin_roles WHERE user_id=?").bind(session.user.id).first<{ role: string }>();
  return { user: session.user, isAdmin: Boolean(role), role: role?.role ?? null };
});
