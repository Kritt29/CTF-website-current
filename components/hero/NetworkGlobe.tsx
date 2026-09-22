"use client";
import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { arc, cities, geographic, seededRandom } from "./globeGeometry";
import { createGlobeMotion } from "./motion/globeMotion";
import type { HeroMotionState } from "./motion/state";

const surfaceVertex = `varying vec2 vUv;varying vec3 vNormal;varying vec3 vPosition;
void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);vPosition=p.xyz;gl_Position=projectionMatrix*p;}`;
const surfaceFragment = `uniform sampler2D dayMap;uniform sampler2D nightMap;uniform sampler2D heightMap;uniform sampler2D detailMap;
varying vec2 vUv;varying vec3 vNormal;varying vec3 vPosition;
void main(){
 vec3 day=texture2D(dayMap,vUv).rgb;vec3 night=texture2D(nightMap,vUv).rgb;
 float h=texture2D(heightMap,vUv).r;
 float dx=h-texture2D(heightMap,vUv+vec2(.0007,0.)).r;
 float dy=h-texture2D(heightMap,vUv+vec2(0.,.0014)).r;
 vec3 n=normalize(vNormal);float facing=max(dot(n,normalize(-vPosition)),0.);
 float rim=pow(1.-facing,5.5);float light=max(dot(n,normalize(vec3(-.45,.8,.8))),0.);
 float land=smoothstep(.018,.07,day.r-day.b*.66);
 float terrain=dot(day,vec3(.28,.56,.16));float relief=abs(dx+dy)*3.5;
 float urban=pow(max(0.,night.r-night.b*.92),1.05)*3.;
 float fractured=smoothstep(.014,.09,abs(dx-dy))*land;
 vec3 base=vec3(.0008,.0017,.002);
 base+=land*(terrain*.12+relief*.52)*vec3(.65,.72,.75)*(light*.7+.2);
 base+=fractured*vec3(.48,.55,.57)*(pow(1.-facing,2.)*.8+.1);
 float silver=smoothstep(.67,.83,vUv.y)*.8;
 base+=urban*mix(vec3(1.,.34,.045),vec3(.8,.9,.94),silver)*1.1;
 base+=rim*vec3(.39,.46,.48)*(light*.8+.2)*(0.3+terrain*2.8);
 vec2 detailUv=fract(vUv*vec2(4.,2.));
 float detail=texture2D(detailMap,detailUv).r;
 float fracture=abs(detail-texture2D(detailMap,detailUv+vec2(.002,.001)).r);
 float shell=pow(1.-facing,3.2);
 base+=vec3(.65,.74,.76)*smoothstep(.08,.34,fracture)*shell*.75;
 gl_FragColor=vec4(base,1.);
}`;
type LandData = {
  features: {
    geometry: { type: string; coordinates: number[][][] | number[][][][] };
  }[];
};
function stableLayer<T extends THREE.Object3D>(object: T, order: number): T {
  object.renderOrder = order;
  return object;
}
function nodeTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,235,1)");
  g.addColorStop(0.095, "rgba(255,255,220,1)");
  g.addColorStop(0.17, "rgba(255,169,60,1)");
  g.addColorStop(0.26, "rgba(255,82,0,.65)");
  g.addColorStop(0.52, "rgba(255,63,0,.14)");
  g.addColorStop(1, "rgba(255,50,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Approved artwork, with an imperative render hook for the shared motion clock. */
export default function NetworkGlobe({
  motion,
}: {
  motion: RefObject<HeroMotionState>;
}) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = container.current!;
    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      host.classList.add("globe-fallback");
      return;
    }
    renderer.setClearColor(0, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
    renderer.domElement.className = "globe-canvas";
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.OrthographicCamera(-5, 5, 3, -3, 0.1, 100);
    camera.position.z = 12;
    const rig = new THREE.Group(),
      earth = new THREE.Group(),
      flightPaths = new THREE.Group();
    scene.add(rig);
    rig.add(earth, flightPaths);
    const networkActivation = { value: 1 };
    const signalNodes: THREE.Points<
      THREE.BufferGeometry,
      THREE.PointsMaterial
    >[] = [];
    const random = seededRandom(93),
      mobile = innerWidth < 700;
    let ready = false,
      scheduled = 0;
    const requestRender = () => {
      if (disposed || !ready) return;
      cancelAnimationFrame(scheduled);
      scheduled = requestAnimationFrame(() => {
        if (motion.current.renderFrame) motion.current.renderFrame(motion.current);
        else render();
      });
    };
    const textures: THREE.Texture[] = [];
    const loader = new THREE.TextureLoader();
    const load = (url: string) => {
      const t = loader.load(url, requestRender);
      textures.push(t);
      return t;
    };
    const day = load("/assets/earth-day.jpg"),
      night = load("/assets/earth-lights.png"),
      height = load("/assets/earth-topology.png"),
      detail = load("/assets/distressed-metal.png");
    const moonMap = load("/assets/moon-surface.jpg");
    const moons = [0, 1, 2].map((i) => {
      const moon = new THREE.Mesh(
        new THREE.SphereGeometry(1, 64, 40),
        new THREE.ShaderMaterial({
          uniforms: {
            moonMap: { value: moonMap },
            keyLight: {
              value: new THREE.Vector3(i === 0 ? 0.65 : -0.5, 0.7, -0.18),
            },
            intensity: { value: i === 0 ? 3.7 : 1.1 },
          },
          vertexShader: surfaceVertex,
          fragmentShader: `uniform sampler2D moonMap;uniform vec3 keyLight;uniform float intensity;
          varying vec2 vUv;varying vec3 vNormal;varying vec3 vPosition;
          void main(){
            float h=texture2D(moonMap,vUv).r;
            vec2 d=vec2(h-texture2D(moonMap,vUv+vec2(.001,0.)).r,h-texture2D(moonMap,vUv+vec2(0.,.002)).r);
            vec3 n=normalize(vNormal+vec3(d*1.9,0.));
            float lit=max(dot(n,normalize(keyLight)),0.);
            float rim=pow(1.-max(dot(normalize(vNormal),normalize(-vPosition)),0.),7.);
            float relief=abs(d.x-d.y);
            vec3 color=vec3(.003,.005,.006)+vec3(.7,.76,.78)*(h*h*.8+relief*1.3)*pow(lit,1.8);
            color+=vec3(.46,.53,.56)*rim*pow(lit,1.6)*.65;
            gl_FragColor=vec4(color*intensity,1.);
          }`,
        }),
      );
      moon.rotation.set(0.2, i * 1.3, -0.35);
      scene.add(moon);
      return moon;
    });
    day.anisotropy = night.anisotropy = Math.min(
      renderer.capabilities.getMaxAnisotropy(),
      8,
    );
    earth.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(2, mobile ? 80 : 144, mobile ? 56 : 100),
        new THREE.ShaderMaterial({
          uniforms: {
            dayMap: { value: day },
            nightMap: { value: night },
            heightMap: { value: height },
            detailMap: { value: detail },
          },
          vertexShader: surfaceVertex,
          fragmentShader: surfaceFragment,
        }),
      ),
    );
    // Narrow atmospheric shell; oceans remain nearly black.
    earth.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(2.025, 96, 64),
        new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          vertexShader: surfaceVertex,
          fragmentShader: `varying vec3 vNormal;varying vec3 vPosition;void main(){vec3 n=normalize(vNormal);float f=pow(1.-max(dot(n,normalize(-vPosition)),0.),9.);float lit=.1+max(dot(n,normalize(vec3(-.5,.8,.5))),0.);gl_FragColor=vec4(vec3(.42,.57,.61),f*lit*.18);}`,
        }),
      ),
    );
    const abort = new AbortController();
    fetch("/assets/land.geojson", { signal: abort.signal })
      .then((r) => r.json() as Promise<LandData>)
      .then((data) => {
        if (disposed) return;
        const random = seededRandom(240);
        const vertices: number[] = [],
          colors: number[] = [];
        for (const feature of data.features) {
          const polygons = (
            feature.geometry.type === "Polygon"
              ? [feature.geometry.coordinates]
              : feature.geometry.coordinates
          ) as number[][][][];
          for (const polygon of polygons)
            for (const ring of polygon)
              for (let i = 1; i < ring.length; i++) {
                const a = ring[i - 1],
                  b = ring[i];
                vertices.push(
                  ...geographic(a[1], a[0], 2.006).toArray(),
                  ...geographic(b[1], b[0], 2.006).toArray(),
                );
                const v = 0.28 + random() * 0.65,
                  warm = a[0] > 62 && a[0] < 120 && a[1] < 30 && a[1] > -12;
                for (let j = 0; j < 2; j++)
                  colors.push(
                    warm ? v : v * 0.9,
                    warm ? v * 0.68 : v * 0.96,
                    warm ? v * 0.4 : v,
                  );
              }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(vertices, 3),
        );
        g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
        earth.add(
          stableLayer(
            new THREE.LineSegments(
              g,
              new THREE.LineBasicMaterial({
                vertexColors: true,
                transparent: true,
                opacity: 0.93,
                depthWrite: false,
              }),
            ),
            5,
          ),
        );
        requestRender();
      })
      .catch(() => {});
    const glow = nodeTexture();
    textures.push(glow);
    function points(
      positions: number[],
      size: number,
      opacity: number,
      color: THREE.ColorRepresentation = 0xffffff,
      parent: THREE.Group = earth,
    ) {
      const g = new THREE.BufferGeometry();
      g.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      const p = new THREE.Points(
        g,
        new THREE.PointsMaterial({
          map: glow,
          size,
          sizeAttenuation: false,
          color,
          transparent: true,
          opacity,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      parent.add(p);
      signalNodes.push(p);
      return p;
    }
    const anchor: number[] = [],
      secondary: number[] = [],
      minor: number[] = [];
    cities.forEach(([lat, lon], i) => {
      if (i === 0) return; // The locator has its own clean target and halo.
      (i % 7 === 0 ? anchor : i % 3 === 0 ? secondary : minor).push(
        ...geographic(lat, lon, 2.03).toArray(),
      );
    });
    points(anchor, 37, 0.88);
    points(secondary, 23, 0.95);
    points(minor, 8, 0.85);
    const oceanHubs = [
      [43, 64],
      [34, 96],
      [-13, 64],
      [-29, 100],
      [-38, 138],
      [7, 123],
      [4, 32],
      [-38, 38],
    ];
    points(
      oceanHubs.flatMap(([lat, lon]) => geographic(lat, lon, 2.035).toArray()),
      32,
      0.95,
    );
    const reliefImage = new Image();
    reliefImage.src = "/assets/earth-topology.png";
    reliefImage.onload = () => {
      if (disposed) return;
      const random = seededRandom(137);
      const canvas = document.createElement("canvas");
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(reliefImage, 0, 0, 2048, 1024);
      const pixels = ctx.getImageData(0, 0, 2048, 1024).data;
      const positions: number[] = [],
        colors: number[] = [];
      for (let y = 80; y < 840; y += mobile ? 4 : 2)
        for (let x = 1; x < 2046; x += 2) {
          const p = (y * 2048 + x) * 4;
          const slope =
            Math.abs(pixels[p] - pixels[p + 8]) +
            Math.abs(pixels[p] - pixels[p + 16384]);
          if (pixels[p] < 10 || slope < 16 || random() > 0.57) continue;
          positions.push(
            ...geographic(
              90 - ((y + random()) / 1024) * 180,
              ((x + random()) / 2048) * 360 - 180,
              2.007,
            ).toArray(),
          );
          const v = Math.min(0.8, slope / 100) * (0.4 + random() * 0.6);
          colors.push(v * 0.83, v * 0.95, v);
        }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colors, 3),
      );
      earth.add(
        stableLayer(
          new THREE.Points(
            geometry,
            new THREE.ShaderMaterial({
              vertexColors: true,
              transparent: true,
              depthWrite: false,
              uniforms: {
                pixelRatio: { value: Math.min(devicePixelRatio, 1.8) },
              },
              vertexShader: `uniform float pixelRatio;varying vec3 vColor;varying float edge;void main(){vColor=color;vec3 n=normalize(normalMatrix*normalize(position));edge=pow(1.-abs(n.z),1.5);gl_PointSize=pixelRatio;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
              fragmentShader: `varying vec3 vColor;varying float edge;void main(){gl_FragColor=vec4(vColor,.12+edge*.85);}`,
            }),
          ),
          2,
        ),
      );
      requestRender();
    };
    // City clusters sampled from the night map, not uniformly scattered land dots.
    const image = new Image();
    image.src = "/assets/earth-lights.png";
    image.onload = () => {
      if (disposed) return;
      const random = seededRandom(941);
      const c = document.createElement("canvas");
      c.width = 2048;
      c.height = 1024;
      const ctx = c.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(image, 0, 0, c.width, c.height);
      const px = ctx.getImageData(0, 0, c.width, c.height).data;
      const pos: number[] = [],
        col: number[] = [],
        fine: number[] = [],
        fineColors: number[] = [];
      // Sample the luminous atlas pixels directly so sparse rural lights survive.
      const stride = mobile ? 4 : 2;
      for (let y = 40; y < 880; y += stride)
        for (let x = 0; x < 2048; x += stride) {
          const lon = ((x + random()) / 2048) * 360 - 180,
            lat = 90 - ((y + random()) / 1024) * 180,
            index = (y * 2048 + x) * 4;
          const r = px[index] / 255,
            g = px[index + 1] / 255,
            b = px[index + 2] / 255,
            urban = Math.max(0, r - b * 0.9);
          if (urban > 0.026 && random() < urban * 12) {
            pos.push(...geographic(lat, lon, 2.012).toArray());
            const v = 0.45 + random() * 0.55;
            const silver = lat > 40 || lon < 30;
            col.push(
              v,
              v * (silver ? 0.86 : 0.31 + random() * 0.22),
              v * (silver ? 0.79 : 0.07),
            );
          } else if (lat > -58 && g > 0.08 && r > b * 0.75 && random() > 0.86) {
            fine.push(...geographic(lat, lon, 2.009).toArray());
            const v = 0.16 + Math.pow(random(), 3) * 0.7;
            fineColors.push(v * 0.78, v * 0.88, v);
          }
        }
      // Uneven metropolitan clusters, with positions constrained by the source land map.
      const clusters: number[] = [],
        clusterColors: number[] = [];
      cities.forEach(([lat, lon], city) => {
        const count = mobile ? 50 : city < 12 ? 140 : 65;
        const spread = city < 12 ? 5.3 : 3.4;
        for (let i = 0; i < count; i++) {
          const a = random() * Math.PI * 2,
            d = Math.pow(random(), 1.8) * spread;
          const la = lat + Math.sin(a) * d,
            lo =
              lon +
              (Math.cos(a) * d) /
                Math.max(0.3, Math.cos((lat * Math.PI) / 180));
          const x = Math.max(
              0,
              Math.min(2047, Math.floor(((lo + 180) / 360) * 2047)),
            ),
            y = Math.max(
              0,
              Math.min(1023, Math.floor(((90 - la) / 180) * 1023)),
            ),
            p = (y * 2048 + x) * 4;
          if (px[p] + px[p + 1] < 25 || px[p + 2] > px[p] * 1.8) continue;
          clusters.push(...geographic(la, lo, 2.014).toArray());
          const v = 0.25 + Math.pow(random(), 0.5) * 0.75;
          const silver = la > 40 || lo < 35;
          clusterColors.push(
            v,
            v * (silver ? 0.83 : 0.25 + random() * 0.24),
            v * (silver ? 0.75 : 0.035),
          );
        }
      });
      const clusterGeo = new THREE.BufferGeometry();
      clusterGeo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(clusters, 3),
      );
      clusterGeo.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(clusterColors, 3),
      );
      earth.add(
        stableLayer(
          new THREE.Points(
            clusterGeo,
            new THREE.PointsMaterial({
              size: 1.2,
              sizeAttenuation: false,
              vertexColors: true,
              transparent: true,
              opacity: 0.9,
              depthWrite: false,
            }),
          ),
          3,
        ),
      );
      for (const [p, colors, size, opacity] of [
        [pos, col, 1.55, 0.94],
        [fine, fineColors, 1.1, 0.75],
      ] as [number[], number[], number, number][]) {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
        g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
        earth.add(
          stableLayer(
            new THREE.Points(
              g,
              new THREE.PointsMaterial({
                size,
                sizeAttenuation: false,
                vertexColors: true,
                transparent: true,
                opacity,
                depthWrite: false,
              }),
            ),
            4,
          ),
        );
      }
      requestRender();
    };
    const lineBatches = new Map<
      THREE.Group,
      { positions: number[]; colors: number[]; alphas: number[] }
    >();
    function line(
      path: THREE.Vector3[],
      color: THREE.ColorRepresentation,
      opacity: number,
      parent = earth,
    ) {
      let batch = lineBatches.get(parent);
      if (!batch) {
        batch = { positions: [], colors: [], alphas: [] };
        lineBatches.set(parent, batch);
      }
      const rgb = new THREE.Color(color);
      for (let i = 1; i < path.length; i++) {
        batch.positions.push(...path[i - 1].toArray(), ...path[i].toArray());
        for (let k = 0; k < 2; k++) {
          batch.colors.push(rgb.r, rgb.g, rgb.b);
          batch.alphas.push(opacity);
        }
      }
    }
    oceanHubs.forEach(([lat, lon], i) => {
      const destination = cities[(i * 7 + 6) % cities.length];
      line(
        arc(
          geographic(lat, lon),
          geographic(destination[0], destination[1]),
          0.06 + (i % 3) * 0.11,
        ),
        0xff7106,
        0.28 + (i % 3) * 0.1,
      );
    });
    // Selected routes carry the orange hierarchy; secondary connections are subdued.
    const routes: Array<[number, number, number, number]> = [
      [13, 7, 0.51, 0.8],
      [20, 8, 0.38, 0.62],
      [22, 18, 0.49, 0.48],
      [16, 6, 0.47, 0.74],
      [0, 7, 0.25, 0.9],
      [0, 11, 0.2, 0.67],
      [24, 21, 0.5, 0.4],
      [17, 19, 0.65, 0.6],
      [3, 14, 0.3, 0.55],
      [12, 26, 0.42, 0.72],
      [6, 35, 0.21, 0.6],
      [15, 18, 0.63, 0.32],
      [23, 34, 0.48, 0.42],
      [1, 25, 0.18, 0.45],
      [14, 10, 0.34, 0.54],
      [21, 7, 0.67, 0.45],
      [0, 6, 0.18, 0.35],
      [22, 35, 0.46, 0.6],
    ];
    const junctions: number[] = [],
      weakJunctions: number[] = [];
    routes.forEach(([a, b, altitude, opacity], i) => {
      const path = arc(
        geographic(cities[a][0], cities[a][1]),
        geographic(cities[b][0], cities[b][1]),
        altitude,
      );
      line(path, i % 5 === 0 ? 0xb9ced1 : 0xff6908, opacity);
      [0.23, 0.61, 0.83]
        .slice(0, i % 3 === 0 ? 3 : 1)
        .forEach((t, j) =>
          (i % 3 === 0 && j === 0 ? junctions : weakJunctions).push(
            ...path[Math.floor(t * 100)].toArray(),
          ),
        );
      if (i === 4 || i === 3 || i === 9) {
        earth.add(
          new THREE.Mesh(
            new THREE.TubeGeometry(
              new THREE.CatmullRomCurve3(path),
              100,
              0.002,
              4,
              false,
            ),
            new THREE.MeshBasicMaterial({
              color: 0xff800c,
              transparent: true,
              opacity: 0.75,
            }),
          ),
        );
      }
    });
    points(junctions, 46, 1);
    points(weakJunctions, 23, 0.95);
    for (let i = 0; i < (mobile ? 18 : 48); i++) {
      const a = cities[(i * 3 + 1) % cities.length],
        b = cities[(i * 7 + 4) % cities.length];
      line(
        arc(
          geographic(a[0], a[1]),
          geographic(b[0], b[1]),
          0.03 + random() * 0.1,
        ),
        i % 3 === 0 ? 0xc0d2d4 : 0xff7b28,
        0.035 + random() * 0.16,
      );
    }
    // Unequal, tilted orbital planes preserve the reference's wide envelope.
    // Partial white tracks and a long outgoing arc avoid a uniform wireframe cage.
    const orbitPlanes = [
      [-1.08, 0.15, -0.12, 2.84, 1, 0.02, 1, 0.48],
      [0.62, 0.18, -0.6, 2.5, 1, 0.08, 0.96, 0.39],
      [-1.17, 0.35, 0.6, 2.65, 1, 0.04, 0.93, 0.37],
      [0.36, 0.4, 0.17, 2.3, 1, 0.13, 0.98, 0.29],
      [-1.24, 0.5, -1.03, 2.77, 1, 0, 0.95, 0.33],
      [0.42, 0.9, -0.2, 2.56, 1, 0.2, 0.92, 0.19],
      [0.92, -0.3, -0.86, 2.55, 1, 0.03, 0.81, 0.2],
      [1.06, 0.42, 0.88, 2.9, 1, 0.1, 0.95, 0.15],
      [0.24, 0.62, -0.35, 2.36, 1, 0.02, 0.87, 0.25],
      [0.75, 0.2, 0.14, 2.36, 1, 0.07, 0.94, 0.15],
      [1.3, 0.2, -0.14, 3.1, 0.86, 0.2, 0.8, 0.08],
    ];
    orbitPlanes
      .slice(0, mobile ? 6 : orbitPlanes.length)
      .forEach(([rx, ry, rz, radius, eccentricity, start, end, opacity], i) => {
        const group = new THREE.Group();
        group.rotation.set(rx, ry, rz);
        flightPaths.add(group);
        const path: THREE.Vector3[] = [];
        for (let j = 0; j <= 180; j++) {
          const t = (start + (j / 180) * (end - start)) * Math.PI * 2;
          path.push(
            new THREE.Vector3(
              Math.cos(t) * radius,
              Math.sin(t) * radius * eccentricity,
              0,
            ),
          );
        }
        line(
          path,
          i === 5 || i === 7 || i === 9 || i === 11 ? 0xb8ced4 : 0xff6200,
          opacity,
          group,
        );
        const orbitNodes: number[] = [];
        for (let j = 0; j < (i < 5 ? 5 : 2); j++) {
          const t =
            (start + (end - start) * ((0.17 + i * 0.137 + j * 0.223) % 1)) *
            Math.PI *
            2;
          orbitNodes.push(
            Math.cos(t) * radius,
            Math.sin(t) * radius * eccentricity,
            0,
          );
        }
        points(
          orbitNodes,
          i === 5 || i === 7 || i === 9 || i === 11 ? 9 : i % 3 === 0 ? 45 : 32,
          1,
          0xffffff,
          group,
        );
        const smallNodes: number[] = [];
        for (let j = 0; j < (i < 5 ? 17 : 8); j++) {
          const t = (start + (end - start) * random()) * Math.PI * 2;
          smallNodes.push(
            Math.cos(t) * radius,
            Math.sin(t) * radius * eccentricity,
            0,
          );
        }
        points(smallNodes, 5.5, 0.8, 0xffffff, group);
      });
    const outgoing = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.35, 2.04, -0.7),
      new THREE.Vector3(-2.8, 0.18, 0.05),
      new THREE.Vector3(-2.46, -0.61, 0.35),
      new THREE.Vector3(-1.42, -1.57, 0.7),
      new THREE.Vector3(0.36, -2.45, 0.5),
      new THREE.Vector3(2.27, -3.42, -0.2),
    ]).getPoints(160);
    line(outgoing, 0xff6a06, 0.4, rig);
    points(
      [outgoing[31], outgoing[70], outgoing[113]].flatMap((p) => p.toArray()),
      44,
      1,
      0xffffff,
      rig,
    );
    const structure: number[] = [],
      structureColors: number[] = [];
    // Connected fragments follow the spherical shell, fading across its face.
    // The brighter edge has layered silver structure without a solid white band.
    for (let i = 0; i < 1150; i++) {
      const lat = random() * 155 - 70,
        lon = random() * 360 - 180,
        r = 2.015 + Math.pow(random(), 4) * 0.11;
      const driftLat = (random() - 0.5) * 1.9,
        driftLon = (random() - 0.5) * 3.8;
      let last = geographic(lat, lon, r);
      const v = 0.06 + Math.pow(random(), 3) * 0.76;
      for (let j = 1; j < 5; j++) {
        const next = geographic(
          lat + driftLat * j + random() * 0.65,
          lon + driftLon * j + random() * 0.8,
          r,
        );
        structure.push(...last.toArray(), ...next.toArray());
        for (let k = 0; k < 2; k++) structureColors.push(v * 0.84, v * 0.95, v);
        last = next;
      }
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.Float32BufferAttribute(structure, 3));
    sg.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(structureColors, 3),
    );
    earth.add(
      new THREE.LineSegments(
        sg,
        new THREE.ShaderMaterial({
          vertexColors: true,
          transparent: true,
          depthWrite: false,
          vertexShader: `varying vec3 vColor;varying float edge;void main(){vColor=color;vec3 n=normalize(normalMatrix*normalize(position));edge=pow(1.-abs(n.z),2.);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
          fragmentShader: `varying vec3 vColor;varying float edge;void main(){gl_FragColor=vec4(vColor,(.035+edge*.7));}`,
        }),
      ),
    );
    // Batched near-field constellation: quiet white connections around the limb.
    const constellation = Array.from({ length: mobile ? 130 : 380 }, () =>
      geographic(
        (Math.asin(random() * 2 - 1) * 180) / Math.PI,
        random() * 360 - 180,
        2.05 + Math.pow(random(), 1.7) * 0.86,
      ),
    );
    const webPositions: number[] = [],
      webColors: number[] = [];
    constellation.forEach((a, i) => {
      const nearest = constellation
        .map((b, j) => ({ j, d: a.distanceToSquared(b) }))
        .filter(({ j, d }) => j > i && d < 0.24)
        .sort((a, b) => a.d - b.d)
        .slice(0, 3);
      nearest.forEach(({ j }) => {
        webPositions.push(...a.toArray(), ...constellation[j].toArray());
        const value = 0.025 + Math.pow(random(), 3) * 0.2;
        for (let k = 0; k < 2; k++)
          webColors.push(value * 0.86, value * 0.94, value);
      });
    });
    const webGeometry = new THREE.BufferGeometry();
    webGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(webPositions, 3),
    );
    webGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(webColors, 3),
    );
    flightPaths.add(
      new THREE.LineSegments(
        webGeometry,
        new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.13,
        }),
      ),
    );
    const webNodes = new THREE.BufferGeometry().setFromPoints(constellation);
    flightPaths.add(
      new THREE.Points(
        webNodes,
        new THREE.PointsMaterial({
          color: 0xb2c3c7,
          size: 1.3,
          sizeAttenuation: false,
          transparent: true,
          opacity: 0.7,
        }),
      ),
    );
    const marker = new THREE.Group();
    marker.position.copy(geographic(17.385, 78.4867, 2.06));
    marker.lookAt(marker.position.clone().multiplyScalar(2));
    earth.add(marker);
    marker.add(
      new THREE.Mesh(
        new THREE.RingGeometry(0.052, 0.075, 64),
        new THREE.MeshBasicMaterial({
          color: 0xff780b,
          side: THREE.DoubleSide,
        }),
      ),
    );
    marker.add(
      new THREE.Mesh(
        new THREE.RingGeometry(0.105, 0.11, 64),
        new THREE.MeshBasicMaterial({
          color: 0xff790c,
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide,
        }),
      ),
    );
    marker.add(
      new THREE.Mesh(
        new THREE.CircleGeometry(0.025, 32),
        new THREE.MeshBasicMaterial({
          color: 0xfff1d4,
          side: THREE.DoubleSide,
        }),
      ),
    );
    points(marker.position.toArray(), 65, 0.18);
    const stars: number[] = [];
    for (let i = 0; i < 170; i++)
      stars.push((random() - 0.5) * 18, (random() - 0.5) * 10, -4);
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(stars, 3),
    );
    scene.add(
      new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({
          size: 0.75,
          sizeAttenuation: false,
          color: 0x91a3a6,
          transparent: true,
          opacity: 0.4,
        }),
      ),
    );
    const motionRig = createGlobeMotion({
      rig,
      earth,
      flightPaths,
      moons,
      marker,
      glow,
      nodes: signalNodes,
      activation: networkActivation,
    });
    const label =
        host.parentElement?.querySelector<HTMLElement>(".hyderabad-label"),
      markWorld = new THREE.Vector3();
    let width = 1,
      heightPx = 1;
    let renderedFrames = 0;
    function render() {
      if (disposed) return;
      scene.updateMatrixWorld();
      camera.updateMatrixWorld();
      if (label) {
        marker.getWorldPosition(markWorld);
        markWorld.project(camera);
        const x = (markWorld.x * 0.5 + 0.5) * width,
          y = (-markWorld.y * 0.5 + 0.5) * heightPx;
        motion.current.locator.x = x;
        motion.current.locator.y = y;
        label.style.left = `${x - (width < 700 ? 100 : 130)}px`;
        label.style.top = `${y - 20}px`;
      }
      renderer.render(scene, camera);
      if (++renderedFrames % 15 === 0)
        host.dataset.renderCount = String(renderedFrames);
      host.dataset.ready = "true";
      motion.current.ready = true;
      host.dataset.drawCalls = String(renderer.info.render.calls);
      host.dataset.triangles = String(renderer.info.render.triangles);
      host.dataset.points = String(renderer.info.render.points);
    }
    function resize() {
      width = host.clientWidth;
      heightPx = host.clientHeight;
      const aspect = width / heightPx;
      camera.left = -3 * aspect;
      camera.right = 3 * aspect;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(
        Math.min(devicePixelRatio, width < 700 ? 1.3 : 1.8),
      );
      renderer.setSize(width, heightPx);
      const small = width < 700,
        radius = small
          ? width * 0.5
          : Math.min(width * 0.1795, heightPx * 0.319);
      rig.position.set(
        ((small ? 0.82 : 0.68) - 0.5) * 6 * aspect,
        (0.5 - (small ? 0.79 : 0.474)) * 6,
        0,
      );
      rig.scale.setScalar((radius * 3) / heightPx);
      earth.rotation.set(0.206, (-Math.PI * 166.7) / 180, -0.1);
      flightPaths.rotation.set(0.16, 0.03, -0.08);
      const moonLayout = [
        [0.566, 0.153, 0.039],
        [0.963, 0.34, 0.023],
        [0.974, 0.739, 0.027],
      ];
      moons.forEach((moon, i) => {
        const [x, y, r] = moonLayout[i];
        moon.position.set((x - 0.5) * 6 * aspect, (0.5 - y) * 6, -3);
        moon.scale.setScalar((width * r * 6) / heightPx);
        moon.visible = !small;
      });
      host.dataset.sphereDiameter = String(radius * 2);
      motionRig.captureBase(width, heightPx);
      ready = true;
      requestRender();
    }
    // One draw per coordinate space instead of one per route.
    lineBatches.forEach((batch, parent) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(batch.positions, 3),
      );
      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(batch.colors, 3),
      );
      geometry.setAttribute(
        "routeAlpha",
        new THREE.Float32BufferAttribute(batch.alphas, 1),
      );
      parent.add(
        new THREE.LineSegments(
          geometry,
          new THREE.ShaderMaterial({
            uniforms: { activation: networkActivation },
            vertexColors: true,
            transparent: true,
            depthWrite: false,
            vertexShader: `attribute float routeAlpha;varying vec3 vColor;varying float vAlpha;void main(){vColor=color;vAlpha=routeAlpha;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
            fragmentShader: `uniform float activation;varying vec3 vColor;varying float vAlpha;void main(){gl_FragColor=vec4(vColor,vAlpha*(.1+.9*activation));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`,
          }),
        ),
      );
    });
    resize();
    motion.current.renderFrame = (frame) => {
      motionRig.apply(frame);
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    const onLoss = (e: Event) => {
      e.preventDefault();
      host.classList.add("globe-fallback");
    };
    renderer.domElement.addEventListener("webglcontextlost", onLoss);
    return () => {
      disposed = true;
      motion.current.renderFrame = null;
      motion.current.ready = false;
      abort.abort();
      cancelAnimationFrame(scheduled);
      observer.disconnect();
      image.onload = null;
      reliefImage.onload = null;
      renderer.domElement.removeEventListener("webglcontextlost", onLoss);
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      scene.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if (m.geometry) geometries.add(m.geometry);
        if (m.material)
          for (const material of Array.isArray(m.material)
            ? m.material
            : [m.material])
            materials.add(material);
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [motion]);
  return <div className="globe-stage" ref={container} aria-hidden="true" />;
}
