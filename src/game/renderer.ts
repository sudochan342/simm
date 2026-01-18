// SimCity 3000 Style Isometric Renderer

import {
  Tile,
  PlacedBuilding,
  BuildingDef,
  SC3000_COLORS,
  ZoneType,
  ZoneDensity,
  DevelopmentLevel,
  TerrainType,
  InfrastructureType,
  getBuildingById,
} from './types';

// Isometric tile dimensions (SC3000 style - 32x16 base)
export const TILE_WIDTH = 32;
export const TILE_HEIGHT = 16;
export const TILE_DEPTH = 8; // Height of elevation step

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

// Draw a single isometric tile (ground)
export function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  screenX: number,
  screenY: number,
  showZones: boolean = true
) {
  const { terrain, elevation, zone, zoneDensity, development, powered } = tile;

  // Get base color based on terrain
  let baseColor = getTerrainColor(terrain);

  // Elevation shading
  const elevationShade = elevation * 10;

  // Draw the tile top surface
  ctx.beginPath();
  ctx.moveTo(screenX, screenY - elevation * TILE_DEPTH);
  ctx.lineTo(screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 - elevation * TILE_DEPTH);
  ctx.lineTo(screenX, screenY + TILE_HEIGHT - elevation * TILE_DEPTH);
  ctx.lineTo(screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 - elevation * TILE_DEPTH);
  ctx.closePath();

  // Fill with terrain color
  ctx.fillStyle = adjustBrightness(baseColor, elevationShade);
  ctx.fill();

  // Draw elevation sides if elevated
  if (elevation > 0) {
    // Left side
    ctx.beginPath();
    ctx.moveTo(screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 - elevation * TILE_DEPTH);
    ctx.lineTo(screenX, screenY + TILE_HEIGHT - elevation * TILE_DEPTH);
    ctx.lineTo(screenX, screenY + TILE_HEIGHT);
    ctx.lineTo(screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2);
    ctx.closePath();
    ctx.fillStyle = adjustBrightness(baseColor, -30);
    ctx.fill();

    // Right side
    ctx.beginPath();
    ctx.moveTo(screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 - elevation * TILE_DEPTH);
    ctx.lineTo(screenX, screenY + TILE_HEIGHT - elevation * TILE_DEPTH);
    ctx.lineTo(screenX, screenY + TILE_HEIGHT);
    ctx.lineTo(screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2);
    ctx.closePath();
    ctx.fillStyle = adjustBrightness(baseColor, -50);
    ctx.fill();
  }

  // Draw zone overlay if zones are visible
  if (showZones && zone && development === 0) {
    ctx.beginPath();
    ctx.moveTo(screenX, screenY - elevation * TILE_DEPTH);
    ctx.lineTo(screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 - elevation * TILE_DEPTH);
    ctx.lineTo(screenX, screenY + TILE_HEIGHT - elevation * TILE_DEPTH);
    ctx.lineTo(screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 - elevation * TILE_DEPTH);
    ctx.closePath();

    const zoneColor = getZoneDisplayColor(zone, zoneDensity);
    ctx.fillStyle = zoneColor;
    ctx.fill();

    // Zone border
    ctx.strokeStyle = adjustBrightness(zoneColor.replace('0.3)', '1)'), 30);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Draw tile outline
  ctx.beginPath();
  ctx.moveTo(screenX, screenY - elevation * TILE_DEPTH);
  ctx.lineTo(screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 - elevation * TILE_DEPTH);
  ctx.lineTo(screenX, screenY + TILE_HEIGHT - elevation * TILE_DEPTH);
  ctx.lineTo(screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 - elevation * TILE_DEPTH);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Power indicator if no power
  if (zone && development > 0 && !powered) {
    drawNoPowerIndicator(ctx, screenX, screenY - elevation * TILE_DEPTH);
  }
}

// Draw terrain details (trees, rocks, etc.)
export function drawTerrainDetails(
  ctx: CanvasRenderingContext2D,
  terrain: TerrainType,
  screenX: number,
  screenY: number,
  seed: number
) {
  if (terrain === 'trees') {
    // Draw multiple small trees
    const treeCount = 2 + (seed % 3);
    for (let i = 0; i < treeCount; i++) {
      const offsetX = ((seed * (i + 1)) % 10) - 5;
      const offsetY = ((seed * (i + 2)) % 6) - 3;
      drawTree(ctx, screenX + offsetX, screenY + offsetY - 4, 4 + (seed % 3));
    }
  } else if (terrain === 'rock') {
    drawRock(ctx, screenX, screenY - 3, seed);
  }
}

// Draw a small tree
function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  // Trunk
  ctx.fillStyle = '#4a3728';
  ctx.fillRect(x - 1, y, 2, size);

  // Foliage (triangle)
  ctx.fillStyle = SC3000_COLORS.terrainTrees;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y + 2);
  ctx.lineTo(x - size, y + 2);
  ctx.closePath();
  ctx.fill();

  // Highlight
  ctx.fillStyle = '#3d7a32';
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x - size + 2, y);
  ctx.lineTo(x - 2, y);
  ctx.closePath();
  ctx.fill();
}

