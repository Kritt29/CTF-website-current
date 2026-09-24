import { Box, Clock3, Trophy, UserRound, UsersRound } from "lucide-react";
import Countdown from "./Countdown";
import HighlightsRegister from "./HighlightsRegister";
import { eventHighlights } from "./content";
import "./highlights.css";
const icons = { people: UsersRound, box: Box, clock: Clock3, person: UserRound, trophy: Trophy };

/**
 * One self-contained scene. The journey controller (components/journey) drives
 * its arrival; at rest and with reduced motion it is exactly this markup.
 */
export default function EventHighlights() {
  return (
    <section id="event-highlights" className="highlights-root" aria-labelledby="highlights-title">
      <div className="highlights-scene" data-scene-group="page03">
        <div className="highlights-depth" aria-hidden="true" />
        <div className="highlights-atmosphere" data-scene-group="environment" aria-hidden="true">
          <img src="/assets/highlights/monolith.webp" width="1672" height="941" alt="" loading="lazy" decoding="async" />
          {/* The monolith's seams unlit; lifted away bottom to top as it powers on. */}
          <div className="highlights-seam">
            <img src="/assets/highlights/monolith-seam-off.webp" width="772" height="791" alt="" loading="lazy" decoding="async" />
          </div>
        </div>
        <header className="highlights-nav">
          <a className="highlights-brand" href="#home" aria-label="Digital Defence Club home">
            <img src="/assets/ddc-logo-reference.png" width="82" height="72" alt="" loading="lazy" />
            <span>DIGITAL DEFENCE CLUB<small>CBIT</small></span>
          </a>
          <nav aria-label="Event highlights navigation">
            <a href="#home"><span>01</span> HOME</a>
            <a href="#challenge-vectors"><span>02</span> CTF</a>
            <a href="#event-highlights" aria-current="location"><span>03</span> INFO</a>
            <button disabled><span>04</span> FAQ</button>
          </nav>
          <div className="highlights-nav-status"><i /> REGISTRATION OPEN</div>
          <HighlightsRegister className="highlights-nav-register" label="REGISTER NOW" />
        </header>
        <svg className="highlights-signal" data-scene-group="signal" viewBox="0 0 1672 940" preserveAspectRatio="none" aria-hidden="true">
          <path d="M90 90 C360 148 610 173 810 256 S1220 419 1535 506" />
          {[[246,119],[715,222],[1070,358]].map(([cx,cy]) => <g key={cx}><circle cx={cx} cy={cy} r="12" className="highlights-node-halo"/><circle cx={cx} cy={cy} r="4" /></g>)}
        </svg>
        <div className="highlights-heading" data-scene-group="heading">
          <div><p className="highlights-index">{"// 03"}</p><h2 id="highlights-title"><span>EVENT</span><strong>HIGHLIGHTS</strong></h2></div>
          <p className="highlights-intro">SAME CURIOSITY.<br/>NEW CHALLENGES.<br/>BIGGER IMPACT.</p>
        </div>
        <Countdown />
        <dl className="highlights-details" data-scene-group="details">
          {eventHighlights.details.map(({label,value,icon}) => { const Icon = icons[icon]; return <div key={label}><Icon aria-hidden="true"/><dt>{label}</dt><dd>{value}</dd></div>; })}
        </dl>
        <div className="highlights-registration" data-scene-group="registration">
          <HighlightsRegister className="highlights-registration-status" label="REGISTRATION OPEN" />
          <div id="event-registration-details" tabIndex={-1}><p>DETAILS TO BE ANNOUNCED SOON.</p><small>STAY TUNED FOR UPDATES.</small></div>
        </div>
        <div className="highlights-side" aria-hidden="true">A<br/>SAFER<br/>TOMORROW<span>BUILT FOR<br/>BRIGHTER<br/>DEFENCES</span></div>
        <footer className="highlights-footer"><span>PEOPLE × IDEAS × EXPLOITS × IMPACT <i /></span><span>DDC CTF ’26 <b>—</b> 03</span></footer>
        <div className="highlights-frame" aria-hidden="true" />
      </div>
    </section>
  );
}


