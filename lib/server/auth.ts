import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { database } from "./database";
import { ApiError } from "./http";
import type { Participant } from "../participant/types";
const COOKIE="ddc_session";
const TTL=60*60*24*7;
// Constant work for unknown users; this is not an account or usable credential.
const DUMMY="$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW";
export async function digest(value:string) {
 const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
 return [...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,"0")).join("");
}
export const userColumns="u.id, u.username, u.email, u.display_name AS displayName, u.participant_id AS participantId, u.role, u.started_at AS startedAt";
export async function tokenFromRequest(request?:Request) {
 if(!request) return (await cookies()).get(COOKIE)?.value;
 return request.headers.get("cookie")?.split(";").map(v=>v.trim()).find(v=>v.startsWith(COOKIE+"="))?.slice(COOKIE.length+1);
}
export async function currentParticipant(request?:Request):Promise<Participant|null> {
 const token=await tokenFromRequest(request);if(!token || !/^[a-f0-9]{64}$/.test(token))return null;
 return database().prepare(`SELECT ${userColumns} FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`).bind(await digest(token),Date.now()).first<Participant>();
}
export async function requireParticipant(request:Request) { const user=await currentParticipant(request);if(!user)throw new ApiError(401,"Please sign in to continue.");return user; }
export async function requireParticipantPage() {const user=await currentParticipant();if(!user)redirect("/login");return user;}
export function sessionCookie(token:string,request:Request,clear=false) {
 const secure=process.env.NODE_ENV==="production" || new URL(request.url).protocol==="https:";
 return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear?0:TTL}${secure?"; Secure":""}`;
}
async function consumeLimit(key:string,max:number) {
 const now=Date.now(),reset=now+15*60*1000;
 const result=await database().prepare(`INSERT INTO auth_limits(key,attempts,resets_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN resets_at<=? THEN 1 ELSE attempts+1 END,resets_at=CASE WHEN resets_at<=? THEN excluded.resets_at ELSE resets_at END RETURNING attempts`).bind(key,reset,now,now).first<{attempts:number}>();
 if(result && result.attempts>max)throw new ApiError(429,"Too many attempts. Please try again in 15 minutes.");
}
export async function authenticate(identifier:unknown,password:unknown,request:Request) {
 if(typeof identifier!=="string" || typeof password!=="string" || !identifier.trim() || !password || identifier.length>254 || new TextEncoder().encode(password).length>72)throw new ApiError(401,"Invalid username or password.");
 const login=identifier.trim().toLowerCase();
 await consumeLimit("account:"+await digest(login),10);
 // CF supplies this header in production. Do not trust arbitrary forwarded-for headers.
 const ip=request.headers.get("cf-connecting-ip");if(ip)await consumeLimit("ip:"+await digest(ip),60);
 const user=await database().prepare(`SELECT ${userColumns},u.password_hash AS passwordHash FROM users u WHERE u.username=? COLLATE NOCASE OR u.email=? COLLATE NOCASE LIMIT 1`).bind(login,login).first<Participant & {passwordHash:string}>();
 const valid=await bcrypt.compare(password,user?.passwordHash??DUMMY);
 if(!valid || !user)throw new ApiError(401,"Invalid username or password.");
 const token=[...crypto.getRandomValues(new Uint8Array(32))].map(v=>v.toString(16).padStart(2,"0")).join("");
 const now=Date.now(),old=await tokenFromRequest(request);
 await database().batch([
  database().prepare("DELETE FROM sessions WHERE expires_at<=? OR token_hash=?").bind(now,old?await digest(old):""),
  database().prepare("INSERT INTO sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)").bind(await digest(token),user.id,now,now+TTL*1000),
  database().prepare("DELETE FROM auth_limits WHERE resets_at<=?").bind(now),
 ]);
 const {passwordHash: _hash,...participant}=user;void _hash;
 return {participant,token};
}
export async function endSession(request:Request) {const token=await tokenFromRequest(request);if(token)await database().prepare("DELETE FROM sessions WHERE token_hash=?").bind(await digest(token)).run();}
