// SimCity 3000 Authentic Isometric Renderer
// Larger tiles with pixel-art style graphics

import {
  Tile,
  PlacedBuilding,
  BuildingDef,
  ZoneType,
  ZoneDensity,
  TerrainType,
  InfrastructureType,
  getBuildingById,
} from './types';

// SC3000 Authentic Color Palette
const SC3K = {
  // Terrain
  grass1: '#4a8c2a',
  grass2: '#5a9c3a',
  grass3: '#3a7c1a',
  grassDark: '#2d6b1a',
  water: '#2864a8',
  waterDeep: '#1a4878',
  waterShallow: '#3a84c8',
  waterHighlight: '#5aa4e8',
  dirt: '#8b7355',
  sand: '#d4c4a4',
  rock: '#6a6a6a',

  // Zones (SC3000 authentic)
  zoneResLight: '#90ee90',
  zoneResMed: '#32cd32',
  zoneResDense: '#228b22',
  zoneComLight: '#87ceeb',
  zoneComMed: '#4169e1',
  zoneComDense: '#0000cd',
  zoneIndLight: '#ffff99',
  zoneIndMed: '#ffd700',
  zoneIndDense: '#b8860b',

  // Buildings - Residential
  resHouse1: '#e8d8c8',
  resHouse2: '#d4c4b4',
  resHouse3: '#c8b8a8',
  resRoof1: '#8b4513',
  resRoof2: '#a0522d',
  resRoof3: '#6b3510',
  resApt: '#c9c9c9',
  resHighrise: '#b8b8c8',

  // Buildings - Commercial
  comSmall: '#e0e8f0',
  comMed: '#c8d0e0',
  comLarge: '#a8b8d0',
  comGlass: '#88c8e8',
  comHighrise: '#708090',

  // Buildings - Industrial
  indLight: '#a8a898',
  indMed: '#888878',
  indHeavy: '#686858',
  indRoof: '#484848',
  indSmoke: '#707070',

  // Infrastructure
  road: '#484848',
  roadLine: '#f0d030',
  roadSidewalk: '#a0a0a0',
  highway: '#383838',
  rail: '#5a5a5a',
  railTie: '#4a3020',
  powerLine: '#404040',

  // UI SC3000 Style
  uiBlue: '#1a3a6a',
  uiBlueDark: '#0a2040',
  uiBlueLight: '#2a5a9a',
  uiBorder: '#4a7aba',
  uiText: '#e0e8f0',
  uiGold: '#d4a020',
};

// LARGER Isometric tile dimensions (SC3000 style - 64x32 base for bigger map)
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const TILE_DEPTH = 16;

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

// Draw authentic SC3000 grass tile with texture
function drawGrassTile(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  seed: number,
  elevation: number
) {
  const offsetY = -elevation * TILE_DEPTH;

  // Main grass surface with variation
  const grassColors = [SC3K.grass1, SC3K.grass2, SC3K.grass3];
  const baseColor = grassColors[seed % 3];

  // Draw isometric diamond
  ctx.beginPath();
  ctx.moveTo(screenX, screenY + offsetY);
  ctx.lineTo(screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 + offsetY);
  ctx.lineTo(screenX, screenY + TILE_HEIGHT + offsetY);
  ctx.lineTo(screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 + offsetY);
  ctx.closePath();

  // Gradient fill for depth
  const gradient = ctx.createLinearGradient(
    screenX - TILE_WIDTH / 2, screenY + offsetY,
    screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT + offsetY
  );
  gradient.addColorStop(0, adjustColor(baseColor, 15));
  gradient.addColorStop(0.5, baseColor);
  gradient.addColorStop(1, adjustColor(baseColor, -15));
  ctx.fillStyle = gradient;
  ctx.fill();

  // Add grass texture dots (SC3000 pixel style)
  ctx.fillStyle = adjustColor(baseColor, -20);
  const random = seedRandom(seed);
  for (let i = 0; i < 6; i++) {
    const px = screenX + (random() - 0.5) * 24;
    const py = screenY + TILE_HEIGHT / 2 + offsetY + (random() - 0.5) * 12;
    ctx.fillRect(px, py, 2, 2);
  }

  // Subtle tile outline
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw elevation sides
  if (elevation > 0) {
    drawElevationSides(ctx, screenX, screenY, elevation, baseColor);
  }
}

// Draw elevation sides for terrain
function drawElevationSides(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  elevation: number,
  baseColor: string
) {
  const offsetY = -elevation * TILE_DEPTH;

  // Left side (darker)
  ctx.beginPath();
  ctx.moveTo(screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 + offsetY);
  ctx.lineTo(screenX, screenY + TILE_HEIGHT + offsetY);
  ctx.lineTo(screenX, screenY + TILE_HEIGHT);
  ctx.lineTo(screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2);
  ctx.closePath();
  ctx.fillStyle = adjustColor(baseColor, -40);
  ctx.fill();

  // Right side (medium)
  ctx.beginPath();
  ctx.moveTo(screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 + offsetY);
  ctx.lineTo(screenX, screenY + TILE_HEIGHT + offsetY);
  ctx.lineTo(screenX, screenY + TILE_HEIGHT);
  ctx.lineTo(screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2);
  ctx.closePath();
  ctx.fillStyle = adjustColor(baseColor, -25);
  ctx.fill();
}

