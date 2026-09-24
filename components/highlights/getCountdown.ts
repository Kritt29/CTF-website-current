export function getCountdown(deadline: number, now: number) {
  const total = Math.max(0, Math.floor((deadline - now) / 1000));
  return [Math.floor(total / 86400), Math.floor(total / 3600) % 24, Math.floor(total / 60) % 60, total % 60];
}
