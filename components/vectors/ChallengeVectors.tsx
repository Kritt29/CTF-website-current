"use client";
import { useRef } from "react";
import { ArrowRight, Users, Layers, Trophy, Flag, Globe } from "lucide-react";
import { RegisterCTA } from "../hero/HeroScreen";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import VectorObject from "./VectorObject";
import { useVectorMotion } from "./useVectorMotion";
import "./vectors.css";

const domains = [
  {
    id: "web",
    name: "WEB",
    line: "BREAK WHAT SHOULDN’T BE TRUSTED.",
    words: ["INSPECT", "EXPLOIT", "BYPASS", "ACCESS"],
    description:
      "Look beneath the interface. Trace requests, question trust boundaries, and uncover weaknesses in how an application handles its users and data.",
    skills: ["HTTP & sessions", "Input validation", "Application logic"],
  },
  {
    id: "crypto",
    name: "CRYPTO",
    line: "NOT EVERYTHING IS MEANT TO BE READ.",
    words: ["CIPHERS", "PATTERNS", "HIDDEN MEANINGS", "TRUTH"],
    description:
      "Find structure inside the noise. Work through encoded messages, cipher design and flawed cryptographic assumptions to recover what was meant to stay hidden.",
    skills: ["Classical ciphers", "Number theory", "Cryptanalysis"],
  },
  {
    id: "pwn",
    name: "PWN",
    line: "CONTROL IS A MATTER OF PERSPECTIVE.",
    words: ["MEMORY", "EXPLOIT", "SHELL", "PRIVILEGE"],
    description:
      "Understand what a program does with memory. Follow execution, investigate unsafe behavior, and turn a small implementation mistake into control.",
    skills: ["Memory layout", "Binary analysis", "Exploit development"],
  },
  {
    id: "reverse",
    name: "REVERSE",
    line: "SEE WHAT OTHERS DON’T.",
    words: ["DISASSEMBLE", "ANALYZE", "UNDERSTAND", "REBUILD"],
    description:
      "Start with the finished program and work backward. Reconstruct its logic, follow the checks, and discover the behavior hidden behind compiled instructions.",
    skills: ["Disassembly", "Debugging", "Program logic"],
  },
  {
    id: "forensics",
    name: "FORENSICS",
    line: "EVERY BYTE TELLS A STORY.",
    words: ["RECOVER", "ANALYZE", "CONNECT", "UNCOVER"],
    description:
      "Piece together the evidence left behind. Inspect files, recover fragments and connect artifacts to understand what happened and where the flag is hidden.",
    skills: ["File analysis", "Packet inspection", "Data recovery"],
  },
  {
    id: "osint",
    name: "OSINT",
    line: "THE INTERNET REMEMBERS.",
    words: ["PEOPLE", "PLACES", "PATTERNS", "INTEL"],
    description:
      "Follow publicly available clues. Compare sources, read the context in images and metadata, and connect scattered information into a defensible conclusion.",
    skills: ["Source verification", "Geolocation", "Public information"],
  },
];
function VectorNavigation() {
  return (
    <header className="hero-nav vectors-nav">
      <a
        className="identity"
        href="#home"
        aria-label="Digital Defence Club home"
      >
        <img
          className="identity-mark"
          src="/assets/ddc-logo-reference.png"
          width="85"
          height="72"
          alt=""
        />
        <span className="identity-name">
          DIGITAL DEFENCE CLUB<small>CBIT</small>
        </span>
      </a>
      <nav className="navigation" aria-label="Challenge section navigation">
        <a className="nav-item" href="#home">
          <span>01</span>HOME
        </a>
        <a
          className="nav-item"
          href="#challenge-vectors"
          aria-current="location"
        >
          <span>02</span>CTF
        </a>
        {["INFO", "FAQ"].map((t, i) => (
          <button
            className="nav-item"
            aria-disabled="true"
            title="Available in a later screen"
            key={t}
          >
            <span>0{i + 3}</span>
            {t}
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
export default function ChallengeVectors() {
  const root = useRef<HTMLDivElement>(null);
  useVectorMotion(root);
  return (
    <div className="vectors-journey" ref={root} id="challenge-vectors">
      <section className="vectors-screen" aria-labelledby="vectors-title">
        <div className="vectors-environment" aria-hidden="true" />
        <svg
          className="vectors-signal"
          viewBox="0 0 1672 941"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M836 0C1130 30 1030 114 692 228S-139 381 61 439S640 553 839 486S1450 238 1581 421S795 762 848 941" />
          <path
            className="vectors-signal-live"
            pathLength="1"
            d="M836 0C1130 30 1030 114 692 228S-139 381 61 439S640 553 839 486S1450 238 1581 421S795 762 848 941"
          />
        </svg>
        <VectorNavigation />
        <div className="vectors-heading">
          <div>
            <p className="vectors-index">// 02</p>
            <h2 id="vectors-title">
              <span>CHALLENGE</span>
              <strong>VECTORS</strong>
            </h2>
          </div>
          <p className="vectors-intro">
            DIFFERENT DOMAINS.
            <br />
            SAME MINDSET.
            <br />
            FIND THE FLAG.
          </p>
          <p className="vectors-motto">
            REAL PROBLEMS
            <br />
            REAL SKILLS
            <br />A MORE SECURE
            <br />
            TOMORROW.
          </p>
        </div>
        <div className="vectors-grid">
          {domains.map((d, i) => (
            <article className="vector-domain" key={d.id} data-domain={d.id}>
              <div className="vector-copy">
                <span className="vector-number">0{i + 1}</span>
                <h3>{d.name}</h3>
                <p>{d.line}</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      className="vector-open"
                      aria-label={`Explore ${d.name}`}
                    >
                      <ArrowRight />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="vector-dialog">
                    <div className="vector-dialog-art">
                      <VectorObject kind={d.id} />
                    </div>
                    <div className="vector-dialog-copy">
                      <span className="vector-number">
                        // 0{i + 1} — CHALLENGE VECTOR
                      </span>
                      <DialogTitle>{d.name}</DialogTitle>
                      <DialogDescription>{d.description}</DialogDescription>
                      <ul>
                        {d.skills.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                      <p className="vector-dialog-line">{d.line}</p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="vector-art">
                <VectorObject kind={d.id} />
              </div>
              <p className="vector-words" aria-hidden="true">
                {d.words.map((w) => (
                  <span key={w}>{w}</span>
                ))}
              </p>
            </article>
          ))}
        </div>
        <div className="vectors-bottom">
          <div className="vectors-highlights">
            <p>// EVENT HIGHLIGHTS</p>
            <div className="vectors-stats">
              {[
                { icon: Users, value: "200+", label: "EXPECTED PARTICIPANTS" },
                { icon: Layers, value: "40+", label: "CHALLENGES" },
                { icon: Trophy, value: "₹1,00,000+", label: "PRIZE POOL" },
                { icon: Flag, value: "24 HOURS", label: "NON-STOP" },
                { icon: Globe, value: "OPEN", label: "TO ALL COLLEGES" },
              ].map((s) => (
                <div key={s.value}>
                  <s.icon aria-hidden="true" />
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="vectors-growth">
            SOLVE
            <br />
            LEARN
            <br />
            COMPETE
            <br />
            GROW<span>—</span>
          </p>
          <div className="vectors-register">
            <h3>
              REGISTRATION <em>OPEN</em>
            </h3>
            <p>LIMITED SLOTS. DON’T MISS OUT.</p>
            <RegisterCTA compact />
          </div>
        </div>
        <footer className="vectors-footer">
          <span>
            DDC CTF ’26
            <br />
            BUILD　/　SOLVE　/　WIN
          </span>
          <span>DIGITAL DEFENCE CLUB × CBIT</span>
        </footer>
      </section>
    </div>
  );
}
