"use client";
import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { arc, cities, geographic, seededRandom } from "./globeGeometry";
import type { SceneState } from "./sceneState";

const vertex = `varying vec2 vUv;varying vec3 vNormal;varying vec3 vPosition;void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);vPosition=p.xyz;gl_Position=projectionMatrix*p;}`;
const fragment = `uniform sampler2D dayMap;uniform sampler2D nightMap;uniform sampler2D heightMap;uniform float reveal;varying vec2 vUv;varying vec3 vNormal;varying vec3 vPosition;
void main(){vec3 day=texture2D(dayMap,vUv).rgb;vec3 night=texture2D(nightMap,vUv).rgb;float land=dot(day,vec3(.24,.57,.19));float city=smoothstep(.24,.85,max(night.r,max(night.g,night.b)));vec3 n=normalize(vNormal);float light=max(dot(n,normalize(vec3(-.5,.85,1.))),0.);float rim=pow(1.-max(dot(n,normalize(-vPosition)),0.),3.8);float relief=texture2D(heightMap,vUv).r;float edge=abs(relief-texture2D(heightMap,vUv+vec2(.001,.001)).r);vec3 base=vec3(.007,.015,.020)+land*vec3(.18,.22,.24)*(light*.85+.15)+edge*vec3(.35,.43,.46);base+=city*vec3(1.,.37,.07)*.8;base+=rim*vec3(.17,.24,.26)*(light*.75+.1);gl_FragColor=vec4(base*reveal,1.);}`;
function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,245,219,1)");
  g.addColorStop(0.13, "rgba(255,147,58,.95)");
  g.addColorStop(0.3, "rgba(255,87,0,.35)");
  g.addColorStop(1, "rgba(255,70,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export default function NetworkGlobe({
  state,
}: {
  state: RefObject<SceneState>;
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
    renderer.setPixelRatio(
      Math.min(devicePixelRatio, innerWidth < 700 ? 1.25 : 1.5),
    );
    renderer.domElement.className = "globe-canvas";
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.OrthographicCamera(-5, 5, 3, -3, 0.1, 100);
    camera.position.z = 12;
    const rig = new THREE.Group(),
      earth = new THREE.Group(),
      routes = new THREE.Group();
    scene.add(rig);
    rig.add(earth, routes);
    const rng = seededRandom();
    const mobile = innerWidth < 700;
    const textures: THREE.Texture[] = [];
    const loader = new THREE.TextureLoader();
    const load = (url: string) => {
      const t = loader.load(url);
      textures.push(t);
      return t;
    };
    const day = load("/assets/earth-day.jpg"),
      night = load("/assets/earth-night.jpg"),
      height = load("/assets/earth-topology.png");
    const surface = new THREE.ShaderMaterial({
      uniforms: {
        dayMap: { value: day },
        nightMap: { value: night },
        heightMap: { value: height },
        reveal: { value: 0 },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    });
    earth.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(2, mobile ? 72 : 112, mobile ? 48 : 80),
        surface,
      ),
    );
    const coastMaterial = new THREE.LineBasicMaterial({
      color: 0xb9d2d6,
      transparent: true,
      opacity: 0.28,
    });
    const abort = new AbortController();
    fetch("/assets/land.geojson", { signal: abort.signal })
      .then(
        (r) =>
          r.json() as Promise<{
            features: Array<{
              geometry: {
                type: string;
                coordinates: number[][][] | number[][][][];
              };
            }>;
          }>,
      )
      .then((data) => {
        if (disposed) return;
        const vertices: number[] = [];
        for (const feature of data.features) {
          const polygons = (
            feature.geometry.type === "Polygon"
              ? [feature.geometry.coordinates]
              : feature.geometry.coordinates
          ) as number[][][][];
          for (const polygon of polygons)
            for (const ring of polygon)
              for (let i = 1; i < ring.length; i++) {
                vertices.push(
                  ...geographic(
                    ring[i - 1][1],
                    ring[i - 1][0],
                    2.004,
                  ).toArray(),
                  ...geographic(ring[i][1], ring[i][0], 2.004).toArray(),
                );
              }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(vertices, 3),
        );
        earth.add(new THREE.LineSegments(g, coastMaterial));
      })
      .catch(() => {});
    const glow = glowTexture();
    textures.push(glow);
    const nodePositions = cities.flatMap(([lat, lon]) =>
      geographic(lat, lon, 2.025).toArray(),
    );
    const nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(nodePositions, 3),
    );
    const nodeMaterial = new THREE.PointsMaterial({
      color: 0xff923e,
      size: 16,
      sizeAttenuation: false,
      map: glow,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    earth.add(new THREE.Points(nodeGeometry, nodeMaterial));
    // Land samples create a geographic network, not a random particle sphere.
    const image = new Image();
    image.src = "/assets/earth-day.jpg";
    image.onload = () => {
      if (disposed) return;
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(image, 0, 0, 1024, 512);
      const pixels = ctx.getImageData(0, 0, 1024, 512).data;
      const pos: number[] = [],
        colors: number[] = [];
      for (let i = 0; i < (mobile ? 16000 : 43000); i++) {
        const lon = rng() * 360 - 180,
          lat = (Math.asin(rng() * 2 - 1) * 180) / Math.PI;
        const x = Math.floor(((lon + 180) / 360) * 1023),
          y = Math.floor(((90 - lat) / 180) * 511),
          p = (y * 1024 + x) * 4;
        const r = pixels[p],
          g = pixels[p + 1],
          b = pixels[p + 2];
        if (g > 27 && r > b * 0.82 && lat > -58) {
          pos.push(...geographic(lat, lon, 2.009 + rng() * 0.009).toArray());
          const amber = rng() > 0.83;
          const v = 0.3 + rng() * 0.65;
          colors.push(
            amber ? v : v * 0.65,
            amber ? v * 0.37 : v * 0.77,
            amber ? v * 0.075 : v * 0.8,
          );
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(pos, 3),
      );
      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colors, 3),
      );
      earth.add(
        new THREE.Points(
          geometry,
          new THREE.PointsMaterial({
            size: mobile ? 0.85 : 1.05,
            sizeAttenuation: false,
            vertexColors: true,
            transparent: true,
            opacity: 0.78,
            depthWrite: false,
          }),
        ),
      );
    };
    const paths: THREE.Vector3[][] = [];
    const routeMaterials: THREE.LineBasicMaterial[] = [];
    for (let i = 0; i < (mobile ? 24 : 47); i++) {
      const a = cities[i % cities.length],
        b = cities[(i * 7 + 6) % cities.length];
      const points = arc(
        geographic(a[0], a[1]),
        geographic(b[0], b[1]),
        0.12 + rng() * 0.52,
      );
      paths.push(points);
      const material = new THREE.LineBasicMaterial({
        color: i % 4 === 0 ? 0xa8c4cb : 0xff6509,
        transparent: true,
        opacity: 0,
      });
      routeMaterials.push(material);
      earth.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          material,
        ),
      );
    }
    // Elliptical flight paths remain 3D curves; they never scale the globe.
    for (let i = 0; i < (mobile ? 4 : 8); i++) {
      const points: THREE.Vector3[] = [];
      for (let j = 0; j <= 220; j++) {
        const t = (j / 220) * Math.PI * 2;
        points.push(
          new THREE.Vector3(
            Math.cos(t) * (2.2 + rng() * 0.002),
            Math.sin(t) * 2.2,
            0,
          ),
        );
      }
      const material = new THREE.LineBasicMaterial({
        color: i % 3 === 0 ? 0xbcd0d3 : 0xff6509,
        transparent: true,
        opacity: 0.18,
      });
      const orbit = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        material,
      );
      orbit.rotation.set(0.6 + i * 0.26, 0.2 + i * 0.34, -0.4 + i * 0.32);
      routes.add(orbit);
    }
    const packetGeometry = new THREE.BufferGeometry();
    const packetArray = new Float32Array(18);
    packetGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(packetArray, 3),
    );
    const packets = new THREE.Points(
      packetGeometry,
      new THREE.PointsMaterial({
        size: 16,
        sizeAttenuation: false,
        map: glow,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    earth.add(packets);
    const marker = new THREE.Group();
    marker.position.copy(geographic(17.385, 78.4867, 2.045));
    marker.lookAt(marker.position.clone().multiplyScalar(2));
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xff801e,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.053, 0.073, 48),
      ringMaterial,
    );
    marker.add(ring);
    marker.add(
      new THREE.Mesh(
        new THREE.CircleGeometry(0.025, 32),
        new THREE.MeshBasicMaterial({
          color: 0xffe8c8,
          side: THREE.DoubleSide,
        }),
      ),
    );
    const pulse = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.084, 48),
      new THREE.MeshBasicMaterial({
        color: 0xff7518,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      }),
    );
    marker.add(pulse);
    earth.add(marker);
    const stars: number[] = [];
    for (let i = 0; i < 290; i++)
      stars.push((rng() - 0.5) * 18, (rng() - 0.5) * 11, -3 - rng() * 3);
    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(stars, 3),
    );
    scene.add(
      new THREE.Points(
        starsGeo,
        new THREE.PointsMaterial({
          size: 0.85,
          sizeAttenuation: false,
          color: 0x6a797d,
          transparent: true,
          opacity: 0.42,
        }),
      ),
    );
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(0.43, 32, 24),
      new THREE.MeshStandardMaterial({
        map: height,
        bumpMap: height,
        bumpScale: 0.025,
        color: 0x273339,
        roughness: 1,
      }),
    );
    moon.position.set(0.6, 2, -2);
    scene.add(moon);
    scene.add(new THREE.AmbientLight(0xc5dae5, 0.35));
    const light = new THREE.DirectionalLight(0xc6e4ed, 2.8);
    light.position.set(-3, 5, 2);
    scene.add(light);
    const wisps = new THREE.Group();
    scene.add(wisps);
    for (let i = 0; i < 22; i++) {
      const p: THREE.Vector3[] = [];
      for (let j = 0; j <= 70; j++) {
        const x = -8 + j * 0.22;
        p.push(
          new THREE.Vector3(
            x,
            -2.6 + i * 0.021 + Math.sin(x * 0.55 + i * 0.018) * 0.7 + x * 0.24,
            -3 - i * 0.01,
          ),
        );
      }
      wisps.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(p),
          new THREE.LineBasicMaterial({
            color: 0x547076,
            transparent: true,
            opacity: 0.025 + rng() * 0.035,
          }),
        ),
      );
    }
    let width = 1,
      heightPx = 1,
      baseX = 0,
      baseY = 0,
      scale = 1;
    const pointer = new THREE.Vector2(),
      eased = new THREE.Vector2();
    function resize() {
      width = host.clientWidth;
      heightPx = host.clientHeight;
      renderer.setSize(width, heightPx);
      const aspect = width / heightPx;
      camera.left = -3 * aspect;
      camera.right = 3 * aspect;
      camera.top = 3;
      camera.bottom = -3;
      camera.updateProjectionMatrix();
      const small = width < 700;
      const radius = small
        ? width * 0.49
        : Math.min(width * 0.183, heightPx * 0.326);
      scale = (radius * 3) / heightPx;
      baseX = ((small ? 0.82 : 0.685) - 0.5) * 6 * aspect;
      baseY = (0.5 - (small ? 0.79 : 0.475)) * 6;
      moon.visible = !small;
      moon.position.set(baseX - 1.15, baseY + 1.82, -2);
      renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.25 : 1.5));
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const onPointer = (e: PointerEvent) => {
      pointer.set(e.clientX / width - 0.5, e.clientY / heightPx - 0.5);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    const transitionPath =
      host.parentElement?.querySelector<SVGPathElement>("#page-two-route");
    const label =
      host.parentElement?.querySelector<HTMLElement>(".hyderabad-label");
    const markWorld = new THREE.Vector3();
    let raf = 0;
    const start = performance.now();
    let last = 0;
    function render(now: number) {
      if (disposed) return;
      raf = requestAnimationFrame(render);
      if (document.hidden) return;
      if (state.current.reduced && now - last < 180) return;
      last = now;
      const t = Math.max(0, (now - start) / 1000),
        s = state.current,
        p = s.progress;
      const drift = s.reduced ? 0 : Math.sin(t * 0.055) * 0.028;
      eased.lerp(s.reduced ? new THREE.Vector2() : pointer, 0.035);
      rig.position.set(
        baseX + eased.x * 0.09,
        baseY + eased.y * -0.055 + p * 0.72,
        0,
      );
      rig.scale.setScalar(
        scale * (1 + Math.sin(p * Math.PI) * 0.085 - p * 0.13),
      );
      earth.rotation.set(
        0.22 + eased.y * 0.022 + p * 0.065,
        (-Math.PI * 168) / 180 + drift + eased.x * 0.04 + p * 0.12,
        -0.1,
      );
      routes.rotation.set(
        0.12 + eased.y * 0.02,
        drift * 0.6 + eased.x * 0.02,
        -0.1,
      );
      surface.uniforms.reveal.value = s.reveal;
      nodeMaterial.opacity = s.reveal * (s.reduced ? 0.9 : 0.85 + Math.sin(t * 0.7) * 0.12);
      coastMaterial.opacity = 0.28 * s.reveal;
      routeMaterials.forEach((m, i) => {
        m.opacity =
          Math.max(0, Math.min(1, (s.reveal - i * 0.011) * 2)) *
          (i % 4 === 0 ? 0.16 : 0.44);
      });
      const wake = Math.max(0, Math.min(1, (s.reveal - 0.78) * 5));
      marker.scale.setScalar(wake);
      const pulseTime = Math.min(1, Math.max(0, (t - 1.6) / 1.4));
      pulse.scale.setScalar(1 + pulseTime * 1.9);
      (pulse.material as THREE.MeshBasicMaterial).opacity = s.reduced
        ? 0
        : (1 - pulseTime) * 0.7;
      for (let i = 0; i < 6; i++) {
        const path = paths[i * 4 + 1],
          at = s.reduced ? 0.38 : (t * 0.035 + i * 0.163) % 1;
        const point = path[Math.floor(at * 100)];
        packetArray.set(point.toArray(), i * 3);
      }
      packetGeometry.attributes.position.needsUpdate = true;
      scene.updateMatrixWorld();
      if (label) {
        marker.getWorldPosition(markWorld);
        markWorld.project(camera);
        const x = (markWorld.x * 0.5 + 0.5) * width,
          y = (-markWorld.y * 0.5 + 0.5) * heightPx;
        label.style.left = `${x - (width < 700 ? 92 : 126)}px`;
        label.style.top = `${y - 17}px`;
        if (transitionPath) {
          const rx = (x / width) * 1440,
            ry = (y / heightPx) * 900;
          transitionPath.setAttribute(
            "d",
            `M${rx} ${ry} C${rx + 220} ${ry + 130} 1020 660 840 760 S740 895 720 1000`,
          );
        }
      }
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(render);
    const onLoss = (e: Event) => {
      e.preventDefault();
      host.classList.add("globe-fallback");
    };
    renderer.domElement.addEventListener("webglcontextlost", onLoss);
    return () => {
      disposed = true;
      abort.abort();
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      image.onload = null;
      renderer.domElement.removeEventListener("webglcontextlost", onLoss);
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) geometries.add(mesh.geometry);
        if (mesh.material) {
          for (const m of Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material])
            materials.add(m);
        }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [state]);
  return <div className="globe-stage" ref={container} aria-hidden="true" />;
}