// Draw water tile with SC3000 style animation
export function drawWater(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  time: number,
  elevation: number = 0
) {
  const offsetY = -elevation * TILE_DEPTH;
  const wave = Math.sin(time * 0.003 + screenX * 0.02) * 1.5;

  // Water surface
  ctx.beginPath();
  ctx.moveTo(screenX, screenY + offsetY + wave);
  ctx.lineTo(screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 + offsetY + wave);
  ctx.lineTo(screenX, screenY + TILE_HEIGHT + offsetY + wave);
  ctx.lineTo(screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 + offsetY + wave);
  ctx.closePath();

  // SC3000 style water gradient
  const gradient = ctx.createLinearGradient(
    screenX, screenY + offsetY,
    screenX, screenY + TILE_HEIGHT + offsetY
  );
  gradient.addColorStop(0, SC3K.waterShallow);
  gradient.addColorStop(0.4, SC3K.water);
  gradient.addColorStop(1, SC3K.waterDeep);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Animated highlights (SC3000 style sparkle)
  const sparklePhase = (time * 0.005 + screenX * 0.1) % (Math.PI * 2);
  if (Math.sin(sparklePhase) > 0.7) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(screenX - 8 + wave, screenY + TILE_HEIGHT / 3 + offsetY, 4, 2, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wave lines
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(screenX - 15, screenY + TILE_HEIGHT / 2 + offsetY + wave * 0.5);
  ctx.quadraticCurveTo(screenX, screenY + TILE_HEIGHT / 2 + offsetY - 2 + wave, screenX + 15, screenY + TILE_HEIGHT / 2 + offsetY + wave * 0.5);
  ctx.stroke();
}

// Draw a single isometric tile
export function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  screenX: number,
  screenY: number,
  showZones: boolean = true,
  time: number = 0
) {
  const { terrain, elevation, zone, zoneDensity, development, powered } = tile;
  const seed = tile.x * 1000 + tile.y;

  // Draw terrain based on type
  if (terrain === 'water') {
    drawWater(ctx, screenX, screenY, time, elevation);
    return;
  }

  if (terrain === 'grass' || terrain === 'trees') {
    drawGrassTile(ctx, screenX, screenY, seed, elevation);
    if (terrain === 'trees') {
      drawTreeCluster(ctx, screenX, screenY - elevation * TILE_DEPTH, seed);
    }
  } else if (terrain === 'dirt') {
    drawDirtTile(ctx, screenX, screenY, seed, elevation);
  } else if (terrain === 'sand') {
    drawSandTile(ctx, screenX, screenY, seed, elevation);
  } else if (terrain === 'rock') {
    drawRockTile(ctx, screenX, screenY, seed, elevation);
  } else {
    drawGrassTile(ctx, screenX, screenY, seed, elevation);
  }

  // Draw zone overlay with SC3000 style stripes
  if (showZones && zone && development === 0) {
    drawZoneOverlay(ctx, screenX, screenY, zone, zoneDensity, elevation);
  }

  // Power indicator
  if (zone && development > 0 && !powered) {
    drawNoPowerIndicator(ctx, screenX, screenY - elevation * TILE_DEPTH - 20);
  }
}

// Draw dirt tile
function drawDirtTile(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, seed: number, elevation: number) {
  const offsetY = -elevation * TILE_DEPTH;

  ctx.beginPath();
  ctx.moveTo(screenX, screenY + offsetY);
  ctx.lineTo(screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 + offsetY);
  ctx.lineTo(screenX, screenY + TILE_HEIGHT + offsetY);
  ctx.lineTo(screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 + offsetY);
  ctx.closePath();
  ctx.fillStyle = SC3K.dirt;
  ctx.fill();

  // Dirt texture
  ctx.fillStyle = adjustColor(SC3K.dirt, -15);
  const random = seedRandom(seed);
  for (let i = 0; i < 4; i++) {
    const px = screenX + (random() - 0.5) * 20;
    const py = screenY + TILE_HEIGHT / 2 + offsetY + (random() - 0.5) * 10;
    ctx.fillRect(px, py, 3, 2);
  }

  if (elevation > 0) {
    drawElevationSides(ctx, screenX, screenY, elevation, SC3K.dirt);
  }
}

// Draw sand tile
function drawSandTile(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, seed: number, elevation: number) {
  const offsetY = -elevation * TILE_DEPTH;

  ctx.beginPath();
  ctx.moveTo(screenX, screenY + offsetY);
  ctx.lineTo(screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 + offsetY);
  ctx.lineTo(screenX, screenY + TILE_HEIGHT + offsetY);
  ctx.lineTo(screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 + offsetY);
  ctx.closePath();
  ctx.fillStyle = SC3K.sand;
  ctx.fill();

  if (elevation > 0) {
    drawElevationSides(ctx, screenX, screenY, elevation, SC3K.sand);
  }
}

// Draw rock tile
function drawRockTile(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, seed: number, elevation: number) {
  const offsetY = -elevation * TILE_DEPTH;

  ctx.beginPath();
  ctx.moveTo(screenX, screenY + offsetY);
  ctx.lineTo(screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 + offsetY);
  ctx.lineTo(screenX, screenY + TILE_HEIGHT + offsetY);
  ctx.lineTo(screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 + offsetY);
  ctx.closePath();
  ctx.fillStyle = SC3K.rock;
  ctx.fill();

  // Rock texture
  ctx.fillStyle = adjustColor(SC3K.rock, 20);
  ctx.beginPath();
  ctx.ellipse(screenX - 5, screenY + TILE_HEIGHT / 2 + offsetY - 2, 6, 4, 0.2, 0, Math.PI * 2);
  ctx.fill();

  if (elevation > 0) {
    drawElevationSides(ctx, screenX, screenY, elevation, SC3K.rock);
  }
}

// Draw SC3000 style tree cluster
function drawTreeCluster(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, seed: number) {
  const random = seedRandom(seed);
  const treeCount = 2 + Math.floor(random() * 3);

  for (let i = 0; i < treeCount; i++) {
    const tx = screenX + (random() - 0.5) * 24;
    const ty = screenY + TILE_HEIGHT / 2 + (random() - 0.5) * 8;
    const size = 8 + Math.floor(random() * 6);
    drawSC3KTree(ctx, tx, ty, size, random);
  }
}

