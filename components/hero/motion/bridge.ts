import { phase } from "./state";

export function createSignalBridge(root: HTMLElement) {
  const svg = root.querySelector<SVGSVGElement>(".signal-bridge")!;
  const paths = [...svg.querySelectorAll<SVGPathElement>(".signal-path")];
  const heads = [...svg.querySelectorAll<SVGCircleElement>("circle")];
  // Rewriting an identical path still repaints the full-viewport SVG layer.
  let lastOpacity = "",
    lastPath = "";
  return (
    progress: number,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => {
    const travel = phase(0.54, 0.98, progress);
    const opacity = String(phase(0.52, 0.6, progress));
    if (opacity !== lastOpacity) svg.style.opacity = lastOpacity = opacity;
    if (progress < 0.52) return;
    const bend = width < 700 ? 0.12 : 0.23;
    const c1x = x + width * bend,
      c1y = y + height * 0.11;
    const c2x = width * 0.5,
      c2y = height * 0.58;
    const endX = width * 0.5,
      endY = height * 1.12;
    // Subdivide the cubic so its visible endpoint and moving light coincide.
    // A dash-length reveal uses arc length, which differs from the curve's t.
    const u = 1 - travel;
    const hx =
      u * u * u * x +
      3 * u * u * travel * c1x +
      3 * u * travel * travel * c2x +
      travel ** 3 * endX;
    const hy =
      u * u * u * y +
      3 * u * u * travel * c1y +
      3 * u * travel * travel * c2y +
      travel ** 3 * endY;
    const aX = u * x + travel * c1x;
    const aY = u * y + travel * c1y;
    const bX = u * u * x + 2 * u * travel * c1x + travel * travel * c2x;
    const bY = u * u * y + 2 * u * travel * c1y + travel * travel * c2y;
    const d = `M ${x} ${y} C ${aX} ${aY}, ${bX} ${bY}, ${hx} ${hy}`;
    if (d === lastPath) return;
    lastPath = d;
    paths.forEach((path) => {
      path.setAttribute("d", d);
      path.style.strokeDashoffset = "0";
    });
    heads.forEach((head) => {
      head.setAttribute("cx", String(hx));
      head.setAttribute("cy", String(hy));
    });
  };
}
