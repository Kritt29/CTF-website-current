-- CRYPTO-104 joins the catalogue as a non-starting challenge, assignable through NEXT CHALLENGE.
INSERT INTO challenges(id,challenge_code,title,category,difficulty,description,active,starting)
VALUES('CRYPTO-104','CRYPTO-104','Dead Drop 64: Receiver’s Copy','CRYPTO','HARD','A dead-drop relay restarted during a transmission. Its export contains an older delivery, a rejected handoff, and retries of the current message. The receiver’s receipts survived, but the relay’s display order does not reflect delivery order. Recover the message the receiver actually accepted.',1,0)
ON CONFLICT(challenge_code) DO NOTHING;
