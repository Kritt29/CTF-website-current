import Link from "next/link";
import type { Assignment } from "@/lib/participant/types";
import { crypto105Evidence } from "@/lib/server/crypto105";
import { CRYPTO105_ARTIFACT } from "@/lib/server/crypto105-check";

// CRYPTO-105 static evidence page (desktop-only). Metadata comes from the challenge record.
export default async function ShiftChangeChallenge({challenge}: {challenge: Assignment}) {
  let evidence: {bytes: Uint8Array; sha256: string} | null = null;
  try { evidence = crypto105Evidence(); } catch { evidence = null; }
  const row = {display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, fontSize: 13, color: '#b8bdbc', margin: '6px 0'} as const;
  return <section className="arena-route">
    <p className="arena-kicker">{challenge.challengeCode} / {challenge.category} / {challenge.difficulty}</p>
    <h1>{challenge.title}</h1>
    <div className="arena-panel" style={{maxWidth: 900, padding: 28}}>
      <h2 style={{marginTop: 0}}>INTERCEPT</h2>
      <p>{challenge.description}</p>
      <p style={{color: '#8f9694', fontStyle: 'italic'}}>New crew, new offset.</p>
      <div style={{borderTop: '1px solid #ffffff15', margin: '22px 0', paddingTop: 18}}>
        <div style={row}><span>EVIDENCE</span><code>{CRYPTO105_ARTIFACT}</code></div>
        {evidence ? <>
          <div style={row}><span>SIZE</span><code>{evidence.bytes.length.toLocaleString('en-US')} bytes</code></div>
          <div style={row}><span>SHA-256</span><code style={{overflowWrap: 'anywhere'}}>{evidence.sha256}</code></div>
        </> : <p role="alert" className="arena-inline-error">Evidence is awaiting configuration. Contact an organizer.</p>}
      </div>
      <div style={{display: 'flex', gap: 16, flexWrap: 'wrap'}}>
        {evidence && <a className="register arena-start" href="/api/challenge-env/crypto-105/evidence" download={CRYPTO105_ARTIFACT}>DOWNLOAD EVIDENCE →</a>}
        <Link className="register arena-start" href={'/submissions?challenge=' + encodeURIComponent(challenge.challengeCode)}>SUBMIT FLAG →</Link>
      </div>
    </div>
  </section>;
}
