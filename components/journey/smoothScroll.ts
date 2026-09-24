import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setScrollSmoothed } from "@/lib/motion/scrollAuthority";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger);
let active: Lenis | null = null;

/**
 * The single scroll authority for wheel/trackpad input.
 *
 * Lenis turns discrete wheel notches into one continuous scroll position and
 * writes it on the shared GSAP ticker, ahead of every other callback, then
 * updates ScrollTrigger synchronously. Native sticky layout, the Page 01
 * scene and the journey therefore all read the same position in the same
 * frame. Touch keeps native momentum scrolling (syncTouch is off).
 */
export function startSmoothScroll(lerp = 0.1) {
  const lenis = new Lenis({
    lerp,
    autoRaf: false,
    smoothWheel: true,
    syncTouch: false,
    allowNestedScroll: true,
  });
  const update = () => ScrollTrigger.update();
  lenis.on("scroll", update);
  const frame = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(frame, false, true);
  setScrollSmoothed(true);
  active = lenis;
  return () => {
    gsap.ticker.remove(frame);
    lenis.off("scroll", update);
    lenis.destroy();
    setScrollSmoothed(false);
    if (active === lenis) active = null;
  };
}

/** Moves through the same scroll authority the user's own input uses. */
export function scrollToY(y: number) {
  if (active) active.scrollTo(y);
  else window.scrollTo(0, y);
}
