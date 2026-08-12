export default defineEventHandler(async (event) => {
  const now = new Date().toISOString();
  const { results } = await bindings(event).DB.prepare(`SELECT id,label,message,href FROM site_announcements
    WHERE active=1 AND (starts_at IS NULL OR starts_at<=?) AND (ends_at IS NULL OR ends_at>?) ORDER BY sort_order,created_at`)
    .bind(now, now).all();
  return { announcements: results };
});
