// Isometric Rendering Utilities

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

// Convert grid coordinates to screen coordinates (isometric)
export function gridToScreen(
  gridX: number,
  gridY: number,
  cameraX: number = 0,
  cameraY: number = 0,
  zoom: number = 1
): { x: number; y: number } {
  const isoX = (gridX - gridY) * (TILE_WIDTH / 2) * zoom;
  const isoY = (gridX + gridY) * (TILE_HEIGHT / 2) * zoom;

  return {
    x: isoX - cameraX + window.innerWidth / 2,
    y: isoY - cameraY + window.innerHeight / 2,
  };
}

// Convert screen coordinates to grid coordinates
export function screenToGrid(
  screenX: number,
  screenY: number,
  cameraX: number = 0,
  cameraY: number = 0,
  zoom: number = 1
): { x: number; y: number } {
  // Adjust for camera and center
  const adjustedX = (screenX - window.innerWidth / 2 + cameraX) / zoom;
  const adjustedY = (screenY - window.innerHeight / 2 + cameraY) / zoom;

  // Convert from isometric to grid
  const gridX = (adjustedX / (TILE_WIDTH / 2) + adjustedY / (TILE_HEIGHT / 2)) / 2;
  const gridY = (adjustedY / (TILE_HEIGHT / 2) - adjustedX / (TILE_WIDTH / 2)) / 2;

  return {
    x: Math.floor(gridX),
    y: Math.floor(gridY),
  };
}

// Draw isometric tile
export function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  strokeColor: string = 'rgba(0,0,0,0.2)',
  height: number = 0
): void {
  const halfW = TILE_WIDTH / 2;
  const halfH = TILE_HEIGHT / 2;

  // Draw tile top
  ctx.beginPath();
  ctx.moveTo(x, y - height);
  ctx.lineTo(x + halfW, y + halfH - height);
  ctx.lineTo(x, y + TILE_HEIGHT - height);
  ctx.lineTo(x - halfW, y + halfH - height);
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw depth if there's height
  if (height > 0) {
    // Left face
    ctx.beginPath();
    ctx.moveTo(x - halfW, y + halfH - height);
    ctx.lineTo(x, y + TILE_HEIGHT - height);
    ctx.lineTo(x, y + TILE_HEIGHT);
    ctx.lineTo(x - halfW, y + halfH);
    ctx.closePath();
    ctx.fillStyle = shadeColor(color, -20);
    ctx.fill();
    ctx.stroke();

    // Right face
    ctx.beginPath();
    ctx.moveTo(x + halfW, y + halfH - height);
    ctx.lineTo(x, y + TILE_HEIGHT - height);
    ctx.lineTo(x, y + TILE_HEIGHT);
    ctx.lineTo(x + halfW, y + halfH);
    ctx.closePath();
    ctx.fillStyle = shadeColor(color, -40);
    ctx.fill();
    ctx.stroke();
  }
}

