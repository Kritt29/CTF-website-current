"use client";
import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./handoff.css";

gsap.registerPlugin(ScrollTrigger);
const smoothPhase = (start: number, end: number, progress: number) => {
  const t = gsap.utils.clamp(0, 1, (progress - start) / (end - start));
  return t * t * (3 - 2 * t);
};

/** Native sticky framing, one scrubbed scene clock, no scroll-counter tween. */
export default function JourneyHandoff() {
  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>(".hero-scroll");
    const hero = root?.querySelector<HTMLElement>(".hero");
    const next = document.querySelector<HTMLElement>("#challenge-vectors");
    const scene = next?.querySelector<HTMLElement>(".vectors-screen");
    if (!root || !hero || !next || !scene) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const state = { progress: 0 };
      const travel = 1.4;
      let height = hero.clientHeight, contentHeight = scene.offsetHeight, startPosition = 0;
      let settled: boolean | undefined, occluded: boolean | undefined;
      let running: boolean | undefined;
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
      };
      measure();
      root.classList.add("journey-overlap");
      hero.classList.add("journey-departure");
      next.classList.add("journey-arrival");
      const draw = () => {
        const a = state.progress;
        const moving = a > 0 && a < 1;
        if (moving !== running) {
          next.dataset.arrivalRunning = String(moving);
          running = moving;
        }
        // Preserve the approved outgoing timing: .75 viewport, followed by
        // .65 viewport of arrival. Both are derived from this one clock.
        const p = Math.min(1, a * travel / .75);
        const arrival = smoothPhase(.08, .9, p);
        const hidden = p >= .9;
        if (hidden !== occluded) {
          hero.classList.toggle("journey-occluded", hidden);
          occluded = hidden;
        }
        root.dataset.handoffProgress = next.dataset.handoffProgress = String(p);
        hero.style.setProperty("--journey-depth", String(p));
        const edge = `${height * (-.10 + arrival * 1.35)}px`;
        // Clear the entire incoming surface before retiring its mask, including
        // on a fast scroll that has already exposed the lower page.
        const clearTail = Math.max(0, contentHeight + 50 - height * 1.25) * smoothPhase(.54, .92, a);
        scene.style.setProperty("--arrival-edge", `${height * (-.10 + arrival * 1.35) + clearTail}px`);
        hero.style.setProperty("--arrival-edge", edge);
        next.style.setProperty("--scene-internals", String(smoothPhase(.93, 1, a)));
        next.dataset.arrivalProgress = String(a);
        // Switch only at the exact endpoint, never ahead of the scrubbed pose.
        const atRest = a === 1;
        if (atRest !== settled) {
          next.dataset.arrivalSettled = String(atRest);
          next.dispatchEvent(new Event("journey:arrival-state"));
          settled = atRest;
        }
      };
      const timeline = gsap.timeline({
        scrollTrigger: {
          id: "ddc-scene-handoff", trigger: root,
          start: () => startPosition,
          end: () => startPosition + height * travel,
          scrub: .18, invalidateOnRefresh: true, onRefreshInit: measure,
        },
        onUpdate: draw,
      });
      timeline.to(state, { progress: 1, duration: 1, ease: "none" }, 0);
      // Native sticky framing follows wheel position without delay. The only
      // interpolated transform is the approved camera/depth pose itself.
      timeline.fromTo(scene,
        { scale: .78, rotationX: 14, rotationY: -4, transformPerspective: 1800, transformOrigin: "50% 30%" },
        { scale: 1, rotationX: 0, rotationY: 0, duration: 1, ease: "sine.inOut" }, 0);
      draw();
      return () => {
        root.classList.remove("journey-overlap");
        hero.classList.remove("journey-departure", "journey-occluded");
        next.classList.remove("journey-arrival");
        hero.style.removeProperty("--journey-depth");
        hero.style.removeProperty("--arrival-edge");
        scene.style.removeProperty("--arrival-edge");
        root.style.removeProperty("--handoff-height");
        root.style.removeProperty("--arrival-travel");
        ["--handoff-height", "--arrival-distance", "--arrival-content-height", "--scene-internals"].forEach(name => next.style.removeProperty(name));
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
  return null;
}
