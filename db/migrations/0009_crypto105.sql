-- CRYPTO-105 joins the catalogue as a non-starting challenge, assignable through NEXT CHALLENGE.
INSERT INTO challenges(id,challenge_code,title,category,difficulty,description,active,starting)
VALUES('CRYPTO-105','CRYPTO-105','Shift Change','CRYPTO','MEDIUM','Relay-7 was intercepted either side of the 06:00 shift change, while an operator moved a recovery key to the incident-response desk. The traffic is only lightly scrambled, but the consoles did not all turn the alphabet the same distance, and the crews changed halfway through. Recover the key the desk confirmed.',1,0)
ON CONFLICT(challenge_code) DO NOTHING;
