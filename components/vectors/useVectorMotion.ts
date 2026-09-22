import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { phase } from "../hero/motion/state";
gsap.registerPlugin(ScrollTrigger);
export function useVectorMotion(ref: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const root = ref.current!,
      items = [...root.querySelectorAll<HTMLElement>(".vector-domain")];
    const media = gsap.matchMedia();
    media.add(
      {
        desktop: "(min-width: 1001px)",
        small: "(max-width: 1000px)",
        reduced: "(prefers-reduced-motion: reduce)",
      },
      (ctx) => {
        const reduced = !!ctx.conditions?.reduced,
          desktop = !!ctx.conditions?.desktop;
        if (reduced) {
          root.dataset.motion = "reduced";
          return;
        }
        root.dataset.motion = desktop ? "desktop" : "mobile";
        let target = 0,
          current = 0,
          visible = false,
          last = performance.now(),
          px = 0,
          py = 0,
          tx = 0,
          ty = 0;
        const trigger = ScrollTrigger.create({
          trigger: root,
          start: desktop ? "top top" : "top 65%",
          end: desktop ? () => `+=${innerHeight * 0.9}` : "bottom bottom",
          onUpdate: (self) => {
            target = self.progress;
          },
          onRefresh: (self) => {
            target = self.progress;
            current = target;
          },
        });
        const observer = new IntersectionObserver(([e]) => {
          visible = e.isIntersecting;
          last = performance.now();
        });
        observer.observe(root);
        const pointer = (e: PointerEvent) => {
          if (e.pointerType === "touch") return;
          const r = root.getBoundingClientRect();
          tx = (e.clientX / r.width - 0.5) * 2;
          ty =
            ((e.clientY - r.top) / Math.min(r.height, innerHeight) - 0.5) * 2;
        };
        const leave = () => {
          tx = ty = 0;
        };
        root.addEventListener("pointermove", pointer, { passive: true });
        root.addEventListener("pointerleave", leave);
        const tick = () => {
          const now = performance.now(),
            dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          if (!visible || document.hidden) return;
          current += (target - current) * (1 - Math.exp(-dt / 0.1));
          px += (tx - px) * (1 - Math.exp(-dt / 0.25));
          py += (ty - py) * (1 - Math.exp(-dt / 0.25));
          const index = current * 5;
          root.dataset.active = String(Math.round(index));
          items.forEach((item, i) => {
            const focus = 1 - phase(0, 1.15, Math.abs(index - i));
            item.style.setProperty("--focus", String(focus));
            item.style.setProperty("--px", `${px * focus * 5}px`);
            item.style.setProperty("--py", `${py * focus * 3}px`);
          });
          root.style.setProperty("--sequence", String(current));
        };
        gsap.ticker.add(tick);
        return () => {
          trigger.kill();
          observer.disconnect();
          gsap.ticker.remove(tick);
          root.removeEventListener("pointermove", pointer);
          root.removeEventListener("pointerleave", leave);
          items.forEach((e) => {
            e.style.removeProperty("--focus");
            e.style.removeProperty("--px");
            e.style.removeProperty("--py");
          });
        };
      },
    );
    return () => media.revert();
  }, [ref]);
}
