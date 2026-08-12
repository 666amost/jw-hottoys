-- Better Auth's SQLite/D1 adapter serializes Date values as ISO-8601 TEXT.
-- Rebuild the four auth tables with matching affinities while preserving data.
-- D1 keeps foreign keys enabled, so dependent rows affected by CASCADE are
-- backed up and restored within the same deferred transaction.
PRAGMA defer_foreign_keys = ON;

CREATE TABLE _auth_user_backup AS
SELECT id, name, email, emailVerified, image,
  CASE WHEN typeof(createdAt) IN ('integer', 'real')
    THEN strftime('%Y-%m-%dT%H:%M:%fZ', createdAt / 1000.0, 'unixepoch')
    ELSE CAST(createdAt AS TEXT) END AS createdAt,
  CASE WHEN typeof(updatedAt) IN ('integer', 'real')
    THEN strftime('%Y-%m-%dT%H:%M:%fZ', updatedAt / 1000.0, 'unixepoch')
    ELSE CAST(updatedAt AS TEXT) END AS updatedAt
FROM user;

CREATE TABLE _auth_session_backup AS
SELECT id,
  CASE WHEN typeof(expiresAt) IN ('integer', 'real')
    THEN strftime('%Y-%m-%dT%H:%M:%fZ', expiresAt / 1000.0, 'unixepoch')
    ELSE CAST(expiresAt AS TEXT) END AS expiresAt,
  token,
  CASE WHEN typeof(createdAt) IN ('integer', 'real')
    THEN strftime('%Y-%m-%dT%H:%M:%fZ', createdAt / 1000.0, 'unixepoch')
    ELSE CAST(createdAt AS TEXT) END AS createdAt,
  CASE WHEN typeof(updatedAt) IN ('integer', 'real')
    THEN strftime('%Y-%m-%dT%H:%M:%fZ', updatedAt / 1000.0, 'unixepoch')
    ELSE CAST(updatedAt AS TEXT) END AS updatedAt,
  ipAddress, userAgent, userId
FROM session;

CREATE TABLE _auth_account_backup AS
SELECT id, accountId, providerId, userId, accessToken, refreshToken, idToken,
  CASE WHEN accessTokenExpiresAt IS NULL THEN NULL
    WHEN typeof(accessTokenExpiresAt) IN ('integer', 'real')
      THEN strftime('%Y-%m-%dT%H:%M:%fZ', accessTokenExpiresAt / 1000.0, 'unixepoch')
    ELSE CAST(accessTokenExpiresAt AS TEXT) END AS accessTokenExpiresAt,
  CASE WHEN refreshTokenExpiresAt IS NULL THEN NULL
    WHEN typeof(refreshTokenExpiresAt) IN ('integer', 'real')
      THEN strftime('%Y-%m-%dT%H:%M:%fZ', refreshTokenExpiresAt / 1000.0, 'unixepoch')
    ELSE CAST(refreshTokenExpiresAt AS TEXT) END AS refreshTokenExpiresAt,
  scope, password,
  CASE WHEN typeof(createdAt) IN ('integer', 'real')
    THEN strftime('%Y-%m-%dT%H:%M:%fZ', createdAt / 1000.0, 'unixepoch')
    ELSE CAST(createdAt AS TEXT) END AS createdAt,
  CASE WHEN typeof(updatedAt) IN ('integer', 'real')
    THEN strftime('%Y-%m-%dT%H:%M:%fZ', updatedAt / 1000.0, 'unixepoch')
    ELSE CAST(updatedAt AS TEXT) END AS updatedAt
FROM account;

CREATE TABLE _auth_verification_backup AS
SELECT id, identifier, value,
  CASE WHEN typeof(expiresAt) IN ('integer', 'real')
    THEN strftime('%Y-%m-%dT%H:%M:%fZ', expiresAt / 1000.0, 'unixepoch')
    ELSE CAST(expiresAt AS TEXT) END AS expiresAt,
  CASE WHEN createdAt IS NULL THEN NULL
    WHEN typeof(createdAt) IN ('integer', 'real')
      THEN strftime('%Y-%m-%dT%H:%M:%fZ', createdAt / 1000.0, 'unixepoch')
    ELSE CAST(createdAt AS TEXT) END AS createdAt,
  CASE WHEN updatedAt IS NULL THEN NULL
    WHEN typeof(updatedAt) IN ('integer', 'real')
      THEN strftime('%Y-%m-%dT%H:%M:%fZ', updatedAt / 1000.0, 'unixepoch')
    ELSE CAST(updatedAt AS TEXT) END AS updatedAt
