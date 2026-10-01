INSERT INTO challenges(id,challenge_code,title,category,difficulty,description,active,starting)
VALUES('WEB-101','WEB-101','Ghost 404','WEB','EASY','A broken internal page may be hiding more than it shows. Not everything deleted is gone.',1,1)
ON CONFLICT(challenge_code) DO NOTHING;
