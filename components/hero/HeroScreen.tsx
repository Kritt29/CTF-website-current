"use client";
import { useRef, useState } from "react";
import {
  ArrowUpRight,
  MapPin,
  Clock3,
  UsersRound,
  ChevronDown,
  Signal,
} from "lucide-react";
import NetworkGlobe from "./NetworkGlobe";
import { useHeroTransition } from "./HeroTransitionController";
import type { SceneState } from "./sceneState";
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
    <svg
      className="identity-mark"
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1.6">
        {Array.from({ length: 12 }, (_, i) => (
          <g key={i} transform={`rotate(${i * 30} 40 40)`}>
            <path d="M35 15v-5l5-4 5 4v5M37 17v-5h6v5" />
            <circle cx="40" cy="3" r="1" />
            <path d="M32 19l-4-3-4 5 3 4" />
          </g>
        ))}
        <path d="m40 18 19 11v23L40 65 21 52V29Z" />
        <path d="m40 25 13 8v16l-13 9-13-9V33Z" />
        <path d="m40 30 8 5v12l-8 6-8-6V35Z" />
        <path d="M40 36v11" strokeWidth="4" />
      </g>
    </svg>
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
        {["CTF", "INFO", "FAQ"].map((label, i) => (
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
  const root = useRef<HTMLElement>(null);
  const state = useRef<SceneState>({ progress: 0, reveal: 0, reduced: false });
  useHeroTransition(root, state);
  return (
    <>
      <a className="skip-link" href="#hero-content">
        Skip to event
      </a>
      <main id="home">
        <section
          className="hero"
          ref={root}
          aria-label="DDC CTF — Enter the Grid"
        >
          <div className="edge-lines" />
          <HeroNavigation />
          <NetworkGlobe state={state} />
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
          <button
            className="scroll-cue"
            aria-label="Explore the globe"
            onClick={() =>
              window.scrollBy({
                top: window.innerHeight * 0.7,
                behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
                  ? "instant"
                  : "smooth",
              })
            }
          >
            SCROLL TO EXPLORE
            <span className="mouse" />
            <ChevronDown />
          </button>
          <svg
            className="transition-route"
            viewBox="0 0 1440 900"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              id="page-two-route"
              d="M985 422 C1190 510 980 680 840 760 S740 895 720 1000"
              fill="none"
              stroke="#ff6509"
              strokeWidth="1.5"
            />
          </svg>
        </section>
        <div
          id="transition-boundary"
          className="transition-boundary"
          aria-hidden="true"
        />
      </main>
    </>
  );
}
