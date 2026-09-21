import * as THREE from "three";
export function geographic(lat: number, lon: number, r = 2) {
  const a = (lat * Math.PI) / 180,
    b = (lon * Math.PI) / 180;
  return new THREE.Vector3(
    r * Math.cos(a) * Math.cos(b),
    r * Math.sin(a),
    -r * Math.cos(a) * Math.sin(b),
  );
}
export function seededRandom(seed = 47) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
}
export function arc(a: THREE.Vector3, b: THREE.Vector3, height: number) {
  const points: THREE.Vector3[] = [];
  for (let j = 0; j <= 100; j++) {
    const t = j / 100;
    points.push(
      a
        .clone()
        .lerp(b, t)
        .normalize()
        .multiplyScalar(2.02 + Math.sin(t * Math.PI) * height),
    );
  }
  return points;
}
export const cities = [
  [17.385, 78.4867],
  [19.07, 72.88],
  [28.61, 77.21],
  [12.97, 77.59],
  [13.08, 80.27],
  [22.57, 88.36],
  [1.35, 103.82],
  [35.68, 139.69],
  [37.56, 126.98],
  [31.23, 121.47],
  [22.32, 114.17],
  [25.2, 55.27],
  [24.71, 46.67],
  [51.5, -0.12],
  [48.85, 2.35],
  [52.52, 13.4],
  [40.71, -74],
  [37.77, -122.42],
  [-33.86, 151.2],
  [-6.2, 106.85],
  [-1.29, 36.82],
  [-26.2, 28.04],
  [30.04, 31.24],
  [41.01, 28.98],
  [55.75, 37.61],
  [13.75, 100.5],
  [14.6, 120.98],
  [23.81, 90.41],
  [27.71, 85.32],
  [24.86, 67.01],
  [-23.55, -46.63],
  [-34.6, -58.38],
  [45.76, 4.84],
  [59.93, 30.33],
  [43.13, 131.89],
  [39.9, 116.4],
  [34.55, 69.2],
  [21.03, 105.85],
  [3.14, 101.68],
  [23.02, 72.57],
];