// Draw authentic SC3000 style tree
function drawSC3KTree(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, random: () => number) {
  // Trunk
  ctx.fillStyle = '#3d2817';
  ctx.fillRect(x - 2, y - size / 2, 4, size / 2 + 4);

  // Foliage layers (SC3000 had layered triangular trees)
  const foliageColors = ['#2d5a1a', '#3d7a2a', '#4d8a3a'];

  for (let layer = 0; layer < 3; layer++) {
    const layerSize = size - layer * 3;
    const layerY = y - size / 2 - layer * 4;

    ctx.fillStyle = foliageColors[layer];
    ctx.beginPath();
    ctx.moveTo(x, layerY - layerSize);
    ctx.lineTo(x + layerSize, layerY + 2);
    ctx.lineTo(x - layerSize, layerY + 2);
    ctx.closePath();
    ctx.fill();
  }

  // Highlight
  ctx.fillStyle = '#5d9a4a';
  ctx.beginPath();
  ctx.moveTo(x, y - size - 8);
  ctx.lineTo(x - 4, y - size / 2 - 6);
  ctx.lineTo(x - 2, y - size / 2 - 6);
  ctx.closePath();
  ctx.fill();
}

// Draw SC3000 zone overlay with authentic stripes
function drawZoneOverlay(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  zone: ZoneType,
  density: ZoneDensity | null,
  elevation: number
) {
  const offsetY = -elevation * TILE_DEPTH;

  // Get SC3000 zone color
  let zoneColor: string;
  switch (zone) {
    case 'residential':
      zoneColor = density === 'dense' ? SC3K.zoneResDense : density === 'medium' ? SC3K.zoneResMed : SC3K.zoneResLight;
      break;
    case 'commercial':
      zoneColor = density === 'dense' ? SC3K.zoneComDense : density === 'medium' ? SC3K.zoneComMed : SC3K.zoneComLight;
      break;
    case 'industrial':
      zoneColor = density === 'dense' ? SC3K.zoneIndDense : density === 'medium' ? SC3K.zoneIndMed : SC3K.zoneIndLight;
      break;
    default:
      return;
  }

  // Draw zone fill
  ctx.beginPath();
  ctx.moveTo(screenX, screenY + offsetY);
  ctx.lineTo(screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 + offsetY);
  ctx.lineTo(screenX, screenY + TILE_HEIGHT + offsetY);
  ctx.lineTo(screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 + offsetY);
  ctx.closePath();

  ctx.globalAlpha = 0.6;
  ctx.fillStyle = zoneColor;
  ctx.fill();
  ctx.globalAlpha = 1;

  // SC3000 style diagonal stripes
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = adjustColor(zoneColor, -30);
  ctx.lineWidth = 2;
  for (let i = -TILE_WIDTH; i < TILE_WIDTH * 2; i += 8) {
    ctx.beginPath();
    ctx.moveTo(screenX - TILE_WIDTH / 2 + i, screenY + offsetY - 10);
    ctx.lineTo(screenX - TILE_WIDTH / 2 + i + 20, screenY + TILE_HEIGHT + offsetY + 10);
    ctx.stroke();
  }
  ctx.restore();

  // Zone border
  ctx.strokeStyle = adjustColor(zoneColor, -40);
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Draw terrain details
export function drawTerrainDetails(
  ctx: CanvasRenderingContext2D,
  terrain: TerrainType,
  screenX: number,
  screenY: number,
  seed: number
) {
  // Handled in drawTile for trees
}

// Draw infrastructure (roads, rail, power lines) - SC3000 style
export function drawInfrastructure(
  ctx: CanvasRenderingContext2D,
  type: InfrastructureType,
  screenX: number,
  screenY: number,
  neighbors: { n: boolean; s: boolean; e: boolean; w: boolean },
  elevation: number = 0
) {
  const offsetY = -elevation * TILE_DEPTH;

  switch (type) {
    case 'road':
      drawSC3KRoad(ctx, screenX, screenY + offsetY, neighbors);
      break;
    case 'highway':
      drawSC3KHighway(ctx, screenX, screenY + offsetY, neighbors);
      break;
    case 'rail':
      drawSC3KRail(ctx, screenX, screenY + offsetY, neighbors);
      break;
    case 'power_line':
      drawSC3KPowerLine(ctx, screenX, screenY + offsetY, neighbors);
      break;
    case 'water_pipe':
      drawWaterPipeIndicator(ctx, screenX, screenY + offsetY);
      break;
  }
}

// SC3000 style road
function drawSC3KRoad(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  neighbors: { n: boolean; s: boolean; e: boolean; w: boolean }
) {
  const roadWidth = TILE_WIDTH * 0.6;
  const roadHeight = TILE_HEIGHT * 0.6;

  // Sidewalk base
  ctx.fillStyle = SC3K.roadSidewalk;
  ctx.beginPath();
  ctx.moveTo(x, y + 2);
  ctx.lineTo(x + roadWidth / 2 + 4, y + roadHeight / 2 + 2);
  ctx.lineTo(x, y + roadHeight + 4);
  ctx.lineTo(x - roadWidth / 2 - 4, y + roadHeight / 2 + 2);
  ctx.closePath();
  ctx.fill();

  // Road surface
  ctx.fillStyle = SC3K.road;
  ctx.beginPath();
  ctx.moveTo(x, y + 4);
  ctx.lineTo(x + roadWidth / 2, y + roadHeight / 2 + 4);
  ctx.lineTo(x, y + roadHeight + 4);
  ctx.lineTo(x - roadWidth / 2, y + roadHeight / 2 + 4);
  ctx.closePath();
  ctx.fill();

  // Road connections
  ctx.fillStyle = SC3K.road;
  if (neighbors.n) {
    ctx.beginPath();
    ctx.moveTo(x, y + 4);
    ctx.lineTo(x + TILE_WIDTH / 4, y - TILE_HEIGHT / 4);
    ctx.lineTo(x + TILE_WIDTH / 4 + 8, y - TILE_HEIGHT / 4 + 4);
    ctx.lineTo(x + 8, y + 8);
    ctx.closePath();
    ctx.fill();
  }
  if (neighbors.e) {
    ctx.beginPath();
    ctx.moveTo(x + roadWidth / 2, y + roadHeight / 2 + 4);
    ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
    ctx.lineTo(x + TILE_WIDTH / 2 - 8, y + TILE_HEIGHT / 2 + 4);
    ctx.lineTo(x + roadWidth / 2 - 8, y + roadHeight / 2 + 8);
    ctx.closePath();
    ctx.fill();
  }
  if (neighbors.s) {
    ctx.beginPath();
    ctx.moveTo(x, y + roadHeight + 4);
    ctx.lineTo(x - TILE_WIDTH / 4, y + TILE_HEIGHT + TILE_HEIGHT / 4);
    ctx.lineTo(x - TILE_WIDTH / 4 + 8, y + TILE_HEIGHT + TILE_HEIGHT / 4);
    ctx.lineTo(x + 8, y + roadHeight + 4);
    ctx.closePath();
    ctx.fill();
  }
  if (neighbors.w) {
    ctx.beginPath();
    ctx.moveTo(x - roadWidth / 2, y + roadHeight / 2 + 4);
    ctx.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
    ctx.lineTo(x - TILE_WIDTH / 2 + 8, y + TILE_HEIGHT / 2 + 4);
    ctx.lineTo(x - roadWidth / 2 + 8, y + roadHeight / 2 + 8);
    ctx.closePath();
    ctx.fill();
  }

  // Yellow center line
  ctx.strokeStyle = SC3K.roadLine;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(x - roadWidth / 3, y + roadHeight / 2 + 4);
  ctx.lineTo(x + roadWidth / 3, y + roadHeight / 2 + 4);
  ctx.stroke();
  ctx.setLineDash([]);
}

// SC3000 style highway
function drawSC3KHighway(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  neighbors: { n: boolean; s: boolean; e: boolean; w: boolean }
) {
  // Wider elevated road
  ctx.fillStyle = SC3K.highway;
  ctx.beginPath();
  ctx.moveTo(x, y - 4);
  ctx.lineTo(x + TILE_WIDTH / 2 - 4, y + TILE_HEIGHT / 2 - 4);
  ctx.lineTo(x, y + TILE_HEIGHT - 4);
  ctx.lineTo(x - TILE_WIDTH / 2 + 4, y + TILE_HEIGHT / 2 - 4);
  ctx.closePath();
  ctx.fill();

  // Highway edge
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 3;
  ctx.stroke();

  // White lane markers
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(x - TILE_WIDTH / 4, y + TILE_HEIGHT / 4);
  ctx.lineTo(x + TILE_WIDTH / 4, y + TILE_HEIGHT / 4);
  ctx.stroke();
  ctx.setLineDash([]);
}

// SC3000 style rail
function drawSC3KRail(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  neighbors: { n: boolean; s: boolean; e: boolean; w: boolean }
) {
  // Gravel bed
  ctx.fillStyle = '#5a5a5a';
  ctx.beginPath();
  ctx.moveTo(x, y + 6);
  ctx.lineTo(x + 20, y + TILE_HEIGHT / 2 + 4);
  ctx.lineTo(x, y + TILE_HEIGHT + 2);
  ctx.lineTo(x - 20, y + TILE_HEIGHT / 2 + 4);
  ctx.closePath();
  ctx.fill();

  // Wooden ties
  ctx.fillStyle = SC3K.railTie;
  for (let i = -4; i <= 4; i++) {
    ctx.fillRect(x + i * 4 - 1, y + TILE_HEIGHT / 2, 3, 8);
  }

  // Rails
  ctx.strokeStyle = SC3K.rail;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 16, y + TILE_HEIGHT / 2 + 2);
  ctx.lineTo(x + 16, y + TILE_HEIGHT / 2 + 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 16, y + TILE_HEIGHT / 2 + 6);
  ctx.lineTo(x + 16, y + TILE_HEIGHT / 2 + 6);
  ctx.stroke();

  // Rail shine
  ctx.strokeStyle = '#8a8a8a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 14, y + TILE_HEIGHT / 2 + 1);
  ctx.lineTo(x + 14, y + TILE_HEIGHT / 2 + 1);
  ctx.stroke();
}

