// SimCity 3000 Style Sprite-Based Renderer
// Uses pre-generated cached sprites for authentic SC3000 graphics

import {
  Tile,
  PlacedBuilding,
  BuildingDef,
  ZoneType,
  ZoneDensity,
  InfrastructureType,
} from './types';
import { sprites, SPRITE_WIDTH, SPRITE_HEIGHT, SPRITE_DEPTH, BUILDING_TILE_WIDTH, BUILDING_TILE_HEIGHT } from './sprites';

// Export tile dimensions
export const TILE_WIDTH = SPRITE_WIDTH;
export const TILE_HEIGHT = SPRITE_HEIGHT;
export const TILE_DEPTH = SPRITE_DEPTH;

// SC3000 UI colors
const SC3K_UI = {
  panelDark: '#0a2040',
  panelMid: '#1a3a6a',
  border: '#4a7aba',
  text: '#e0e8f0',
  textDim: '#8090a0',
};

// Convert grid coordinates to screen coordinates
export function gridToScreen(x: number, y: number, elevation: number = 0): { x: number; y: number } {
  return {
    x: (x - y) * (TILE_WIDTH / 2),
    y: (x + y) * (TILE_HEIGHT / 2) - elevation * TILE_DEPTH,
  };
}

// Convert screen coordinates to grid coordinates
export function screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
  const x = (screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2;
  const y = (screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2;
  return { x: Math.floor(x), y: Math.floor(y) };
}

// Initialize sprites (call once on game start)
export function initRenderer(): void {
  sprites.init();
}

// Draw a single tile using cached sprites
export function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  screenX: number,
  screenY: number,
  showZones: boolean = true,
  time: number = 0
): void {
  const { terrain, elevation, zone, zoneDensity, development } = tile;
  const seed = tile.x * 1000 + tile.y;
  const offsetY = -elevation * TILE_DEPTH;

  // Draw terrain sprite
  // Kenney's landscape sprites are 132x83, so position them to align bottom with tile base
  const spriteBaseOffset = 17; // Extra height above base tile (83 - 66)

  if (terrain === 'water') {
    drawWater(ctx, screenX, screenY, time, elevation);
  } else if (terrain === 'grass' || terrain === 'trees') {
    // Use seeded grass variant
    const variant = seed % 4;
    const sprite = sprites.getGrass(variant);
    if (sprite) {
      ctx.drawImage(sprite, screenX - TILE_WIDTH / 2, screenY + offsetY - spriteBaseOffset);
    } else {
      // Fallback to direct drawing if sprite not ready
      drawGrassFallback(ctx, screenX, screenY + offsetY, seed, elevation);
    }

    if (terrain === 'trees') {
      drawTreesOnTile(ctx, screenX, screenY + offsetY, seed);
    }
  } else if (terrain === 'dirt') {
    const sprite = sprites.get('dirt');
    if (sprite) {
      ctx.drawImage(sprite, screenX - TILE_WIDTH / 2, screenY + offsetY - spriteBaseOffset);
    } else {
      drawDirtFallback(ctx, screenX, screenY + offsetY, elevation);
    }
  } else {
    // Default to grass
    const variant = seed % 4;
    const sprite = sprites.getGrass(variant);
    if (sprite) {
      ctx.drawImage(sprite, screenX - TILE_WIDTH / 2, screenY + offsetY - spriteBaseOffset);
    }
  }

  // Draw elevation sides if elevated
  if (elevation > 0 && terrain !== 'water') {
    drawElevationSides(ctx, screenX, screenY, elevation, seed);
  }

  // Draw zone overlay for undeveloped zones
  if (showZones && zone && development === 0) {
    drawZoneOverlay(ctx, screenX, screenY + offsetY, zone, zoneDensity);
  }
}

// Draw elevation sides (for raised terrain)
function drawElevationSides(ctx: CanvasRenderingContext2D, x: number, y: number, elevation: number, seed: number): void {
  const colors = ['#3a8a2a', '#4a9a3a', '#2a7a1a', '#45953a'];
  const baseColor = colors[seed % 4];

  // Left side
  ctx.fillStyle = adjustColor(baseColor, -40);
  ctx.beginPath();
  ctx.moveTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2 - elevation * TILE_DEPTH);
  ctx.lineTo(x, y + TILE_HEIGHT - elevation * TILE_DEPTH);
  ctx.lineTo(x, y + TILE_HEIGHT);
  ctx.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
  ctx.closePath();
  ctx.fill();

  // Right side
  ctx.fillStyle = adjustColor(baseColor, -25);
  ctx.beginPath();
  ctx.moveTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2 - elevation * TILE_DEPTH);
  ctx.lineTo(x, y + TILE_HEIGHT - elevation * TILE_DEPTH);
  ctx.lineTo(x, y + TILE_HEIGHT);
  ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
  ctx.closePath();
  ctx.fill();
}

