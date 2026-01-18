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
  getTerrainColor,
} from '@/game/renderer';
import { getTileKey } from '@/game/types';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [hoverTile, setHoverTile] = useState<{ x: number; y: number } | null>(null);

  const {
    tiles,
    buildings,
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
  } = useGameStore();

  // Render the game
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 140; // Account for UI

    // Clear canvas with sky color based on time of day
    const skyColor = getSkyColor(timeOfDay, weather);
    ctx.fillStyle = skyColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw weather effects
    if (weather === 'rain') {
      drawRain(ctx, canvas.width, canvas.height);
    } else if (weather === 'cloudy') {
      drawClouds(ctx, canvas.width, canvas.height);
    }

    // Get visible tile range
    const zoom = camera.zoom;
    const topLeft = screenToGrid(0, 0, camera.x, camera.y, zoom);
    const bottomRight = screenToGrid(
      canvas.width,
      canvas.height,
      camera.x,
      camera.y,
      zoom
    );

    const padding = 5;
    const startX = Math.max(0, topLeft.x - padding);
    const endX = Math.min(gridSize.width, bottomRight.x + padding + 10);
    const startY = Math.max(0, topLeft.y - padding - 10);
    const endY = Math.min(gridSize.height, bottomRight.y + padding);

    // Sort tiles by render order (back to front)
    const tilesToRender: { x: number; y: number; screenX: number; screenY: number }[] = [];

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const screen = gridToScreen(x, y, camera.x, camera.y, zoom);
        tilesToRender.push({ x, y, screenX: screen.x, screenY: screen.y });
      }
    }

    // Sort by y position for proper layering
    tilesToRender.sort((a, b) => a.screenY - b.screenY);

    // Track rendered buildings to avoid duplicates
    const renderedBuildings = new Set<string>();

    // Render tiles and buildings
    tilesToRender.forEach(({ x, y, screenX, screenY }) => {
      const key = getTileKey(x, y);
      const tile = tiles.get(key);

      if (!tile) return;

      // Draw terrain
      const terrainColor = getTerrainColor(tile.terrain, timeOfDay);
      drawTile(ctx, screenX, screenY, terrainColor, showGrid ? 'rgba(0,0,0,0.15)' : 'transparent');

      // Draw building
      if (tile.building && !renderedBuildings.has(tile.building.id)) {
        renderedBuildings.add(tile.building.id);
        const building = tile.building;
        const buildingScreen = gridToScreen(
          building.x + building.type.width / 2,
          building.y + building.type.height / 2,
          camera.x,
          camera.y,
          zoom
        );

        if (building.type.category === 'road') {
          // Check road connections
          const connections = {
            north: checkRoadConnection(tiles, building.x - 1, building.y),
            south: checkRoadConnection(tiles, building.x + 1, building.y),
            east: checkRoadConnection(tiles, building.x, building.y - 1),
            west: checkRoadConnection(tiles, building.x, building.y + 1),
          };
          drawRoad(ctx, buildingScreen.x, buildingScreen.y - TILE_HEIGHT / 2, connections);
        } else {
          const buildingHeight = getBuildingHeight(building.type.category);
          drawBuilding(
            ctx,
            buildingScreen.x,
            buildingScreen.y - TILE_HEIGHT / 2,
            building.type.width,
            building.type.height,
            building.type.color,
            building.type.emoji,
            buildingHeight * zoom,
            building.level
          );
        }
      }
    });

    // Draw hover indicator
    if (hoverTile && selectedTool && selectedTool !== 'select') {
      const hoverScreen = gridToScreen(hoverTile.x, hoverTile.y, camera.x, camera.y, zoom);
      const tile = tiles.get(getTileKey(hoverTile.x, hoverTile.y));

      const canPlace =
        tile &&
        !tile.building &&
        tile.terrain !== 'water' &&
        (selectedTool === 'bulldoze' ||
          (typeof selectedTool === 'object' && stats.money >= selectedTool.cost));

      // Draw placement preview
      if (typeof selectedTool === 'object') {
        ctx.globalAlpha = 0.5;
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

            drawTile(
              ctx,
              previewScreen.x,
              previewScreen.y,
              isValid ? selectedTool.color : '#ef4444',
              canPlace ? '#22c55e' : '#ef4444'
            );
          }
        }
        ctx.globalAlpha = 1;
      } else if (selectedTool === 'bulldoze') {
        ctx.globalAlpha = 0.7;
        drawTile(ctx, hoverScreen.x, hoverScreen.y, '#ef4444', '#dc2626');
        ctx.globalAlpha = 1;
      }

      // Draw cursor coordinates
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(hoverScreen.x - 30, hoverScreen.y - 55, 60, 20);
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${hoverTile.x}, ${hoverTile.y}`, hoverScreen.x, hoverScreen.y - 40);
    }

    // Draw day/night overlay
    if (timeOfDay < 6 || timeOfDay > 20) {
      ctx.fillStyle = `rgba(0, 0, 40, ${0.3 + (timeOfDay < 6 ? (6 - timeOfDay) : (timeOfDay - 20)) * 0.05})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars at night
      if (timeOfDay < 5 || timeOfDay > 21) {
        drawStars(ctx, canvas.width, canvas.height, timeOfDay);
      }
    }
  }, [tiles, buildings, camera, gridSize, showGrid, selectedTool, timeOfDay, weather, hoverTile, stats.money]);

  // Animation loop
  useEffect(() => {
    let animationId: number;

    const animate = () => {
      render();
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [render]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => render();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2) {
      // Middle or right click for dragging
      setIsDragging(true);
      setLastMouse({ x: e.clientX, y: e.clientY });
    } else if (e.button === 0 && selectedTool) {
      // Left click for placement
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
        } else if (selectedTool !== 'select') {
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

    // Update hover tile
    const canvas = canvasRef.current;
    if (canvas) {
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

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoverTile(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.min(2, Math.max(0.5, camera.zoom + delta));
    updateCamera(camera.x, camera.y, newZoom);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full cursor-crosshair"
      style={{ height: 'calc(100vh - 140px)' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
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

function getBuildingHeight(category: string): number {
  switch (category) {
    case 'residential':
      return 25;
    case 'commercial':
      return 35;
    case 'industrial':
      return 20;
    case 'utility':
      return 30;
    case 'special':
      return 45;
    case 'park':
      return 10;
    default:
      return 15;
  }
}

function getSkyColor(timeOfDay: number, weather: string): string {
  if (weather === 'rain') return '#708090';
  if (weather === 'cloudy') return '#87CEEB';

  if (timeOfDay < 5) return '#1a1a2e';
  if (timeOfDay < 6) return '#2d2d44';
  if (timeOfDay < 7) return '#ff7e5f';
  if (timeOfDay < 8) return '#87CEEB';
  if (timeOfDay < 17) return '#87CEEB';
  if (timeOfDay < 18) return '#ffecd2';
  if (timeOfDay < 19) return '#ff7e5f';
  if (timeOfDay < 20) return '#614385';
  if (timeOfDay < 21) return '#2d2d44';
  return '#1a1a2e';
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeOfDay: number
): void {
  const intensity = timeOfDay < 5 ? 1 : timeOfDay > 21 ? 1 : 0.5;
  ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;

  // Use deterministic positions based on simple math
  for (let i = 0; i < 100; i++) {
    const x = ((i * 137.5) % width);
    const y = ((i * 73.7) % (height * 0.6));
    const size = (i % 3) + 1;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRain(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
  ctx.lineWidth = 1;

  for (let i = 0; i < 100; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 2, y + 10);
    ctx.stroke();
  }
}

function drawClouds(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';

  for (let i = 0; i < 5; i++) {
    const x = (i * 200 + Date.now() / 100) % (width + 200) - 100;
    const y = 50 + i * 30;

    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.arc(x + 30, y - 10, 35, 0, Math.PI * 2);
    ctx.arc(x + 60, y, 40, 0, Math.PI * 2);
    ctx.arc(x + 30, y + 10, 30, 0, Math.PI * 2);
    ctx.fill();
  }
}
