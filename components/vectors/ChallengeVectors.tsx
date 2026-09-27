"use client";
import { useRef } from "react";
import { ArrowRight, Users, Layers, Trophy, Flag, Globe } from "lucide-react";
import { VectorRegister } from "./VectorRegister";
import { domains, vectorEvent } from "./content";
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

function VectorNavigation() {
  return (
    <header className="vectors-nav">
      <a
        className="vectors-brand"
        href="/#home"
        aria-label="Digital Defence Club home"
      >
        <img
          className="vectors-mark"
          src="/assets/ddc-logo-reference.png"
          width="85"
          height="72"
          alt=""
        />
        <span className="vectors-brand-name">
          DIGITAL DEFENCE CLUB<small>CBIT</small>
        </span>
      </a>
      <nav
        className="vectors-navigation"
        aria-label="Challenge section navigation"
      >
        <a className="vectors-nav-item" href="/#home">
          <span>01</span>HOME
        </a>
        <a
          className="vectors-nav-item"
          href="#challenge-vectors"
          aria-current="location"
        >
          <span>02</span>CTF
        </a>
        {["INFO", "FAQ"].map((t, i) => i === 0 ? (
          <a className="vectors-nav-item" href="/#event-highlights" key={t}><span>03</span>INFO</a>
        ) : (
          <button
            className="vectors-nav-item"
            aria-disabled="true"
            title="Available in a later screen"
            key={t}
          >
            <span>0{i + 3}</span>
            {t}
          </button>
        ))}
      </nav>
      <div className="vectors-nav-actions">
        <span className="vectors-registration-status">
          <i className="vectors-status-dot" />
          EVENT DETAILS TO BE ANNOUNCED
        </span>
        <VectorRegister />
      </div>
    </header>
  );
}
export default function ChallengeVectors() {
  const root = useRef<HTMLDivElement>(null);
  useVectorMotion(root);
  return (
    <div className="vectors-journey" ref={root} id="challenge-vectors">
      {/* Motion-only wrapper: lets the journey hold the scene while it recedes. */}
      <div className="vectors-pin">
      <section className="vectors-screen" aria-labelledby="vectors-title">
        <div className="vectors-environment" aria-hidden="true" />
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
                <Dialog modal={false}>
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
                {
                  icon: Users,
                  value: vectorEvent.participants ?? "TBA",
                  label: "EXPECTED PARTICIPANTS",
                },
                {
                  icon: Layers,
                  value: vectorEvent.challenges ?? "TBA",
                  label: "CHALLENGES",
                },
                {
                  icon: Trophy,
                  value: vectorEvent.prizePool ?? "TBA",
                  label: "PRIZE POOL",
                },
                {
                  icon: Flag,
                  value: vectorEvent.duration ?? "TBA",
                  label: "DURATION",
                },
                {
                  icon: Globe,
                  value: vectorEvent.eligibility ?? "TBA",
                  label: "ELIGIBILITY",
                },
              ].map((s) => (
                <div key={s.label}>
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
              REGISTRATION{" "}
              <em>{vectorEvent.registrationUrl ? "OPEN" : "SOON"}</em>
            </h3>
            <p>
              {vectorEvent.registrationUrl
                ? "ENTER THE CHALLENGE."
                : "DETAILS TO BE ANNOUNCED."}
            </p>
            <VectorRegister />
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
    </div>
  );
}