// Fallback grass drawing if sprites not loaded
function drawGrassFallback(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number, elevation: number): void {
  const colors = ['#3a8a2a', '#4a9a3a', '#2a7a1a', '#45953a'];
  const baseColor = colors[seed % 4];

  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
  ctx.lineTo(x, y + TILE_HEIGHT);
  ctx.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
  ctx.closePath();
  ctx.fill();
}

// Fallback dirt drawing
function drawDirtFallback(ctx: CanvasRenderingContext2D, x: number, y: number, elevation: number): void {
  ctx.fillStyle = '#8a7050';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
  ctx.lineTo(x, y + TILE_HEIGHT);
  ctx.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
  ctx.closePath();
  ctx.fill();
}

// Draw animated water
export function drawWater(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, elevation: number = 0): void {
  const offsetY = -elevation * TILE_DEPTH;
  const wave = Math.sin(time * 0.003 + x * 0.02 + y * 0.01) * 1.5;
  const spriteBaseOffset = 17; // Extra height above base tile

  // Water sprite as base
  const sprite = sprites.get('water');
  if (sprite) {
    ctx.drawImage(sprite, x - TILE_WIDTH / 2, y + offsetY + wave - spriteBaseOffset);
  } else {
    // Fallback water gradient
    const gradient = ctx.createLinearGradient(x - 20, y + offsetY, x + 20, y + TILE_HEIGHT + offsetY);
    gradient.addColorStop(0, '#3a78a8');
    gradient.addColorStop(0.5, '#2a5888');
    gradient.addColorStop(1, '#1a4878');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x, y + offsetY + wave);
    ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2 + offsetY + wave);
    ctx.lineTo(x, y + TILE_HEIGHT + offsetY + wave);
    ctx.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2 + offsetY + wave);
    ctx.closePath();
    ctx.fill();
  }

  // Animated sparkle
  const sparkle = (time * 0.004 + x * 0.1) % (Math.PI * 2);
  if (Math.sin(sparkle) > 0.6) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(x - 6 + wave * 2, y + TILE_HEIGHT / 3 + offsetY, 4, 2, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw trees on tile using sprites
function drawTreesOnTile(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number): void {
  const random = seedRandom(seed);
  const count = 2 + Math.floor(random() * 2);

  for (let i = 0; i < count; i++) {
    const tx = x + (random() - 0.5) * 30;
    const ty = y + TILE_HEIGHT / 2 + (random() - 0.5) * 10 - 8;
    const sizeVariant = Math.floor(random() * 3);

    const sprite = sprites.get(`tree_${sizeVariant}`);
    if (sprite) {
      ctx.drawImage(sprite, tx - sprite.width / 2, ty - sprite.height + 8);
    } else {
      // Fallback tree drawing
      drawTreeFallback(ctx, tx, ty, 10 + sizeVariant * 4, random);
    }
  }
}

// Fallback tree drawing
function drawTreeFallback(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, random: () => number): void {
  ctx.fillStyle = '#4a3020';
  ctx.fillRect(x - 2, y, 4, size / 2 + 4);

  const colors = ['#2a6a1a', '#3a8a2a', '#4a9a3a'];
  for (let layer = 0; layer < 3; layer++) {
    const layerSize = size - layer * 3;
    const layerY = y - layer * 4;
    ctx.fillStyle = colors[layer];
    ctx.beginPath();
    ctx.moveTo(x, layerY - layerSize);
    ctx.lineTo(x + layerSize * 0.8, layerY + 2);
    ctx.lineTo(x - layerSize * 0.8, layerY + 2);
    ctx.closePath();
    ctx.fill();
  }
}

// Draw zone overlay using sprites
function drawZoneOverlay(ctx: CanvasRenderingContext2D, x: number, y: number, zone: ZoneType | null, density: ZoneDensity | null): void {
  if (!zone) return;
  const densityStr = density || 'light';
  const zoneChar = zone.charAt(0); // r, c, or i
  const spriteKey = `zone_${zoneChar}_${densityStr}`;

  const sprite = sprites.get(spriteKey);
  if (sprite) {
    ctx.drawImage(sprite, x - TILE_WIDTH / 2, y - 4);
  } else {
    // Fallback zone overlay
    let color: string;
    switch (zone) {
      case 'residential':
        color = density === 'dense' ? '#209020' : density === 'medium' ? '#40c040' : '#80e080';
        break;
      case 'commercial':
        color = density === 'dense' ? '#2050a0' : density === 'medium' ? '#4080d0' : '#80b0e0';
        break;
      case 'industrial':
        color = density === 'dense' ? '#a08020' : density === 'medium' ? '#d0c040' : '#e8e080';
        break;
      default:
        return;
    }

    ctx.globalAlpha = 0.55;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
    ctx.lineTo(x, y + TILE_HEIGHT);
    ctx.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// Draw infrastructure using sprites
export function drawInfrastructure(
  ctx: CanvasRenderingContext2D,
  type: InfrastructureType,
  x: number,
  y: number,
  neighbors: { n: boolean; s: boolean; e: boolean; w: boolean },
  elevation: number = 0
): void {
  const offsetY = -elevation * TILE_DEPTH;

  switch (type) {
    case 'road':
      drawRoad(ctx, x, y + offsetY, neighbors);
      break;
    case 'highway':
      drawHighway(ctx, x, y + offsetY);
      break;
    case 'rail':
      drawRail(ctx, x, y + offsetY);
      break;
    case 'power_line':
      drawPowerLine(ctx, x, y + offsetY);
      break;
    case 'water_pipe':
      drawWaterPipe(ctx, x, y + offsetY);
      break;
  }
}

// Draw road using sprites
function drawRoad(ctx: CanvasRenderingContext2D, x: number, y: number, neighbors: { n: boolean; s: boolean; e: boolean; w: boolean }): void {
  // Calculate connection mask: N=1, E=2, S=4, W=8
  const mask = (neighbors.n ? 1 : 0) | (neighbors.e ? 2 : 0) | (neighbors.s ? 4 : 0) | (neighbors.w ? 8 : 0);
  const sprite = sprites.getRoad(mask);
  const cityBaseOffset = 38; // City sprites are 132x104 (104 - 66 = 38)

  if (sprite) {
    ctx.drawImage(sprite, x - TILE_WIDTH / 2, y - cityBaseOffset);
  } else {
    // Fallback road drawing
    ctx.fillStyle = '#909090';
    ctx.beginPath();
    ctx.moveTo(x, y + 2);
    ctx.lineTo(x + 26, y + TILE_HEIGHT / 2 + 2);
    ctx.lineTo(x, y + TILE_HEIGHT + 2);
    ctx.lineTo(x - 26, y + TILE_HEIGHT / 2 + 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#484848';
    ctx.beginPath();
    ctx.moveTo(x, y + 4);
    ctx.lineTo(x + 20, y + TILE_HEIGHT / 2 + 2);
    ctx.lineTo(x, y + TILE_HEIGHT);
    ctx.lineTo(x - 20, y + TILE_HEIGHT / 2 + 2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#e8d020';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(x - 12, y + TILE_HEIGHT / 2 + 2);
    ctx.lineTo(x + 12, y + TILE_HEIGHT / 2 + 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// Draw highway using sprite
function drawHighway(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const sprite = sprites.get('highway');
  const cityBaseOffset = 38;
  if (sprite) {
    ctx.drawImage(sprite, x - TILE_WIDTH / 2, y - cityBaseOffset);
  } else {
    // Fallback
    ctx.fillStyle = '#404040';
    ctx.beginPath();
    ctx.moveTo(x, y - 2);
    ctx.lineTo(x + TILE_WIDTH / 2 - 4, y + TILE_HEIGHT / 2 - 2);
    ctx.lineTo(x, y + TILE_HEIGHT - 2);
    ctx.lineTo(x - TILE_WIDTH / 2 + 4, y + TILE_HEIGHT / 2 - 2);
    ctx.closePath();
    ctx.fill();
  }
}

// Draw rail using sprite
function drawRail(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const sprite = sprites.get('rail');
  const cityBaseOffset = 38;
  if (sprite) {
    ctx.drawImage(sprite, x - TILE_WIDTH / 2, y - cityBaseOffset);
  } else {
    // Fallback
    ctx.fillStyle = '#5a5a5a';
    ctx.beginPath();
    ctx.moveTo(x, y + 4);
    ctx.lineTo(x + 18, y + TILE_HEIGHT / 2 + 2);
    ctx.lineTo(x, y + TILE_HEIGHT);
    ctx.lineTo(x - 18, y + TILE_HEIGHT / 2 + 2);
    ctx.closePath();
    ctx.fill();
  }
}

// Draw power line using sprite
function drawPowerLine(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const sprite = sprites.get('power_line');
  const cityBaseOffset = 38;
  if (sprite) {
    ctx.drawImage(sprite, x - TILE_WIDTH / 2, y - cityBaseOffset);
  } else {
    // Fallback
    ctx.fillStyle = '#505050';
    ctx.beginPath();
    ctx.moveTo(x - 5, y + TILE_HEIGHT / 2);
    ctx.lineTo(x, y - 25);
    ctx.lineTo(x + 5, y + TILE_HEIGHT / 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#404040';
    ctx.fillRect(x - 14, y - 20, 28, 3);
  }
}

// Draw water pipe using sprite
function drawWaterPipe(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const sprite = sprites.get('water_pipe');
  const cityBaseOffset = 38;
  if (sprite) {
    ctx.drawImage(sprite, x - TILE_WIDTH / 2, y - cityBaseOffset);
  } else {
    // Fallback
    ctx.fillStyle = 'rgba(0, 120, 220, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + TILE_HEIGHT / 2, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw zone building - SimCity 3000 style procedural graphics
export function drawZoneBuilding(ctx: CanvasRenderingContext2D, tile: Tile, x: number, y: number): void {
  const { zone, zoneDensity, development, elevation, powered } = tile;
  if (!zone || development === 0) return;

  const offsetY = -elevation * TILE_DEPTH;
  const baseY = y + offsetY + TILE_HEIGHT / 2;
  const level = Math.max(1, Math.min(8, development));
  const seed = tile.x * 1000 + tile.y;

  switch (zone) {
    case 'residential':
      drawSC3KResidential(ctx, x, baseY, level, seed);
      break;
    case 'commercial':
      drawSC3KCommercial(ctx, x, baseY, level, seed);
      break;
    case 'industrial':
      drawSC3KIndustrial(ctx, x, baseY, level, seed);
      break;
  }

  // Draw no power indicator
  if (!powered) {
    drawNoPowerIndicator(ctx, x, baseY - 20 - level * 8);
  }
}

// SC3K Style Residential Buildings
function drawSC3KResidential(ctx: CanvasRenderingContext2D, x: number, y: number, level: number, seed: number): void {
  const rand = seedRandom(seed);

  if (level <= 2) {
    // Small house
    const w = 28 + rand() * 8;
    const h = 20 + level * 6;
    const houseColor = ['#e8d4b8', '#d4c4a8', '#c8b898', '#dcd0b4'][Math.floor(rand() * 4)];
    const roofColor = ['#8b4513', '#a0522d', '#6b3510', '#7a4420'][Math.floor(rand() * 4)];

    // House body
    drawIsometricBox(ctx, x, y, w, w * 0.6, h, houseColor);

    // Pitched roof
    const roofH = 12;
    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(x - w/2, y - h);
    ctx.lineTo(x, y - h - roofH);
    ctx.lineTo(x + w/2, y - h);
    ctx.lineTo(x + w/2 + w*0.15, y - h + w*0.15);
    ctx.lineTo(x + w*0.15, y - h - roofH + w*0.15);
    ctx.lineTo(x - w/2 + w*0.15, y - h + w*0.15);
    ctx.closePath();
    ctx.fill();

    // Door
    ctx.fillStyle = '#5a3a20';
    ctx.fillRect(x - 3, y - 12, 6, 12);

    // Windows
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(x - w/3, y - h + 8, 5, 6);
    ctx.fillRect(x + w/3 - 5, y - h + 8, 5, 6);

  } else if (level <= 5) {
    // Apartment building
    const w = 32 + level * 2;
    const h = 35 + level * 12;
    const floors = 2 + level;
    const colors = ['#d4c8b8', '#c8bca8', '#b8a898', '#ccc4b4'];

    drawIsometricBox(ctx, x, y, w, w * 0.5, h, colors[seed % 4]);

    // Windows grid
    ctx.fillStyle = '#6090c0';
    const floorH = h / floors;
    for (let f = 0; f < floors; f++) {
      for (let wx = 0; wx < 3; wx++) {
        const winX = x - w/3 + wx * (w/3);
        const winY = y - h + f * floorH + floorH/2;
        ctx.fillRect(winX - 2, winY, 4, 5);
      }
    }

    // Flat roof edge
    ctx.fillStyle = '#808080';
    ctx.fillRect(x - w/2, y - h - 2, w, 2);

  } else {
    // High-rise apartment
    const w = 36;
    const h = 60 + level * 15;
    const floors = 5 + level;

    drawIsometricBox(ctx, x, y, w, w * 0.5, h, '#c4b8a8');

    // Many windows
    ctx.fillStyle = '#5080b0';
    const floorH = h / floors;
    for (let f = 0; f < floors; f++) {
      for (let wx = 0; wx < 4; wx++) {
        const winX = x - w/2 + 4 + wx * 8;
        const winY = y - h + f * floorH + 4;
        ctx.fillRect(winX, winY, 5, 4);
      }
    }

    // Roof details
    ctx.fillStyle = '#707070';
    ctx.fillRect(x - 4, y - h - 8, 8, 8);
  }
}

// SC3K Style Commercial Buildings
function drawSC3KCommercial(ctx: CanvasRenderingContext2D, x: number, y: number, level: number, seed: number): void {
  const rand = seedRandom(seed);

  if (level <= 2) {
    // Small shop
    const w = 30 + rand() * 6;
    const h = 22 + level * 5;
    const colors = ['#b8c8d8', '#a8b8c8', '#98a8b8', '#c0d0e0'];

    drawIsometricBox(ctx, x, y, w, w * 0.5, h, colors[seed % 4]);

    // Shop window (large)
    ctx.fillStyle = '#70a0d0';
    ctx.fillRect(x - w/3, y - h/2 - 2, w * 0.5, h/2 - 4);

    // Awning
    ctx.fillStyle = ['#c04040', '#4080c0', '#40a040', '#c0a040'][seed % 4];
    ctx.beginPath();
    ctx.moveTo(x - w/2 + 2, y - h + 2);
    ctx.lineTo(x + w/2 - 2, y - h + 2);
    ctx.lineTo(x + w/2 + 4, y - h + 8);
    ctx.lineTo(x - w/2 - 2, y - h + 8);
    ctx.closePath();
    ctx.fill();

  } else if (level <= 5) {
    // Office building
    const w = 34 + level * 2;
    const h = 45 + level * 14;
    const floors = 3 + level;

    // Glass and steel look
    drawIsometricBox(ctx, x, y, w, w * 0.5, h, '#708898');

    // Glass windows (blue tint)
    ctx.fillStyle = '#4080b8';
    const floorH = h / floors;
    for (let f = 0; f < floors; f++) {
      ctx.fillRect(x - w/2 + 3, y - h + f * floorH + 3, w - 6, floorH - 5);
    }

    // Window frames
    ctx.strokeStyle = '#506070';
    ctx.lineWidth = 1;
    for (let f = 0; f < floors; f++) {
      for (let wx = 0; wx < 4; wx++) {
        ctx.strokeRect(x - w/2 + 4 + wx * (w/4 - 1), y - h + f * floorH + 4, w/4 - 3, floorH - 7);
      }
    }

  } else {
    // Skyscraper
    const w = 38;
    const h = 80 + level * 18;
    const floors = 8 + level;

    // Modern glass tower
    drawIsometricBox(ctx, x, y, w, w * 0.45, h, '#607888');

    // Reflective glass
    ctx.fillStyle = '#3070a0';
    const floorH = h / floors;
    for (let f = 0; f < floors; f++) {
      ctx.fillRect(x - w/2 + 2, y - h + f * floorH + 2, w - 4, floorH - 3);
    }

    // Spire on top
    ctx.fillStyle = '#909090';
    ctx.beginPath();
    ctx.moveTo(x - 2, y - h);
    ctx.lineTo(x, y - h - 20);
    ctx.lineTo(x + 2, y - h);
    ctx.closePath();
    ctx.fill();
  }
}

// SC3K Style Industrial Buildings
function drawSC3KIndustrial(ctx: CanvasRenderingContext2D, x: number, y: number, level: number, seed: number): void {
  const rand = seedRandom(seed);

  if (level <= 2) {
    // Warehouse
    const w = 36 + rand() * 8;
    const h = 20 + level * 4;
    const colors = ['#909080', '#a09888', '#888878', '#98907c'];

    drawIsometricBox(ctx, x, y, w, w * 0.6, h, colors[seed % 4]);

    // Corrugated roof
    ctx.fillStyle = '#707068';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(x - w/2 + i * (w/5), y - h - 2, w/5 - 1, 3);
    }

    // Large door
    ctx.fillStyle = '#505048';
    ctx.fillRect(x - 8, y - 14, 16, 14);

  } else if (level <= 5) {
    // Factory
    const w = 40 + level * 2;
    const h = 30 + level * 8;

    drawIsometricBox(ctx, x, y, w, w * 0.55, h, '#807870');

    // Sawtooth roof
    ctx.fillStyle = '#606058';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x - w/2 + i * (w/3), y - h);
      ctx.lineTo(x - w/2 + i * (w/3) + w/6, y - h - 10);
      ctx.lineTo(x - w/2 + (i+1) * (w/3), y - h);
      ctx.closePath();
      ctx.fill();
    }

    // Smokestack
    ctx.fillStyle = '#604840';
    ctx.fillRect(x + w/4, y - h - 25, 8, 25);

    // Smoke
    ctx.fillStyle = 'rgba(100,100,100,0.4)';
    ctx.beginPath();
    ctx.ellipse(x + w/4 + 4, y - h - 30, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w/4 + 6, y - h - 38, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Windows
    ctx.fillStyle = '#a0a090';
    for (let wx = 0; wx < 3; wx++) {
      ctx.fillRect(x - w/3 + wx * (w/3), y - h + 10, 6, 8);
    }

  } else {
    // Heavy industry / refinery
    const w = 44;
    const h = 40 + level * 10;

    drawIsometricBox(ctx, x, y, w, w * 0.5, h, '#706860');

    // Multiple smokestacks
    ctx.fillStyle = '#585048';
    ctx.fillRect(x - w/3, y - h - 30, 6, 30);
    ctx.fillRect(x, y - h - 40, 8, 40);
    ctx.fillRect(x + w/4, y - h - 25, 6, 25);

    // Tanks
    ctx.fillStyle = '#808078';
    ctx.beginPath();
    ctx.ellipse(x - w/4, y - 10, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - w/4 - 10, y - 25, 20, 15);

    // Pipes
    ctx.strokeStyle = '#606058';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - w/4, y - 25);
    ctx.lineTo(x - w/4, y - h + 10);
    ctx.lineTo(x + w/4, y - h + 10);
    ctx.stroke();
  }
}

// Draw isometric box with proper 3D shading
function drawIsometricBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, d: number, h: number, baseColor: string): void {
  // Parse color and create shading
  const rgb = parseColor(baseColor);
  const frontColor = baseColor;
  const rightColor = `rgb(${Math.max(0, rgb.r - 30)}, ${Math.max(0, rgb.g - 30)}, ${Math.max(0, rgb.b - 30)})`;
  const topColor = `rgb(${Math.min(255, rgb.r + 20)}, ${Math.min(255, rgb.g + 20)}, ${Math.min(255, rgb.b + 20)})`;

  // Front face
  ctx.fillStyle = frontColor;
  ctx.fillRect(x - w/2, y - h, w, h);

  // Right face (isometric)
  ctx.fillStyle = rightColor;
  ctx.beginPath();
  ctx.moveTo(x + w/2, y);
  ctx.lineTo(x + w/2 + d * 0.5, y - d * 0.3);
  ctx.lineTo(x + w/2 + d * 0.5, y - h - d * 0.3);
  ctx.lineTo(x + w/2, y - h);
  ctx.closePath();
  ctx.fill();

  // Top face
  ctx.fillStyle = topColor;
  ctx.beginPath();
  ctx.moveTo(x - w/2, y - h);
  ctx.lineTo(x - w/2 + d * 0.5, y - h - d * 0.3);
  ctx.lineTo(x + w/2 + d * 0.5, y - h - d * 0.3);
  ctx.lineTo(x + w/2, y - h);
  ctx.closePath();
  ctx.fill();

  // Outline
  ctx.strokeStyle = `rgb(${Math.max(0, rgb.r - 50)}, ${Math.max(0, rgb.g - 50)}, ${Math.max(0, rgb.b - 50)})`;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - w/2, y - h, w, h);
}

// Parse hex color to RGB
function parseColor(color: string): { r: number; g: number; b: number } {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  return { r: 128, g: 128, b: 128 };
}

// Fallback building drawing functions
function drawResidentialFallback(ctx: CanvasRenderingContext2D, x: number, y: number, density: string, development: number, seed: number): void {
  const isHouse = density === 'light' || development <= 2;
  const w = isHouse ? 20 + development * 2 : 26;
  const h = isHouse ? 14 + development * 3 : 30 + development * 10;

  draw3DBox(ctx, x, y, w, h, '#e8d8c8', '#c8b8a8', '#909090');

  if (isHouse) {
    // Roof
    ctx.fillStyle = '#a04020';
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 3, y - h);
    ctx.lineTo(x, y - h - 10);
    ctx.lineTo(x + w / 2 - 3, y - h);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCommercialFallback(ctx: CanvasRenderingContext2D, x: number, y: number, density: string, development: number, seed: number): void {
  const isShop = density === 'light' || development <= 2;
  const w = isShop ? 22 + development * 2 : 28;
  const h = isShop ? 18 + development * 4 : 40 + development * 12;

  draw3DBox(ctx, x, y, w, h, '#c8d0e0', '#98a0b0', '#8090a0');
}

function drawIndustrialFallback(ctx: CanvasRenderingContext2D, x: number, y: number, density: string, development: number, seed: number): void {
  const isWarehouse = density === 'light' || development <= 2;
  const w = isWarehouse ? 28 : 32;
  const h = isWarehouse ? 18 + development * 3 : 35 + development * 6;

  draw3DBox(ctx, x, y, w, h, '#909080', '#606050', '#505040');
}

// Draw 3D box helper
function draw3DBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, frontColor: string, sideColor: string, topColor: string): void {
  const halfW = w / 2;
  const depth = w / 3;

  // Front
  ctx.fillStyle = frontColor;
  ctx.beginPath();
  ctx.moveTo(x - halfW + depth / 2, y);
  ctx.lineTo(x + halfW - depth / 2, y);
  ctx.lineTo(x + halfW - depth / 2, y - h);
  ctx.lineTo(x - halfW + depth / 2, y - h);
  ctx.closePath();
  ctx.fill();

  // Right side
  ctx.fillStyle = sideColor;
  ctx.beginPath();
  ctx.moveTo(x + halfW - depth / 2, y);
  ctx.lineTo(x + halfW, y - depth / 2);
  ctx.lineTo(x + halfW, y - h - depth / 2);
  ctx.lineTo(x + halfW - depth / 2, y - h);
  ctx.closePath();
  ctx.fill();

  // Top
  ctx.fillStyle = topColor;
  ctx.beginPath();
  ctx.moveTo(x - halfW + depth / 2, y - h);
  ctx.lineTo(x + halfW - depth / 2, y - h);
  ctx.lineTo(x + halfW, y - h - depth / 2);
  ctx.lineTo(x - halfW + depth, y - h - depth / 2);
  ctx.closePath();
  ctx.fill();
}

// Draw placed building (civic buildings, power plants, etc.)
export function drawPlacedBuilding(ctx: CanvasRenderingContext2D, building: PlacedBuilding, def: BuildingDef, x: number, y: number, elevation: number = 0): void {
  const offsetY = -elevation * TILE_DEPTH;
  const baseY = y + offsetY + TILE_HEIGHT / 2;

  // Try to get sprite for building
  let spriteKey: string | null = null;

  switch (def.category) {
    case 'power':
      if (def.id.includes('coal') || def.id.includes('oil')) spriteKey = 'power_coal';
      else if (def.id.includes('nuclear')) spriteKey = 'power_nuclear';
      else if (def.id.includes('solar')) spriteKey = 'power_solar';
      break;
    case 'water':
      spriteKey = def.id.includes('tower') ? 'water_tower' : 'water_pump';
      break;
    case 'safety':
      spriteKey = def.id.includes('police') ? 'civic_police' : 'civic_fire';
      break;
    case 'health':
      spriteKey = 'civic_hospital';
      break;
    case 'education':
      spriteKey = 'civic_school';
      break;
    case 'civic':
      spriteKey = 'civic_city_hall';
      break;
    case 'recreation':
      spriteKey = 'civic_park';
      break;
  }

  if (spriteKey) {
    const sprite = sprites.get(spriteKey);
    if (sprite) {
      // City sprites are 132x104, position so bottom aligns with tile base
      ctx.drawImage(sprite, x - sprite.width / 2, baseY - sprite.height + 24);

      // Draw no power indicator for non-power buildings
      if (!building.powered && def.category !== 'power') {
        drawNoPowerIndicator(ctx, x, baseY - 60);
      }
      return;
    }
  }

  // Fallback: draw generic building
  const w = def.width * TILE_WIDTH * 0.55;
  const h = def.width * 22 + 28;

  draw3DBox(ctx, x, baseY, w, h, '#808080', '#606060', '#505050');

  if (!building.powered && def.category !== 'power') {
    drawNoPowerIndicator(ctx, x, baseY - h - 8);
  }
}

// Draw no power indicator
function drawNoPowerIndicator(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  if (Math.floor(Date.now() / 350) % 2 !== 0) return;

  ctx.fillStyle = '#ffc000';
  ctx.beginPath();
  ctx.moveTo(x, y - 10);
  ctx.lineTo(x + 5, y - 3);
  ctx.lineTo(x + 2, y - 3);
  ctx.lineTo(x + 4, y + 4);
  ctx.lineTo(x - 2, y - 1);
  ctx.lineTo(x + 1, y - 1);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#ff8800';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// Draw selection highlight
export function drawSelectionHighlight(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, valid: boolean): void {
  ctx.strokeStyle = valid ? '#00ff00' : '#ff0000';
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 4]);

  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const sx = x + (dx - dy) * (TILE_WIDTH / 2);
      const sy = y + (dx + dy) * (TILE_HEIGHT / 2);

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + TILE_WIDTH / 2, sy + TILE_HEIGHT / 2);
      ctx.lineTo(sx, sy + TILE_HEIGHT);
      ctx.lineTo(sx - TILE_WIDTH / 2, sy + TILE_HEIGHT / 2);
      ctx.closePath();
      ctx.stroke();
    }
  }

  ctx.setLineDash([]);
}

// Draw RCI demand meter
export function drawDemandMeter(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c: number, ind: number): void {
  const meterHeight = 80;
  const meterWidth = 16;
  const gap = 6;
  const totalWidth = (meterWidth + gap) * 3 + gap * 2;

  // Panel background
  ctx.fillStyle = SC3K_UI.panelDark;
  ctx.fillRect(x - 4, y - 4, totalWidth + 8, meterHeight + 26);

  // Panel border
  ctx.strokeStyle = SC3K_UI.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 4, y - 4, totalWidth + 8, meterHeight + 26);

  // Draw individual bars
  drawDemandBar(ctx, x, y, meterWidth, meterHeight, r, '#40c040', 'R');
  drawDemandBar(ctx, x + meterWidth + gap, y, meterWidth, meterHeight, c, '#4080d0', 'C');
  drawDemandBar(ctx, x + (meterWidth + gap) * 2, y, meterWidth, meterHeight, ind, '#d0c040', 'I');
}

// Draw single demand bar
function drawDemandBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, value: number, color: string, label: string): void {
  // Background
  ctx.fillStyle = '#101828';
  ctx.fillRect(x, y, w, h);

  // Center line
  ctx.strokeStyle = '#303848';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();

  // Bar
  const barHeight = Math.abs(value) / 100 * (h / 2);
  ctx.fillStyle = color;

  if (value >= 0) {
    ctx.fillRect(x + 2, y + h / 2 - barHeight, w - 4, barHeight);
  } else {
    ctx.fillRect(x + 2, y + h / 2, w - 4, barHeight);
  }

  // Highlight
  if (value > 0) {
    ctx.fillStyle = adjustColor(color, 35);
    ctx.fillRect(x + 2, y + h / 2 - barHeight, 3, barHeight);
  }

  // Label
  ctx.fillStyle = SC3K_UI.text;
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h + 12);
}

