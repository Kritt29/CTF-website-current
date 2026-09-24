"use client";
import { useEffect, useRef, useState } from "react";
import { eventHighlights } from "./content";
import { getCountdown } from "./getCountdown";
const units = ["DAYS", "HOURS", "MINUTES", "SECONDS"];
const deadline = Date.parse(eventHighlights.startsAt);

/** The only ticking React subtree; sleeps offscreen and in background tabs. */
export default function Countdown() {
  const root = useRef<HTMLDivElement>(null);
  const [digits, setDigits] = useState<number[] | null>(null);
  useEffect(() => {
    let visible = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      clearTimeout(timer);
      if (!visible || document.hidden) return;
      const now = Date.now();
      setDigits(getCountdown(deadline, now));
      if (now < deadline) timer = setTimeout(tick, 1000 - now % 1000 + 10);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      tick();
    }, { rootMargin: "200px" });
    observer.observe(root.current!);
    document.addEventListener("visibilitychange", tick);
    return () => { clearTimeout(timer); observer.disconnect(); document.removeEventListener("visibilitychange", tick); };
  }, []);
  return (
    <div className="highlights-countdown" ref={root} data-scene-group="countdown">
      <p className="highlights-countdown-label">{eventHighlights.countdownLabel}</p>
      <div className="highlights-time" role="timer" aria-live="off" aria-label="Time until October 12, 2026, midnight India Standard Time">
        {units.map((unit, i) => (
          <div className="highlights-time-unit" key={unit}>
            <span className="highlights-digit">{digits ? String(digits[i]).padStart(2, "0") : "--"}</span>
            <span className="highlights-time-label">{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
