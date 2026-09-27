export type Participant = { id:string; username:string; email:string; displayName:string; participantId:string; role:string; startedAt:number|null };
export type Challenge = { id:string; challengeCode:string; title:string; category:string; difficulty:string; description:string };
export type Assignment = Challenge & { assignedAt:number; startedAt:number; solvedAt:number|null };
export type EventInfo = { name:string; startsAt:string; endsAt:string|null; countdownLabel:string };
export type DashboardData = {
 participant:Participant; assignedChallenge:Assignment|null; score:number; rank:number|null; solves:number; hintsUsed:number;
 totalChallenges:number; event:EventInfo; announcements:{id:string;body:string;publishedAt:number}[];
 recentActivity:{id:string;type:string;challengeCode:string;at:number}[];
};
export const categories = ["WEB","CRYPTO","PWN","REVERSE","FORENSICS","OSINT"] as const;
