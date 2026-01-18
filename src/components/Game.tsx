'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import GameCanvas from './GameCanvas';
import StatsBar from './StatsBar';
import BuildingToolbar from './BuildingToolbar';
import NewGameModal from './NewGameModal';

export default function Game() {
  const [showNewGame, setShowNewGame] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  const { tiles, tick, isPaused, gameSpeed, initializeGame } = useGameStore();

  // Initialize game on first load
  useEffect(() => {
    // Check if game already exists
    if (tiles.size === 0) {
      setShowNewGame(true);
    }
    setIsLoaded(true);
  }, [tiles.size]);

  // Game loop
  useEffect(() => {
    if (!isLoaded) return;

    const startTick = () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
      }

      if (!isPaused) {
        const interval = Math.max(100, 1000 / gameSpeed);
        tickRef.current = setInterval(() => {
          tick();
        }, interval);
      }
    };

    startTick();

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
      }
    };
  }, [isLoaded, isPaused, gameSpeed, tick]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const store = useGameStore.getState();

      switch (e.key) {
        case 'Escape':
          store.selectTool(null);
          break;
        case 'g':
        case 'G':
          store.toggleGrid();
          break;
        case ' ':
          e.preventDefault();
          store.togglePause();
          break;
        case '1':
          store.setGameSpeed(1);
          break;
        case '2':
          store.setGameSpeed(2);
          break;
        case '3':
          store.setGameSpeed(3);
          break;
        case 'b':
        case 'B':
          store.selectTool('bulldoze');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNewGame = () => {
    setShowNewGame(false);
  };

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🏙️</div>
          <h1 className="text-2xl font-bold text-white">Loading SimCity...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-900 flex flex-col">
      {/* Stats Bar */}
      <StatsBar />

      {/* Game Canvas */}
      <div className="flex-1 relative">
        <GameCanvas />

        {/* Mini help overlay */}
        <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm rounded-lg p-3 text-xs text-slate-300 max-w-xs">
          <div className="font-bold text-white mb-2">🎮 Controls</div>
          <div className="space-y-1">
            <div><kbd className="bg-slate-700 px-1 rounded">Left Click</kbd> Place/Select</div>
            <div><kbd className="bg-slate-700 px-1 rounded">Right Click</kbd> Pan View</div>
            <div><kbd className="bg-slate-700 px-1 rounded">Scroll</kbd> Zoom</div>
            <div><kbd className="bg-slate-700 px-1 rounded">Space</kbd> Pause</div>
            <div><kbd className="bg-slate-700 px-1 rounded">G</kbd> Toggle Grid</div>
            <div><kbd className="bg-slate-700 px-1 rounded">B</kbd> Bulldoze</div>
            <div><kbd className="bg-slate-700 px-1 rounded">1-3</kbd> Game Speed</div>
          </div>
        </div>

        {/* Unlocks notification area */}
        <UnlockNotifications />
      </div>

      {/* Building Toolbar */}
      <BuildingToolbar />

      {/* New Game Modal */}
      <NewGameModal isOpen={showNewGame} onClose={handleNewGame} />
    </div>
  );
}

function UnlockNotifications() {
  const [notifications, setNotifications] = useState<string[]>([]);
  const { stats } = useGameStore();
  const lastPopRef = useRef(0);

  useEffect(() => {
    const milestones = [
      { pop: 50, msg: '🎉 Medium Houses unlocked!' },
      { pop: 100, msg: '🎉 Large Park & Department Store unlocked!' },
      { pop: 200, msg: '🎉 Apartments, Large Factory & Hospital unlocked!' },
      { pop: 300, msg: '🎉 Office Building unlocked!' },
      { pop: 500, msg: '🎉 City Hall, Solar Farm & Highway unlocked!' },
      { pop: 1000, msg: '🎉 Residential Tower unlocked!' },
      { pop: 2000, msg: '🎉 Stadium unlocked!' },
      { pop: 3000, msg: '🎉 Casino unlocked!' },
      { pop: 5000, msg: '🎉 Monument unlocked!' },
      { pop: 10000, msg: '🏆 Airport unlocked! You built a metropolis!' },
    ];

    milestones.forEach(({ pop, msg }) => {
      if (stats.population >= pop && lastPopRef.current < pop) {
        setNotifications((prev) => [...prev, msg]);
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n !== msg));
        }, 5000);
      }
    });

    lastPopRef.current = stats.population;
  }, [stats.population]);

  return (
    <div className="absolute top-4 left-4 space-y-2">
      {notifications.map((msg, i) => (
        <div
          key={i}
          className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse"
        >
          {msg}
        </div>
      ))}
    </div>
  );
}
