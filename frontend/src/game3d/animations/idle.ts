export const easeInOut = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
};

export const pingPong01 = (t: number) => {
  const x = t % 2;
  return x <= 1 ? x : 2 - x;
};

export const breathe = (t: number, speed: number) => {
  return Math.sin(t * speed) * 0.5 + 0.5;
};

export const subtleNod = (t: number, speed: number) => {
  return Math.sin(t * speed) * 0.25 + Math.sin(t * speed * 0.5) * 0.15;
};
