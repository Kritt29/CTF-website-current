/**
 * Which system owns scroll smoothing. When the smooth-scroll controller is
 * active, scroll-linked scenes must follow the (already smoothed) scroll
 * position 1:1 instead of adding their own interpolation on top of it.
 */
let smoothed = false;

export const isScrollSmoothed = () => smoothed;
export const setScrollSmoothed = (value: boolean) => {
  smoothed = value;
};
