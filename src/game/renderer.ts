// Advanced Isometric Rendering Engine

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
    x: isoX - cameraX + (typeof window !== 'undefined' ? window.innerWidth / 2 : 500),
    y: isoY - cameraY + (typeof window !== 'undefined' ? window.innerHeight / 2 : 300),
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
  const adjustedX = (screenX - (typeof window !== 'undefined' ? window.innerWidth / 2 : 500) + cameraX) / zoom;
  const adjustedY = (screenY - (typeof window !== 'undefined' ? window.innerHeight / 2 : 300) + cameraY) / zoom;

  const gridX = (adjustedX / (TILE_WIDTH / 2) + adjustedY / (TILE_HEIGHT / 2)) / 2;
  const gridY = (adjustedY / (TILE_HEIGHT / 2) - adjustedX / (TILE_WIDTH / 2)) / 2;

  return {
    x: Math.floor(gridX),
    y: Math.floor(gridY),
  };
}

// Draw textured isometric tile with lighting
export function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  terrain: string,
  timeOfDay: number,
  showGrid: boolean = true,
  elevation: number = 0
): void {
  const halfW = TILE_WIDTH / 2;
  const halfH = TILE_HEIGHT / 2;
  const elevOffset = elevation * 4;

  // Get terrain colors with time-based lighting
  const colors = getTerrainColors(terrain, timeOfDay);

  // Draw tile base (for elevation)
  if (elevation > 0) {
    ctx.beginPath();
    ctx.moveTo(x - halfW, y + halfH - elevOffset);
    ctx.lineTo(x - halfW, y + halfH);
    ctx.lineTo(x, y + TILE_HEIGHT);
    ctx.lineTo(x, y + TILE_HEIGHT - elevOffset);
    ctx.closePath();
    ctx.fillStyle = colors.shadow;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + halfW, y + halfH - elevOffset);
    ctx.lineTo(x + halfW, y + halfH);
    ctx.lineTo(x, y + TILE_HEIGHT);
    ctx.lineTo(x, y + TILE_HEIGHT - elevOffset);
    ctx.closePath();
    ctx.fillStyle = colors.dark;
    ctx.fill();
  }

  // Draw tile top
  ctx.beginPath();
  ctx.moveTo(x, y - elevOffset);
  ctx.lineTo(x + halfW, y + halfH - elevOffset);
  ctx.lineTo(x, y + TILE_HEIGHT - elevOffset);
  ctx.lineTo(x - halfW, y + halfH - elevOffset);
  ctx.closePath();

  // Create gradient for texture
  const gradient = ctx.createLinearGradient(x - halfW, y - elevOffset, x + halfW, y + TILE_HEIGHT - elevOffset);
  gradient.addColorStop(0, colors.light);
  gradient.addColorStop(0.5, colors.base);
  gradient.addColorStop(1, colors.mid);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Add texture pattern for grass
  if (terrain === 'grass') {
    ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
    const seed = Math.floor(x * 100 + y);
    for (let i = 0; i < 4; i++) {
      const px = x - halfW/2 + ((seed + i * 17) % 20);
      const py = y + halfH/2 - elevOffset + ((seed + i * 23) % 10);
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Add waves for water
  if (terrain === 'water') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    const waveOffset = (Date.now() / 500) % 10;
    ctx.beginPath();
    ctx.moveTo(x - halfW/2 + waveOffset, y + halfH/2 - elevOffset);
    ctx.quadraticCurveTo(x, y + halfH/2 - 3 - elevOffset, x + halfW/2 - waveOffset, y + halfH/2 - elevOffset);
    ctx.stroke();
  }

  // Draw grid lines if enabled
  if (showGrid) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - elevOffset);
    ctx.lineTo(x + halfW, y + halfH - elevOffset);
    ctx.lineTo(x, y + TILE_HEIGHT - elevOffset);
    ctx.lineTo(x - halfW, y + halfH - elevOffset);
    ctx.closePath();
    ctx.stroke();
  }
}

