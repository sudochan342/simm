'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  gridToScreen,
  screenToGrid,
  TILE_WIDTH,
  TILE_HEIGHT,
  drawTile,
  drawBuilding,
  drawRoad,
} from '@/game/renderer';
import { getTileKey } from '@/game/types';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [hoverTile, setHoverTile] = useState<{ x: number; y: number } | null>(null);

  const {
    tiles,
    camera,
    gridSize,
    showGrid,
    selectedTool,
    timeOfDay,
    weather,
    updateCamera,
    placeBuilding,
    bulldoze,
    stats,
    isInitialized,
  } = useGameStore();

  // Render the game
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 160;

    // Draw sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    const skyColors = getSkyGradient(timeOfDay, weather);
    skyGradient.addColorStop(0, skyColors.top);
    skyGradient.addColorStop(0.6, skyColors.mid);
    skyGradient.addColorStop(1, skyColors.bottom);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw sun or moon
    drawCelestialBody(ctx, canvas.width, canvas.height, timeOfDay);

    // Draw clouds
    if (weather === 'cloudy' || weather === 'rain') {
      drawClouds(ctx, canvas.width, canvas.height, weather === 'rain');
    }

    // Draw rain
    if (weather === 'rain') {
      drawRain(ctx, canvas.width, canvas.height);
    }

    // Draw stars at night
    if (timeOfDay < 5 || timeOfDay > 21) {
      drawStars(ctx, canvas.width, canvas.height);
    }

    if (!isInitialized || tiles.size === 0) {
      // Draw "No City" message
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = 'bold 24px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Click "New City" to start building!', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Get visible tile range
    const zoom = camera.zoom;
    const topLeft = screenToGrid(0, 0, camera.x, camera.y, zoom);
    const bottomRight = screenToGrid(canvas.width, canvas.height, camera.x, camera.y, zoom);

    const padding = 8;
    const startX = Math.max(0, topLeft.x - padding);
    const endX = Math.min(gridSize.width, bottomRight.x + padding + 15);
    const startY = Math.max(0, topLeft.y - padding - 15);
    const endY = Math.min(gridSize.height, bottomRight.y + padding);

    // Collect tiles to render and sort by depth
    const tilesToRender: Array<{
      x: number;
      y: number;
      screenX: number;
      screenY: number;
      depth: number;
    }> = [];

    for (let gy = startY; gy < endY; gy++) {
      for (let gx = startX; gx < endX; gx++) {
        const screen = gridToScreen(gx, gy, camera.x, camera.y, zoom);
        tilesToRender.push({
          x: gx,
          y: gy,
          screenX: screen.x,
          screenY: screen.y,
          depth: gx + gy, // Depth for isometric sorting
        });
      }
    }

    // Sort by depth (back to front rendering)
    tilesToRender.sort((a, b) => a.depth - b.depth);

    // Track rendered buildings
    const renderedBuildings = new Set<string>();

    // First pass: render all terrain tiles
    tilesToRender.forEach(({ x, y, screenX, screenY }) => {
      const key = getTileKey(x, y);
      const tile = tiles.get(key);
      if (!tile) return;

      drawTile(
        ctx,
        screenX,
        screenY,
        tile.terrain,
        timeOfDay,
        showGrid,
        tile.elevation || 0
      );
    });

    // Second pass: render buildings (sorted by depth)
    tilesToRender.forEach(({ x, y, screenX, screenY }) => {
      const key = getTileKey(x, y);
      const tile = tiles.get(key);
      if (!tile || !tile.building) return;

      const building = tile.building;
      if (renderedBuildings.has(building.id)) return;
      renderedBuildings.add(building.id);

      // Calculate building center position
      const buildingScreen = gridToScreen(
        building.x + building.type.width / 2,
        building.y + building.type.height / 2,
        camera.x,
        camera.y,
        zoom
      );

      if (building.type.category === 'road') {
        const connections = {
          north: checkRoadConnection(tiles, building.x - 1, building.y),
          south: checkRoadConnection(tiles, building.x + 1, building.y),
          east: checkRoadConnection(tiles, building.x, building.y - 1),
          west: checkRoadConnection(tiles, building.x, building.y + 1),
        };
        drawRoad(
          ctx,
          buildingScreen.x,
          buildingScreen.y - TILE_HEIGHT / 2,
          connections,
          building.type.id === 'highway'
        );
      } else {
        const buildingHeight = getBuildingHeight(building.type.category, building.type.id);
        drawBuilding(
          ctx,
          buildingScreen.x,
          buildingScreen.y - TILE_HEIGHT / 2,
          building.type.width,
          building.type.height,
          building.type.color,
          building.type.category,
          buildingHeight * zoom,
          building.level,
          timeOfDay
        );
      }
    });

    // Draw hover/placement preview
    if (hoverTile && selectedTool && selectedTool !== 'select') {
      const hoverScreen = gridToScreen(hoverTile.x, hoverTile.y, camera.x, camera.y, zoom);

      if (selectedTool === 'bulldoze') {
        // Bulldoze preview
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#ef4444';
        drawPreviewTile(ctx, hoverScreen.x, hoverScreen.y);
        ctx.globalAlpha = 1;

        // X mark
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(hoverScreen.x - 10, hoverScreen.y + TILE_HEIGHT / 2 - 10);
        ctx.lineTo(hoverScreen.x + 10, hoverScreen.y + TILE_HEIGHT / 2 + 10);
        ctx.moveTo(hoverScreen.x + 10, hoverScreen.y + TILE_HEIGHT / 2 - 10);
        ctx.lineTo(hoverScreen.x - 10, hoverScreen.y + TILE_HEIGHT / 2 + 10);
        ctx.stroke();
      } else if (typeof selectedTool === 'object') {
        // Building placement preview
        ctx.globalAlpha = 0.6;

        for (let dx = 0; dx < selectedTool.width; dx++) {
          for (let dy = 0; dy < selectedTool.height; dy++) {
            const previewScreen = gridToScreen(
              hoverTile.x + dx,
              hoverTile.y + dy,
              camera.x,
              camera.y,
              zoom
            );

            const checkTile = tiles.get(getTileKey(hoverTile.x + dx, hoverTile.y + dy));
            const isValid = checkTile && !checkTile.building && checkTile.terrain !== 'water';
            const canAfford = stats.money >= selectedTool.cost;

            ctx.fillStyle = isValid && canAfford ? selectedTool.color : '#ef4444';
            drawPreviewTile(ctx, previewScreen.x, previewScreen.y);
          }
        }
        ctx.globalAlpha = 1;
      }

      // Coordinate display
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      roundRect(ctx, hoverScreen.x - 25, hoverScreen.y - 40, 50, 22, 4);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${hoverTile.x}, ${hoverTile.y}`, hoverScreen.x, hoverScreen.y - 24);
    }

    // Draw vignette effect
    const vignetteGradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      canvas.height * 0.3,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width * 0.8
    );
    vignetteGradient.addColorStop(0, 'rgba(0,0,0,0)');
    vignetteGradient.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = vignetteGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

  }, [tiles, camera, gridSize, showGrid, selectedTool, timeOfDay, weather, hoverTile, stats.money, isInitialized]);

  // Animation loop
  useEffect(() => {
    let animationId: number;
    const animate = () => {
      render();
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationId);
  }, [render]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => render();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2) {
      setIsDragging(true);
      setLastMouse({ x: e.clientX, y: e.clientY });
    } else if (e.button === 0) {
      if (!isInitialized) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const grid = screenToGrid(
        e.clientX - rect.left,
        e.clientY - rect.top,
        camera.x,
        camera.y,
        camera.zoom
      );

      if (grid.x >= 0 && grid.x < gridSize.width && grid.y >= 0 && grid.y < gridSize.height) {
        if (selectedTool === 'bulldoze') {
          bulldoze(grid.x, grid.y);
        } else if (selectedTool && selectedTool !== 'select') {
          placeBuilding(grid.x, grid.y);
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      updateCamera(camera.x - dx, camera.y - dy);
      setLastMouse({ x: e.clientX, y: e.clientY });
    }

    const canvas = canvasRef.current;
    if (canvas && isInitialized) {
      const rect = canvas.getBoundingClientRect();
      const grid = screenToGrid(
        e.clientX - rect.left,
        e.clientY - rect.top,
        camera.x,
        camera.y,
        camera.zoom
      );

      if (grid.x >= 0 && grid.x < gridSize.width && grid.y >= 0 && grid.y < gridSize.height) {
        setHoverTile(grid);
      } else {
        setHoverTile(null);
      }
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoverTile(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.min(2.5, Math.max(0.4, camera.zoom + delta));
    updateCamera(camera.x, camera.y, newZoom);
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full cursor-crosshair block"
      style={{ height: 'calc(100vh - 160px)' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}

// Helper functions
function checkRoadConnection(
  tiles: Map<string, { building: { type: { category: string } } | null }>,
  x: number,
  y: number
): boolean {
  const tile = tiles.get(getTileKey(x, y));
  return tile?.building?.type.category === 'road';
}

function getBuildingHeight(category: string, id: string): number {
  // Special cases for specific buildings
  if (id === 'tower') return 50;
  if (id === 'apartment') return 35;
  if (id === 'mall' || id === 'stadium') return 40;
  if (id === 'airport') return 25;

  switch (category) {
    case 'residential': return 25;
    case 'commercial': return 35;
    case 'industrial': return 22;
    case 'utility': return 28;
    case 'special': return 45;
    case 'park': return 8;
    default: return 20;
  }
}

function getSkyGradient(timeOfDay: number, weather: string): { top: string; mid: string; bottom: string } {
  if (weather === 'rain') {
    return { top: '#4a5568', mid: '#718096', bottom: '#a0aec0' };
  }

  if (timeOfDay < 5) {
    return { top: '#0f172a', mid: '#1e293b', bottom: '#334155' };
  } else if (timeOfDay < 6) {
    return { top: '#1e3a5f', mid: '#3b5998', bottom: '#ff7e5f' };
  } else if (timeOfDay < 8) {
    return { top: '#4a90a4', mid: '#87ceeb', bottom: '#ffecd2' };
  } else if (timeOfDay < 17) {
    return { top: '#2d8cc4', mid: '#87ceeb', bottom: '#e0f4ff' };
  } else if (timeOfDay < 19) {
    return { top: '#614385', mid: '#ff7e5f', bottom: '#ffecd2' };
  } else if (timeOfDay < 20) {
    return { top: '#2d2d44', mid: '#614385', bottom: '#ff6b6b' };
  } else {
    return { top: '#0f172a', mid: '#1e293b', bottom: '#334155' };
  }
}

function drawPreviewTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const halfW = TILE_WIDTH / 2;
  const halfH = TILE_HEIGHT / 2;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + halfW, y + halfH);
  ctx.lineTo(x, y + TILE_HEIGHT);
  ctx.lineTo(x - halfW, y + halfH);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCelestialBody(ctx: CanvasRenderingContext2D, width: number, height: number, timeOfDay: number) {
  const isNight = timeOfDay < 6 || timeOfDay > 20;

  // Calculate position based on time
  const progress = isNight
    ? (timeOfDay < 6 ? timeOfDay + 4 : timeOfDay - 20) / 10
    : (timeOfDay - 6) / 14;

  const x = width * 0.1 + width * 0.8 * progress;
  const y = height * 0.1 + Math.sin(progress * Math.PI) * -height * 0.15;

  if (isNight) {
    // Moon
    ctx.fillStyle = '#f5f5f5';
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();

    // Moon craters
    ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
    ctx.beginPath();
    ctx.arc(x - 8, y - 5, 5, 0, Math.PI * 2);
    ctx.arc(x + 5, y + 8, 3, 0, Math.PI * 2);
    ctx.arc(x + 10, y - 3, 4, 0, Math.PI * 2);
    ctx.fill();

    // Glow
    const moonGlow = ctx.createRadialGradient(x, y, 20, x, y, 60);
    moonGlow.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    moonGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = moonGlow;
    ctx.fillRect(x - 60, y - 60, 120, 120);
  } else {
    // Sun glow
    const sunGlow = ctx.createRadialGradient(x, y, 15, x, y, 80);
    sunGlow.addColorStop(0, 'rgba(255, 236, 179, 0.8)');
    sunGlow.addColorStop(0.5, 'rgba(255, 193, 7, 0.3)');
    sunGlow.addColorStop(1, 'rgba(255, 193, 7, 0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(x - 80, y - 80, 160, 160);

    // Sun
    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStars(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 80; i++) {
    const x = (i * 137.5) % width;
    const y = (i * 73.7) % (height * 0.5);
    const size = (i % 3) * 0.5 + 0.5;
    const alpha = 0.3 + (i % 5) * 0.15;

    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawClouds(ctx: CanvasRenderingContext2D, width: number, height: number, isRain: boolean) {
  const cloudColor = isRain ? 'rgba(100, 116, 139, 0.8)' : 'rgba(255, 255, 255, 0.6)';
  ctx.fillStyle = cloudColor;

  const time = Date.now() / 50000;

  for (let i = 0; i < 6; i++) {
    const baseX = ((i * 250 + time * 100) % (width + 300)) - 150;
    const baseY = 30 + i * 25 + Math.sin(i) * 20;

    ctx.beginPath();
    ctx.arc(baseX, baseY, 35 + i * 3, 0, Math.PI * 2);
    ctx.arc(baseX + 35, baseY - 10, 30 + i * 2, 0, Math.PI * 2);
    ctx.arc(baseX + 70, baseY, 35 + i * 3, 0, Math.PI * 2);
    ctx.arc(baseX + 35, baseY + 10, 25 + i * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRain(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = 'rgba(174, 194, 224, 0.4)';
  ctx.lineWidth = 1;

  const time = Date.now();
  for (let i = 0; i < 150; i++) {
    const x = (i * 17 + time / 20) % width;
    const y = (i * 31 + time / 10) % height;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 1, y + 15);
    ctx.stroke();
  }
}
