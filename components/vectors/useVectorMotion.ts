import { useEffect, type RefObject } from "react";
/** A Page 02 clock. Never refreshes or touches the Hero's GSAP state. */
export function useVectorMotion(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = ref.current!,
      items = [...root.querySelectorAll<HTMLElement>(".vector-domain")];
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      visible = false,
      last = 0,
      active = 0,
      target = 0,
      px = 0,
      py = 0,
      tx = 0,
      ty = 0,
      hover = -1;
    const measure = () => {
      const r = root.getBoundingClientRect();
      target = Math.max(
        0,
        Math.min(
          5,
          ((innerHeight * 0.25 - r.top) / (r.height - innerHeight * 0.5)) * 5,
        ),
      );
    };
    const render = (now: number) => {
      frame = 0;
      if (!visible || document.hidden || preference.matches) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      active += (target - active) * (1 - Math.exp(-dt / 0.12));
      px += (tx - px) * (1 - Math.exp(-dt / 0.23));
      py += (ty - py) * (1 - Math.exp(-dt / 0.23));
      const selected = hover < 0 ? active : hover;
      root.dataset.active = String(Math.round(selected));
      items.forEach((item, i) => {
        const f = Math.max(0, 1 - Math.abs(selected - i));
        item.style.setProperty("--focus", String(f));
        item.style.setProperty("--px", `${px * f * 5}px`);
        item.style.setProperty("--py", `${py * f * 3}px`);
      });
      frame = requestAnimationFrame(render);
    };
    const wake = () => {
      if (!frame && visible && !preference.matches && !document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(render);
      }
    };
    const scroll = () => {
      measure();
      wake();
    };
    const pointer = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const item = (e.target as Element).closest<HTMLElement>(".vector-domain");
      hover = item ? items.indexOf(item) : -1;
      const r = item?.getBoundingClientRect();
      if (r) {
        tx = (e.clientX - r.left) / r.width - 0.5;
        ty = (e.clientY - r.top) / r.height - 0.5;
      }
      wake();
    };
    const leave = () => {
      hover = -1;
      tx = ty = 0;
    };
    const change = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      root.dataset.motion = preference.matches ? "reduced" : "local";
      if (preference.matches)
        items.forEach((e) => {
          e.style.removeProperty("--focus");
          e.style.removeProperty("--px");
          e.style.removeProperty("--py");
        });
      else wake();
    };
    const observer = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      measure();
      wake();
    });
    observer.observe(root);
    root.addEventListener("pointermove", pointer, { passive: true });
    root.addEventListener("pointerleave", leave);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll, { passive: true });
    document.addEventListener("visibilitychange", wake);
    preference.addEventListener("change", change);
    change();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      root.removeEventListener("pointermove", pointer);
      root.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
      document.removeEventListener("visibilitychange", wake);
      preference.removeEventListener("change", change);
    };
  }, [ref]);
}