// Draw a building (multi-tile support)
export function drawBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  emoji: string,
  buildingHeight: number = 20,
  level: number = 1
): void {
  const halfW = TILE_WIDTH / 2;
  const halfH = TILE_HEIGHT / 2;
  const actualHeight = buildingHeight * level;

  // Calculate building footprint
  const footprintWidth = width * halfW;
  const footprintHeight = height * halfH;

  // Draw shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.moveTo(x + 5, y + footprintHeight + 5);
  ctx.lineTo(x + footprintWidth + 5, y + height * halfH + 5);
  ctx.lineTo(x + 5, y + footprintHeight + height * halfH + 5);
  ctx.lineTo(x - footprintWidth + 5, y + height * halfH + 5);
  ctx.closePath();
  ctx.fill();

  // Draw base
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + footprintWidth, y + height * halfH);
  ctx.lineTo(x, y + footprintHeight + height * halfH);
  ctx.lineTo(x - footprintWidth, y + height * halfH);
  ctx.closePath();
  ctx.fillStyle = shadeColor(color, -30);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.stroke();

  // Draw building body (left face)
  ctx.beginPath();
  ctx.moveTo(x - footprintWidth, y + height * halfH);
  ctx.lineTo(x, y + footprintHeight + height * halfH);
  ctx.lineTo(x, y + footprintHeight + height * halfH - actualHeight);
  ctx.lineTo(x - footprintWidth, y + height * halfH - actualHeight);
  ctx.closePath();
  ctx.fillStyle = shadeColor(color, -15);
  ctx.fill();
  ctx.stroke();

  // Draw building body (right face)
  ctx.beginPath();
  ctx.moveTo(x + footprintWidth, y + height * halfH);
  ctx.lineTo(x, y + footprintHeight + height * halfH);
  ctx.lineTo(x, y + footprintHeight + height * halfH - actualHeight);
  ctx.lineTo(x + footprintWidth, y + height * halfH - actualHeight);
  ctx.closePath();
  ctx.fillStyle = shadeColor(color, -25);
  ctx.fill();
  ctx.stroke();

  // Draw roof
  ctx.beginPath();
  ctx.moveTo(x, y - actualHeight);
  ctx.lineTo(x + footprintWidth, y + height * halfH - actualHeight);
  ctx.lineTo(x, y + footprintHeight + height * halfH - actualHeight);
  ctx.lineTo(x - footprintWidth, y + height * halfH - actualHeight);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.stroke();

  // Draw emoji
  ctx.font = `${Math.min(32 * width, 48)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, x, y + footprintHeight / 2 - actualHeight - 10);
}

// Draw road
export function drawRoad(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  connections: { north: boolean; south: boolean; east: boolean; west: boolean }
): void {
  const halfW = TILE_WIDTH / 2;
  const halfH = TILE_HEIGHT / 2;

  // Draw base road tile
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + halfW, y + halfH);
  ctx.lineTo(x, y + TILE_HEIGHT);
  ctx.lineTo(x - halfW, y + halfH);
  ctx.closePath();
  ctx.fillStyle = '#4a5568';
  ctx.fill();
  ctx.strokeStyle = '#2d3748';
  ctx.stroke();

  // Draw road markings
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;

  // Center dot
  ctx.beginPath();
  ctx.arc(x, y + halfH, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#fbbf24';
  ctx.fill();

  // Draw connection lines
  if (connections.north || connections.south || connections.east || connections.west) {
    ctx.beginPath();
    if (connections.north) {
      ctx.moveTo(x, y + halfH);
      ctx.lineTo(x - halfW / 2, y + halfH / 2);
    }
    if (connections.south) {
      ctx.moveTo(x, y + halfH);
      ctx.lineTo(x + halfW / 2, y + halfH + halfH / 2);
    }
    if (connections.east) {
      ctx.moveTo(x, y + halfH);
      ctx.lineTo(x + halfW / 2, y + halfH / 2);
    }
    if (connections.west) {
      ctx.moveTo(x, y + halfH);
      ctx.lineTo(x - halfW / 2, y + halfH + halfH / 2);
    }
    ctx.stroke();
  }
}

// Utility: Shade a color
function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;

  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

// Get terrain color based on type and time of day
export function getTerrainColor(terrain: string, timeOfDay: number): string {
  const isDark = timeOfDay < 6 || timeOfDay > 20;
  const isSunset = timeOfDay > 17 && timeOfDay <= 20;

  let baseColor = '#90EE90'; // Default grass

  switch (terrain) {
    case 'grass':
      baseColor = '#90EE90';
      break;
    case 'water':
      baseColor = '#4FC3F7';
      break;
    case 'sand':
      baseColor = '#F4D03F';
      break;
    case 'dirt':
      baseColor = '#8B7355';
      break;
  }

  if (isDark) {
    return shadeColor(baseColor, -40);
  } else if (isSunset) {
    return blendColors(baseColor, '#FF6B6B', 0.2);
  }

  return baseColor;
}

// Blend two colors
function blendColors(color1: string, color2: string, ratio: number): string {
  const hex1 = parseInt(color1.replace('#', ''), 16);
  const hex2 = parseInt(color2.replace('#', ''), 16);

  const r1 = (hex1 >> 16) & 0xff;
  const g1 = (hex1 >> 8) & 0xff;
  const b1 = hex1 & 0xff;

  const r2 = (hex2 >> 16) & 0xff;
  const g2 = (hex2 >> 8) & 0xff;
  const b2 = hex2 & 0xff;

  const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
  const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
  const b = Math.round(b1 * (1 - ratio) + b2 * ratio);

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
