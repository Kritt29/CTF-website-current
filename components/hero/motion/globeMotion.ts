import * as THREE from "three";
import { arc, cities, geographic } from "../globeGeometry";
import { phase, clamp, type MotionFrame } from "./state";

type RigParts = {
  rig: THREE.Group;
  earth: THREE.Group;
  flightPaths: THREE.Group;
  moons: THREE.Mesh[];
  marker: THREE.Group;
  glow: THREE.Texture;
  nodes: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>[];
  activation: { value: number };
};

/** All motion is relative to an immutable copy of the approved scene transforms. */
export function createGlobeMotion(parts: RigParts) {
  const { rig, earth, flightPaths, moons, marker, glow, nodes, activation } =
    parts;
  const basePosition = new THREE.Vector3(),
    baseEarth = new THREE.Euler(),
    baseFlight = new THREE.Euler();
  let baseScale = 1,
    width = 1,
    height = 1;
  const baseMoons = moons.map(() => new THREE.Vector3());
  const originalOpacities = nodes.map((node) => node.material.opacity);
  const routePoints = [13, 7, 6, 18, 22, 25, 35, 21].map((index, i) =>
    arc(
      geographic(cities[index][0], cities[index][1]),
      geographic(17.385, 78.4867),
      0.12 + (i % 3) * 0.09,
    ),
  );
  const positions: number[] = [],
    parameters: number[] = [],
    routeIds: number[] = [];
  routePoints.forEach((path, route) => {
    for (let i = 1; i < path.length; i++) {
      positions.push(...path[i - 1].toArray(), ...path[i].toArray());
      parameters.push((i - 1) / 100, i / 100);
      routeIds.push(route, route);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute(
    "routeT",
    new THREE.Float32BufferAttribute(parameters, 1),
  );
  geometry.setAttribute(
    "routeId",
    new THREE.Float32BufferAttribute(routeIds, 1),
  );
  const uniforms = {
    travel: { value: 0 },
    strength: { value: 0 },
    activeRoute: { value: -1 },
  };
  const packetTrails = new THREE.LineSegments(
    geometry,
    new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `attribute float routeT;attribute float routeId;varying float vT;varying float vId;void main(){vT=routeT;vId=routeId;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform float travel;uniform float strength;uniform float activeRoute;varying float vT;varying float vId;void main(){float head=clamp(travel*1.3-vId*.035,0.,1.);float tail=smoothstep(head-.16,head,vT)*(1.-smoothstep(head,head+.012,vT));float selected=activeRoute<0.||abs(activeRoute-vId)<.1?1.:0.;gl_FragColor=vec4(1.,.34,.035,tail*strength*selected);}`,
    }),
  );
  const headGeometry = new THREE.BufferGeometry();
  const headPositions = new Float32Array(routePoints.length * 3);
  headGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(headPositions, 3),
  );
  const packetHeads = new THREE.Points(
    headGeometry,
    new THREE.PointsMaterial({
      map: glow,
      size: 27,
      sizeAttenuation: false,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  packetHeads.frustumCulled = false;
  const acquisition = new THREE.Mesh(
    new THREE.RingGeometry(0.105, 0.111, 64),
    new THREE.MeshBasicMaterial({
      color: 0xff8a27,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  marker.add(acquisition);
  earth.add(packetTrails, packetHeads);
  packetTrails.visible = packetHeads.visible = acquisition.visible = false;
  const locatorOffset = new THREE.Vector3(),
    focusPosition = new THREE.Vector3(),
    departurePosition = new THREE.Vector3();

  function captureBase(w: number, h: number) {
    width = w;
    height = h;
    baseScale = rig.scale.x;
    basePosition.copy(rig.position);
    baseEarth.copy(earth.rotation);
    baseFlight.copy(flightPaths.rotation);
    moons.forEach((moon, i) => baseMoons[i].copy(moon.position));
  }
  function apply(frame: MotionFrame) {
    const p = frame.reduced ? 0 : frame.progress;
    const idle = frame.reduced
      ? 0
      : phase(4, 8, frame.elapsed) * (1 - phase(0.02, 0.22, p));
    const acquire = phase(0.08, 0.58, p),
      depart = phase(0.6, 1, p);
    const pointerX = frame.reduced ? 0 : frame.pointerX,
      pointerY = frame.reduced ? 0 : frame.pointerY;
    activation.value = frame.reduced ? 1 : frame.activation;
    nodes.forEach((node, i) => {
      node.material.opacity =
        originalOpacities[i] * (0.1 + 0.9 * activation.value);
    });
    marker.visible = activation.value > 0.46;
    const scale =
      baseScale *
      (1 +
        (frame.mobile ? 0.1 : frame.tablet ? 0.22 : 0.38) * acquire +
        (frame.mobile ? 0 : 0.12) * depart);
    rig.scale.setScalar(scale);
    earth.rotation.copy(baseEarth);
    earth.rotation.y +=
      acquire * 0.16 -
      depart * 0.06 +
      pointerX * 0.006 +
      Math.sin(frame.elapsed * 0.085) * 0.0016 * idle;
    earth.rotation.x += -acquire * 0.055 + depart * 0.03 + pointerY * 0.004;
    flightPaths.rotation.copy(baseFlight);
    flightPaths.rotation.z +=
      acquire * 0.14 -
      depart * 0.11 +
      Math.sin(frame.elapsed * 0.065) * 0.002 * idle;
    const aspect = width / height;
    locatorOffset
      .copy(marker.position)
      .applyEuler(earth.rotation)
      .multiplyScalar(scale);
    const screenToWorld = (x: number, y: number, out: THREE.Vector3) =>
      out.set((x - 0.5) * 6 * aspect, (0.5 - y) * 6, 0).sub(locatorOffset);
    screenToWorld(
      frame.mobile ? 0.62 : 0.55,
      frame.mobile ? 0.61 : 0.44,
      focusPosition,
    );
    screenToWorld(
      frame.mobile ? 0.43 : 0.25,
      frame.mobile ? 0.38 : 0.2,
      departurePosition,
    );
    rig.position
      .copy(basePosition)
      .lerp(focusPosition, acquire)
      .lerp(departurePosition, depart);
    rig.position.x += pointerX * 0.022;
    rig.position.y -= pointerY * 0.014;
    moons.forEach((moon, i) => {
      moon.position.copy(baseMoons[i]);
      moon.position.x +=
        pointerX * (i === 0 ? 0.009 : 0.016) -
        acquire * 0.18 -
        depart * (i === 0 ? 0.65 : 0.18);
      moon.position.y +=
        pointerY * 0.01 +
        acquire * 0.06 +
        depart * (i === 0 ? 0.48 : 0.2) +
        Math.sin(frame.elapsed * 0.06 + i) * 0.0018 * idle;
    });
    const idleCycle = (frame.elapsed - 8) % 18;
    const idleSignal = idle > 0.99 && frame.elapsed > 8 && idleCycle < 1.7;
    const collecting = p > 0.12 && p < 0.66;
    packetTrails.visible = packetHeads.visible =
      !frame.reduced && (collecting || idleSignal);
    if (packetTrails.visible) {
      const travel = collecting ? phase(0.12, 0.58, p) : idleCycle / 1.7;
      const selected = collecting
        ? -1
        : Math.floor((frame.elapsed - 8) / 18) % routePoints.length;
      uniforms.travel.value = travel;
      uniforms.activeRoute.value = selected;
      uniforms.strength.value = collecting
        ? (1 - phase(0.57, 0.66, p)) * 0.95
        : Math.sin(travel * Math.PI) * 0.45;
      packetHeads.material.opacity = uniforms.strength.value;
      let count = 0;
      routePoints.forEach((path, i) => {
        if (selected >= 0 && selected !== i) return;
        const t = clamp(travel * 1.3 - i * 0.035),
          index = Math.min(99, Math.floor(t * 100)),
          fraction = t * 100 - index;
        const a = path[index],
          b = path[index + 1];
        headPositions[count * 3] = a.x + (b.x - a.x) * fraction;
        headPositions[count * 3 + 1] = a.y + (b.y - a.y) * fraction;
        headPositions[count * 3 + 2] = a.z + (b.z - a.z) * fraction;
        count++;
      });
      headGeometry.setDrawRange(0, count);
      headGeometry.attributes.position.needsUpdate = true;
    }
    acquisition.visible = !frame.reduced && p > 0.24 && p < 0.7;
    acquisition.scale.setScalar(1 + phase(0.24, 0.61, p) * 3.2);
    acquisition.material.opacity =
      Math.sin(phase(0.24, 0.7, p) * Math.PI) * 0.65;
  }
  return { captureBase, apply };
}
