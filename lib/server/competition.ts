import "server-only";
import { database } from "./database";
import { eventConfig } from "../event";
import type { Participant, Challenge, Assignment, DashboardData } from "../participant/types";
const columns="c.id,c.challenge_code AS challengeCode,c.title,c.category,c.difficulty,c.description";
export async function assignments(userId:string) {
 return (await database().prepare(`SELECT ${columns},p.assigned_at AS assignedAt,p.started_at AS startedAt,p.solved_at AS solvedAt FROM participant_challenges p JOIN challenges c ON c.id=p.challenge_id WHERE p.user_id=? ORDER BY p.solved_at IS NULL DESC,p.assigned_at DESC,c.id`).bind(userId).all<Assignment>()).results;
}
export async function assignment(userId:string,challengeId?:string) {
 const all=await assignments(userId);
 return (challengeId?all.find(c=>c.id===challengeId||c.challengeCode===challengeId):all.find(c=>c.solvedAt===null))??null;
}
export async function progression(userId:string) {
 const [all,available]=await Promise.all([assignments(userId),availableChallenges()]);
 const assignedChallenge=all.find(c=>c.solvedAt===null)??null;
 const completedChallenges=all.filter(c=>c.solvedAt!==null);
 return {assignedChallenge,completedChallenges,allChallengesCompleted:!assignedChallenge&&completedChallenges.length>0&&available.every(c=>all.some(a=>a.id===c.id))};
}
export async function availableChallenges() {return (await database().prepare(`SELECT ${columns} FROM challenges c WHERE c.active=1 ORDER BY c.category,c.challenge_code`).all<Challenge>()).results;}
export async function startChallenge(userId:string) {
 const now=Date.now();
 // Atomic selection/claim plus a partial unique index protects concurrent requests.
 await database().batch([
 database().prepare(`INSERT INTO participant_challenges(user_id,challenge_id,assigned_at,started_at)
 SELECT ?,c.id,?,? FROM challenges c WHERE c.active=1
 AND (c.starting=1 OR EXISTS(SELECT 1 FROM participant_challenges WHERE user_id=?))
 AND NOT EXISTS(SELECT 1 FROM participant_challenges WHERE user_id=? AND solved_at IS NULL)
 AND NOT EXISTS(SELECT 1 FROM participant_challenges WHERE user_id=? AND challenge_id=c.id)
 ORDER BY random() LIMIT 1 ON CONFLICT DO NOTHING`).bind(userId,now,now,userId,userId,userId),
 database().prepare(`UPDATE users SET started_at=COALESCE(started_at,(SELECT MIN(started_at) FROM participant_challenges WHERE user_id=?)) WHERE id=?`).bind(userId,userId),
 ]);
 return assignment(userId);
}
export async function dashboard(participant:Participant):Promise<DashboardData> {
 const state=await progression(participant.id);
 const total=await database().prepare("SELECT COUNT(*) AS count FROM challenges WHERE active=1").first<{count:number}>();
 const notices=await database().prepare("SELECT id,body,published_at AS publishedAt FROM announcements WHERE published_at<=? ORDER BY published_at DESC LIMIT 20").bind(Date.now()).all<{id:string;body:string;publishedAt:number}>();
 const all=[...state.completedChallenges,...(state.assignedChallenge?[state.assignedChallenge]:[])];
 return {participant,...state,score:0,rank:null,solves:state.completedChallenges.length,hintsUsed:0,totalChallenges:total?.count??0,event:eventConfig,announcements:notices.results,
 recentActivity:all.flatMap(a=>[...(a.solvedAt!==null?[{id:a.id+":solved",type:"Challenge solved",challengeCode:a.challengeCode,at:a.solvedAt}]:[]),{id:a.id+":started",type:"Challenge started",challengeCode:a.challengeCode,at:a.startedAt}]).sort((a,b)=>b.at-a.at).slice(0,20)};
}
