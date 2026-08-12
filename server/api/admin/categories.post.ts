import { z } from "zod";
const schema = z.object({ name: z.string().trim().min(2).max(100), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().max(500).optional().default("") });
export default defineEventHandler(async (event) => {
  assertSafeMutation(event); await requireAdmin(event);
  const parsed = schema.safeParse(await readLimitedBody(event));
  if (!parsed.success) apiError(422, "VALIDATION_ERROR", "Kategori tidak valid.");
  const id = crypto.randomUUID();
  try {
    await bindings(event).DB.prepare("INSERT INTO categories(id,name,slug,description,created_at) VALUES(?,?,?,?,datetime('now'))").bind(id, parsed.data.name, parsed.data.slug, parsed.data.description).run();
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) apiError(409, "CATEGORY_EXISTS", "Slug kategori sudah digunakan.");
    throw error;
  }
  return { id };
});
