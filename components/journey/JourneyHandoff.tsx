"use client";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollToY, startSmoothScroll } from "./smoothScroll";
import { createDestination } from "./destination";
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
 * The journey master clock: Page 01 → Page 02 → Page 03.
 *
 * Lenis owns scroll smoothing; one ScrollTrigger maps the smoothed position
 * to two consecutive progresses with no scrub delay, and every element of all
 * three scenes is rendered from them in the same frame, writing only
 * per-element properties (no inherited custom properties on large subtrees).
 *
 *   a  Page 01 → Page 02 arrival (Page 02 held at its top by native sticky)
 *   –  Page 02 scrolls natively to its last viewport
 *   u  Page 02 → Page 03 departure (Page 02 held at its bottom and Page 03 at
 *      its top, both by native sticky; see destination.ts)
 */
export default function JourneyHandoff() {
  const veilRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>(".hero-scroll");
    const hero = root?.querySelector<HTMLElement>(".hero");
    const next = document.querySelector<HTMLElement>("#challenge-vectors");
    const scene = next?.querySelector<HTMLElement>(".vectors-screen");
    const veil = veilRef.current;
    const finale = document.querySelector<HTMLElement>("#event-highlights");
    if (!root || !hero || !next || !scene || !veil) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)", () =>
      startSmoothScroll(),
    );
    media.add({ animate: "(prefers-reduced-motion: no-preference)", compact: "(max-width: 1024px)" }, (context) => {
      if (!context.conditions?.animate) return;
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
      const destination = finale ? createDestination(finale, styleWriter) : null;
      const compact = !!context.conditions?.compact;
      const travel = compact ? .85 : 1.4, departTravel = compact ? .9 : 1.6;
      let height = hero.clientHeight, contentHeight = scene.offsetHeight, startPosition = 0;
      let departStart = 0, departDistance = 0;
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
        // Page 02 is held at its last viewport while it recedes; Page 03 is
        // laid over exactly that viewport and held while it resolves.
        departDistance = destination ? height * departTravel : 0;
        departStart = startPosition + height * travel + Math.max(0, contentHeight - height);
        next.style.setProperty("--departure-distance", `${departDistance}px`);
        next.style.setProperty("--pin-top", `${Math.min(0, height - contentHeight) - height * travel}px`);
        if (finale && destination) {
          finale.style.setProperty("--destination-overlap", `${Math.min(contentHeight, height) + departDistance}px`);
          finale.style.setProperty("--destination-height", `${destination.sceneHeight() + departDistance}px`);
          destination.measure();
        }
        // Three hero heights, soft band centred at two; same origin as the hero.
        veil.style.height = `${height * 3}px`;
        veil.style.transformOrigin = `35% ${height * .25}px`;
      };
      measure();
      root.classList.add("journey-overlap");
      hero.classList.add("journey-departure");
      next.classList.add("journey-arrival");
      finale?.classList.add("journey-destination");

      // Page 02 has one transform writer: the arrival pose until it lands,
      // then the recession pose as the camera pulls away from it.
      let posed = "";
      const writeScenePose = (a: number, u: number, force = false) => {
        const key = `${a}|${u}`;
        if (key === posed && !force) return;
        posed = key;
        if (u <= 0) {
          const pose = 1 - sineInOut(a);
          sceneStyle("transform-origin", "50% 30%");
          sceneStyle("transform", `perspective(1800px) rotateY(${(pose * -4).toFixed(4)}deg) rotateX(${(pose * 14).toFixed(4)}deg) scale(${(1 - pose * .22).toFixed(5)})`);
        } else {
          // The hold catches the scene at the scroll velocity it arrived with
          // and eases it out, so it never stops dead against the pin; then the
          // whole composition recedes in depth, internal layout untouched.
          const held = u * departDistance, give = height * .16;
          const drift = give * (1 - Math.exp(-held / give));
          const recede = smoothPhase(0, .55, u);
          sceneStyle("transform-origin", `50% ${(Math.max(contentHeight, height) - height / 2).toFixed(1)}px`);
          sceneStyle("transform", `perspective(1800px) translateY(${(-drift).toFixed(2)}px) rotateX(${(recede * 7).toFixed(4)}deg) scale(${(1 - recede * .12).toFixed(5)})`);
        }
        // Fully behind Page 03's depth layer from u = .5: stop drawing it.
        sceneStyle("opacity", u >= .5 ? "0" : "");
        sceneStyle("pointer-events", u > .15 ? "none" : "");
      };

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

        // Page 02 arrives as one plane, driven by the same progress (pose is
        // written by writeScenePose).
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
      // Page 03's layers are promoted the same way, and demoted once it has
      // settled (it is the end of the document) or been left behind.
      let finaleLive: boolean | undefined, wantsFinale = false;
      const setFinaleLive = (isLive: boolean) => {
        if (isLive === finaleLive) return;
        destination?.setLive(isLive);
        finaleLive = isLive;
      };
      const demoteAtRest = () => {
        if (!wantsLive) setLive(false);
        if (!wantsFinale) setFinaleLive(false);
      };
      ScrollTrigger.addEventListener("scrollEnd", demoteAtRest);
      let departing = 0;
      const frame = (scroll: number, force = false) => {
        wantsLive = scroll > startPosition - height * prewarm;
        if (wantsLive || live === undefined) setLive(wantsLive);
        const a = clamp01((scroll - startPosition) / (height * travel));
        departing = departDistance ? clamp01((scroll - departStart) / departDistance) : 0;
        wantsFinale = !!destination && scroll > departStart - height * prewarm && departing < 1;
        if (wantsFinale || finaleLive === undefined) setFinaleLive(wantsFinale);
        render(a, force);
        destination?.render(departing);
        writeScenePose(a, departing, force);
      };
      const trigger = ScrollTrigger.create({
        id: "ddc-scene-handoff", trigger: root,
        start: () => startPosition - height * prewarm,
        end: () => destination ? departStart + departDistance : startPosition + height * travel,
        onRefreshInit: measure,
        onRefresh: (self) => frame(self.scroll(), true),
        onUpdate: (self) => frame(self.scroll()),
      });
      frame(trigger.scroll(), true);

      // Every scene rests somewhere other than where its element starts, so
      // in-page links and keyboard focus go to each scene's resting position.
      const restingPosition = (hash: string) =>
        hash === "#home" ? 0
          : hash === "#challenge-vectors" ? Math.ceil(startPosition + height * travel)
            : hash === "#event-highlights" && destination ? Math.ceil(departStart + departDistance)
              : null;
      const onLinkClick = (event: MouseEvent) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const link = (event.target as Element).closest?.<HTMLAnchorElement>("a[href*='#']");
        if (!link || link.pathname !== location.pathname || link.origin !== location.origin) return;
        const target = restingPosition(link.hash);
        if (target === null) return;
        event.preventDefault();
        if (location.hash !== link.hash) history.pushState(null, "", link.hash);
        scrollToY(target);
      };
      const onFocus = (event: FocusEvent) => {
        if (departing < 1 && finale?.contains(event.target as Node)) scrollToY(Math.ceil(departStart + departDistance));
      };
      const followLocation = () => {
        const target = restingPosition(location.hash);
        if (target !== null) scrollToY(target);
      };
      const anchorFrame = requestAnimationFrame(followLocation);
      window.addEventListener("popstate", followLocation);
      document.addEventListener("click", onLinkClick);
      finale?.addEventListener("focusin", onFocus);
      return () => {
        cancelAnimationFrame(anchorFrame);
        window.removeEventListener("popstate", followLocation);
        document.removeEventListener("click", onLinkClick);
        finale?.removeEventListener("focusin", onFocus);
        ScrollTrigger.removeEventListener("scrollEnd", demoteAtRest);
        trigger.kill();
        destination?.cleanup();
        finale?.classList.remove("journey-destination");
        ["--destination-overlap", "--destination-height"].forEach((name) => finale?.style.removeProperty(name));
        root.classList.remove("journey-overlap");
        hero.classList.remove("journey-departure", "journey-occluded", "journey-live");
        next.classList.remove("journey-arrival");
        hero.style.removeProperty("scale");
        ["height", "transform-origin", "scale", "translate", "visibility"].forEach((name) => veil.style.removeProperty(name));
        ["scale", "translate"].forEach((name) => globe.style.removeProperty(name));
        ["filter", "visibility"].forEach((name) => bridge.style.removeProperty(name));
        nav.style.removeProperty("filter");
        ["filter", "scale"].forEach((name) => content.style.removeProperty(name));
        ["transform", "transform-origin", "mask-image", "clip-path", "visibility", "opacity", "pointer-events"].forEach((name) => scene.style.removeProperty(name));
        art.forEach((element) => element.style.removeProperty("--scene-internals"));
        root.style.removeProperty("--handoff-height");
        root.style.removeProperty("--arrival-travel");
        ["--handoff-height", "--arrival-distance", "--arrival-content-height", "--departure-distance", "--pin-top"].forEach((name) => next.style.removeProperty(name));
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