// Draw mini-map
export function drawMiniMap(ctx: CanvasRenderingContext2D, tiles: Tile[][], x: number, y: number, w: number, h: number, vx: number, vy: number, vw: number, vh: number): void {
  const mapWidth = tiles[0]?.length || 0;
  const mapHeight = tiles.length;
  const scaleX = w / mapWidth;
  const scaleY = h / mapHeight;

  // Panel background with shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x - 6, y - 6, w + 12, h + 12);

  ctx.fillStyle = SC3K_UI.panelDark;
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);

  // Panel border - thicker and brighter
  ctx.strokeStyle = '#6090c0';
  ctx.lineWidth = 3;
  ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);

  // Map background
  ctx.fillStyle = '#0a1520';
  ctx.fillRect(x, y, w, h);

  // Draw tiles
  for (let ty = 0; ty < mapHeight; ty++) {
    for (let tx = 0; tx < mapWidth; tx++) {
      const tile = tiles[ty]?.[tx];
      if (!tile) continue;

      let color: string;
      if (tile.building) {
        color = '#ffffff';
      } else if (tile.development && tile.development > 0 && tile.zone) {
        color = tile.zone === 'residential' ? '#40c040' : tile.zone === 'commercial' ? '#4080d0' : '#d0c040';
      } else if (tile.zone) {
        color = tile.zone === 'residential' ? '#80e080' : tile.zone === 'commercial' ? '#80b0e0' : '#e8e080';
      } else if (tile.infrastructure) {
        color = '#585858';
      } else if (tile.terrain === 'water') {
        color = '#2a5888';
      } else {
        color = '#3a7a2a';
      }

      ctx.fillStyle = color;
      ctx.fillRect(x + tx * scaleX, y + ty * scaleY, Math.ceil(scaleX), Math.ceil(scaleY));
    }
  }
}

// Utility functions
function seedRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function adjustColor(color: string, amount: number): string {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));
    return `rgb(${r}, ${g}, ${b})`;
  }
  return color;
}
