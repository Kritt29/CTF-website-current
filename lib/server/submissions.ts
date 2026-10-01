import "server-only";
import { timingSafeEqual } from "node:crypto";
import { database } from "./database";
import { ApiError } from "./http";
import { web101Flag } from "./web101";
import { web102Flag } from "./web102";
import { forensics103Flag } from "./forensics103";
import { crypto104Flag } from "./crypto104";

export async function submissionHistory(userId: string) {
  const rows = await database().prepare(`SELECT s.id,c.challenge_code AS challengeId,s.is_correct AS isCorrect,s.submitted_at AS submittedAt
    FROM submissions s JOIN challenges c ON c.id=s.challenge_id WHERE s.user_id=? ORDER BY s.submitted_at DESC,s.id DESC LIMIT 50`).bind(userId).all<{id:string;challengeId:string;isCorrect:number;submittedAt:number}>();
  return rows.results.map(row=>({...row,isCorrect:!!row.isCorrect,result:row.isCorrect?'CORRECT':'INCORRECT'}));
}

export async function submitFlag(userId: string, body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400,'Enter a challenge ID and flag.');
  const {challengeId,flag} = body as {challengeId?:unknown;flag?:unknown};
  if(typeof challengeId!=='string'||!challengeId.trim()||challengeId.length>64||typeof flag!=='string'||!flag.trim()||flag.length>512) throw new ApiError(400,'Enter a valid challenge ID and flag (maximum 512 characters).');
  const now=Date.now();
  // An atomic conditional upsert admits at most one request every two seconds per user.
  const permit=await database().prepare(`INSERT INTO submission_limits(user_id,next_allowed_at) VALUES(?,?)
    ON CONFLICT(user_id) DO UPDATE SET next_allowed_at=excluded.next_allowed_at WHERE submission_limits.next_allowed_at<=? RETURNING user_id`).bind(userId,now+2000,now).first();
  if(!permit) throw new ApiError(429,'Please wait two seconds before submitting again.');
  const challenge=await database().prepare('SELECT id,challenge_code AS code FROM challenges WHERE challenge_code=? AND active=1').bind(challengeId.trim().toUpperCase()).first<{id:string;code:string}>();
  if(!challenge) throw new ApiError(400,'Invalid challenge ID.');
  const assigned=await database().prepare('SELECT solved_at AS solvedAt FROM participant_challenges WHERE user_id=? AND challenge_id=?').bind(userId,challenge.id).first<{solvedAt:number|null}>();
  if(!assigned) throw new ApiError(403,'This challenge is not assigned to you.');
  if(assigned.solvedAt!==null) return {correct:true,alreadySolved:true,message:'Challenge already solved.'};
  const validators:Record<string,()=>string>={'WEB-101':web101Flag,'WEB-102':web102Flag,'FORENSICS-103':forensics103Flag,'CRYPTO-104':crypto104Flag};
  const validator=validators[challenge.code]??null;
  if(!validator) throw new ApiError(409,'Submissions are not available for this challenge yet.');
  const hash=(value:string)=>crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  const [provided,expected]=await Promise.all([hash(flag.trim()),hash(validator())]);
  const correct=timingSafeEqual(new Uint8Array(provided),new Uint8Array(expected));
  // D1 batch is transactional: attempt and first solve either both persist or neither does.
  const result=await database().batch([
    database().prepare('INSERT INTO submissions(id,user_id,challenge_id,is_correct,submitted_at) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),userId,challenge.id,correct?1:0,now),
    database().prepare('UPDATE participant_challenges SET solved_at=? WHERE user_id=? AND challenge_id=? AND solved_at IS NULL AND ?=1').bind(now,userId,challenge.id,correct?1:0),
  ]);
  if(correct&&!result[1].meta.changes) return {correct:true,alreadySolved:true,message:'Challenge already solved.'};
  return {correct,message:correct?'Flag accepted.':'Incorrect flag.'};
}