FROM verification;

-- Dropping user cascades into these tables. Preserve them explicitly, including
-- the order/address link that would otherwise be set to NULL.
CREATE TABLE _auth_profiles_backup AS SELECT * FROM profiles;
CREATE TABLE _auth_roles_backup AS SELECT * FROM admin_roles;
CREATE TABLE _auth_addresses_backup AS SELECT * FROM addresses;
CREATE TABLE _auth_order_addresses_backup AS
SELECT id AS order_id, address_id FROM orders WHERE address_id IS NOT NULL;

DROP TABLE session;
DROP TABLE account;
DROP TABLE verification;
DROP TABLE user;

CREATE TABLE user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0 CHECK (emailVerified IN (0, 1)),
  image TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
) STRICT;

INSERT INTO user(id,name,email,emailVerified,image,createdAt,updatedAt)
SELECT id,name,email,emailVerified,image,createdAt,updatedAt FROM _auth_user_backup;

CREATE TABLE session (
  id TEXT PRIMARY KEY,
  expiresAt TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
) STRICT;
CREATE INDEX session_user_idx ON session(userId);

INSERT INTO session(id,expiresAt,token,createdAt,updatedAt,ipAddress,userAgent,userId)
SELECT id,expiresAt,token,createdAt,updatedAt,ipAddress,userAgent,userId FROM _auth_session_backup;

CREATE TABLE account (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt TEXT,
  refreshTokenExpiresAt TEXT,
  scope TEXT,
  password TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
) STRICT;
CREATE UNIQUE INDEX account_provider_identity_idx ON account(providerId, accountId);
CREATE INDEX account_user_idx ON account(userId);

INSERT INTO account(id,accountId,providerId,userId,accessToken,refreshToken,idToken,
  accessTokenExpiresAt,refreshTokenExpiresAt,scope,password,createdAt,updatedAt)
SELECT id,accountId,providerId,userId,accessToken,refreshToken,idToken,
  accessTokenExpiresAt,refreshTokenExpiresAt,scope,password,createdAt,updatedAt
FROM _auth_account_backup;

CREATE TABLE verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT,
  updatedAt TEXT
) STRICT;
CREATE INDEX verification_identifier_idx ON verification(identifier);

INSERT INTO verification(id,identifier,value,expiresAt,createdAt,updatedAt)
SELECT id,identifier,value,expiresAt,createdAt,updatedAt FROM _auth_verification_backup;

INSERT INTO profiles SELECT * FROM _auth_profiles_backup;
INSERT INTO admin_roles SELECT * FROM _auth_roles_backup;
INSERT INTO addresses SELECT * FROM _auth_addresses_backup;
UPDATE orders
SET address_id = (SELECT address_id FROM _auth_order_addresses_backup WHERE order_id = orders.id)
WHERE id IN (SELECT order_id FROM _auth_order_addresses_backup);

CREATE TRIGGER user_profile_created
AFTER INSERT ON user
BEGIN
  INSERT OR IGNORE INTO profiles(id, full_name, avatar_url, created_at, updated_at)
  VALUES(NEW.id, NEW.name, NEW.image, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

DROP TABLE _auth_user_backup;
DROP TABLE _auth_session_backup;
DROP TABLE _auth_account_backup;
DROP TABLE _auth_verification_backup;
DROP TABLE _auth_profiles_backup;
DROP TABLE _auth_roles_backup;
DROP TABLE _auth_addresses_backup;
DROP TABLE _auth_order_addresses_backup;

-- Constraint validation happens automatically at the migration transaction's
-- commit. Do not turn deferral off early: D1 applies the file transactionally.
