'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  gridToScreen,
  screenToGrid,
  drawTile,
  drawInfrastructure,
  drawZoneBuilding,
  drawPlacedBuilding,
  drawSelectionHighlight,
  drawMiniMap,
  drawDemandMeter,
  initRenderer,
  TILE_WIDTH,
  TILE_HEIGHT,
} from '@/game/renderer';
import {
  BuildingDef,
  ZoneType,
  ZoneDensity,
  InfrastructureType,
  getBuildingById,
} from '@/game/types';

// SC3000 style colors
const SC3K_BG = '#1a2a3a';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastDragPos, setLastDragPos] = useState({ x: 0, y: 0 });
  const [hoverTile, setHoverTile] = useState<{ x: number; y: number } | null>(null);

  // Camera offset in pixels
  const [cameraX, setCameraX] = useState(0);
  const [cameraY, setCameraY] = useState(0);

  const {
    tiles,
    width,
    height,
    buildings,
    isInitialized,
    selectedTool,
    showZones,
    zoom,
    stats,
    setZoom,
    placeZone,
    placeInfrastructure,
    placeBuilding,
    bulldoze,
  } = useGameStore();

  // Initialize renderer/sprites on mount
  useEffect(() => {
    initRenderer();
  }, []);

  // Initialize camera to center of map when game starts
  useEffect(() => {
    if (isInitialized && canvasRef.current) {
      // Center the camera on the middle of the map
      const centerTile = gridToScreen(width / 2, height / 2, 0);
      setCameraX(centerTile.x);
      setCameraY(centerTile.y);
    }
  }, [isInitialized, width, height]);

  // Get tool info for placement
  const getToolInfo = useCallback(() => {
    if (!selectedTool) return null;

    if (typeof selectedTool === 'string') {
      if (selectedTool.startsWith('zone_')) {
        const parts = selectedTool.split('_');
        const zoneMap: Record<string, ZoneType> = { r: 'residential', c: 'commercial', i: 'industrial' };
        const densityMap: Record<string, ZoneDensity> = { light: 'light', medium: 'medium', dense: 'dense' };
        return {
          type: 'zone' as const,
          zone: zoneMap[parts[1]] || 'residential',
          density: densityMap[parts[2]] || 'light',
          width: 1,
          height: 1,
        };
      }
      if (selectedTool === 'road' || selectedTool === 'highway' || selectedTool === 'rail' ||
          selectedTool === 'power_line' || selectedTool === 'water_pipe') {
        return {
          type: 'infrastructure' as const,
          infrastructure: selectedTool as InfrastructureType,
          width: 1,
          height: 1,
        };
      }
      if (selectedTool === 'bulldoze') {
        return { type: 'bulldoze' as const, width: 1, height: 1 };
      }
      return null;
    }

    // Building
    return {
      type: 'building' as const,
      building: selectedTool as BuildingDef,
      width: selectedTool.width,
      height: selectedTool.height,
    };
  }, [selectedTool]);

  // Convert screen position to world position
  const screenToWorld = useCallback((screenX: number, screenY: number, canvas: HTMLCanvasElement) => {
    const worldX = (screenX - canvas.width / 2) / zoom + cameraX;
    const worldY = (screenY - canvas.height / 2) / zoom + cameraY;
    return { x: worldX, y: worldY };
  }, [cameraX, cameraY, zoom]);

  // Handle click
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isInitialized || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const world = screenToWorld(mouseX, mouseY, canvas);
    const gridPos = screenToGrid(world.x, world.y);
    const toolInfo = getToolInfo();

    if (!toolInfo || gridPos.x < 0 || gridPos.y < 0 || gridPos.x >= width || gridPos.y >= height) return;

    switch (toolInfo.type) {
      case 'zone':
        placeZone(gridPos.x, gridPos.y, toolInfo.zone, toolInfo.density);
        break;
      case 'infrastructure':
        placeInfrastructure(gridPos.x, gridPos.y, toolInfo.infrastructure);
        break;
      case 'building':
        placeBuilding(gridPos.x, gridPos.y, toolInfo.building);
        break;
      case 'bulldoze':
        bulldoze(gridPos.x, gridPos.y);
        break;
    }
  }, [isInitialized, screenToWorld, width, height, getToolInfo, placeZone, placeInfrastructure, placeBuilding, bulldoze]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      const dx = (mouseX - lastDragPos.x) / zoom;
      const dy = (mouseY - lastDragPos.y) / zoom;
      setCameraX(prev => prev - dx);
      setCameraY(prev => prev - dy);
      setLastDragPos({ x: mouseX, y: mouseY });
    } else {
      // Update hover tile
      const world = screenToWorld(mouseX, mouseY, canvas);
      const gridPos = screenToGrid(world.x, world.y);

      if (gridPos.x >= 0 && gridPos.y >= 0 && gridPos.x < width && gridPos.y < height) {
        setHoverTile(gridPos);
      } else {
        setHoverTile(null);
      }
    }
  }, [isDragging, lastDragPos, zoom, screenToWorld, width, height]);

  // Handle mouse down/up
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 2 || e.button === 1) { // Right or middle click
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setLastDragPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
      e.preventDefault();
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(zoom + delta);
  }, [zoom, setZoom]);

  // Render loop
  useEffect(() => {
    if (!isInitialized || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (time: number) => {
      // Clear canvas with SC3000 style background
      ctx.fillStyle = SC3K_BG;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Save context
      ctx.save();

      // Apply camera transformation
      // Move origin to center of canvas, apply zoom, then offset by camera position
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-cameraX, -cameraY);

      // Calculate visible bounds for culling (with some padding)
      const padding = 5;
      const minVisibleX = -padding;
      const maxVisibleX = width + padding;
      const minVisibleY = -padding;
      const maxVisibleY = height + padding;

      // Render tiles in isometric order (back to front)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Cull tiles outside visible range
          if (x < minVisibleX || x > maxVisibleX || y < minVisibleY || y > maxVisibleY) continue;

          const tile = tiles[y]?.[x];
          if (!tile) continue;

          const screen = gridToScreen(x, y, 0);

          // Draw base terrain with time for animations
          drawTile(ctx, tile, screen.x, screen.y, showZones, time);

          // Draw infrastructure
          if (tile.infrastructure) {
            const neighbors = {
              n: tiles[y - 1]?.[x]?.infrastructure === tile.infrastructure,
              s: tiles[y + 1]?.[x]?.infrastructure === tile.infrastructure,
              e: tiles[y]?.[x + 1]?.infrastructure === tile.infrastructure,
              w: tiles[y]?.[x - 1]?.infrastructure === tile.infrastructure,
            };
            drawInfrastructure(ctx, tile.infrastructure, screen.x, screen.y, neighbors, tile.elevation);
          }

          // Draw zone buildings
          if (tile.zone && tile.development > 0) {
            drawZoneBuilding(ctx, tile, screen.x, screen.y);
          }
        }
      }

      // Draw placed buildings (render separately to ensure proper z-order)
      const sortedBuildings = [...buildings].sort((a, b) => (a.x + a.y) - (b.x + b.y));
      for (const building of sortedBuildings) {
        const def = getBuildingById(building.defId);
        if (!def) continue;

        const tile = tiles[building.y]?.[building.x];
        if (!tile) continue;

        // Calculate center position for multi-tile buildings
        const centerX = building.x + def.width / 2;
        const centerY = building.y + def.height / 2;
        const screen = gridToScreen(centerX, centerY, tile.elevation);

        drawPlacedBuilding(ctx, building, def, screen.x, screen.y, tile.elevation);
      }

      // Draw hover highlight
      if (hoverTile && selectedTool) {
        const toolInfo = getToolInfo();
        if (toolInfo) {
          const screen = gridToScreen(hoverTile.x, hoverTile.y, 0);
          const tile = tiles[hoverTile.y]?.[hoverTile.x];
          const isValid = tile && tile.terrain !== 'water' && !tile.building;
          drawSelectionHighlight(ctx, screen.x, screen.y, toolInfo.width, toolInfo.height, isValid);
        }
      }

      ctx.restore();

      // Draw UI overlays (not affected by camera)
      // Mini-map in bottom right
      drawMiniMap(
        ctx,
        tiles,
        canvas.width - 170,
        canvas.height - 130,
        160,
        120,
        0,
        0,
        width,
        height
      );

      // RCI Demand meter in bottom left
      drawDemandMeter(
        ctx,
        10,
        canvas.height - 120,
        stats.demand.residential,
        stats.demand.commercial,
        stats.demand.industrial
      );

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isInitialized, tiles, buildings, cameraX, cameraY, zoom, width, height, showZones, hoverTile, selectedTool, getToolInfo, stats.demand]);

  // Resize canvas
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth - 60; // Account for toolbar
        canvasRef.current.height = window.innerHeight - 60; // Account for stats bar
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: SC3K_BG }}>
        <div className="text-center">
          <div className="text-6xl mb-4">🏙️</div>
          <p className="text-gray-400">Start a new city to begin</p>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="block cursor-crosshair"
      style={{ background: SC3K_BG }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
    />
  );
}
