import gsap from "gsap";
import type { HeroMotionState } from "./state";

export function createIntro(
  root: HTMLElement,
  state: HeroMotionState,
  immediate: boolean,
) {
  const q = gsap.utils.selector(root);
  const timeline = gsap.timeline({ paused: true });
  timeline
    .fromTo(
      state,
      { activation: 0.12 },
      { activation: 1, duration: 1.15, ease: "power2.inOut" },
      0,
    )
    .fromTo(
      q(".globe-stage"),
      { opacity: 0.42 },
      { opacity: 1, duration: 1.15, ease: "power2.out", clearProps: "opacity" },
      0,
    )
    .fromTo(
      q(".hero-nav"),
      { opacity: 0.5 },
      { opacity: 1, duration: 0.55, clearProps: "opacity" },
      0,
    )
    .fromTo(
      q(".title-composition"),
      { clipPath: "inset(0 100% 0 0)" },
      {
        clipPath: "inset(0 0% 0 0)",
        duration: 0.85,
        ease: "power3.inOut",
        clearProps: "clipPath",
      },
      0.12,
    )
    // The X is revealed as cold metal, then ignites once the title wipe reaches it.
    .fromTo(
      q(".title-x"),
      { "--x-heat": 0 },
      { "--x-heat": 1.35, duration: 0.24, ease: "power2.in" },
      0.9,
    )
    .to(
      q(".title-x"),
      { "--x-heat": 1, duration: 0.55, ease: "power2.out", clearProps: "--x-heat" },
      1.14,
    )
    .fromTo(
      q(".eyebrow,.hero-description,.hero-tagline,.hero-meta,.cta-wrap"),
      { opacity: 0.08 },
      { opacity: 1, duration: 0.65, ease: "power2.out", clearProps: "opacity" },
      0.45,
    )
    .fromTo(
      q(".system-label"),
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: "power2.out", clearProps: "opacity" },
      0.9,
    )
    .fromTo(
      q(".scroll-cue,.bottom-phrase,.side-phrase"),
      { opacity: 0 },
      { opacity: 1, duration: 0.4, clearProps: "opacity" },
      1.35,
    );
  const finish = () => {
    timeline.progress(1);
    state.activation = 1;
    root.dataset.intro = "complete";
  };
  timeline.eventCallback("onComplete", () => {
    root.dataset.intro = "complete";
  });
  delete document.documentElement.dataset.heroMotion;
  if (immediate) finish();
  else {
    root.dataset.intro = "running";
    timeline.play();
  }
  return { timeline, finish };
}
