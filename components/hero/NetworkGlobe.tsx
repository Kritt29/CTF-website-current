"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { arc, cities, geographic, seededRandom } from "./globeGeometry";

const surfaceVertex = `varying vec2 vUv;varying vec3 vNormal;varying vec3 vPosition;
void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);vPosition=p.xyz;gl_Position=projectionMatrix*p;}`;
const surfaceFragment = `uniform sampler2D dayMap;uniform sampler2D nightMap;uniform sampler2D heightMap;
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
 vec3 base=vec3(.0015,.004,.006);
 base+=land*(terrain*.24+relief*.30)*vec3(.57,.7,.74)*(light*.78+.12);
 base+=urban*vec3(1.,.34,.045)*1.55;
 base+=rim*vec3(.23,.30,.33)*(light*.8+.12)*(0.55+terrain*1.8);
 gl_FragColor=vec4(base,1.);
}`;
type LandData = {
  features: {
    geometry: { type: string; coordinates: number[][][] | number[][][][] };
  }[];
};
function nodeTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,235,1)");
  g.addColorStop(0.065, "rgba(255,255,220,1)");
  g.addColorStop(0.14, "rgba(255,169,60,1)");
  g.addColorStop(0.26, "rgba(255,82,0,.65)");
  g.addColorStop(0.52, "rgba(255,63,0,.14)");
  g.addColorStop(1, "rgba(255,50,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Static approval frame. Render only on asset completion and resize. */
export default function NetworkGlobe() {
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
    const random = seededRandom(93),
      mobile = innerWidth < 700;
    let ready = false,
      scheduled = 0;
    const requestRender = () => {
      if (disposed || !ready) return;
      cancelAnimationFrame(scheduled);
      scheduled = requestAnimationFrame(render);
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
      height = load("/assets/earth-topology.png");
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
                  warm = a[0] > 50 && a[0] < 125 && a[1] < 36 && a[1] > -12;
                for (let j = 0; j < 2; j++)
                  colors.push(
                    warm ? v : v * 0.72,
                    warm ? v * 0.58 : v * 0.86,
                    warm ? v * 0.28 : v * 0.93,
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
          new THREE.LineSegments(
            g,
            new THREE.LineBasicMaterial({
              vertexColors: true,
              transparent: true,
              opacity: 0.76,
            }),
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
      return p;
    }
    const anchor: number[] = [],
      secondary: number[] = [],
      minor: number[] = [];
    cities.forEach(([lat, lon], i) => {
      (i % 7 === 0 ? anchor : i % 3 === 0 ? secondary : minor).push(
        ...geographic(lat, lon, 2.03).toArray(),
      );
    });
    points(anchor, 36, 1);
    points(secondary, 18, 0.9);
    points(minor, 8, 0.85);
    // City clusters sampled from the night map, not uniformly scattered land dots.
    const image = new Image();
    image.src = "/assets/earth-lights.png";
    image.onload = () => {
      if (disposed) return;
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
      for (let i = 0; i < (mobile ? 55000 : 280000); i++) {
        const lon = random() * 360 - 180,
          lat = (Math.asin(random() * 2 - 1) * 180) / Math.PI,
          x = Math.floor(((lon + 180) / 360) * 2047),
          y = Math.floor(((90 - lat) / 180) * 1023),
          index = (y * 2048 + x) * 4;
        const r = px[index] / 255,
          g = px[index + 1] / 255,
          b = px[index + 2] / 255,
          urban = Math.max(0, r - b * 0.9);
        if (urban > 0.012 && random() < urban * 9) {
          pos.push(...geographic(lat, lon, 2.012).toArray());
          const v = 0.45 + random() * 0.55;
          col.push(v, v * (0.31 + random() * 0.22), v * 0.07);
        } else if (lat > -58 && g > 0.08 && r > b * 0.75 && random() > 0.78) {
          fine.push(...geographic(lat, lon, 2.009).toArray());
          const v = 0.1 + Math.pow(random(), 3) * 0.52;
          fineColors.push(v * 0.78, v * 0.88, v);
        }
      }
      // Uneven metropolitan clusters, with positions constrained by the source land map.
      const clusters: number[] = [],
        clusterColors: number[] = [];
      cities.forEach(([lat, lon], city) => {
        const count = mobile ? 60 : city < 12 ? 180 : 80;
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
          clusterColors.push(v, v * (0.25 + random() * 0.24), v * 0.035);
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
      );
      for (const [p, colors, size, opacity] of [
        [pos, col, 1.55, 0.94],
        [fine, fineColors, 0.8, 0.55],
      ] as [number[], number[], number, number][]) {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
        g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
        earth.add(
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
        );
      }
      requestRender();
    };
    function line(
      path: THREE.Vector3[],
      color: THREE.ColorRepresentation,
      opacity: number,
      parent = earth,
    ) {
      parent.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(path),
          new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
        ),
      );
    }
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
    points(junctions, 38, 1);
    points(weakJunctions, 17, 0.9);
    for (let i = 0; i < (mobile ? 13 : 29); i++) {
      const a = cities[(i * 3 + 1) % cities.length],
        b = cities[(i * 7 + 4) % cities.length];
      line(
        arc(
          geographic(a[0], a[1]),
          geographic(b[0], b[1]),
          0.03 + random() * 0.1,
        ),
        i % 3 === 0 ? 0xc0d2d4 : 0xff7b28,
        0.08 + random() * 0.2,
      );
    }
    for (let i = 0; i < (mobile ? 4 : 10); i++) {
      const group = new THREE.Group();
      group.rotation.set(0.45 + i * 0.28, 0.18 + i * 0.37, -0.65 + i * 0.24);
      flightPaths.add(group);
      const radius = 2.15 + (i % 4) * 0.15,
        path: THREE.Vector3[] = [];
      for (let j = 0; j <= 210; j++) {
        const t = (j / 210) * Math.PI * 2;
        path.push(
          new THREE.Vector3(Math.cos(t) * radius, Math.sin(t) * radius, 0),
        );
      }
      line(
        path,
        i % 3 === 0 ? 0xb8ced4 : 0xff6200,
        i % 3 === 0 ? 0.19 : 0.25 + random() * 0.16,
        group,
      );
      const orbitNodes: number[] = [];
      for (let j = 0; j < 3; j++) {
        const t = (i * 0.57 + j * 2.16) % (Math.PI * 2);
        orbitNodes.push(Math.cos(t) * radius, Math.sin(t) * radius, 0);
      }
      points(
        orbitNodes,
        i % 3 === 0 ? 13 : 27,
        i % 3 === 0 ? 0.65 : 1,
        0xffffff,
        group,
      );
    }
    const structure: number[] = [],
      structureColors: number[] = [];
    for (let i = 0; i < 1200; i++) {
      const lat = random() * 155 - 70,
        lon = random() * 360 - 180,
        r = 2.015 + Math.pow(random(), 4) * 0.055;
      structure.push(
        ...geographic(lat, lon, r).toArray(),
        ...geographic(
          lat + (random() - 0.5) * 3,
          lon + (random() - 0.5) * 4,
          r,
        ).toArray(),
      );
      const v = 0.08 + Math.pow(random(), 4) * 0.45;
      for (let k = 0; k < 2; k++) structureColors.push(v * 0.8, v * 0.94, v);
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
        new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.35,
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
    points(marker.position.toArray(), 60, 0.45);
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
    const label =
        host.parentElement?.querySelector<HTMLElement>(".hyderabad-label"),
      markWorld = new THREE.Vector3();
    let width = 1,
      heightPx = 1;
    function render() {
      if (disposed) return;
      scene.updateMatrixWorld();
      if (label) {
        marker.getWorldPosition(markWorld);
        markWorld.project(camera);
        const x = (markWorld.x * 0.5 + 0.5) * width,
          y = (-markWorld.y * 0.5 + 0.5) * heightPx;
        label.style.left = `${x - (width < 700 ? 100 : 118)}px`;
        label.style.top = `${y - 16}px`;
      }
      renderer.render(scene, camera);
      host.dataset.ready = "true";
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
          : Math.min(width * 0.198, heightPx * 0.355);
      rig.position.set(
        ((small ? 0.82 : 0.68) - 0.5) * 6 * aspect,
        (0.5 - (small ? 0.79 : 0.476)) * 6,
        0,
      );
      rig.scale.setScalar((radius * 3) / heightPx);
      earth.rotation.set(0.222, (-Math.PI * 168) / 180, -0.1);
      flightPaths.rotation.set(0.16, 0.03, -0.08);
      host.dataset.sphereDiameter = String(radius * 2);
      ready = true;
      requestRender();
    }
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    const onLoss = (e: Event) => {
      e.preventDefault();
      host.classList.add("globe-fallback");
    };
    renderer.domElement.addEventListener("webglcontextlost", onLoss);
    return () => {
      disposed = true;
      abort.abort();
      cancelAnimationFrame(scheduled);
      observer.disconnect();
      image.onload = null;
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
  }, []);
  return <div className="globe-stage" ref={container} aria-hidden="true" />;
}