// Draw a rock
function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number) {
  const size = 3 + (seed % 4);
  ctx.fillStyle = SC3000_COLORS.terrainRock;
  ctx.beginPath();
  ctx.ellipse(x, y, size, size * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = adjustBrightness(SC3000_COLORS.terrainRock, 20);
  ctx.beginPath();
  ctx.ellipse(x - 1, y - 1, size * 0.5, size * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Draw water with animation
export function drawWater(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  time: number,
  elevation: number = 0
) {
  const wave = Math.sin(time * 0.002 + screenX * 0.05) * 2;

  // Water surface
  ctx.beginPath();
  ctx.moveTo(screenX, screenY - elevation * TILE_DEPTH + wave);
  ctx.lineTo(screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 - elevation * TILE_DEPTH + wave);
  ctx.lineTo(screenX, screenY + TILE_HEIGHT - elevation * TILE_DEPTH + wave);
  ctx.lineTo(screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2 - elevation * TILE_DEPTH + wave);
  ctx.closePath();

  // Gradient water
  const gradient = ctx.createLinearGradient(
    screenX - TILE_WIDTH / 2,
    screenY,
    screenX + TILE_WIDTH / 2,
    screenY + TILE_HEIGHT
  );
  gradient.addColorStop(0, SC3000_COLORS.terrainWater);
  gradient.addColorStop(1, SC3000_COLORS.terrainWaterDeep);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Specular highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.ellipse(screenX - 4, screenY + 2 + wave, 4, 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Draw infrastructure (roads, rail, power lines)
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
      drawRoad(ctx, screenX, screenY + offsetY, neighbors);
      break;
    case 'highway':
      drawHighway(ctx, screenX, screenY + offsetY, neighbors);
      break;
    case 'rail':
      drawRail(ctx, screenX, screenY + offsetY, neighbors);
      break;
    case 'power_line':
      drawPowerLine(ctx, screenX, screenY + offsetY, neighbors);
      break;
    case 'water_pipe':
      // Water pipes are underground, just show indicator
      drawWaterPipeIndicator(ctx, screenX, screenY + offsetY);
      break;
  }
}

// Draw road with connections
function drawRoad(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  neighbors: { n: boolean; s: boolean; e: boolean; w: boolean }
) {
  // Road base
  ctx.fillStyle = SC3000_COLORS.road;

  // Center of road
  const roadWidth = 10;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + roadWidth / 2, y + TILE_HEIGHT / 4);
  ctx.lineTo(x, y + TILE_HEIGHT / 2);
  ctx.lineTo(x - roadWidth / 2, y + TILE_HEIGHT / 4);
  ctx.closePath();
  ctx.fill();

  // Draw connections based on neighbors
  if (neighbors.n || neighbors.s || neighbors.e || neighbors.w) {
    // North-East connection
    if (neighbors.n) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + TILE_WIDTH / 4, y - TILE_HEIGHT / 4);
      ctx.lineTo(x + TILE_WIDTH / 4 + 3, y - TILE_HEIGHT / 4 + 1);
      ctx.lineTo(x + 3, y + 1);
      ctx.closePath();
      ctx.fill();
    }
    // South-East connection
    if (neighbors.e) {
      ctx.beginPath();
      ctx.moveTo(x + roadWidth / 2, y + TILE_HEIGHT / 4);
      ctx.lineTo(x + TILE_WIDTH / 4, y + TILE_HEIGHT / 2);
      ctx.lineTo(x + TILE_WIDTH / 4 - 3, y + TILE_HEIGHT / 2);
      ctx.lineTo(x + roadWidth / 2 - 3, y + TILE_HEIGHT / 4);
      ctx.closePath();
      ctx.fill();
    }
    // South-West connection
    if (neighbors.s) {
      ctx.beginPath();
      ctx.moveTo(x, y + TILE_HEIGHT / 2);
      ctx.lineTo(x - TILE_WIDTH / 4, y + TILE_HEIGHT * 3 / 4);
      ctx.lineTo(x - TILE_WIDTH / 4 + 3, y + TILE_HEIGHT * 3 / 4);
      ctx.lineTo(x + 3, y + TILE_HEIGHT / 2);
      ctx.closePath();
      ctx.fill();
    }
    // North-West connection
    if (neighbors.w) {
      ctx.beginPath();
      ctx.moveTo(x - roadWidth / 2, y + TILE_HEIGHT / 4);
      ctx.lineTo(x - TILE_WIDTH / 4, y);
      ctx.lineTo(x - TILE_WIDTH / 4 + 3, y);
      ctx.lineTo(x - roadWidth / 2 + 3, y + TILE_HEIGHT / 4);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Road markings (yellow center line)
  ctx.strokeStyle = SC3000_COLORS.roadLine;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(x - TILE_WIDTH / 4, y + TILE_HEIGHT / 4);
  ctx.lineTo(x + TILE_WIDTH / 4, y + TILE_HEIGHT / 4);
  ctx.stroke();
  ctx.setLineDash([]);
}

// Draw highway
function drawHighway(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  neighbors: { n: boolean; s: boolean; e: boolean; w: boolean }
) {
  // Wider road base
  ctx.fillStyle = '#333333';
  ctx.beginPath();
  ctx.moveTo(x, y - 2);
  ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2 - 2);
  ctx.lineTo(x, y + TILE_HEIGHT);
  ctx.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2 - 2);
  ctx.closePath();
  ctx.fill();

  // Highway markings
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - TILE_WIDTH / 3, y + TILE_HEIGHT / 3);
  ctx.lineTo(x + TILE_WIDTH / 3, y + TILE_HEIGHT / 3);
  ctx.stroke();
}

