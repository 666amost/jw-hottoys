export function parseAdminMode(argv) {
  const values = new Set(argv);
  const local = values.has("local") || values.has("--local");
  const remote = values.has("remote") || values.has("--remote");
  if (local === remote) return null;
  return { mode: local ? "local" : "remote", fallback: values.has("--fallback") };
}

const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;

export function createAdminSql({ email, name, passwordHash, now, userId, accountId }) {
  const nowIso = new Date(now).toISOString();
  return `PRAGMA foreign_keys=ON;
INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt)
VALUES(${quote(userId)},${quote(name)},${quote(email)},1,${quote(nowIso)},${quote(nowIso)})
ON CONFLICT(email) DO UPDATE SET name=excluded.name,emailVerified=1,updatedAt=excluded.updatedAt;
INSERT INTO account(id,accountId,providerId,userId,password,createdAt,updatedAt)
VALUES(${quote(accountId)},(SELECT id FROM user WHERE email=${quote(email)}),'credential',(SELECT id FROM user WHERE email=${quote(email)}),${quote(passwordHash)},${quote(nowIso)},${quote(nowIso)})
ON CONFLICT(providerId,accountId) DO UPDATE SET password=excluded.password,updatedAt=excluded.updatedAt;
INSERT INTO admin_roles(user_id,role,created_at)
VALUES((SELECT id FROM user WHERE email=${quote(email)}),'owner',${quote(nowIso)})
ON CONFLICT(user_id) DO UPDATE SET role='owner';
`;
}