// SC3000 style power line
function drawSC3KPowerLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  neighbors: { n: boolean; s: boolean; e: boolean; w: boolean }
) {
  // Tower base
  ctx.fillStyle = '#555555';
  ctx.beginPath();
  ctx.moveTo(x - 6, y + TILE_HEIGHT / 2);
  ctx.lineTo(x, y - 30);
  ctx.lineTo(x + 6, y + TILE_HEIGHT / 2);
  ctx.closePath();
  ctx.fill();

  // Cross arms
  ctx.fillStyle = '#444444';
  ctx.fillRect(x - 16, y - 24, 32, 4);
  ctx.fillRect(x - 12, y - 16, 24, 3);

  // Insulators
  ctx.fillStyle = '#888888';
  ctx.fillRect(x - 14, y - 24, 3, 6);
  ctx.fillRect(x + 11, y - 24, 3, 6);
  ctx.fillRect(x - 1, y - 24, 3, 6);

  // Wires
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1;
  if (neighbors.n || neighbors.e || neighbors.s || neighbors.w) {
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 18);
    ctx.quadraticCurveTo(x - 12, y, x - 12, y + 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 12, y - 18);
    ctx.quadraticCurveTo(x + 12, y, x + 12, y + 20);
    ctx.stroke();
  }
}

