import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { motion } from "./content";
import type { SceneState } from "./sceneState";
gsap.registerPlugin(ScrollTrigger);
export function useHeroTransition(
  root: RefObject<HTMLElement | null>,
  state: RefObject<SceneState>,
) {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(
      {
        normal: "(prefers-reduced-motion: no-preference)",
        reduced: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const reduced = !!context.conditions?.reduced;
        state.current.reduced = reduced;
        state.current.progress = 0;
        state.current.reveal = reduced ? 1 : 0;
        if (reduced) {
          gsap.set(
            el.querySelectorAll(
              ".hero-copy,.hero-nav,.system-label,.scroll-cue",
            ),
            { opacity: 1 },
          );
          return;
        }
        const q = gsap.utils.selector(el);
        const opening = gsap.timeline({ defaults: { ease: "power3.out" } });
        opening
          .from(q(".hero-nav"), { opacity: 0.12, duration: 0.7 }, 0)
          .to(
            state.current,
            { reveal: 1, duration: 1.5, ease: "power2.inOut" },
            0.1,
          )
          .from(q(".eyebrow"), { opacity: 0, y: 5, duration: 0.55 }, 0.35)
          .from(
            q(".title-ddc"),
            { clipPath: "inset(100% 0 0 0)", y: 16, duration: 0.75 },
            0.55,
          )
          .from(
            q(".title-ctf"),
            { clipPath: "inset(100% 0 0 0)", y: 25, duration: 0.65 },
            0.82,
          )
          .from(
            q(".hero-tagline,.hero-description,.manifesto"),
            { opacity: 0, y: 8, stagger: 0.07, duration: 0.5 },
            1.1,
          )
          .from(
            q(".system-label"),
            { opacity: 0, duration: 0.65, stagger: 0.12 },
            1.15,
          )
          .from(
            q(".hero-register,.hero-meta"),
            { opacity: 0, y: 6, duration: 0.45, stagger: 0.1 },
            1.45,
          )
          .from(
            q(".scroll-cue,.bottom-phrase,.side-phrase"),
            { opacity: 0, duration: 0.5 },
            1.75,
          );
        const lenis = new Lenis({
          lerp: 0.15,
          smoothWheel: true,
          syncTouch: false,
        });
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        const route = el.querySelector<SVGPathElement>("#page-two-route")!;
        route.setAttribute("pathLength", "1");
        const length = 1;
        gsap.set(route, { strokeDasharray: length, strokeDashoffset: length });
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: () => `+=${innerHeight * motion.scrollDistance}`,
            pin: true,
            scrub: motion.scrub,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              el.dataset.transitionProgress = self.progress.toFixed(3);
            },
          },
        });
        tl.to(state.current, { progress: 1, duration: 1, ease: "none" }, 0)
          .to(
            q(".hero-description,.hero-meta,.eyebrow,.manifesto"),
            { opacity: 0, y: -24, duration: 0.32, ease: "none" },
            0,
          )
          .to(
            q(".title-ddc"),
            {
              y: -70,
              x: -18,
              opacity: 0.08,
              scale: 0.94,
              duration: 0.8,
              ease: "none",
            },
            0.1,
          )
          .to(
            q(".title-ctf"),
            {
              y: -30,
              x: -40,
              opacity: 0.06,
              scale: 1.035,
              duration: 0.8,
              ease: "none",
            },
            0.14,
          )
          .to(
            q(".hero-tagline,.hero-register"),
            { opacity: 0, y: -25, duration: 0.45 },
            0.2,
          )
          .to(
            q(
              ".scroll-cue,.bottom-phrase,.side-phrase,.scan-label,.network-label",
            ),
            { opacity: 0, duration: 0.2 },
            0,
          )
          .to(q(".transition-route"), { opacity: 1, duration: 0.22 }, 0.42)
          .to(
            route,
            { strokeDashoffset: 0, duration: 0.54, ease: "none" },
            0.46,
          );
        const onIntent = () => {
          if (opening.progress() < 1) opening.progress(1);
        };
        window.addEventListener("wheel", onIntent, { passive: true });
        window.addEventListener("touchstart", onIntent, { passive: true });
        return () => {
          opening.kill();
          tl.scrollTrigger?.kill();
          tl.kill();
          lenis.destroy();
          gsap.ticker.remove(tick);
          window.removeEventListener("wheel", onIntent);
          window.removeEventListener("touchstart", onIntent);
        };
      },
    );
    return () => mm.revert();
  }, [root, state]);
}
