import Link from "next/link";
import { requireParticipantPage } from "@/lib/server/auth";
import { availableChallenges,assignment } from "@/lib/server/competition";
import { categories } from "@/lib/participant/types";
import StartChallenge from "@/components/participant/StartChallenge";
export default async function ChallengesPage({searchParams}:{searchParams:Promise<{category?:string}>}) {
 const user=await requireParticipantPage();const {category}=await searchParams;const all=await availableChallenges();const assigned=await assignment(user.id);const selected=categories.find(c=>c===category);const filtered=selected?all.filter(c=>c.category===selected):all;
 return <section className="arena-route"><p className="arena-kicker">EXPLORE THE GRID</p><h1>CHALLENGES</h1><div className="arena-filters"><Link href="/challenges" aria-current={!selected?'page':undefined}>ALL</Link>{categories.map(c=><Link href={'/challenges?category='+c} key={c} aria-current={selected===c?'page':undefined}>{c}</Link>)}</div><div className="arena-challenge-list">{filtered.map(c=><article className="arena-panel" key={c.id}><span className="arena-kicker">{c.challengeCode} / {c.category} / {c.difficulty}</span><h2>{c.title}</h2><p>{c.description}</p>{assigned?.id===c.id?<Link className="register arena-start" href={'/challenges/'+c.id}>CONTINUE CHALLENGE →</Link>:<p className="arena-empty">{assigned?'Available challenge · additional challenge access is not enabled yet.':'Start below to receive your server-assigned starting challenge.'}</p>}</article>)}</div>{!filtered.length&&<p className="arena-empty">No {selected??''} challenges have been published yet.</p>}<StartChallenge assigned={!!assigned}/></section>;
}
