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
    size: 1024,
    paint: (ctx, size) => {
      // Base: Deep, healthy green mixed with some dry patches
      ctx.fillStyle = '#3a6639';
      ctx.fillRect(0, 0, size, size);

      // 1. Large noise patches (Dry/Lush areas)
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 50 + Math.random() * 150;
        // Some lighter/yellower (sun exposed), some darker (lush)
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(80, 120, 60, 0.15)' : 'rgba(30, 80, 40, 0.2)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Blades/Noise
      for (let i = 0; i < 20000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const w = 1 + Math.random() * 2;
        const h = 2 + Math.random() * 6;
        // Varied greens: from yellow-green to blue-green
        const g = 60 + Math.random() * 80; // Green channel
        const r = 20 + Math.random() * 40; // Red channel
        ctx.fillStyle = `rgba(${r}, ${g}, 30, 0.25)`;
        ctx.fillRect(x, y, w, h);
      }

      // 3. Tiny details (Clovers, small soil specs)
      ctx.fillStyle = 'rgba(20, 10, 5, 0.3)'; // Soil
      for (let i = 0; i < 2000; i++) {
        ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
      }

      // 4. Subtle highlights
      ctx.fillStyle = 'rgba(255, 255, 220, 0.1)';
      for (let i = 0; i < 1000; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * size, Math.random() * size, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  });
}

export function makeWoodTexture() {
  return createCanvasTexture({
    size: 1024,
    paint: (ctx, size) => {
      // Base: Warm medium brown
      ctx.fillStyle = '#8f6b4e';
      ctx.fillRect(0, 0, size, size);

      const numPlanks = 8;
      const plankHeight = size / numPlanks;

      // 1. Draw Individual Planks
      for (let i = 0; i < numPlanks; i++) {
        const y = i * plankHeight;

        // Vary Tone
        const toneVar = (Math.random() - 0.5) * 30;
        const colorVal = Math.max(0, Math.min(255, 120 + toneVar));
        ctx.fillStyle = `rgb(${colorVal}, ${colorVal * 0.8}, ${colorVal * 0.6})`;
        ctx.fillRect(0, y, size, plankHeight);

        // Grain
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = '#3e2b1f';
        for (let j = 0; j < 60; j++) {
          const gy = y + Math.random() * plankHeight;
          ctx.lineWidth = 1 + Math.random() * 3;
          ctx.beginPath();
          ctx.moveTo(0, gy);
          // Slight curve for grain
          ctx.bezierCurveTo(size / 3, gy + (Math.random() - 0.5) * 20, size * 0.66, gy + (Math.random() - 0.5) * 20, size, gy);
          ctx.stroke();
        }

        // Knots
        if (Math.random() > 0.6) {
          const kx = Math.random() * size;
          const ky = y + Math.random() * plankHeight;
          const r = 5 + Math.random() * 15;
          ctx.fillStyle = '#2a1a10';
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.ellipse(kx, ky, r * 2, r, Math.random(), 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1.0;
      }

      // 2. Seams (Darkened)
      ctx.strokeStyle = '#1a1008';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.6;
      for (let i = 1; i < numPlanks; i++) {
        const y = i * plankHeight;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();
      }

      // 3. Wear & Scuffs (Global)
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = '#000'; // Darkens
      for (let i = 0; i < 500; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const w = 2 + Math.random() * 10;
        ctx.globalAlpha = 0.05;
        ctx.beginPath();
        ctx.arc(x, y, w, 0, Math.PI * 2);
        ctx.fill();
      }

      // Scratches (Light)
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#d9cbb8';
      ctx.globalAlpha = 0.1;
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const len = 10 + Math.random() * 40;
        const ang = (Math.random() - 0.5) * 1;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
        ctx.stroke();
      }
    },
  });
}

export function makeForestFloorTexture() {
  return createCanvasTexture({
    size: 1024,
    paint: (ctx, size) => {
      // Base: Dark damp soil
      ctx.fillStyle = '#221e18';
      ctx.fillRect(0, 0, size, size);

      // 1. Moss Patches
      for (let i = 0; i < 15; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 80 + Math.random() * 200;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, 'rgba(40, 70, 30, 0.4)');
        grad.addColorStop(1, 'rgba(40, 70, 30, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Small Noise (Moss texture)
      for (let i = 0; i < 15000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        ctx.fillStyle = Math.random() > 0.6 ? 'rgba(60, 100, 40, 0.2)' : 'rgba(20, 40, 20, 0.15)';
        ctx.fillRect(x, y, 2, 2);
      }

      // 3. Fallen Leaves (Dead/Yellow)
      for (let i = 0; i < 400; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const angle = Math.random() * Math.PI;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = Math.random() > 0.5 ? '#6b542e' : '#594426';
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. Pebbles
      ctx.fillStyle = '#333';
      for (let i = 0; i < 300; i++) {
        const r = 1 + Math.random() * 3;
        ctx.beginPath();
        ctx.arc(Math.random() * size, Math.random() * size, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  });
}