// Water pipe indicator
function drawWaterPipeIndicator(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = 'rgba(0, 120, 220, 0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y + TILE_HEIGHT / 2, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 80, 180, 0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Draw zone buildings - SC3000 authentic style
export function drawZoneBuilding(
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  screenX: number,
  screenY: number
) {
  const { zone, zoneDensity, development, elevation } = tile;
  if (!zone || development === 0) return;

  const offsetY = -elevation * TILE_DEPTH;
  const baseY = screenY + offsetY + TILE_HEIGHT / 2;
  const seed = tile.x * 1000 + tile.y;

  switch (zone) {
    case 'residential':
      drawResidentialBuilding(ctx, screenX, baseY, zoneDensity, development, seed);
      break;
    case 'commercial':
      drawCommercialBuilding(ctx, screenX, baseY, zoneDensity, development, seed);
      break;
    case 'industrial':
      drawIndustrialBuilding(ctx, screenX, baseY, zoneDensity, development, seed);
      break;
  }
}

// SC3000 style residential buildings
function drawResidentialBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  density: ZoneDensity | null,
  development: number,
  seed: number
) {
  const random = seedRandom(seed);

  if (density === 'light' || development <= 3) {
    // Small houses
    const houseColors = [SC3K.resHouse1, SC3K.resHouse2, SC3K.resHouse3];
    const roofColors = [SC3K.resRoof1, SC3K.resRoof2, SC3K.resRoof3];
    const colorIdx = Math.floor(random() * 3);

    const width = 20 + development * 2;
    const height = 12 + development * 3;

    // House body
    drawSC3KBuilding(ctx, x, y, width, height, houseColors[colorIdx], roofColors[colorIdx], 'pitched');

    // Door
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(x - 3, y - 2, 6, 8);

    // Windows
    ctx.fillStyle = '#a8d8f8';
    ctx.fillRect(x - width / 3, y - height / 2, 5, 5);
    ctx.fillRect(x + width / 3 - 5, y - height / 2, 5, 5);

  } else if (density === 'medium' || development <= 5) {
    // Apartments
    const height = 30 + development * 8;
    const width = 28;

    drawSC3KBuilding(ctx, x, y, width, height, SC3K.resApt, '#6a6a6a', 'flat');

    // Windows grid
    drawWindowGrid(ctx, x, y, width, height, 3, Math.min(development + 2, 6), '#a8d8f8');

  } else {
    // High-rise residential
    const height = 60 + development * 12;
    const width = 32;

    drawSC3KBuilding(ctx, x, y, width, height, SC3K.resHighrise, '#5a5a6a', 'flat');

    // Windows grid
    drawWindowGrid(ctx, x, y, width, height, 4, Math.min(development + 4, 10), '#f8f8a8');
  }
}

// SC3000 style commercial buildings
function drawCommercialBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  density: ZoneDensity | null,
  development: number,
  seed: number
) {
  if (density === 'light' || development <= 3) {
    // Small shops
    const height = 16 + development * 4;
    const width = 24;

    drawSC3KBuilding(ctx, x, y, width, height, SC3K.comSmall, '#5a6a7a', 'flat');

    // Storefront
    ctx.fillStyle = SC3K.comGlass;
    ctx.fillRect(x - width / 3, y - 8, width * 0.6, 10);

    // Sign
    ctx.fillStyle = '#e83030';
    ctx.fillRect(x - 8, y - height + 4, 16, 6);

  } else if (density === 'medium' || development <= 5) {
    // Office buildings
    const height = 40 + development * 10;
    const width = 30;

    drawSC3KBuilding(ctx, x, y, width, height, SC3K.comMed, '#4a5a6a', 'flat');

    // Glass windows
    drawWindowGrid(ctx, x, y, width, height, 4, Math.min(development + 3, 8), SC3K.comGlass);

  } else {
    // Skyscrapers
    const height = 80 + development * 15;
    const width = 36;

    // Main tower
    drawSC3KBuilding(ctx, x, y, width, height, SC3K.comHighrise, '#3a4a5a', 'flat');

    // Glass curtain wall effect
    ctx.fillStyle = SC3K.comGlass;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(x - width / 3 + 4, y - height + 10, width * 0.5, height - 20);
    ctx.globalAlpha = 1;

    // Windows
    drawWindowGrid(ctx, x, y, width, height, 5, Math.min(development + 6, 14), '#ffffff');

    // Rooftop antenna
    ctx.fillStyle = '#ff3030';
    ctx.fillRect(x - 1, y - height - 15, 2, 15);
  }
}

// SC3000 style industrial buildings
function drawIndustrialBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  density: ZoneDensity | null,
  development: number,
  seed: number
) {
  if (density === 'light' || development <= 3) {
    // Small warehouse
    const height = 18 + development * 3;
    const width = 28;

    drawSC3KBuilding(ctx, x, y, width, height, SC3K.indLight, SC3K.indRoof, 'pitched');

    // Garage door
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(x - 8, y - 2, 16, 10);
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 8, y - 2 + i * 3);
      ctx.lineTo(x + 8, y - 2 + i * 3);
      ctx.stroke();
    }

  } else if (density === 'medium' || development <= 5) {
    // Factory
    const height = 30 + development * 6;
    const width = 34;

    drawSC3KBuilding(ctx, x, y, width, height, SC3K.indMed, SC3K.indRoof, 'sawtooth');

    // Smokestack
    drawSmokestack(ctx, x + width / 3, y - height, true);

    // Loading dock
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(x - 12, y - 2, 24, 8);

  } else {
    // Heavy industry
    const height = 45 + development * 8;
    const width = 40;

    drawSC3KBuilding(ctx, x, y, width, height, SC3K.indHeavy, SC3K.indRoof, 'flat');

    // Multiple smokestacks
    drawSmokestack(ctx, x - 10, y - height + 5, true);
    drawSmokestack(ctx, x + 10, y - height + 5, true);

    // Industrial equipment on roof
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(x - 6, y - height - 8, 12, 8);

    // Pipes
    ctx.strokeStyle = '#6a6a6a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - width / 3, y - height / 2);
    ctx.lineTo(x + width / 3, y - height / 2);
    ctx.stroke();
  }
}

