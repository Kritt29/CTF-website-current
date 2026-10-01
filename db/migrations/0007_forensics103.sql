-- FORENSICS-103 joins the catalogue as a non-starting challenge, assignable through NEXT CHALLENGE.
INSERT INTO challenges(id,challenge_code,title,category,difficulty,description,active,starting)
VALUES('FORENSICS-103','FORENSICS-103','Cold Boot: Shattered Cache','FORENSICS','HARD','A partially corrupted memory image was recovered from a workstation after an incident. A recovery process was running before shutdown, but its state appears fragmented across memory.',1,0)
ON CONFLICT(challenge_code) DO NOTHING;