// Draw rail
function drawRail(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  neighbors: { n: boolean; s: boolean; e: boolean; w: boolean }
) {
  ctx.strokeStyle = SC3000_COLORS.rail;
  ctx.lineWidth = 2;

  // Rails
  ctx.beginPath();
  ctx.moveTo(x - TILE_WIDTH / 3, y + TILE_HEIGHT / 3);
  ctx.lineTo(x + TILE_WIDTH / 3, y + TILE_HEIGHT / 3);
  ctx.stroke();

  ctx.moveTo(x - TILE_WIDTH / 3 + 2, y + TILE_HEIGHT / 3 + 3);
  ctx.lineTo(x + TILE_WIDTH / 3 - 2, y + TILE_HEIGHT / 3 + 3);
  ctx.stroke();

  // Ties
  ctx.strokeStyle = '#4a3728';
  ctx.lineWidth = 1;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * 3, y + TILE_HEIGHT / 3 - 2);
    ctx.lineTo(x + i * 3, y + TILE_HEIGHT / 3 + 5);
    ctx.stroke();
  }
}

// Draw power line
function drawPowerLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  neighbors: { n: boolean; s: boolean; e: boolean; w: boolean }
) {
  // Pole
  ctx.fillStyle = '#666666';
  ctx.fillRect(x - 1, y - 12, 2, 16);

  // Cross bar
  ctx.fillRect(x - 6, y - 10, 12, 2);

  // Wires
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1;

  if (neighbors.n || neighbors.s) {
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 8);
    ctx.quadraticCurveTo(x - 4, y + 4, x - 4, y + 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 4, y - 8);
    ctx.quadraticCurveTo(x + 4, y + 4, x + 4, y + 8);
    ctx.stroke();
  }
  if (neighbors.e || neighbors.w) {
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 8);
    ctx.quadraticCurveTo(x, y - 4, x + 8, y - 8);
    ctx.stroke();
  }
}

