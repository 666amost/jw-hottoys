import { betterAuth } from "better-auth";
import type { H3Event } from "h3";

export function createAuth(event: H3Event) {
  const env = bindings(event);
  const config = appConfig(event);
  return betterAuth({
    database: env.DB,
    secret: config.betterAuthSecret,
    baseURL: config.siteUrl,
    emailAndPassword: { enabled: true, disableSignUp: true },
    socialProviders: config.googleClientId && config.googleClientSecret
      ? { google: { clientId: config.googleClientId, clientSecret: config.googleClientSecret } }
      : {},
    trustedOrigins: [config.siteUrl],
  });
}

export async function getAppSession(event: H3Event) {
  return createAuth(event).api.getSession({ headers: event.headers });
}

export async function requireUser(event: H3Event) {
  const session = await getAppSession(event);
  if (!session?.user) apiError(401, "AUTH_REQUIRED", "Silakan masuk untuk melanjutkan.");
  return session;
}

export async function requireAdmin(event: H3Event) {
  const session = await requireUser(event);
  const role = await bindings(event).DB.prepare("SELECT role FROM admin_roles WHERE user_id = ?")
    .bind(session.user.id).first<{ role: "owner" | "admin" }>();
  if (!role) apiError(403, "ADMIN_REQUIRED", "Akses admin diperlukan.");
  return { ...session, role: role.role };
}
