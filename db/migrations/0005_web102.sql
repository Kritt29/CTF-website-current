INSERT INTO challenges(id,challenge_code,title,category,difficulty,description,active,starting)
VALUES('WEB-102','WEB-102','Wrong Key, Right State','WEB','EASY / MEDIUM','An internal portal rejects your identity. Its version of trust may be closer than you think.',1,1)
ON CONFLICT(challenge_code) DO NOTHING;
CREATE TABLE web102_progress (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 stage INTEGER NOT NULL DEFAULT 0 CHECK(stage BETWEEN 0 AND 3),
 updated_at INTEGER NOT NULL
);
