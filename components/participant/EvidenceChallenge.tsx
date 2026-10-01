import Link from "next/link";
import type { Assignment } from "@/lib/participant/types";
import { forensics103Evidence } from "@/lib/server/forensics103";
import { FORENSICS103_ARTIFACT } from "@/lib/forensics103/artifact";

// Static downloadable evidence challenge (desktop-first). Metadata comes from the challenge record.
export default async function EvidenceChallenge({challenge}: {challenge: Assignment}) {
  const evidence = await forensics103Evidence().catch(() => null);
  const row = {display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, fontSize: 13, color: '#b8bdbc', margin: '6px 0'} as const;
  return <section className="arena-route">
    <p className="arena-kicker">{challenge.challengeCode} / {challenge.category} / {challenge.difficulty}</p>
    <h1>{challenge.title}</h1>
    <div className="arena-panel" style={{maxWidth: 900, padding: 28}}>
      <h2 style={{marginTop: 0}}>INCIDENT</h2>
      <p>{challenge.description}</p>
      <p style={{color: '#8f9694', fontStyle: 'italic'}}>Not every string survived in the same form.</p>
      <div style={{borderTop: '1px solid #ffffff15', margin: '22px 0', paddingTop: 18}}>
        <div style={row}><span>EVIDENCE</span><code>{FORENSICS103_ARTIFACT}</code></div>
        {evidence ? <>
          <div style={row}><span>SIZE</span><code>{evidence.bytes.length.toLocaleString('en-US')} bytes</code></div>
          <div style={row}><span>SHA-256</span><code style={{overflowWrap: 'anywhere'}}>{evidence.sha256}</code></div>
        </> : <p role="alert" className="arena-inline-error">Evidence is awaiting configuration. Contact an organizer.</p>}
      </div>
      <div style={{display: 'flex', gap: 16, flexWrap: 'wrap'}}>
        {evidence && <a className="register arena-start" href="/api/challenge-env/forensics-103/evidence" download={FORENSICS103_ARTIFACT}>DOWNLOAD EVIDENCE →</a>}
        <Link className="register arena-start" href={'/submissions?challenge=' + encodeURIComponent(challenge.challengeCode)}>SUBMIT FLAG →</Link>
      </div>
    </div>
  </section>;
}