// Draw SC3000 style 3D building
function drawSC3KBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  wallColor: string,
  roofColor: string,
  roofStyle: 'flat' | 'pitched' | 'sawtooth'
) {
  const halfWidth = width / 2;
  const depth = width / 3;

  // Front face
  ctx.fillStyle = wallColor;
  ctx.beginPath();
  ctx.moveTo(x - halfWidth + depth / 2, y);
  ctx.lineTo(x + halfWidth - depth / 2, y);
  ctx.lineTo(x + halfWidth - depth / 2, y - height);
  ctx.lineTo(x - halfWidth + depth / 2, y - height);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = adjustColor(wallColor, -30);
  ctx.lineWidth = 1;
  ctx.stroke();

  // Right face (darker)
  ctx.fillStyle = adjustColor(wallColor, -25);
  ctx.beginPath();
  ctx.moveTo(x + halfWidth - depth / 2, y);
  ctx.lineTo(x + halfWidth, y - depth / 2);
  ctx.lineTo(x + halfWidth, y - height - depth / 2);
  ctx.lineTo(x + halfWidth - depth / 2, y - height);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Roof
  ctx.fillStyle = roofColor;
  if (roofStyle === 'pitched') {
    // Pitched roof
    ctx.beginPath();
    ctx.moveTo(x - halfWidth + depth / 2, y - height);
    ctx.lineTo(x, y - height - 12);
    ctx.lineTo(x + halfWidth - depth / 2, y - height);
    ctx.closePath();
    ctx.fill();

    // Roof right side
    ctx.fillStyle = adjustColor(roofColor, -20);
    ctx.beginPath();
    ctx.moveTo(x, y - height - 12);
    ctx.lineTo(x + halfWidth - depth / 2, y - height);
    ctx.lineTo(x + halfWidth, y - height - depth / 2);
    ctx.lineTo(x + depth / 2, y - height - 12 - depth / 4);
    ctx.closePath();
    ctx.fill();
  } else if (roofStyle === 'sawtooth') {
    // Sawtooth industrial roof
    const teeth = 3;
    const toothWidth = width / teeth;
    for (let i = 0; i < teeth; i++) {
      ctx.fillStyle = roofColor;
      ctx.beginPath();
      ctx.moveTo(x - halfWidth + depth / 2 + i * toothWidth, y - height);
      ctx.lineTo(x - halfWidth + depth / 2 + i * toothWidth + toothWidth / 2, y - height - 8);
      ctx.lineTo(x - halfWidth + depth / 2 + (i + 1) * toothWidth, y - height);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    // Flat roof
    ctx.beginPath();
    ctx.moveTo(x - halfWidth + depth / 2, y - height);
    ctx.lineTo(x + halfWidth - depth / 2, y - height);
    ctx.lineTo(x + halfWidth, y - height - depth / 2);
    ctx.lineTo(x - halfWidth + depth, y - height - depth / 2);
    ctx.closePath();
    ctx.fill();
  }
}

// Draw window grid on building
function drawWindowGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  buildingWidth: number,
  buildingHeight: number,
  cols: number,
  rows: number,
  windowColor: string
) {
  const windowWidth = 4;
  const windowHeight = 5;
  const startX = x - (cols * windowWidth + (cols - 1) * 3) / 2;
  const startY = y - buildingHeight + 8;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const wx = startX + col * (windowWidth + 3);
      const wy = startY + row * (windowHeight + 4);

      // Window lit randomly
      const lit = Math.random() > 0.3;
      ctx.fillStyle = lit ? windowColor : '#333344';
      ctx.fillRect(wx, wy, windowWidth, windowHeight);
    }
  }
}

