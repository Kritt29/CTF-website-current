/**
 * Page 02 → Page 03: the second segment of the journey master clock.
 *
 * Everything here is a pure function of one progress `u` (0 → 1) that the
 * master ScrollTrigger derives from the smoothed scroll position. Only
 * transform and opacity are written, on layers promoted for the journey, so
 * every frame is compositing only.
 *
 *   0.00 – 0.55  Page 02 recedes as one plane and loses dominance to depth
 *   0.30 – 0.80  Page 03's environment resolves out of that depth
 *   0.52 – 0.76  the monolith's seams power on, bottom to top
 *   0.66 – 0.98  Page 03's UI resolves in hierarchy; countdown after the seam
 */
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (start: number, end: number, x: number) => {
  const t = clamp01((x - start) / (end - start));
  return t * t * (3 - 2 * t);
};
const sineInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
// Fully resolved layers carry no inline opacity at rest.
const alpha = (value: number) => (value >= 1 ? "" : value.toFixed(4));

// Image-space rectangle of monolith-seam-off.webp inside monolith.webp.
const IMAGE = { width: 1672, height: 941 };
const SEAM = { x: 900, y: 150, width: 772, height: 791 };
const SEAM_FADE = 70;

type Writer = (property: string, value: string) => void;
type Destination = {
  measure: () => void;
  render: (u: number) => void;
  setLive: (live: boolean) => void;
  sceneHeight: () => number;
  cleanup: () => void;
};

export function createDestination(root: HTMLElement, styleWriter: (element: HTMLElement) => Writer): Destination {
  const scene = root.querySelector<HTMLElement>(".highlights-scene")!;
  const pick = (selector: string) => scene.querySelector<HTMLElement>(selector)!;
  const depth = pick(".highlights-depth");
  const environment = pick(".highlights-atmosphere");
  const image = environment.querySelector<HTMLImageElement>(":scope > img")!;
  const seam = pick(".highlights-seam");
  const seamImage = seam.querySelector<HTMLElement>("img")!;
  const frame = pick(".highlights-frame");
  const nav = pick(".highlights-nav");
  const signal = scene.querySelector<SVGElement>(".highlights-signal") as unknown as HTMLElement;
  const heading = pick(".highlights-heading");
  const countdownLabel = pick(".highlights-countdown-label");
  const time = pick(".highlights-time");
  const settleGroup = [".highlights-details", ".highlights-registration", ".highlights-side", ".highlights-footer"].map(pick);
  const managed = [depth, environment, seam, seamImage, frame, nav, signal, heading, countdownLabel, time, ...settleGroup];
  const write = new Map(managed.map((element) => [element, styleWriter(element)]));
  const set = (element: HTMLElement, property: string, value: string) => write.get(element)!(property, value);
  const rootStyle = styleWriter(root);
  let seamTravel = 0, current = NaN;

  const measure = () => {
    // Cover mapping of the environment image, so the unlit seam overlay sits
    // exactly on the monolith at any viewport (layout-time only).
    const width = environment.clientWidth, height = environment.clientHeight;
    const scale = Math.max(width / IMAGE.width, height / IMAGE.height);
    const [px, py] = getComputedStyle(image).objectPosition.split(" ").map((v) => parseFloat(v) / 100);
    const left = (width - IMAGE.width * scale) * (Number.isFinite(px) ? px : .5);
    const top = (height - IMAGE.height * scale) * (Number.isFinite(py) ? py : .5);
    const seamHeight = SEAM.height * scale;
    Object.assign(seam.style, {
      left: `${left + SEAM.x * scale}px`, top: `${top + SEAM.y * scale}px`,
      width: `${SEAM.width * scale}px`, height: `${seamHeight + SEAM_FADE}px`,
    });
    Object.assign(seamImage.style, { width: `${SEAM.width * scale}px`, height: `${seamHeight}px` });
    seamTravel = seamHeight + SEAM_FADE;
    environment.style.transformOrigin = `${left + 1330 * scale}px ${top + 420 * scale}px`;
    current = NaN;
  };

  const render = (u: number) => {
    if (u === current) return;
    current = u;
    // Depth: the darker layer of the same world the camera passes through.
    set(depth, "opacity", alpha(smooth(.04, .5, u)));
    // Environment resolves from depth toward the monolith, contrast first.
    const emerge = smooth(.3, .74, u);
    const approach = easeOutCubic(clamp01((u - .28) / .52));
    set(environment, "opacity", alpha(emerge));
    set(environment, "transform", approach >= 1 ? "none" : `scale(${(.9 + .1 * approach).toFixed(5)})`);
    // Monolith activation: the unlit seams lift away bottom to top.
    const power = sineInOut(clamp01((u - .52) / .24));
    const lift = (power * seamTravel).toFixed(2);
    set(seam, "transform", `translate3d(0, ${-lift}px, 0)`);
    set(seamImage, "transform", `translate3d(0, ${lift}px, 0)`);
    set(seam, "visibility", power >= 1 ? "hidden" : "");
    // UI resolves in hierarchy as grouped layers of one scene.
    const chrome = smooth(.66, .82, u);
    set(frame, "opacity", alpha(chrome));
    set(nav, "opacity", alpha(chrome));
    const title = smooth(.71, .87, u);
    set(heading, "opacity", alpha(title));
    set(heading, "transform", title >= 1 ? "none" : `scale(${(1.035 - .035 * title).toFixed(5)})`);
    set(signal, "opacity", alpha(smooth(.75, .91, u)));
    // The countdown powers on as the seam reaches the top of the monolith.
    set(countdownLabel, "opacity", alpha(smooth(.76, .86, u)));
    const on = smooth(.79, .92, u);
    set(time, "opacity", alpha(on));
    set(time, "transform", on >= 1 ? "none" : `scale(${(1.02 - .02 * on).toFixed(5)})`);
    const settle = alpha(smooth(.85, .98, u));
    settleGroup.forEach((element) => set(element, "opacity", settle));
    rootStyle("pointer-events", u > .92 ? "" : "none");
    root.dataset.departureProgress = u.toFixed(4);
  };

  const setLive = (live: boolean) => root.classList.toggle("journey-live", live);
  const sceneHeight = () => scene.offsetHeight;
  const cleanup = () => {
    root.classList.remove("journey-live");
    root.style.removeProperty("pointer-events");
    delete root.dataset.departureProgress;
    managed.forEach((element) => ["opacity", "transform", "visibility"].forEach((name) => element.style.removeProperty(name)));
    ["left", "top", "width", "height"].forEach((name) => seam.style.removeProperty(name));
    ["width", "height"].forEach((name) => seamImage.style.removeProperty(name));
    environment.style.removeProperty("transform-origin");
  };
  return { measure, render, setLive, sceneHeight, cleanup };
}