// Draw water pipe indicator
function drawWaterPipeIndicator(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = 'rgba(0, 100, 200, 0.3)';
  ctx.beginPath();
  ctx.arc(x, y + TILE_HEIGHT / 3, 4, 0, Math.PI * 2);
  ctx.fill();
}

// Draw zone buildings (developed zones)
export function drawZoneBuilding(
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  screenX: number,
  screenY: number
) {
  const { zone, zoneDensity, development, elevation } = tile;
  if (!zone || development === 0) return;

  const offsetY = -elevation * TILE_DEPTH;
  const baseY = screenY + offsetY;

  // Building height based on development and density
  const densityMultiplier = zoneDensity === 'dense' ? 3 : zoneDensity === 'medium' ? 2 : 1;
  const height = (development * 3 + 5) * densityMultiplier;

  // Building colors based on zone type
  let buildingColor: string;
  let roofColor: string;
  let windowColor = '#ffffcc';

  switch (zone) {
    case 'residential':
      buildingColor = SC3000_COLORS.buildingResidential;
      roofColor = '#8b4513';
      break;
    case 'commercial':
      buildingColor = SC3000_COLORS.buildingCommercial;
      roofColor = '#4a6fa5';
      windowColor = '#87ceeb';
      break;
    case 'industrial':
      buildingColor = SC3000_COLORS.buildingIndustrial;
      roofColor = '#666666';
      windowColor = '#444444';
      break;
    default:
      return;
  }

  // Draw building
  drawBuilding3D(ctx, screenX, baseY, TILE_WIDTH - 4, height, buildingColor, roofColor);

  // Draw windows
  if (development >= 2) {
    const windowRows = Math.min(development, 6);
    const windowCols = zoneDensity === 'dense' ? 4 : zoneDensity === 'medium' ? 3 : 2;

    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        const wx = screenX - (windowCols - 1) * 2 + col * 4;
        const wy = baseY - height + 4 + row * 5;
        ctx.fillStyle = Math.random() > 0.3 ? windowColor : '#333333';
        ctx.fillRect(wx, wy, 2, 3);
      }
    }
  }
}

// Draw a 3D building
function drawBuilding3D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  wallColor: string,
  roofColor: string
) {
  const halfWidth = width / 2;
  const depth = width / 3;

  // Front face
  ctx.fillStyle = wallColor;
  ctx.beginPath();
  ctx.moveTo(x - halfWidth + depth, y);
  ctx.lineTo(x + halfWidth - depth, y);
  ctx.lineTo(x + halfWidth - depth, y - height);
  ctx.lineTo(x - halfWidth + depth, y - height);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = adjustBrightness(wallColor, -30);
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Right face
  ctx.fillStyle = adjustBrightness(wallColor, -20);
  ctx.beginPath();
  ctx.moveTo(x + halfWidth - depth, y);
  ctx.lineTo(x + halfWidth, y - depth / 2);
  ctx.lineTo(x + halfWidth, y - height - depth / 2);
  ctx.lineTo(x + halfWidth - depth, y - height);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Roof
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(x - halfWidth + depth, y - height);
  ctx.lineTo(x + halfWidth - depth, y - height);
  ctx.lineTo(x + halfWidth, y - height - depth / 2);
  ctx.lineTo(x - halfWidth + depth * 2, y - height - depth / 2);
  ctx.closePath();
  ctx.fill();
}