// Draw smokestack with smoke
function drawSmokestack(ctx: CanvasRenderingContext2D, x: number, y: number, active: boolean) {
  // Stack
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(x - 4, y, 8, 20);

  // Stack top
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(x - 5, y - 2, 10, 4);

  // Smoke puffs if active
  if (active) {
    const time = Date.now() * 0.002;
    ctx.fillStyle = SC3K.indSmoke;
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 4; i++) {
      const offset = Math.sin(time + i) * 4;
      const rise = i * 10;
      const size = 6 + i * 3;
      ctx.beginPath();
      ctx.arc(x + offset, y - 8 - rise, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

// Draw placed building (civic, power plant, etc.) - SC3000 style
export function drawPlacedBuilding(
  ctx: CanvasRenderingContext2D,
  building: PlacedBuilding,
  def: BuildingDef,
  screenX: number,
  screenY: number,
  elevation: number = 0
) {
  const offsetY = -elevation * TILE_DEPTH;
  const baseY = screenY + offsetY + TILE_HEIGHT / 2;
  const width = def.width * TILE_WIDTH * 0.6;
  const height = def.width * 25 + 30;

  switch (def.category) {
    case 'power':
      drawPowerPlant(ctx, screenX, baseY, width, height, def.id, building.active);
      break;
    case 'water':
      drawWaterFacility(ctx, screenX, baseY, width, height, def.id);
      break;
    case 'education':
      drawSchool(ctx, screenX, baseY, width, height, def.id);
      break;
    case 'health':
      drawHospital(ctx, screenX, baseY, width, height, def.id);
      break;
    case 'safety':
      drawSafetyBuilding(ctx, screenX, baseY, width, height, def.id);
      break;
    case 'recreation':
      drawPark(ctx, screenX, baseY, width, height, def.id);
      break;
    case 'civic':
      drawCivicBuilding(ctx, screenX, baseY, width, height, def.id);
      break;
    default:
      drawSC3KBuilding(ctx, screenX, baseY, width, height, '#888888', '#666666', 'flat');
  }

  // No power indicator
  if (!building.powered && def.category !== 'power') {
    drawNoPowerIndicator(ctx, screenX, baseY - height - 10);
  }
}

// Draw power plant
function drawPowerPlant(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, type: string, active: boolean) {
  // Main building
  drawSC3KBuilding(ctx, x, y, width, height, '#6a6a6a', '#4a4a4a', 'flat');

  // Smokestacks
  if (type.includes('coal') || type.includes('oil')) {
    drawSmokestack(ctx, x - 15, y - height + 10, active);
    drawSmokestack(ctx, x + 15, y - height + 10, active);
  } else if (type.includes('nuclear')) {
    // Cooling tower
    ctx.fillStyle = '#c0c0c0';
    ctx.beginPath();
    ctx.moveTo(x - 20, y);
    ctx.quadraticCurveTo(x - 25, y - height / 2, x - 15, y - height - 10);
    ctx.lineTo(x + 15, y - height - 10);
    ctx.quadraticCurveTo(x + 25, y - height / 2, x + 20, y);
    ctx.closePath();
    ctx.fill();

    // Steam
    if (active) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(x, y - height - 20, 15, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Warning stripes
  ctx.fillStyle = '#ffcc00';
  ctx.fillRect(x - width / 3, y - 5, 8, 5);
  ctx.fillRect(x + width / 3 - 8, y - 5, 8, 5);
}

// Draw water facility
function drawWaterFacility(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, type: string) {
  if (type.includes('tower')) {
    // Water tower
    ctx.fillStyle = '#4a90d9';

    // Legs
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(x - 15, y - 30, 4, 35);
    ctx.fillRect(x + 11, y - 30, 4, 35);

    // Tank
    ctx.fillStyle = '#4a90d9';
    ctx.beginPath();
    ctx.ellipse(x, y - 50, 20, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 20, y - 50, 40, 20);
    ctx.beginPath();
    ctx.ellipse(x, y - 30, 20, 12, 0, 0, Math.PI * 2);
    ctx.fill();

  } else {
    // Pump station
    drawSC3KBuilding(ctx, x, y, width, height, '#4a90d9', '#3a70b9', 'flat');

    // Pipes
    ctx.strokeStyle = '#6a6a7a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x - width / 2 - 10, y - height / 3);
    ctx.lineTo(x + width / 2 + 10, y - height / 3);
    ctx.stroke();
  }
}

// Draw school
function drawSchool(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, type: string) {
  drawSC3KBuilding(ctx, x, y, width, height, '#d4a574', '#8b4513', 'pitched');

  // Clock
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y - height / 2, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Clock hands
  ctx.beginPath();
  ctx.moveTo(x, y - height / 2);
  ctx.lineTo(x, y - height / 2 - 4);
  ctx.moveTo(x, y - height / 2);
  ctx.lineTo(x + 3, y - height / 2);
  ctx.stroke();

  // Flag pole
  ctx.fillStyle = '#888888';
  ctx.fillRect(x + width / 3, y - height - 25, 2, 30);
  ctx.fillStyle = '#cc0000';
  ctx.beginPath();
  ctx.moveTo(x + width / 3 + 2, y - height - 25);
  ctx.lineTo(x + width / 3 + 14, y - height - 20);
  ctx.lineTo(x + width / 3 + 2, y - height - 15);
  ctx.closePath();
  ctx.fill();
}

// Draw hospital
function drawHospital(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, type: string) {
  drawSC3KBuilding(ctx, x, y, width, height, '#f8f8f8', '#e0e0e0', 'flat');

  // Red cross
  ctx.fillStyle = '#cc0000';
  ctx.fillRect(x - 3, y - height / 2 - 8, 6, 16);
  ctx.fillRect(x - 8, y - height / 2 - 3, 16, 6);

  // Windows
  drawWindowGrid(ctx, x, y, width, height, 4, 4, '#a8e8f8');

  // Ambulance entrance
  ctx.fillStyle = '#404040';
  ctx.fillRect(x - 12, y - 3, 24, 10);
}

// Draw safety building (police/fire)
function drawSafetyBuilding(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, type: string) {
  const isPolice = type.includes('police');
  const color = isPolice ? '#3a5a8a' : '#aa3030';

  drawSC3KBuilding(ctx, x, y, width, height, color, adjustColor(color, -20), 'flat');

  // Garage doors
  ctx.fillStyle = '#303030';
  ctx.fillRect(x - 10, y - 3, 8, 10);
  ctx.fillRect(x + 2, y - 3, 8, 10);

  // Badge/emblem
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(x, y - height + 15, 8, 0, Math.PI * 2);
  ctx.fill();
}

// Draw park
function drawPark(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, type: string) {
  // Grass base
  ctx.fillStyle = SC3K.grass2;
  ctx.beginPath();
  ctx.ellipse(x, y, width / 2, width / 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Trees
  const random = seedRandom(x * 100 + y);
  for (let i = 0; i < 4; i++) {
    const tx = x + (random() - 0.5) * width * 0.7;
    const ty = y - 5 + (random() - 0.5) * 10;
    drawSC3KTree(ctx, tx, ty, 10 + random() * 5, random);
  }

  // Path
  ctx.strokeStyle = '#c4a484';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - width / 3, y + 5);
  ctx.quadraticCurveTo(x, y - 5, x + width / 3, y + 5);
  ctx.stroke();

  // Fountain or statue
  if (type.includes('large')) {
    ctx.fillStyle = '#808080';
    ctx.beginPath();
    ctx.ellipse(x, y - 8, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 2, y - 20, 4, 12);
  }
}

// Draw civic building
function drawCivicBuilding(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, type: string) {
  // Grand building with columns
  drawSC3KBuilding(ctx, x, y, width, height, '#f5f5dc', '#c4a484', 'pitched');

  // Columns
  ctx.fillStyle = '#f0f0e0';
  for (let i = -2; i <= 2; i++) {
    ctx.fillRect(x + i * 8 - 2, y - height + 10, 4, height - 10);
  }

  // Steps
  ctx.fillStyle = '#e0e0d0';
  ctx.fillRect(x - width / 3, y, width * 0.6, 5);
  ctx.fillRect(x - width / 3 + 3, y + 5, width * 0.6 - 6, 4);

  // Flag
  ctx.fillStyle = '#888888';
  ctx.fillRect(x, y - height - 20, 2, 25);
  ctx.fillStyle = '#0044aa';
  ctx.beginPath();
  ctx.moveTo(x + 2, y - height - 20);
  ctx.lineTo(x + 14, y - height - 15);
  ctx.lineTo(x + 2, y - height - 10);
  ctx.closePath();
  ctx.fill();
}

// Draw no power indicator
function drawNoPowerIndicator(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const flash = Math.floor(Date.now() / 400) % 2 === 0;

  if (flash) {
    // Lightning bolt
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x + 6, y - 4);
    ctx.lineTo(x + 2, y - 4);
    ctx.lineTo(x + 4, y + 4);
    ctx.lineTo(x - 2, y - 2);
    ctx.lineTo(x + 2, y - 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ff8800';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// Draw selection highlight
export function drawSelectionHighlight(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  width: number,
  height: number,
  valid: boolean
) {
  ctx.strokeStyle = valid ? '#00ff00' : '#ff0000';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 4]);

  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const sx = screenX + (dx - dy) * (TILE_WIDTH / 2);
      const sy = screenY + (dx + dy) * (TILE_HEIGHT / 2);

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

// Draw zone preview
export function drawZonePreview(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  zone: ZoneType,
  density: ZoneDensity
) {
  let color: string;
  switch (zone) {
    case 'residential':
      color = density === 'dense' ? SC3K.zoneResDense : density === 'medium' ? SC3K.zoneResMed : SC3K.zoneResLight;
      break;
    case 'commercial':
      color = density === 'dense' ? SC3K.zoneComDense : density === 'medium' ? SC3K.zoneComMed : SC3K.zoneComLight;
      break;
    case 'industrial':
      color = density === 'dense' ? SC3K.zoneIndDense : density === 'medium' ? SC3K.zoneIndMed : SC3K.zoneIndLight;
      break;
    default:
      color = '#888888';
  }

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(screenX, screenY);
  ctx.lineTo(screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2);
  ctx.lineTo(screenX, screenY + TILE_HEIGHT);
  ctx.lineTo(screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = adjustColor(color, -40);
  ctx.lineWidth = 2;
  ctx.stroke();
}

// SC3000 Style RCI Demand Meter
export function drawDemandMeter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  residential: number,
  commercial: number,
  industrial: number
) {
  const meterHeight = 80;
  const meterWidth = 16;
  const gap = 6;
  const totalWidth = (meterWidth + gap) * 3 + gap * 2;

  // SC3000 style blue panel background
  ctx.fillStyle = SC3K.uiBlueDark;
  ctx.fillRect(x - 4, y - 4, totalWidth + 8, meterHeight + 28);

  // Beveled border
  ctx.strokeStyle = SC3K.uiBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 4, y - 4, totalWidth + 8, meterHeight + 28);

  // Inner border
  ctx.strokeStyle = SC3K.uiBlue;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 2, y - 2, totalWidth + 4, meterHeight + 24);

  // Draw each demand bar
  drawSC3KDemandBar(ctx, x, y, meterWidth, meterHeight, residential, SC3K.zoneResMed, 'R');
  drawSC3KDemandBar(ctx, x + meterWidth + gap, y, meterWidth, meterHeight, commercial, SC3K.zoneComMed, 'C');
  drawSC3KDemandBar(ctx, x + (meterWidth + gap) * 2, y, meterWidth, meterHeight, industrial, SC3K.zoneIndMed, 'I');
}

function drawSC3KDemandBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  value: number,
  color: string,
  label: string
) {
  // Bar background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(x, y, width, height);

  // Center line
  ctx.strokeStyle = '#3a3a4e';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + height / 2);
  ctx.lineTo(x + width, y + height / 2);
  ctx.stroke();

  // Demand bar
  const barHeight = Math.abs(value) / 100 * (height / 2);
  ctx.fillStyle = color;
  if (value >= 0) {
    ctx.fillRect(x + 2, y + height / 2 - barHeight, width - 4, barHeight);
  } else {
    ctx.fillRect(x + 2, y + height / 2, width - 4, barHeight);
  }

  // Bar highlight
  ctx.fillStyle = adjustColor(color, 30);
  if (value >= 0) {
    ctx.fillRect(x + 2, y + height / 2 - barHeight, 3, barHeight);
  }

  // Label
  ctx.fillStyle = SC3K.uiText;
  ctx.font = 'bold 11px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + width / 2, y + height + 14);
}

// SC3000 Style Mini-map
export function drawMiniMap(
  ctx: CanvasRenderingContext2D,
  tiles: Tile[][],
  x: number,
  y: number,
  width: number,
  height: number,
  viewportX: number,
  viewportY: number,
  viewportWidth: number,
  viewportHeight: number
) {
  const mapWidth = tiles[0]?.length || 0;
  const mapHeight = tiles.length;
  const scaleX = width / mapWidth;
  const scaleY = height / mapHeight;

  // SC3000 style panel
  ctx.fillStyle = SC3K.uiBlueDark;
  ctx.fillRect(x - 4, y - 4, width + 8, height + 8);

  // Beveled border
  ctx.strokeStyle = SC3K.uiBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 4, y - 4, width + 8, height + 8);

  // Map background
  ctx.fillStyle = '#0a1520';
  ctx.fillRect(x, y, width, height);

  // Draw tiles
  for (let ty = 0; ty < mapHeight; ty++) {
    for (let tx = 0; tx < mapWidth; tx++) {
      const tile = tiles[ty]?.[tx];
      if (!tile) continue;

      let color: string;
      if (tile.building) {
        color = '#ffffff';
      } else if (tile.development && tile.development > 0 && tile.zone) {
        color = tile.zone === 'residential' ? SC3K.zoneResMed :
                tile.zone === 'commercial' ? SC3K.zoneComMed : SC3K.zoneIndMed;
      } else if (tile.zone) {
        color = tile.zone === 'residential' ? SC3K.zoneResLight :
                tile.zone === 'commercial' ? SC3K.zoneComLight : SC3K.zoneIndLight;
      } else if (tile.infrastructure) {
        color = '#606060';
      } else if (tile.terrain === 'water') {
        color = SC3K.water;
      } else {
        color = SC3K.grass3;
      }

      ctx.fillStyle = color;
      ctx.fillRect(x + tx * scaleX, y + ty * scaleY, Math.ceil(scaleX), Math.ceil(scaleY));
    }
  }

  // Viewport rectangle
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(
    x + (viewportX / mapWidth) * width,
    y + (viewportY / mapHeight) * height,
    Math.max(10, (viewportWidth / mapWidth) * width),
    Math.max(10, (viewportHeight / mapHeight) * height)
  );
}

// Utility functions
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

function seedRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
