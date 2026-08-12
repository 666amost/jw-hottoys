export default defineEventHandler(async (event) => {
  const session = await requireUser(event);
  const { results } = await bindings(event).DB.prepare("SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC,created_at DESC")
    .bind(session.user.id).all();
  return { addresses: results };
});
