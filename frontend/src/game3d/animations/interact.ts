export const pop = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  const a = 1 - Math.pow(1 - x, 3);
  return a;
};

export const wobble = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return Math.sin(x * Math.PI * 2) * (1 - x);
};
