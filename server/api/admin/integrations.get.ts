export default defineEventHandler(async (event) => {
  await requireAdmin(event); const config=appConfig(event);
  const failed=(await bindings(event).DB.prepare("SELECT s.id,s.order_id,s.error_message,s.retry_count,o.order_number FROM shipments s JOIN orders o ON o.id=s.order_id WHERE s.error_message IS NOT NULL ORDER BY s.updated_at DESC").all()).results;
  return { configured: { sumopod: Boolean(config.sumopodApiKey), bce: Boolean(config.bceApiUrl && config.bcePartnerKey && config.bceWebhookSecret), r2: Boolean(bindings(event).PRODUCT_IMAGES) }, failed };
});
