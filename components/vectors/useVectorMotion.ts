import { useEffect, type RefObject } from "react";
/** Demand-driven Page 02 clock; never touches the Hero's GSAP state. */
export function useVectorMotion(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = ref.current!;
    const scene = root.querySelector<HTMLElement>(".vectors-screen")!;
    const items = [...root.querySelectorAll<HTMLElement>(".vector-domain")];
    // Only the artwork reads the focus variables. Writing them on the article
    // restyled and re-laid-out every heading and caption each frame.
    const arts = items.map((item) => item.querySelector<HTMLElement>(".vector-art")!);
    const arriving = () => root.dataset.arrivalSettled === "false";
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const previous = items.map(() => [NaN, NaN, NaN]);
    let frame = 0, visible = false, dirty = true, last = 0;
    let active = 0, target = 0, px = 0, py = 0, tx = 0, ty = 0, hover = -1;
    const damp = (value: number, goal: number, dt: number, time: number) =>
      Math.abs(goal - value) < .0001 ? goal : value + (goal - value) * (1 - Math.exp(-dt / time));
    const paint = () => {
      const selected = hover < 0 ? active : hover;
      const index = String(Math.round(selected));
      if (root.dataset.active !== index) root.dataset.active = index;
      arts.forEach((art, i) => {
        const f = Math.max(0, 1 - Math.abs(selected - i));
        const values = [f, px * f * 5, py * f * 3];
        values.forEach((value, j) => {
          if (value === previous[i][j]) return;
          art.style.setProperty(["--focus", "--px", "--py"][j], `${value}${j ? "px" : ""}`);
          previous[i][j] = value;
        });
      });
    };
    const render = (now: number) => {
      frame = 0;
      if (!visible || document.hidden || preference.matches || arriving()) return;
      if (dirty) {
        const r = scene.getBoundingClientRect();
        target = Math.max(0, Math.min(5, ((innerHeight * .25 - r.top) / (r.height - innerHeight * .5)) * 5));
        dirty = false;
      }
      const dt = Math.min(.05, (now - last) / 1000 || .016);
      last = now;
      active = damp(active, target, dt, .12);
      px = damp(px, tx, dt, .23);
      py = damp(py, ty, dt, .23);
      paint();
      if (active !== target || px !== tx || py !== ty) frame = requestAnimationFrame(render);
    };
    const wake = () => {
      if (!frame && visible && !preference.matches && !document.hidden && !arriving()) {
        last = performance.now();
        frame = requestAnimationFrame(render);
      }
    };
    const arrivalChange = () => {
      cancelAnimationFrame(frame); frame = 0; dirty = true;
      // The scene owns all arrival motion. Resume local focus only at rest.
      hover = -1; tx = ty = 0;
      if (arriving()) {
        // Prepare the resting focus invisibly while the master scene weight
        // is zero, then let that same weight resolve it during arrival.
        active = target = Math.max(0, Math.min(5, (innerHeight * .25 / (scene.offsetHeight - innerHeight * .5)) * 5));
        px = py = 0; paint();
      } else wake();
    };
    const scroll = () => { dirty = true; wake(); };
    const pointer = (e: PointerEvent) => {
      if (e.pointerType === "touch" || arriving()) return;
      const item = (e.target as Element).closest<HTMLElement>(".vector-domain");
      hover = item ? items.indexOf(item) : -1;
      const r = item?.getBoundingClientRect();
      if (r) { tx = (e.clientX - r.left) / r.width - .5; ty = (e.clientY - r.top) / r.height - .5; }
      wake();
    };
    const leave = () => { hover = -1; tx = ty = 0; wake(); };
    const change = () => {
      cancelAnimationFrame(frame); frame = 0;
      root.dataset.motion = preference.matches ? "reduced" : "local";
      if (preference.matches) arts.forEach((art, i) => {
        ["--focus", "--px", "--py"].forEach(name => art.style.removeProperty(name));
        previous[i] = [NaN, NaN, NaN];
      });
      else { dirty = true; if (arriving()) arrivalChange(); else wake(); }
    };
    const observer = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (!visible) { cancelAnimationFrame(frame); frame = 0; }
      else scroll();
    });
    observer.observe(root);
    root.addEventListener("journey:arrival-state", arrivalChange);
    root.addEventListener("pointermove", pointer, { passive: true });
    root.addEventListener("pointerleave", leave);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll, { passive: true });
    document.addEventListener("visibilitychange", wake);
    preference.addEventListener("change", change);
    change();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      root.removeEventListener("journey:arrival-state", arrivalChange);
      root.removeEventListener("pointermove", pointer);
      root.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
      document.removeEventListener("visibilitychange", wake);
      preference.removeEventListener("change", change);
    };
  }, [ref]);
}