// Draw placed building (civic, power plant, etc.)
export function drawPlacedBuilding(
  ctx: CanvasRenderingContext2D,
  building: PlacedBuilding,
  def: BuildingDef,
  screenX: number,
  screenY: number,
  elevation: number = 0
) {
  const offsetY = -elevation * TILE_DEPTH;
  const baseY = screenY + offsetY;
  const width = def.width * TILE_WIDTH * 0.7;
  const height = def.width * 20 + 20;

  // Building colors based on category
  let mainColor: string;
  let accentColor: string;

  switch (def.category) {
    case 'power':
      mainColor = '#777777';
      accentColor = '#ffcc00';
      break;
    case 'water':
      mainColor = '#4a90d9';
      accentColor = '#6bb5ff';
      break;
    case 'education':
      mainColor = '#d4a574';
      accentColor = '#8b4513';
      break;
    case 'health':
      mainColor = '#ffffff';
      accentColor = '#ff0000';
      break;
    case 'safety':
      mainColor = '#cc3333';
      accentColor = '#ffffff';
      break;
    case 'recreation':
      mainColor = '#228b22';
      accentColor = '#8b4513';
      break;
    case 'civic':
      mainColor = '#f5f5dc';
      accentColor = '#c4a484';
      break;
    case 'transportation':
      mainColor = '#888888';
      accentColor = '#444444';
      break;
    case 'landmark':
      mainColor = '#d4d4d4';
      accentColor = '#gold';
      break;
    default:
      mainColor = '#888888';
      accentColor = '#666666';
  }

  // Draw building base
  drawBuilding3D(ctx, screenX, baseY + TILE_HEIGHT / 2, width, height, mainColor, accentColor);

  // Category-specific details
  switch (def.category) {
    case 'power':
      // Smokestacks
      drawSmokestack(ctx, screenX - 8, baseY - height + 10, building.active);
      drawSmokestack(ctx, screenX + 8, baseY - height + 10, building.active);
      break;
    case 'water':
      // Water tower top
      if (def.id === 'water_tower') {
        ctx.fillStyle = '#4a90d9';
        ctx.beginPath();
        ctx.ellipse(screenX, baseY - height - 5, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'recreation':
      if (def.id.includes('park')) {
        // Draw trees around
        drawTree(ctx, screenX - 10, baseY - 5, 6);
        drawTree(ctx, screenX + 10, baseY - 5, 5);
        drawTree(ctx, screenX, baseY - 10, 7);
      }
      break;
    case 'civic':
      // Flag on top
      drawFlag(ctx, screenX, baseY - height - 5);
      break;
    case 'education':
      // Clock on front
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(screenX, baseY - height / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      break;
  }

  // No power indicator
  if (!building.powered) {
    drawNoPowerIndicator(ctx, screenX, baseY - height - 10);
  }
}

// Draw smokestack with optional smoke
function drawSmokestack(ctx: CanvasRenderingContext2D, x: number, y: number, active: boolean) {
  // Stack
  ctx.fillStyle = '#555555';
  ctx.fillRect(x - 3, y, 6, 15);

  // Smoke if active
  if (active) {
    ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
    for (let i = 0; i < 3; i++) {
      const offset = Math.sin(Date.now() * 0.002 + i) * 3;
      ctx.beginPath();
      ctx.arc(x + offset, y - 5 - i * 8, 4 + i * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Draw flag
function drawFlag(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Pole
  ctx.fillStyle = '#888888';
  ctx.fillRect(x - 0.5, y, 1, 15);

  // Flag
  ctx.fillStyle = '#cc0000';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 8, y + 3);
  ctx.lineTo(x, y + 6);
  ctx.closePath();
  ctx.fill();
}

// Draw no power indicator
function drawNoPowerIndicator(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('⚡', x, y);

  // Flashing effect
  if (Math.floor(Date.now() / 500) % 2 === 0) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(x, y - 3, 6, 0, Math.PI * 2);
    ctx.fill();
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
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);

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
  const color = getZoneDisplayColor(zone, density);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(screenX, screenY);
  ctx.lineTo(screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2);
  ctx.lineTo(screenX, screenY + TILE_HEIGHT);
  ctx.lineTo(screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = color.replace('0.5)', '1)');
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Helper functions
function getTerrainColor(terrain: TerrainType): string {
  switch (terrain) {
    case 'grass':
      return SC3000_COLORS.terrainGrass;
    case 'water':
      return SC3000_COLORS.terrainWater;
    case 'trees':
      return SC3000_COLORS.terrainGrassDark;
    case 'dirt':
      return SC3000_COLORS.terrainDirt;
    case 'sand':
      return SC3000_COLORS.terrainSand;
    case 'rock':
      return SC3000_COLORS.terrainRock;
    default:
      return SC3000_COLORS.terrainGrass;
  }
}

function getZoneDisplayColor(zone: ZoneType, density: ZoneDensity | null): string {
  const alpha = density === 'dense' ? 0.5 : density === 'medium' ? 0.4 : 0.3;
  switch (zone) {
    case 'residential':
      return `rgba(0, 170, 0, ${alpha})`;
    case 'commercial':
      return `rgba(0, 100, 200, ${alpha})`;
    case 'industrial':
      return `rgba(200, 200, 0, ${alpha})`;
    default:
      return 'transparent';
  }
}

function adjustBrightness(color: string, amount: number): string {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));
    return `rgb(${r}, ${g}, ${b})`;
  }
  return color;
}

// Draw RCI demand meter
export function drawDemandMeter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  residential: number,
  commercial: number,
  industrial: number
) {
  const meterHeight = 60;
  const meterWidth = 12;
  const gap = 4;

  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(x - 2, y - 2, (meterWidth + gap) * 3 + gap, meterHeight + 4);
  ctx.strokeStyle = '#0f3460';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 2, y - 2, (meterWidth + gap) * 3 + gap, meterHeight + 4);

  // Residential
  drawSingleDemandBar(ctx, x, y, meterWidth, meterHeight, residential, '#00aa00', 'R');

  // Commercial
  drawSingleDemandBar(ctx, x + meterWidth + gap, y, meterWidth, meterHeight, commercial, '#0066cc', 'C');

  // Industrial
  drawSingleDemandBar(ctx, x + (meterWidth + gap) * 2, y, meterWidth, meterHeight, industrial, '#cccc00', 'I');
}

function drawSingleDemandBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  value: number,
  color: string,
  label: string
) {
  // Background
  ctx.fillStyle = '#333333';
  ctx.fillRect(x, y, width, height);

  // Center line
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + height / 2);
  ctx.lineTo(x + width, y + height / 2);
  ctx.stroke();

  // Demand bar
  const barHeight = (Math.abs(value) / 100) * (height / 2);
  ctx.fillStyle = color;
  if (value >= 0) {
    ctx.fillRect(x + 1, y + height / 2 - barHeight, width - 2, barHeight);
  } else {
    ctx.fillRect(x + 1, y + height / 2, width - 2, barHeight);
  }

  // Label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + width / 2, y + height + 10);
}

// Draw mini-map
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

  // Background
  ctx.fillStyle = '#0a0a15';
  ctx.fillRect(x, y, width, height);

  // Draw tiles
  for (let ty = 0; ty < mapHeight; ty++) {
    for (let tx = 0; tx < mapWidth; tx++) {
      const tile = tiles[ty]?.[tx];
      if (!tile) continue;

      let color: string;
      if (tile.building) {
        color = '#ffffff';
      } else if (tile.zone) {
        color = getZoneDisplayColor(tile.zone, tile.zoneDensity).replace(/[\d.]+\)$/, '0.8)');
      } else if (tile.infrastructure) {
        color = '#666666';
      } else {
        color = getTerrainColor(tile.terrain);
      }

      ctx.fillStyle = color;
      ctx.fillRect(x + tx * scaleX, y + ty * scaleY, Math.ceil(scaleX), Math.ceil(scaleY));
    }
  }

  // Viewport rectangle
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    x + (viewportX / mapWidth) * width,
    y + (viewportY / mapHeight) * height,
    (viewportWidth / mapWidth) * width,
    (viewportHeight / mapHeight) * height
  );

  // Border
  ctx.strokeStyle = '#0f3460';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
}
