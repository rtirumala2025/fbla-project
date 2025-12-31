import * as THREE from 'three';

export function createCanvasTexture(opts: {
  size: number;
  paint: (ctx: CanvasRenderingContext2D, size: number) => void;
}) {
  const canvas = document.createElement('canvas');
  canvas.width = opts.size;
  canvas.height = opts.size;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas not supported');

  opts.paint(ctx, opts.size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

export function makeGrassTexture() {
  return createCanvasTexture({
    size: 512,
    paint: (ctx, size) => {
      ctx.fillStyle = '#4f8f4a';
      ctx.fillRect(0, 0, size, size);

      for (let i = 0; i < 1800; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const h = 3 + Math.random() * 12;
        const w = 1 + Math.random() * 2;
        const g = 90 + Math.floor(Math.random() * 80);
        ctx.fillStyle = `rgba(20, ${g}, 40, 0.25)`;
        ctx.fillRect(x, y, w, h);
      }

      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let i = 0; i < 80; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * size, Math.random() * size, 2 + Math.random() * 6, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  });
}

export function makeWoodTexture() {
  return createCanvasTexture({
    size: 512,
    paint: (ctx, size) => {
      ctx.fillStyle = '#6b4f35';
      ctx.fillRect(0, 0, size, size);

      for (let row = 0; row < 10; row++) {
        const y = (row / 10) * size;
        ctx.fillStyle = row % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
        ctx.fillRect(0, y, size, size / 10);
      }

      for (let i = 0; i < 120; i++) {
        const y = Math.random() * size;
        ctx.strokeStyle = 'rgba(20,10,5,0.15)';
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(size * 0.25, y + (Math.random() - 0.5) * 18, size * 0.75, y + (Math.random() - 0.5) * 18, size, y);
        ctx.stroke();
      }
    },
  });
}

export function makeForestFloorTexture() {
  return createCanvasTexture({
    size: 512,
    paint: (ctx, size) => {
      ctx.fillStyle = '#2b4a2c';
      ctx.fillRect(0, 0, size, size);

      for (let i = 0; i < 900; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 2 + Math.random() * 10;
        const c = Math.random() < 0.5 ? 'rgba(10,70,30,0.22)' : 'rgba(60,120,50,0.16)';
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (let i = 0; i < 220; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * size, Math.random() * size, 1 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  });
}