// Get terrain colors based on type and time
function getTerrainColors(terrain: string, timeOfDay: number): { base: string; light: string; mid: string; dark: string; shadow: string } {
  const isDark = timeOfDay < 6 || timeOfDay > 20;
  const isSunset = timeOfDay >= 17 && timeOfDay <= 20;
  const isDawn = timeOfDay >= 5 && timeOfDay <= 7;

  let base: string, light: string, mid: string, dark: string, shadow: string;

  switch (terrain) {
    case 'grass':
      base = '#4ade80';
      light = '#86efac';
      mid = '#22c55e';
      dark = '#16a34a';
      shadow = '#15803d';
      break;
    case 'water':
      base = '#38bdf8';
      light = '#7dd3fc';
      mid = '#0ea5e9';
      dark = '#0284c7';
      shadow = '#0369a1';
      break;
    case 'sand':
      base = '#fcd34d';
      light = '#fde68a';
      mid = '#fbbf24';
      dark = '#f59e0b';
      shadow = '#d97706';
      break;
    case 'dirt':
      base = '#a8a29e';
      light = '#d6d3d1';
      mid = '#78716c';
      dark = '#57534e';
      shadow = '#44403c';
      break;
    default:
      base = '#4ade80';
      light = '#86efac';
      mid = '#22c55e';
      dark = '#16a34a';
      shadow = '#15803d';
  }

  // Apply time-based color modifications
  if (isDark) {
    return {
      base: shadeColor(base, -35),
      light: shadeColor(light, -35),
      mid: shadeColor(mid, -35),
      dark: shadeColor(dark, -35),
      shadow: shadeColor(shadow, -35),
    };
  } else if (isSunset) {
    return {
      base: blendColors(base, '#ff7e5f', 0.2),
      light: blendColors(light, '#ffecd2', 0.2),
      mid: blendColors(mid, '#ff7e5f', 0.15),
      dark: blendColors(dark, '#ff6b6b', 0.15),
      shadow: blendColors(shadow, '#ff6b6b', 0.1),
    };
  } else if (isDawn) {
    return {
      base: blendColors(base, '#ffecd2', 0.15),
      light: blendColors(light, '#fff', 0.1),
      mid: blendColors(mid, '#ffecd2', 0.1),
      dark: dark,
      shadow: shadow,
    };
  }

  return { base, light, mid, dark, shadow };
}

