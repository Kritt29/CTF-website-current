/* Public-site links deliberately reload to preserve the approved scene initialization. */
/* eslint-disable @next/next/no-html-link-for-pages */
"use client";
import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowUpRight, Eye, EyeOff, Info, LockKeyhole, UserRound, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import NetworkGlobe from "../hero/NetworkGlobe";
import { createMotionState } from "../hero/motion/state";
import LoginCTA from "../shared/LoginCTA";
import { registrationUrl } from "../shared/registration";
import "./login-page.css";

const subscribeHydration = () => () => {};
const hydrated = () => true;
const serverHydrated = () => false;
export default function LoginScreen() {
  const motion = useRef(createMotionState());
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const ready = useSyncExternalStore(subscribeHydration, hydrated, serverHydrated);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(busy)return;
    const form = new FormData(event.currentTarget);
    setBusy(true);setStatus("");
    try {
      const response = await fetch("/api/auth/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({identifier:form.get("username"),password:form.get("password")}) });
      const data=await response.json() as {error?:string};
      if(!response.ok){setStatus(data.error ?? "Unable to sign in. Please try again.");return;}
      router.replace("/dashboard");
    } catch {setStatus("Unable to connect. Please try again.");} finally {setBusy(false);}
  }
  return <main className="participant-login">
    <header className="participant-header">
      <a href="/#home" className="participant-brand"><img src="/assets/ddc-logo-reference.png" alt="Digital Defence Club" width="74" height="72"/><span>DIGITAL DEFENCE CLUB<small>CBIT</small></span></a>
      <nav aria-label="Main navigation"><a href="/#home">01 <b>HOME</b></a><a href="/#challenge-vectors">02 <b>CTF</b></a><a href="/#event-highlights">03 <b>INFO</b></a><button disabled>04 <b>FAQ</b></button></nav>
      <div className="participant-header-actions"><span className="participant-registration-dot">REGISTRATION OPEN • LIMITED SLOTS</span><LoginCTA/><a href={registrationUrl} className="register compact">REGISTER NOW <ArrowUpRight aria-hidden="true"/></a></div>
    </header>
    <div className="participant-environment" aria-hidden="true">
      <div className="participant-terrain"/>
      <img className="participant-monolith" src="/assets/highlights/monolith.webp" alt=""/>
      <div className="participant-globe"><NetworkGlobe motion={motion}/></div>
      <div className="participant-moon"/>
      <p className="participant-scan">SCAN<br/>DETECT<br/>ANALYZE<br/>DEFEND</p>
      <p className="participant-locator">HYDERABAD<small>17.3859° N<br/>78.4867° E</small></p>
      <p className="participant-curiosity">SAME CURIOSITY.<br/>HIGHER PRIVILEGES.<br/>—</p>
      <p className="participant-manifesto">THINK<br/>BREAK<br/>EXPLORE<br/>DEFEND</p>
      <p className="participant-global">A<br/>GLOBAL MINDS<br/>SECURE SYSTEMS<br/>BRIGHTER TOMORROW<br/>—</p>
      <p className="participant-safer">A<br/>SAFER<br/>TOMORROW</p>
      <p className="participant-footer">PEOPLE × IDEAS × EXPLOITS × IMPACT <span>—</span></p>
    </div>
    <section className="participant-interface" aria-labelledby="participant-title">
      <div className="participant-wordmark" aria-label="DDC CTF"><div><span>DDC</span><strong>CTF</strong></div><p>CAPTURE<br/>THE FLAG<br/>BY DIGITAL<br/>DEFENCE CLUB<br/>CBIT</p></div>
      <h1 id="participant-title">PARTICIPANT LOGIN</h1>
      <p className="participant-description">Use your platform credentials to enter<br className="participant-desktop-break"/> the competition interface.</p>
      <div className="participant-panel">
        <form method="post" action="/api/auth/login" onSubmit={submit}>
          <label className="participant-field"><UserRound aria-hidden="true"/><span className="sr-only">Email or Username</span><input name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required placeholder="Email or Username"/></label>
          <label className="participant-field"><LockKeyhole aria-hidden="true"/><span className="sr-only">Password</span><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required placeholder="Password"/><button type="button" className="participant-password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? <Eye aria-hidden="true"/> : <EyeOff aria-hidden="true"/>}</button></label>
          <button type="submit" className="register participant-submit" disabled={busy || !ready} aria-busy={busy}>{busy ? "SIGNING IN" : "LOGIN"} <ArrowUpRight aria-hidden="true"/></button>
          <button className="participant-forgot" type="button" onClick={() => setStatus("Password recovery is not available yet. Please contact your event organizer.")}>Forgot password?</button>
          <p className="participant-status" role="status" hidden={!status}>{status}</p>
        </form>
        <div className="participant-access-note"><Info aria-hidden="true"/><p>Event registration is separate from platform access.<span>If you haven’t registered yet, please <a href={registrationUrl}>visit the main site.</a></span></p></div>
        <a className="participant-back" href="/"><ArrowLeft aria-hidden="true"/>Back to main website</a>
      </div>
    </section>
  </main>;
}



