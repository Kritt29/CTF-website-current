import Link from "next/link";
export default function GhostFrame({ stage = "index" }: { stage?: string }) {
  return <section aria-label="WEB-101 Ghost 404 challenge">
    <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}><Link href="/submissions?challenge=WEB-101" className="register arena-start">SUBMIT FLAG →</Link></div>
    <iframe title="WEB-101 — Ghost 404 environment" src={'/api/challenge-env/web-101/' + stage}
      style={{ width: '100%', height: 'max(520px, calc(100svh - 190px))', border: '1px solid #493529', background: '#080909' }}
      referrerPolicy="same-origin" />
  </section>;
}
