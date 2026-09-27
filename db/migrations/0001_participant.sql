CREATE TABLE users (
 id TEXT PRIMARY KEY, username TEXT NOT NULL COLLATE NOCASE UNIQUE,
 email TEXT NOT NULL COLLATE NOCASE UNIQUE, password_hash TEXT NOT NULL,
 display_name TEXT NOT NULL, participant_id TEXT NOT NULL UNIQUE,
 role TEXT NOT NULL DEFAULT 'participant' CHECK(role IN ('participant','admin')),
 created_at INTEGER NOT NULL, started_at INTEGER
);
CREATE TABLE sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE challenges (
 id TEXT PRIMARY KEY, challenge_code TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
 category TEXT NOT NULL CHECK(category IN ('WEB','CRYPTO','PWN','REVERSE','FORENSICS','OSINT')),
 difficulty TEXT NOT NULL, description TEXT NOT NULL,
 active INTEGER NOT NULL DEFAULT 0, starting INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE participant_challenges (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 challenge_id TEXT NOT NULL REFERENCES challenges(id),
 assigned_at INTEGER NOT NULL, started_at INTEGER NOT NULL, solved_at INTEGER
);
CREATE TABLE announcements (id TEXT PRIMARY KEY, body TEXT NOT NULL, published_at INTEGER NOT NULL);
CREATE TABLE auth_limits (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, resets_at INTEGER NOT NULL);
CREATE INDEX auth_limits_expiry ON auth_limits(resets_at);