// Draw a detailed 3D building
export function drawBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  category: string,
  buildingHeight: number = 30,
  level: number = 1,
  timeOfDay: number = 12
): void {
  const halfW = (TILE_WIDTH / 2) * width;
  const halfH = (TILE_HEIGHT / 2) * height;
  const actualHeight = buildingHeight * level;
  const isDark = timeOfDay < 6 || timeOfDay > 20;

  // Adjust colors for time of day
  const baseColor = isDark ? shadeColor(color, -30) : color;
  const lightColor = shadeColor(baseColor, 15);
  const darkColor = shadeColor(baseColor, -20);
  const shadowColor = shadeColor(baseColor, -35);

  // Draw shadow on ground
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.moveTo(x + 8, y + halfH + 4);
  ctx.lineTo(x + halfW + 8, y + height * (TILE_HEIGHT / 2) + 4);
  ctx.lineTo(x + 8, y + halfH + height * (TILE_HEIGHT / 2) + 4);
  ctx.lineTo(x - halfW + 8, y + height * (TILE_HEIGHT / 2) + 4);
  ctx.closePath();
  ctx.fill();

  // Draw building base/foundation
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + halfW, y + halfH);
  ctx.lineTo(x, y + halfH * 2);
  ctx.lineTo(x - halfW, y + halfH);
  ctx.closePath();
  ctx.fillStyle = shadowColor;
  ctx.fill();

  // Draw left wall
  ctx.beginPath();
  ctx.moveTo(x - halfW, y + halfH);
  ctx.lineTo(x, y + halfH * 2);
  ctx.lineTo(x, y + halfH * 2 - actualHeight);
  ctx.lineTo(x - halfW, y + halfH - actualHeight);
  ctx.closePath();

  const leftGradient = ctx.createLinearGradient(x - halfW, y, x, y + halfH * 2);
  leftGradient.addColorStop(0, lightColor);
  leftGradient.addColorStop(1, baseColor);
  ctx.fillStyle = leftGradient;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw right wall
  ctx.beginPath();
  ctx.moveTo(x + halfW, y + halfH);
  ctx.lineTo(x, y + halfH * 2);
  ctx.lineTo(x, y + halfH * 2 - actualHeight);
  ctx.lineTo(x + halfW, y + halfH - actualHeight);
  ctx.closePath();

  const rightGradient = ctx.createLinearGradient(x, y, x + halfW, y + halfH * 2);
  rightGradient.addColorStop(0, baseColor);
  rightGradient.addColorStop(1, darkColor);
  ctx.fillStyle = rightGradient;
  ctx.fill();
  ctx.stroke();

  // Draw roof
  ctx.beginPath();
  ctx.moveTo(x, y - actualHeight);
  ctx.lineTo(x + halfW, y + halfH - actualHeight);
  ctx.lineTo(x, y + halfH * 2 - actualHeight);
  ctx.lineTo(x - halfW, y + halfH - actualHeight);
  ctx.closePath();

  const roofGradient = ctx.createLinearGradient(x - halfW, y - actualHeight, x + halfW, y + halfH * 2 - actualHeight);
  roofGradient.addColorStop(0, lightColor);
  roofGradient.addColorStop(0.5, baseColor);
  roofGradient.addColorStop(1, darkColor);
  ctx.fillStyle = roofGradient;
  ctx.fill();
  ctx.stroke();

  // Draw windows based on building type
  if (category !== 'road' && category !== 'park' && actualHeight > 15) {
    drawBuildingDetails(ctx, x, y, halfW, halfH, actualHeight, category, isDark, width, height);
  }

  // Draw special elements based on category
  drawCategoryDetails(ctx, x, y, halfW, halfH, actualHeight, category, isDark);
}

// Draw building windows and details
function drawBuildingDetails(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  halfW: number,
  halfH: number,
  height: number,
  category: string,
  isDark: boolean,
  width: number,
  tileHeight: number
): void {
  const windowColor = isDark ? '#fef08a' : '#87ceeb';
  const windowLitColor = '#fef08a';

  // Calculate window positions
  const numFloors = Math.floor(height / 12);
  const windowsPerFloor = Math.max(1, Math.floor(width * 2));

  for (let floor = 0; floor < numFloors; floor++) {
    const floorY = y + halfH * 2 - height + floor * 12 + 8;

    // Left wall windows
    for (let w = 0; w < windowsPerFloor; w++) {
      const windowX = x - halfW * 0.7 + (w * halfW * 0.6 / windowsPerFloor);
      const windowY = floorY + (w * 3);

      // Randomize which windows are lit at night
      const isLit = isDark && Math.random() > 0.4;

      ctx.fillStyle = isLit ? windowLitColor : windowColor;
      ctx.fillRect(windowX, windowY, 4, 5);

      if (isLit) {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.3)';
        ctx.fillRect(windowX - 1, windowY - 1, 6, 7);
      }
    }

    // Right wall windows
    for (let w = 0; w < windowsPerFloor; w++) {
      const windowX = x + halfW * 0.2 + (w * halfW * 0.6 / windowsPerFloor);
      const windowY = floorY + ((windowsPerFloor - w - 1) * 3);

      const isLit = isDark && Math.random() > 0.4;

      ctx.fillStyle = isLit ? windowLitColor : 'rgba(135, 206, 235, 0.6)';
      ctx.fillRect(windowX, windowY, 4, 5);

      if (isLit) {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.3)';
        ctx.fillRect(windowX - 1, windowY - 1, 6, 7);
      }
    }
  }
}

