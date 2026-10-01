-- Preserve existing assignments and solve timestamps.
CREATE TABLE participant_challenges_next (
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 challenge_id TEXT NOT NULL REFERENCES challenges(id),
 assigned_at INTEGER NOT NULL, started_at INTEGER NOT NULL, solved_at INTEGER,
 PRIMARY KEY (user_id, challenge_id)
);
INSERT INTO participant_challenges_next SELECT user_id,challenge_id,assigned_at,started_at,solved_at FROM participant_challenges;
DROP TABLE participant_challenges;
ALTER TABLE participant_challenges_next RENAME TO participant_challenges;
CREATE UNIQUE INDEX participant_one_active ON participant_challenges(user_id) WHERE solved_at IS NULL;
