import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { HeroMotionState } from "./state";
import { phase } from "./state";
import { createIntro } from "./intro";
import { createScrollTimelines } from "./scroll";
import { createSignalBridge } from "./bridge";
import { isScrollSmoothed } from "@/lib/motion/scrollAuthority";

gsap.registerPlugin(ScrollTrigger);

export function useHeroMotion(
  rootRef: RefObject<HTMLDivElement | null>,
  stateRef: RefObject<HeroMotionState>,
) {
  useLayoutEffect(() => {
    const root = rootRef.current!;
    const hero = root.querySelector<HTMLElement>(".hero")!;
    const state = stateRef.current;
    let hasEntered = false;
    const media = gsap.matchMedia();
    media.add(
      {
        reduced: "(prefers-reduced-motion: reduce)",
        desktop: "(min-width: 1201px)",
        tablet: "(min-width: 701px) and (max-width: 1200px)",
        mobile: "(max-width: 700px)",
        fine: "(hover: hover) and (pointer: fine)",
      },
      (context) => {
        const reduced = !!context.conditions?.reduced;
        const mobile = !!context.conditions?.mobile;
        state.reduced = reduced;
        state.mobile = mobile;
        state.tablet = !mobile && !context.conditions?.desktop;
        state.progress = 0;
        state.pointerX = 0;
        state.pointerY = 0;
        state.elapsed = 0;
        root.dataset.motion = reduced
          ? "reduced"
          : mobile
            ? "mobile"
            : "desktop";
        if (reduced) {
          delete document.documentElement.dataset.heroMotion;
          state.activation = 1;
          root.dataset.intro = "complete";
          root.dataset.progress = "0";
          root.style.setProperty("--scroll-distance", "0px");
          state.renderFrame?.(state);
          return () => {
            state.reduced = true;
          };
        }
        let visible = true,
          tabVisible = !document.hidden,
          pointerTargetX = 0,
          pointerTargetY = 0;
        let target = 0,
          distance = 1,
          last = performance.now(),
          idle = 0,
          resizeFrame = 0;
        let viewportWidth = hero.clientWidth,
          viewportHeight = hero.clientHeight;
        const bridge = createSignalBridge(root);
        const rendered = { progress: NaN, x: NaN, y: NaN };
        const content = root.querySelector<HTMLElement>("#hero-content")!;
        const cta = root.querySelector<HTMLElement>(".cta-wrap")!;
        const intro = createIntro(
          root,
          state,
          hasEntered || window.scrollY > 4,
        );
        intro.timeline.eventCallback("onComplete", () => {
          hasEntered = true;
          root.dataset.intro = "complete";
        });
        let timelines = createScrollTimelines(
          root,
          mobile,
          viewportWidth,
          viewportHeight,
        );
        function measure() {
          viewportWidth = hero.clientWidth;
          viewportHeight = hero.clientHeight;
          distance =
            viewportHeight * (mobile ? 0.72 : state.tablet ? 1.05 : 1.32);
          root.style.setProperty("--scroll-distance", `${distance}px`);
        }
        measure();
        const trigger = ScrollTrigger.create({
          id: "ddc-page-01",
          trigger: root,
          start: "top top",
          end: () => `+=${distance}`,
          onUpdate: (self) => {
            target = self.progress;
            if (target > 0.002) intro.finish();
          },
          onRefresh: (self) => {
            target = self.progress;
            state.progress = target;
          },
        });
        target = trigger.progress;
        state.progress = target;
        const onIntent = () => {
          if (intro.timeline.progress() < 1) intro.finish();
          hasEntered = true;
        };
        const onKey = (event: KeyboardEvent) => {
          if (
            [
              "ArrowDown",
              "ArrowUp",
              "PageDown",
              "PageUp",
              "Home",
              "End",
              " ",
            ].includes(event.key)
          )
            onIntent();
        };
        const onPointer = (event: PointerEvent) => {
          if (!context.conditions?.fine || event.pointerType === "touch")
            return;
          pointerTargetX = (event.clientX / viewportWidth - 0.5) * 2;
          pointerTargetY = (event.clientY / viewportHeight - 0.5) * 2;
        };
        const onLeave = () => {
          pointerTargetX = pointerTargetY = 0;
        };
        const onVisibility = () => {
          tabVisible = !document.hidden;
          last = performance.now();
        };
        const observer = new IntersectionObserver(
          (entries) => {
            visible = entries[0].isIntersecting;
            last = performance.now();
          },
          { threshold: 0 },
        );
        observer.observe(hero);
        const onResize = () => {
          cancelAnimationFrame(resizeFrame);
          resizeFrame = requestAnimationFrame(() => {
            intro.finish();
            timelines.supporting.revert();
            timelines.spatial.revert();
            gsap.set(
              root.querySelectorAll(
                ".title-composition,.hero-tagline,.eyebrow,.hero-description,.hero-meta,.manifesto,.cta-wrap,.scroll-cue,.bottom-phrase,.side-phrase,.scan-label,.network-label,.hyderabad-label",
              ),
              { clearProps: "transform,opacity,clipPath" },
            );
            measure();
            timelines = createScrollTimelines(
              root,
              mobile,
              viewportWidth,
              viewportHeight,
            );
            ScrollTrigger.refresh();
            timelines.supporting.progress(target);
            timelines.spatial.progress(state.progress);
          });
        };
        const tick = () => {
          const now = performance.now(),
            dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          if (!visible || !tabVisible) return;
          if (root.dataset.intro === "complete") idle += dt;
          state.elapsed = idle;
          // Scroll input that is already smoothed is followed 1:1; a second
          // interpolation here would lag the globe behind the rest of the page.
          state.progress +=
            (target - state.progress) *
            (isScrollSmoothed()
              ? 1
              : 1 - Math.exp(-dt / (mobile ? 0.065 : 0.105)));
          if (Math.abs(target - state.progress) < 0.000015)
            state.progress = target;
          const pointerWeight = 1 - phase(0.04, 0.42, state.progress);
          state.pointerX +=
            (pointerTargetX * pointerWeight - state.pointerX) *
            (1 - Math.exp(-dt / 0.24));
          state.pointerY +=
            (pointerTargetY * pointerWeight - state.pointerY) *
            (1 - Math.exp(-dt / 0.24));
          if (root.dataset.intro === "complete") {
            timelines.supporting.progress(target);
            timelines.spatial.progress(state.progress);
          }
          // Past 0.42 idle drift and pointer response are fully suppressed,
          // so the globe frame depends only on progress. Re-rendering an
          // identical frame would force the compositor to redraw every layer
          // above the canvas during the handoff.
          const unchanged =
            state.progress >= 0.42 &&
            state.progress === rendered.progress &&
            Math.abs(state.pointerX - rendered.x) < 1e-4 &&
            Math.abs(state.pointerY - rendered.y) < 1e-4;
          if (!unchanged) {
            state.renderFrame?.(state);
            rendered.progress = state.progress;
            rendered.x = state.pointerX;
            rendered.y = state.pointerY;
          }
          const atmosphereX =
            state.pointerX * -2 -
            phase(0.1, 1, state.progress) * (mobile ? 10 : 44);
          const atmosphereY =
            state.pointerY * -1 +
            phase(0.1, 1, state.progress) * (mobile ? 12 : 50);
          // These are inherited by the whole hero; unrounded, the endless
          // pointer decay rewrote them every frame and restyled every node.
          hero.style.setProperty("--atmosphere-x", `${atmosphereX.toFixed(2)}px`);
          hero.style.setProperty("--atmosphere-y", `${atmosphereY.toFixed(2)}px`);
          hero.style.setProperty(
            "--nav-shade",
            String(phase(0.12, 0.45, state.progress) * 0.86),
          );
          if (mobile) {
            const reveal = phase(0.1, 0.44, state.progress);
            hero.style.setProperty(
              "--globe-mask-start",
              `${68 * (1 - reveal)}%`,
            );
            hero.style.setProperty("--globe-mask-end", `${85 - 67 * reveal}%`);
          }
          bridge(
            state.progress,
            state.locator.x,
            state.locator.y,
            viewportWidth,
            viewportHeight,
          );
          root.dataset.progress = state.progress.toFixed(4);
          root.dataset.handoff =
            state.progress > 0.98 ? "ready" : "approaching";
          const contentHidden = !mobile && target > 0.38;
          if (content.inert !== contentHidden) content.inert = contentHidden;
          const ctaHidden = mobile && target > 0.3 && target < 0.77;
          if (cta.inert !== ctaHidden) cta.inert = ctaHidden;
        };
        gsap.ticker.add(tick);
        hero.addEventListener("pointermove", onPointer, { passive: true });
        hero.addEventListener("pointerleave", onLeave);
        window.addEventListener("wheel", onIntent, { passive: true });
        window.addEventListener("touchmove", onIntent, { passive: true });
        window.addEventListener("keydown", onKey);
        window.addEventListener("resize", onResize, { passive: true });
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
          intro.timeline.revert();
          timelines.supporting.revert();
          timelines.spatial.revert();
          trigger.kill();
          gsap.ticker.remove(tick);
          observer.disconnect();
          cancelAnimationFrame(resizeFrame);
          hero.removeEventListener("pointermove", onPointer);
          hero.removeEventListener("pointerleave", onLeave);
          window.removeEventListener("wheel", onIntent);
          window.removeEventListener("touchmove", onIntent);
          window.removeEventListener("keydown", onKey);
          window.removeEventListener("resize", onResize);
          document.removeEventListener("visibilitychange", onVisibility);
          hero.style.removeProperty("--atmosphere-x");
          hero.style.removeProperty("--atmosphere-y");
          ["--nav-shade", "--globe-mask-start", "--globe-mask-end"].forEach(
            (name) => hero.style.removeProperty(name),
          );
          root.querySelector<HTMLElement>("#hero-content")!.inert = false;
          cta.inert = false;
          root.querySelector<SVGSVGElement>(".signal-bridge")!.style.opacity =
            "0";
        };
      },
      root,
    );
    return () => {
      media.revert();
      root.style.removeProperty("--scroll-distance");
    };
  }, [rootRef, stateRef]);
}