// Draw category-specific details
function drawCategoryDetails(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  halfW: number,
  halfH: number,
  height: number,
  category: string,
  isDark: boolean
): void {
  const roofY = y - height + halfH;

  switch (category) {
    case 'utility':
      // Draw antenna/chimney for utilities
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(x - 2, roofY - 15, 4, 15);
      if (!isDark) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(x, roofY - 17, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case 'industrial':
      // Draw smokestacks
      ctx.fillStyle = '#78716c';
      ctx.fillRect(x - halfW * 0.3 - 3, roofY - 20, 6, 20);
      ctx.fillRect(x + halfW * 0.3 - 3, roofY - 15, 6, 15);
      // Smoke effect
      if (!isDark) {
        ctx.fillStyle = 'rgba(200, 200, 200, 0.4)';
        ctx.beginPath();
        ctx.arc(x - halfW * 0.3, roofY - 25, 5, 0, Math.PI * 2);
        ctx.arc(x - halfW * 0.3 + 3, roofY - 30, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case 'park':
      // Draw trees
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(x - 2, roofY - 10, 4, 12);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(x, roofY - 25);
      ctx.lineTo(x + 10, roofY - 5);
      ctx.lineTo(x - 10, roofY - 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.moveTo(x, roofY - 30);
      ctx.lineTo(x + 8, roofY - 15);
      ctx.lineTo(x - 8, roofY - 15);
      ctx.closePath();
      ctx.fill();
      break;

    case 'special':
      // Draw flag or spire
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x - 1, roofY - 20, 2, 20);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(x + 1, roofY - 20);
      ctx.lineTo(x + 12, roofY - 15);
      ctx.lineTo(x + 1, roofY - 10);
      ctx.closePath();
      ctx.fill();
      break;
  }
}

// Draw road with proper connections and markings
export function drawRoad(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  connections: { north: boolean; south: boolean; east: boolean; west: boolean },
  isHighway: boolean = false
): void {
  const halfW = TILE_WIDTH / 2;
  const halfH = TILE_HEIGHT / 2;

  // Draw road base
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + halfW, y + halfH);
  ctx.lineTo(x, y + TILE_HEIGHT);
  ctx.lineTo(x - halfW, y + halfH);
  ctx.closePath();

  const roadColor = isHighway ? '#374151' : '#4b5563';
  const gradient = ctx.createLinearGradient(x - halfW, y, x + halfW, y + TILE_HEIGHT);
  gradient.addColorStop(0, shadeColor(roadColor, 10));
  gradient.addColorStop(0.5, roadColor);
  gradient.addColorStop(1, shadeColor(roadColor, -10));
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw road markings
  ctx.strokeStyle = isHighway ? '#fbbf24' : '#d1d5db';
  ctx.lineWidth = isHighway ? 2 : 1;
  ctx.setLineDash(isHighway ? [] : [4, 4]);

  const connCount = [connections.north, connections.south, connections.east, connections.west].filter(Boolean).length;

  // Draw center marking based on connections
  if (connCount >= 2) {
    ctx.beginPath();
    if (connections.north || connections.south) {
      ctx.moveTo(x - halfW * 0.3, y + halfH * 0.7);
      ctx.lineTo(x + halfW * 0.3, y + halfH * 1.3);
    }
    if (connections.east || connections.west) {
      ctx.moveTo(x + halfW * 0.3, y + halfH * 0.7);
      ctx.lineTo(x - halfW * 0.3, y + halfH * 1.3);
    }
    ctx.stroke();
  }

  ctx.setLineDash([]);

  // Draw intersection dot
  if (connCount >= 3) {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(x, y + halfH, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw sidewalk edges
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 2);
  ctx.lineTo(x + halfW - 2, y + halfH);
  ctx.moveTo(x + halfW - 2, y + halfH);
  ctx.lineTo(x, y + TILE_HEIGHT - 2);
  ctx.moveTo(x, y + TILE_HEIGHT - 2);
  ctx.lineTo(x - halfW + 2, y + halfH);
  ctx.moveTo(x - halfW + 2, y + halfH);
  ctx.lineTo(x, y + 2);
  ctx.stroke();
}

// Utility: Shade a color
function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));

  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
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

// Export utility for terrain colors
export function getTerrainColor(terrain: string, timeOfDay: number): string {
  return getTerrainColors(terrain, timeOfDay).base;
}
