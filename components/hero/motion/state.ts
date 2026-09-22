export type MotionFrame = {
  progress: number;
  activation: number;
  elapsed: number;
  pointerX: number;
  pointerY: number;
  reduced: boolean;
  mobile: boolean;
  tablet: boolean;
};

export type HeroMotionState = MotionFrame & {
  locator: { x: number; y: number };
  renderFrame: ((frame: MotionFrame) => void) | null;
  ready: boolean;
};

export const createMotionState = (): HeroMotionState => ({
  progress: 0,
  activation: 1,
  elapsed: 0,
  pointerX: 0,
  pointerY: 0,
  reduced: true,
  mobile: false,
  tablet: false,
  locator: { x: 0, y: 0 },
  renderFrame: null,
  ready: false,
});

export const clamp = (x: number) => Math.min(1, Math.max(0, x));
export function phase(start: number, end: number, value: number) {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}
