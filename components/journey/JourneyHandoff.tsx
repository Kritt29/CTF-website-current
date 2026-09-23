"use client";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./handoff.css";

gsap.registerPlugin(ScrollTrigger);

/** An optional bridge between the two approved scenes, never mounted standalone. */
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
      const path = svg.querySelector<SVGPathElement>(".journey-route")!;
      const head = svg.querySelector<SVGCircleElement>("circle")!;
      const source = hero.querySelector<SVGPathElement>(".signal-core");
      const state = { progress: 0 };
      hero.classList.add("journey-departure");
      next.classList.add("journey-arrival");
      const draw = () => {
        const p = state.progress;
        svg.style.visibility = p > 0.001 && p < 0.999 ? "visible" : "hidden";
        hero.style.setProperty("--journey-depth", String(p));
        next.style.setProperty("--journey-edge", String(1 - p));
        next.dataset.handoffProgress = p.toFixed(4);
        if (p <= 0 || p >= 1) return;
        // Start on the existing Hyderabad route in screen coordinates, including
        // its inherited scene transform. The new route shares its exact tangent.
        const length = source?.getTotalLength() || 0;
        const sourceSvg = source?.ownerSVGElement;
        const sourceRect = sourceSvg?.getBoundingClientRect();
        const at = (fraction: number) => {
          const point = source!.getPointAtLength(length * fraction);
          return new DOMPoint(sourceRect!.left + point.x * sourceRect!.width / sourceSvg!.clientWidth, sourceRect!.top + point.y * sourceRect!.height / sourceSvg!.clientHeight);
        };
        const a = length && sourceRect ? at(0.82) : new DOMPoint(innerWidth * .5, hero.getBoundingClientRect().bottom - 70);
        const before = length && sourceRect ? at(0.80) : new DOMPoint(a.x, a.y - 10);
        const r = heading.getBoundingClientRect();
        const end = { x: r.left - 18, y: r.top + r.height * .56 };
        const c1 = { x: a.x + (a.x - before.x) * 6, y: a.y + Math.max(45, (a.y - before.y) * 6) };
        const c2 = { x: end.x + innerWidth * .27, y: end.y - 100 };
        const t = Math.min(1, p / .72), u = 1 - t;
        const b = { x: u * a.x + t * c1.x, y: u * a.y + t * c1.y };
        const c = { x: u*u*a.x + 2*u*t*c1.x + t*t*c2.x, y: u*u*a.y + 2*u*t*c1.y + t*t*c2.y };
        const tip = { x: u*u*u*a.x + 3*u*u*t*c1.x + 3*u*t*t*c2.x + t*t*t*end.x, y: u*u*u*a.y + 3*u*u*t*c1.y + 3*u*t*t*c2.y + t*t*t*end.y };
        path.setAttribute("d", `M${a.x},${a.y} C${b.x},${b.y} ${c.x},${c.y} ${tip.x},${tip.y}`);
        head.setAttribute("cx", String(tip.x));
        head.setAttribute("cy", String(tip.y));
        svg.style.opacity = String(Math.min(1, p * 14) * Math.min(1, (1 - p) * 7));
      };
      const timeline = gsap.timeline({
        scrollTrigger: {
          id: "ddc-scene-handoff",
          trigger: root,
          start: "bottom bottom",
          end: () => `+=${hero.clientHeight * .96}`,
          scrub: .24,
          invalidateOnRefresh: true,
        },
        onUpdate: draw,
      });
      timeline.to(state, { progress: 1, duration: 1, ease: "none" }, 0);
      timeline.fromTo(heading, { clipPath: "inset(0 -100% 100% 0)", rotateX: 12, transformPerspective: 1100, transformOrigin: "50% 100%" },
        { clipPath: "inset(0 -100% 0% 0)", rotateX: 0, duration: .48, ease: "power2.out" }, .32);
      timeline.fromTo(next.querySelectorAll(".vectors-intro,.vectors-motto,.vectors-index"),
        { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: .34, stagger: .04, ease: "power1.out" }, .49);
      // Transform the artwork itself; Page 02 retains ownership of its pointer
      // and category focus transforms on the parent .vector-art elements.
      timeline.fromTo(next.querySelectorAll(".vector-domain:nth-child(-n+3) .vector-object"),
        { scale: .86, rotateX: 8, transformPerspective: 1100, transformOrigin: "50% 50%" },
        { scale: 1, rotateX: 0, duration: .36, stagger: .045, ease: "power2.out" }, .51);
      timeline.to({}, { duration: .04 }, .96);
      draw();
      // The hero has its own damped clock. Follow its moving attachment point
      // until it settles, including when the user reverses direction.
      const followSource = () => {
        if (state.progress > 0 && state.progress < 1 && !document.hidden) draw();
      };
      gsap.ticker.add(followSource);
      return () => {
        gsap.ticker.remove(followSource);
        // matchMedia reverts only the timeline created in this context.
        hero.classList.remove("journey-departure");
        next.classList.remove("journey-arrival");
        hero.style.removeProperty("--journey-depth");
        next.style.removeProperty("--journey-edge");
        delete next.dataset.handoffProgress;
        svg.style.visibility = "hidden";
      };
    });
    return () => media.revert();
  }, []);
  return <svg ref={overlay} className="journey-signal" aria-hidden="true" focusable="false"><path className="journey-route" /><circle r="3" /></svg>;
}

