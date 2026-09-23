"use client";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./handoff.css";

gsap.registerPlugin(ScrollTrigger);
const phase = (a: number, b: number, p: number) => gsap.utils.clamp(0, 1, (p - a) / (b - a));

/** The existing handoff clock owns only the overlap between the approved scenes. */
export default function JourneyHandoff() {
  const overlay = useRef<SVGSVGElement>(null);
  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>(".hero-scroll");
    const hero = root?.querySelector<HTMLElement>(".hero");
    const next = document.querySelector<HTMLElement>("#challenge-vectors");
    const heading = next?.querySelector<HTMLElement>("#vectors-title");
    const svg = overlay.current;
    if (!root || !hero || !next || !heading || !svg) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const routes = [...svg.querySelectorAll<SVGGElement>(".journey-transfer")];
      const source = hero.querySelector<SVGPathElement>(".signal-core");
      const globe = hero.querySelector<HTMLElement>(".globe-stage")!;
      const objects = [...next.querySelectorAll<HTMLElement>(".vector-domain:nth-child(-n+3) .vector-art > .vector-object")];
      const state = { progress: 0 };
      const measure = () => {
        const h = `${hero.clientHeight}px`;
        root.style.setProperty("--handoff-height", h);
        next.style.setProperty("--handoff-height", h);
      };
      measure();
      root.classList.add("journey-overlap");
      hero.classList.add("journey-departure");
      next.classList.add("journey-arrival");
      const start = () => root.getBoundingClientRect().top + scrollY + parseFloat(getComputedStyle(root).getPropertyValue("--scroll-distance"));
      const draw = () => {
        const p = state.progress;
        root.dataset.handoffProgress = p.toFixed(4);
        next.dataset.handoffProgress = p.toFixed(4);
        hero.style.setProperty("--journey-depth", String(p));
        next.style.setProperty("--scene-solidity", String(phase(.2, .85, p)));
        svg.style.visibility = p > .005 && p < .94 ? "visible" : "hidden";
        if (p <= .005 || p >= .94 || !source?.getAttribute("d")) return;
        // Sample the existing network origin, including the departing globe's
        // separate CSS depth transform. No duplicate globe or new render loop.
        const point = source.getPointAtLength(0);
        const box = globe.getBoundingClientRect();
        const a = { x: box.left + point.x * box.width / globe.clientWidth, y: box.top + point.y * box.height / globe.clientHeight };
        routes.forEach((group, i) => {
          const path = group.querySelector("path")!;
          const head = group.querySelector("circle")!;
          const rect = objects[i].getBoundingClientRect();
          const end = { x: rect.left + rect.width * .53, y: rect.top + rect.height * .49 };
          const travel = phase(.06 + i * .07, .48 + i * .07, p);
          const u = 1 - travel;
          const c1 = { x: a.x + (end.x - a.x) * .32, y: a.y - innerHeight * (.07 + i * .025) };
          const c2 = { x: end.x - (end.x - a.x) * .16, y: end.y - innerHeight * .14 };
          const b = { x: u*a.x + travel*c1.x, y: u*a.y + travel*c1.y };
          const c = { x: u*u*a.x + 2*u*travel*c1.x + travel*travel*c2.x, y: u*u*a.y + 2*u*travel*c1.y + travel*travel*c2.y };
          const tip = { x: u*u*u*a.x + 3*u*u*travel*c1.x + 3*u*travel*travel*c2.x + travel**3*end.x, y: u*u*u*a.y + 3*u*u*travel*c1.y + 3*u*travel*travel*c2.y + travel**3*end.y };
          path.setAttribute("d", `M${a.x},${a.y} C${b.x},${b.y} ${c.x},${c.y} ${tip.x},${tip.y}`);
          head.setAttribute("cx", String(tip.x));
          head.setAttribute("cy", String(tip.y));
          group.style.opacity = String(phase(.01+i*.06,.10+i*.06,p) * (1-phase(.52+i*.07,.72+i*.07,p)) * .82);
        });
      };
      const timeline = gsap.timeline({
        scrollTrigger: {
          id: "ddc-scene-handoff", trigger: root, start,
          end: () => start() + hero.clientHeight * .75,
          scrub: .22, invalidateOnRefresh: true, onRefreshInit: measure,
        },
        onUpdate: draw,
      });
      timeline.to(state, { progress: 1, duration: 1, ease: "none" }, 0);
      // A shared camera move: Page 02 occupies the departing scene immediately,
      // then returns exactly to its normal document position at the end.
      timeline.fromTo(next,
        { y: () => -hero.clientHeight * .58, scale: .88, rotationX: 7, transformPerspective: 1500, transformOrigin: "50% 45%", "--reveal-top": "48%", "--reveal-bottom": "52%" },
        { y: 0, scale: 1, rotationX: 0, "--reveal-top": "0%", "--reveal-bottom": "0%", duration: 1, ease: "power1.inOut" }, 0);
      timeline.fromTo(heading.children,
        { clipPath: "inset(0 -100% 100% 0)", rotationX: 18, z: -90, transformPerspective: 1100, transformOrigin: "0% 100%" },
        { clipPath: "inset(0 -100% 0% 0)", rotationX: 0, z: 0, duration: .39, stagger: .08, ease: "power2.out" }, .28);
      timeline.fromTo(next.querySelectorAll(".vectors-intro,.vectors-motto,.vectors-index"),
        { clipPath: "inset(0 100% 0 0)" },
        { clipPath: "inset(0 0% 0 0)", duration: .27, stagger: .035, ease: "power1.out" }, .46);
      objects.forEach((object, i) => {
        timeline.fromTo(object,
          { scale: .58, rotationY: (i-1)*-13, rotationX: 13, z: -150, transformPerspective: 1100, filter: "brightness(.35) blur(2px)" },
          { scale: 1, rotationY: 0, rotationX: 0, z: 0, filter: "brightness(1) blur(0px)", duration: .47, ease: "power2.out" }, .15+i*.09);
      });
      timeline.fromTo(next.querySelector(".vectors-nav"),
        { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: .2, ease: "power1.out" }, .77);
      draw();
      const followSource = () => {
        if (state.progress > 0 && state.progress < .94 && !document.hidden) draw();
      };
      gsap.ticker.add(followSource);
      return () => {
        gsap.ticker.remove(followSource);
        root.classList.remove("journey-overlap");
        hero.classList.remove("journey-departure");
        next.classList.remove("journey-arrival");
        hero.style.removeProperty("--journey-depth");
        root.style.removeProperty("--handoff-height");
        next.style.removeProperty("--handoff-height");
        next.style.removeProperty("--scene-solidity");
        delete root.dataset.handoffProgress;
        delete next.dataset.handoffProgress;
        svg.style.visibility = "hidden";
      };
    });
    return () => media.revert();
  }, []);
  return <svg ref={overlay} className="journey-signal" aria-hidden="true" focusable="false">{[0,1,2].map(i => <g key={i} className="journey-transfer"><path className="journey-route" /><circle r="2.4" /></g>)}</svg>;
}

