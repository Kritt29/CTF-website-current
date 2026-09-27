"use client";
import { useState, useRef } from "react";
import {
  ArrowUpRight,
  MapPin,
  Clock3,
  UsersRound,
  ChevronDown,
  Signal,
} from "lucide-react";
import NetworkGlobe from "./NetworkGlobe";
import SignalBridge from "./motion/SignalBridge";
import { createMotionState } from "./motion/state";
import { useHeroMotion } from "./motion/useHeroMotion";

import { event } from "./content";
export function RegisterCTA({ compact = false }: { compact?: boolean }) {
  const [notice, setNotice] = useState(false);
  const content = (
    <>
      REGISTER NOW <ArrowUpRight aria-hidden="true" />
    </>
  );
  return (
    <div className={compact ? "" : "cta-wrap"}>
      {event.registrationUrl ? (
        <a
          className={`register ${compact ? "compact" : "hero-register"}`}
          href={event.registrationUrl}
        >
          {content}
        </a>
      ) : (
        <>
          <button
            className={`register ${compact ? "compact" : "hero-register"}`}
            onClick={() => setNotice(!notice)}
            aria-expanded={notice}
          >
            {content}
          </button>
          <p className="registration-note" role="status" hidden={!notice}>
            The registration link hasn’t been announced here yet. Check back
            soon.
          </p>
        </>
      )}
    </div>
  );
}
function IdentityMark() {
  return (
    <img
      className="identity-mark"
      src="/assets/ddc-logo-reference.png"
      alt=""
      width="85"
      height="72"
    />
  );
}
function HeroNavigation() {
  return (
    <header className="hero-nav">
      <a
        className="identity"
        href="#home"
        aria-label="Digital Defence Club home"
      >
        <IdentityMark />
        <span className="identity-name">
          DIGITAL DEFENCE CLUB<small>CBIT</small>
        </span>
      </a>
      <nav className="navigation" aria-label="Main navigation">
        <a className="nav-item" href="#home" aria-current="page">
          <span>01</span>HOME
        </a>
        {["CTF", "INFO", "FAQ"].map((label, i) => i < 2 ? (
          <a className="nav-item" key={label} href={i === 0 ? "#challenge-vectors" : "#event-highlights"}><span>0{i + 2}</span>{label}</a>
        ) : (
          <button
            className="nav-item"
            key={label}
            aria-disabled="true"
            title={`${label} — available in a later screen`}
          >
            <span>0{i + 2}</span>
            {label}
          </button>
        ))}
      </nav>
      <div className="nav-actions">
        <span className="registration-status">
          <i className="status-dot" />
          REGISTRATION OPEN <b>•</b> LIMITED SLOTS
        </span>
        <RegisterCTA compact />
      </div>
    </header>
  );
}
function HeroTypography() {
  return (
    <div className="hero-copy">
      <p className="eyebrow">
        SAME CURIOSITY.
        <br />
        HIGHER PRIVILEGES.
      </p>
      <div className="title-composition">
        <h1 className="title" aria-label="DDC CTF">
          <span className="title-line title-ddc">DDC</span>
          <span className="title-line title-ctf">CTF</span>
        </h1>
        <div className="manifesto">
          THINK
          <br />
          BREAK
          <br />
          EXPLORE
          <br />
          DEFEND
        </div>
      </div>
      <h2 className="hero-tagline">ENTER THE GRID.</h2>
      <p className="hero-description">
        A capture the flag event by Digital Defence Club
        <br />
        Chaitanya Bharathi Institute of Technology
      </p>
      <RegisterCTA />
      <HeroMeta />
    </div>
  );
}
function HeroMeta() {
  return (
    <div className="hero-meta">
      <span className="meta-item">
        <MapPin aria-hidden="true" />
        CBIT, Hyderabad
      </span>
      <span className="meta-item">
        <Clock3 aria-hidden="true" />
        24 Hours
      </span>
      <span className="meta-item">
        <UsersRound aria-hidden="true" />
        Open to all colleges
      </span>
    </div>
  );
}
export default function HeroScreen() {
  const root = useRef<HTMLDivElement>(null);
  const motion = useRef(createMotionState());
  useHeroMotion(root, motion);
  return (
    <>
      <a className="skip-link" href="#hero-content">
        Skip to event
      </a>
      <main id="home">
        <div className="hero-scroll" ref={root}>
          <section
            className="hero"

            aria-label="DDC CTF — Enter the Grid"
          >
            <div className="edge-lines" />
            <HeroNavigation />
            <NetworkGlobe motion={motion} />
            <SignalBridge />
            <div id="hero-content">
              <HeroTypography />
            </div>
            <div className="system-label scan-label" aria-hidden="true">
              SCAN
              <br />
              DETECT
              <br />
              ANALYZE
            </div>
            <div className="system-label hyderabad-label">
              HYDERABAD
              <small>
                17.3859° N<br />
                78.4867° E
              </small>
            </div>
            <div className="system-label network-label" aria-hidden="true">
              <span>
                LIVE
                <br />
                NETWORK
              </span>
              <Signal />
            </div>
            <p className="side-phrase" aria-hidden="true">
              A<br />
              SAFER
              <br />
              TOMORROW
            </p>
            <p className="side-phrase bottom-right" aria-hidden="true">
              BUILT FOR
              <br />
              BRIGHTER
              <br />
              DEFENCES
            </p>
            <p className="bottom-phrase" aria-hidden="true">
              PEOPLE × IDEAS × EXPLOITS × IMPACT
            </p>
            <div className="scroll-cue" aria-hidden="true">
              SCROLL TO EXPLORE
              <span className="mouse" />
              <ChevronDown />
            </div>
          </section>
        </div>
        <div
          className="handoff-boundary"
          data-page01-boundary
          aria-hidden="true"
        />
      </main>
    </>
  );
}
