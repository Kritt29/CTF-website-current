-- Minimal WEB-101 progression: the ghost terminal requires the archive stage to have been served.
CREATE TABLE web101_progress (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 archive_reached_at INTEGER NOT NULL
);
