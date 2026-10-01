import Link from "next/link";
export default function PortalFrame({stage='index'}:{stage?:string}) {
 return <section aria-label="WEB-102 Wrong Key, Right State">
  <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}><Link href="/submissions?challenge=WEB-102" className="register arena-start">SUBMIT FLAG →</Link></div>
  <iframe title="WEB-102 — Internal Portal" src={'/api/challenge-env/web-102/'+stage} referrerPolicy="same-origin" style={{width:'100%',height:'max(690px, calc(100svh - 190px))',border:'1px solid #414641',background:'#111512'}}/>
 </section>;
}
