export default defineEventHandler(async (event) => {
  assertSafeMutation(event);
  const session = await requireUser(event);
  const result = await bindings(event).DB.prepare("DELETE FROM addresses WHERE id=? AND user_id=?")
    .bind(getRouterParam(event, "id"), session.user.id).run();
  if (!result.meta.changes) apiError(404, "ADDRESS_NOT_FOUND", "Alamat tidak ditemukan.");
  return { deleted: true };
});
