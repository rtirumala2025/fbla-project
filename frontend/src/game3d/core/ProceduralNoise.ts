import * as THREE from 'three';

/**
 * Procedural Noise Generation for AAA Visual Detail
 * Generates canvas-based textures for roughness, normal, and AO maps
 */

// Simple pseudo-random hash function
function hash(x: number, y: number): number {
    const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return h - Math.floor(h);
}

// 2D Perlin-style noise
function noise2D(x: number, y: number): number {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;

    // Smooth interpolation
    const u = xf * xf * (3.0 - 2.0 * xf);
    const v = yf * yf * (3.0 - 2.0 * yf);

    // Hash corners
    const a = hash(xi, yi);
    const b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1);
    const d = hash(xi + 1, yi + 1);

    // Bilinear interpolation
    return a * (1 - u) * (1 - v) +
        b * u * (1 - v) +
        c * (1 - u) * v +
        d * u * v;
}

// Fractal Brownian Motion (multi-octave noise)
function fbm(x: number, y: number, octaves: number): number {
    let value = 0.0;
    let amplitude = 0.5;
    let frequency = 1.0;

    for (let i = 0; i < octaves; i++) {
        value += amplitude * noise2D(x * frequency, y * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }

    return value;
}

/**
 * Generate grayscale noise texture for roughness variation
 * @param size - Texture resolution (e.g., 512)
 * @param frequency - Noise frequency multiplier (higher = more detail)
 * @param octaves - Number of noise layers (3-5 typical)
 * @returns THREE.Texture
 */
export function makeNoiseTexture(size: number = 512, frequency: number = 4.0, octaves: number = 3): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas not supported');

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = (x / size) * frequency;
            const ny = (y / size) * frequency;

            const noiseValue = fbm(nx, ny, octaves);
            const gray = Math.floor((noiseValue * 0.5 + 0.5) * 255); // Remap to 0-255

            const idx = (y * size + x) * 4;
            data[idx] = gray;
            data[idx + 1] = gray;
            data[idx + 2] = gray;
            data[idx + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.LinearSRGBColorSpace; // Roughness is data, not color
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
}

/**
 * Generate normal map texture from noise
 * @param size - Texture resolution
 * @param strength - Normal perturbation strength (0.0-1.0)
 * @returns THREE.Texture
 */
export function makeNormalNoiseTexture(size: number = 512, strength: number = 0.5): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas not supported');

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    // Generate height field
    const heightMap: number[][] = [];
    for (let y = 0; y < size; y++) {
        heightMap[y] = [];
        for (let x = 0; x < size; x++) {
            const nx = (x / size) * 6.0;
            const ny = (y / size) * 6.0;
            heightMap[y][x] = fbm(nx, ny, 3);
        }
    }

    // Calculate normals via Sobel filter
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const xPrev = Math.max(0, x - 1);
            const xNext = Math.min(size - 1, x + 1);
            const yPrev = Math.max(0, y - 1);
            const yNext = Math.min(size - 1, y + 1);

            const dx = (heightMap[y][xNext] - heightMap[y][xPrev]) * strength;
            const dy = (heightMap[yNext][x] - heightMap[yPrev][x]) * strength;

            // Normal vector (dx, dy, 1.0) normalized
            const len = Math.sqrt(dx * dx + dy * dy + 1.0);
            const nx = dx / len;
            const ny = dy / len;
            const nz = 1.0 / len;

            // Encode normal as RGB (remap from [-1,1] to [0,255])
            const idx = (y * size + x) * 4;
            data[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
            data[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
            data[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
            data[idx + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.LinearSRGBColorSpace; // Normals are data
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
}

/**
 * Generate fake ambient occlusion texture (contact darkening)
 * @param size - Texture resolution
 * @param samples - Number of AO samples (higher = darker crevices)
 * @returns THREE.Texture
 */
export function makeAOTexture(size: number = 512, samples: number = 16): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas not supported');

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let occlusion = 0;

            // Sample surrounding area
            for (let i = 0; i < samples; i++) {
                const angle = (i / samples) * Math.PI * 2;
                const radius = 0.05 * size;
                const sx = x + Math.cos(angle) * radius;
                const sy = y + Math.sin(angle) * radius;

                const nx = (sx / size) * 8.0;
                const ny = (sy / size) * 8.0;
                const heightDiff = noise2D(nx, ny) - noise2D(x / size * 8.0, y / size * 8.0);

                if (heightDiff > 0) occlusion += 1;
            }

            const ao = 1.0 - (occlusion / samples) * 0.4; // Max 40% darkening
            const gray = Math.floor(ao * 255);

            const idx = (y * size + x) * 4;
            data[idx] = gray;
            data[idx + 1] = gray;
            data[idx + 2] = gray;
            data[idx + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.LinearSRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
}
