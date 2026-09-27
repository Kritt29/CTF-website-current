import "server-only";
import { database } from "./database";
import { ApiError } from "./http";
import { eventConfig } from "../event";
import type { Participant, Challenge, Assignment, DashboardData } from "../participant/types";
const columns="c.id,c.challenge_code AS challengeCode,c.title,c.category,c.difficulty,c.description";
export async function assignment(userId:string) {
 return database().prepare(`SELECT ${columns},p.assigned_at AS assignedAt,p.started_at AS startedAt,p.solved_at AS solvedAt FROM participant_challenges p JOIN challenges c ON c.id=p.challenge_id WHERE p.user_id=?`).bind(userId).first<Assignment>();
}
export async function availableChallenges() {return (await database().prepare(`SELECT ${columns} FROM challenges c WHERE c.active=1 ORDER BY c.category,c.challenge_code`).all<Challenge>()).results;}
export async function startChallenge(userId:string) {
 const now=Date.now();
 // Both statements run transactionally. PRIMARY KEY(user_id) is the concurrency guard.
 await database().batch([
  database().prepare(`INSERT INTO participant_challenges(user_id,challenge_id,assigned_at,started_at) SELECT ?,id,?,? FROM challenges WHERE active=1 AND starting=1 ORDER BY random() LIMIT 1 ON CONFLICT(user_id) DO NOTHING`).bind(userId,now,now),
  database().prepare(`UPDATE users SET started_at=COALESCE(started_at,(SELECT started_at FROM participant_challenges WHERE user_id=?)) WHERE id=?`).bind(userId,userId),
 ]);
 const result=await assignment(userId);if(!result)throw new ApiError(409,"Starting challenges have not been published yet. Please check back soon.");return result;
}
export async function dashboard(participant:Participant):Promise<DashboardData> {
 const assigned=await assignment(participant.id);
 const total=await database().prepare("SELECT COUNT(*) AS count FROM challenges WHERE active=1").first<{count:number}>();
 const notices=await database().prepare("SELECT id,body,published_at AS publishedAt FROM announcements WHERE published_at<=? ORDER BY published_at DESC LIMIT 20").bind(Date.now()).all<{id:string;body:string;publishedAt:number}>();
 return {participant,assignedChallenge:assigned,score:0,rank:null,solves:assigned?.solvedAt?1:0,hintsUsed:0,totalChallenges:total?.count??0,event:eventConfig,announcements:notices.results,
 recentActivity:assigned?[{id:assigned.id+":started",type:"Challenge started",challengeCode:assigned.challengeCode,at:assigned.startedAt}]:[]};
}
