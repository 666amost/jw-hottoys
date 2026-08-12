export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, "path");
  if (!key || key.includes("..")) apiError(400, "INVALID_PATH", "Path aset tidak valid.");
  const bucket = bindings(event).PRODUCT_IMAGES;
  if (!bucket) apiError(503, "R2_UNAVAILABLE", "Binding R2 belum tersedia.");
  const object = await bucket.get(key);
  if (!object) apiError(404, "ASSET_NOT_FOUND", "Aset tidak ditemukan.");
  setHeader(event, "Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
  setHeader(event, "Cache-Control", object.httpMetadata?.cacheControl || "public, max-age=31536000, immutable");
  setHeader(event, "ETag", object.httpEtag);
  return object.body;
});
