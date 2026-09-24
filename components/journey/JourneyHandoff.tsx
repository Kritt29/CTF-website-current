"use client";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { startSmoothScroll } from "./smoothScroll";
import "./handoff.css";

gsap.registerPlugin(ScrollTrigger);
const clamp01 = gsap.utils.clamp(0, 1);
const smoothPhase = (start: number, end: number, progress: number) => {
  const t = clamp01((progress - start) / (end - start));
  return t * t * (3 - 2 * t);
};
const sineInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
// The approved departure is linear in p. Page 01 comes to rest at the
// boundary, so a linear start would jump from zero to full velocity; a short
// quadratic lead-in joins it with continuous velocity, then stays linear.
const LEAD = 0.2;
const departure = (p: number) =>
  p < LEAD ? (p * p) / (2 * LEAD) / (1 - LEAD / 2) : (p - LEAD / 2) / (1 - LEAD / 2);

/** Writes an inline style only when its serialized value changes. */
function styleWriter(element: HTMLElement) {
  const last: Record<string, string> = {};
  return (property: string, value: string) => {
    if (last[property] === value) return;
    last[property] = value;
    element.style.setProperty(property, value);
  };
}
const opacityFilter = (value: number) =>
  value >= 1 ? "none" : `opacity(${Math.max(0, value).toFixed(4)})`;

/**
 * One master progress for the Page 01 → Page 02 handoff.
 *
 * Lenis owns scroll smoothing; this ScrollTrigger maps the smoothed position
 * to a single progress with no scrub delay and renders every element of both
 * scenes from it, in the same frame, writing only per-element properties
 * (no inherited custom properties on large subtrees).
 */
