import gsap from "gsap";

export function createScrollTimelines(
  root: HTMLElement,
  mobile: boolean,
  width: number,
  height: number,
) {
  const q = gsap.utils.selector(root);
  const supporting = gsap.timeline({ paused: true });
  supporting
    .to(
      q(
        mobile
          ? ".eyebrow,.hero-description,.hero-meta,.manifesto"
          : ".eyebrow,.hero-description,.hero-meta,.manifesto,.cta-wrap",
      ),
      {
        opacity: 0,
        y: mobile ? -12 : -22,
        duration: 0.23,
        ease: "power1.in",
      },
      0.04,
    )
    .to(
      q(".scroll-cue,.bottom-phrase,.side-phrase,.scan-label,.network-label"),
      {
        opacity: 0,
        duration: 0.14,
        ease: "power2.out",
      },
      0,
    )
    .to({}, { duration: 0.62 });
  // The title retains its material and mass; it passes the left camera edge.
  const spatial = gsap.timeline({ paused: true });
  spatial
    .to(
      q(".title-composition"),
      {
        x: -width * (mobile ? 0.84 : 0.46),
        scale: mobile ? 1.05 : 1.19,
        transformOrigin: "0% 50%",
        duration: 0.58,
        ease: "power2.inOut",
      },
      0.04,
    )
    .to(
      q(".title-composition"),
      {
        clipPath: "inset(0 0 0 100%)",
        duration: 0.2,
        ease: "power1.in",
      },
      0.4,
    )
    .to(
      q(".hyderabad-label"),
      {
        opacity: 0,
        duration: 0.16,
        ease: "power2.out",
      },
      0.63,
    );
  const tagline = root.querySelector<HTMLElement>(".hero-tagline")!;
  const rect = tagline.getBoundingClientRect();
  const titleWidth = Math.min(rect.width, tagline.scrollWidth);
  spatial
    .to(tagline, { opacity: 0, duration: 0.15, ease: "power1.in" }, 0.14)
    .set(
      tagline,
      {
        x: width * 0.5 - rect.left - titleWidth * 0.5,
        y: height * (mobile ? 0.65 : 0.61) - rect.top,
      },
      0.58,
    )
    .fromTo(
      tagline,
      { clipPath: "inset(0 0 100% 0)" },
      {
        clipPath: "inset(0 0 0% 0)",
        opacity: 1,
        duration: 0.22,
        ease: "power2.out",
        immediateRender: false,
      },
      0.71,
    )
    .to({}, { duration: 0.07 });
  if (mobile) {
    const cta = root
      .querySelector<HTMLElement>(".hero-register")!
      .getBoundingClientRect();
    spatial
      .to(
        q(".cta-wrap"),
        { opacity: 0, duration: 0.16, ease: "power1.in" },
        0.16,
      )
      .set(
        q(".cta-wrap"),
        {
          x: width * 0.5 - cta.left - cta.width * 0.5,
          y: height * 0.79 - cta.top,
        },
        0.59,
      )
      .to(
        q(".cta-wrap"),
        { opacity: 1, duration: 0.16, ease: "power2.out" },
        0.76,
      );
  }
  // Normalize both timelines to one scroll unit, independent of target count.
  supporting.to({}, { duration: Math.max(0, 1 - supporting.duration()) });
  spatial.to({}, { duration: Math.max(0, 1 - spatial.duration()) });
  return { supporting, spatial };
}
