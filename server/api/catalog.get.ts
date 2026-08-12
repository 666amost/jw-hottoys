export default defineEventHandler(async (event) => ({
  products: await getProducts(bindings(event).DB),
  categories: await getCategories(bindings(event).DB),
}));
