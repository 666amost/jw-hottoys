export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  return { products: await getProducts(bindings(event).DB, true), categories: await getCategories(bindings(event).DB) };
});