export default function JourneyHandoff() {
  const veilRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>(".hero-scroll");
    const hero = root?.querySelector<HTMLElement>(".hero");
    const next = document.querySelector<HTMLElement>("#challenge-vectors");
    const scene = next?.querySelector<HTMLElement>(".vectors-screen");
    const veil = veilRef.current;
    if (!root || !hero || !next || !scene || !veil) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)", () =>
      startSmoothScroll(),
    );
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const globe = hero.querySelector<HTMLElement>(".globe-stage")!;
      const bridge = hero.querySelector<HTMLElement>(".signal-bridge")!;
      const nav = hero.querySelector<HTMLElement>(".hero-nav")!;
      const content = hero.querySelector<HTMLElement>("#hero-content")!;
      const art = [...scene.querySelectorAll<HTMLElement>(".vector-art")];
      const heroStyle = styleWriter(hero), globeStyle = styleWriter(globe);
      const bridgeStyle = styleWriter(bridge), navStyle = styleWriter(nav);
      const contentStyle = styleWriter(content), sceneStyle = styleWriter(scene);
      const veilStyle = styleWriter(veil);
      const artStyles = art.map(styleWriter);
      const travel = 1.4;
      let height = hero.clientHeight, contentHeight = scene.offsetHeight, startPosition = 0;
      let settled: boolean | undefined, occluded: boolean | undefined, current = NaN;
      const measure = () => {
        height = hero.clientHeight;
        contentHeight = scene.offsetHeight;
        startPosition = root.getBoundingClientRect().top + scrollY
          + parseFloat(getComputedStyle(root).getPropertyValue("--scroll-distance"));
        root.style.setProperty("--handoff-height", `${height}px`);
        root.style.setProperty("--arrival-travel", String(travel));
        next.style.setProperty("--handoff-height", `${height}px`);
        next.style.setProperty("--arrival-distance", `${height * travel}px`);
        next.style.setProperty("--arrival-content-height", `${contentHeight}px`);
        // Three hero heights, soft band centred at two; same origin as the hero.
        veil.style.height = `${height * 3}px`;
        veil.style.transformOrigin = `35% ${height * .25}px`;
      };
      measure();
      root.classList.add("journey-overlap");
      hero.classList.add("journey-departure");
      next.classList.add("journey-arrival");
      sceneStyle("transform-origin", "50% 30%");

      const render = (a: number, force = false) => {
        if (a === current && !force) return;
        current = a;
        // Outgoing timing: .75 viewport of departure inside 1.4 of arrival.
        const p = Math.min(1, a * travel / .75);
        const depth = departure(p);
        const arrival = smoothPhase(.08, .9, p);
        const edge = height * (-.10 + arrival * 1.35);

        // Page 01 departs as one camera move. Spatial terms use the eased
        // depth; the approved fades keep their original linear timing.
        globeStyle("scale", (1 - depth * .48).toFixed(5));
        globeStyle("translate", `${(depth * -8).toFixed(4)}vw ${(depth * -12).toFixed(4)}vh`);
        bridgeStyle("filter", opacityFilter(1 - p * 2));
        bridgeStyle("visibility", p >= .5 ? "hidden" : "");
        navStyle("filter", opacityFilter(1 - p * 5));
        contentStyle("filter", opacityFilter(1 - p * 2.4));
        contentStyle("scale", (1 - depth * .14).toFixed(5));
        // The wipe retires Page 01 into the page background: transparent at
        // edge - 35px, opaque at edge + 15px in the hero's own coordinates. The
        // hero is opaque, so an ink veil over it is pixel-identical to masking
        // it, and a veil only translates: no mask repaint, no offscreen pass.
        const heroScale = 1 - depth * .04;
        heroStyle("scale", heroScale.toFixed(5));
        veilStyle("scale", heroScale.toFixed(5));
        veilStyle("translate", `0 ${(heroScale * (edge - 10 - 2 * height)).toFixed(2)}px`);
        const hidden = p >= .9;
        if (hidden !== occluded) {
          hero.classList.toggle("journey-occluded", hidden);
          occluded = hidden;
          veilStyle("visibility", live && !hidden ? "visible" : "hidden");
        }

        // Page 02 arrives as one plane, driven by the same progress.
        const pose = 1 - sineInOut(a);
        sceneStyle("transform", `perspective(1800px) rotateY(${(pose * -4).toFixed(4)}deg) rotateX(${(pose * 14).toFixed(4)}deg) scale(${(1 - pose * .22).toFixed(5)})`);
        const atRest = a === 1;
        // Clear the entire incoming surface before retiring its mask, including
        // on a fast scroll that has already exposed the lower page.
        const clearTail = Math.max(0, contentHeight + 50 - height * 1.25) * smoothPhase(.54, .92, a);
        const sceneEdge = edge + clearTail;
        sceneStyle("mask-image", atRest ? "none"
          : `linear-gradient(to bottom, #000 ${(sceneEdge - 50).toFixed(2)}px, transparent ${sceneEdge.toFixed(2)}px)`);
        // Everything below the soft edge is already fully transparent. Clipping
        // it away too shrinks the masked offscreen pass the GPU redraws each
        // frame to the part of the scene that is actually revealed.
        sceneStyle("clip-path", atRest ? "none"
          : `inset(0 0 ${Math.max(0, contentHeight - sceneEdge).toFixed(2)}px 0)`);
        const internals = smoothPhase(.93, 1, a).toFixed(4);
        artStyles.forEach((write) => write("--scene-internals", internals));

        root.dataset.handoffProgress = next.dataset.handoffProgress = p.toFixed(4);
        next.dataset.arrivalProgress = a.toFixed(4);
        next.dataset.arrivalRunning = String(a > 0 && a < 1);
        // Switch only at the exact endpoint, never ahead of the rendered pose.
        if (atRest !== settled) {
          next.dataset.arrivalSettled = String(atRest);
          next.dispatchEvent(new Event("journey:arrival-state"));
          settled = atRest;
        }
      };
      // Shortly before the handoff, promote the animated layers so every
      // handoff frame is compositing only; nothing repaints mid-scroll. The
      // Page 01 resting state is left exactly as approved. Demotion repaints
      // the hero, so it waits until scrolling has stopped.
      const prewarm = .3;
      let live: boolean | undefined, wantsLive = false;
      const setLive = (isLive: boolean) => {
        if (isLive === live) return;
        hero.classList.toggle("journey-live", isLive);
        sceneStyle("visibility", isLive ? "visible" : "hidden");
        veilStyle("visibility", isLive && !occluded ? "visible" : "hidden");
        live = isLive;
      };
      const demoteAtRest = () => { if (!wantsLive) setLive(false); };
      ScrollTrigger.addEventListener("scrollEnd", demoteAtRest);
      const frame = (scroll: number, force = false) => {
        wantsLive = scroll > startPosition - height * prewarm;
        if (wantsLive || live === undefined) setLive(wantsLive);
        render(clamp01((scroll - startPosition) / (height * travel)), force);
      };
      const trigger = ScrollTrigger.create({
        id: "ddc-scene-handoff", trigger: root,
        start: () => startPosition - height * prewarm,
        end: () => startPosition + height * travel,
        onRefreshInit: measure,
        onRefresh: (self) => frame(self.scroll(), true),
        onUpdate: (self) => frame(self.scroll()),
      });
      frame(trigger.scroll(), true);
      return () => {
        ScrollTrigger.removeEventListener("scrollEnd", demoteAtRest);
        trigger.kill();
        root.classList.remove("journey-overlap");
        hero.classList.remove("journey-departure", "journey-occluded", "journey-live");
        next.classList.remove("journey-arrival");
        hero.style.removeProperty("scale");
        ["height", "transform-origin", "scale", "translate", "visibility"].forEach((name) => veil.style.removeProperty(name));
        ["scale", "translate"].forEach((name) => globe.style.removeProperty(name));
        ["filter", "visibility"].forEach((name) => bridge.style.removeProperty(name));
        nav.style.removeProperty("filter");
        ["filter", "scale"].forEach((name) => content.style.removeProperty(name));
        ["transform", "transform-origin", "mask-image", "clip-path", "visibility"].forEach((name) => scene.style.removeProperty(name));
        art.forEach((element) => element.style.removeProperty("--scene-internals"));
        root.style.removeProperty("--handoff-height");
        root.style.removeProperty("--arrival-travel");
        ["--handoff-height", "--arrival-distance", "--arrival-content-height"].forEach((name) => next.style.removeProperty(name));
        delete root.dataset.handoffProgress;
        delete next.dataset.handoffProgress;
        delete next.dataset.arrivalSettled;
        delete next.dataset.arrivalProgress;
        delete next.dataset.arrivalRunning;
        next.dispatchEvent(new Event("journey:arrival-state"));
      };
    });
    return () => media.revert();
  }, []);
  return <div ref={veilRef} className="journey-veil" aria-hidden="true" />;
}
