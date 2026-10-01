CREATE TABLE submissions (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 challenge_id TEXT NOT NULL REFERENCES challenges(id),
 is_correct INTEGER NOT NULL CHECK(is_correct IN (0,1)),
 submitted_at INTEGER NOT NULL
);
CREATE INDEX submissions_user_time ON submissions(user_id, submitted_at DESC);
CREATE TABLE submission_limits (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 next_allowed_at INTEGER NOT NULL
);
