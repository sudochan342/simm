'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import GameCanvas from './GameCanvas';
import StatsBar from './StatsBar';
import Toolbar from './Toolbar';
import NewGameModal from './NewGameModal';
import BudgetModal from './BudgetModal';
import { SC3000_COLORS } from '@/game/types';

export default function Game() {
  const [showNewGame, setShowNewGame] = useState(true);
  const [showBudget, setShowBudget] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  const { tick, speed, isInitialized, selectTool, toggleZones } = useGameStore();

  // Client-side only
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show modal based on initialization
  useEffect(() => {
    if (isInitialized) {
      setShowNewGame(false);
    }
  }, [isInitialized]);

  // Game loop
  useEffect(() => {
    if (!isClient || !isInitialized) return;

    if (tickRef.current) {
      clearInterval(tickRef.current);
    }

    if (speed > 0) {
      const interval = Math.max(50, 500 / speed);
      tickRef.current = setInterval(() => {
        tick();
      }, interval);
    }

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
      }
    };
  }, [isClient, isInitialized, speed, tick]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isClient) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const store = useGameStore.getState();

      switch (e.key) {
        case 'Escape':
          if (showBudget) {
            setShowBudget(false);
          } else if (showNewGame && store.isInitialized) {
            setShowNewGame(false);
          } else {
            store.selectTool('pointer');
          }
          break;
        case 'z':
        case 'Z':
          store.toggleZones();
          break;
        case ' ':
          e.preventDefault();
          store.setSpeed(store.speed === 0 ? 1 : 0);
          break;
        case '1':
          store.setSpeed(1);
          break;
        case '2':
          store.setSpeed(2);
          break;
        case '3':
          store.setSpeed(3);
          break;
        case 'b':
        case 'B':
          store.selectTool('bulldoze');
          break;
        case 'r':
        case 'R':
          store.selectTool('road');
          break;
        case 'n':
        case 'N':
          setShowNewGame(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isClient, showBudget, showNewGame]);

  if (!isClient) {
    return (
      <div
        className="h-screen w-screen flex items-center justify-center"
        style={{ background: SC3000_COLORS.uiBackground }}
      >
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🏙️</div>
          <h1 className="text-2xl font-bold" style={{ color: SC3000_COLORS.uiText }}>
            Loading SimCity 3000...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col select-none"
      style={{ background: SC3000_COLORS.uiBackground }}
    >
      {/* Top Stats Bar */}
      <StatsBar onNewGame={() => setShowNewGame(true)} onBudget={() => setShowBudget(true)} />

      {/* Main Game Area */}
      <div className="flex-1 relative overflow-hidden">
        <GameCanvas />
        <Toolbar />

        {/* Keyboard shortcuts hint */}
        {isInitialized && (
          <div
            className="absolute bottom-4 right-4 p-3 rounded-lg text-xs"
            style={{
              background: SC3000_COLORS.uiPanel + 'dd',
              border: `1px solid ${SC3000_COLORS.uiBorder}`,
              color: SC3000_COLORS.uiTextDim,
            }}
          >
            <div className="font-bold mb-2" style={{ color: SC3000_COLORS.uiText }}>Shortcuts</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span>Right-click drag</span><span>Pan</span>
              <span>Scroll</span><span>Zoom</span>
              <span>Space</span><span>Pause</span>
              <span>Z</span><span>Toggle zones</span>
              <span>B</span><span>Bulldoze</span>
              <span>R</span><span>Road</span>
              <span>1-3</span><span>Speed</span>
            </div>
          </div>
        )}
      </div>

      {/* New Game Modal */}
      <NewGameModal
        isOpen={showNewGame}
        onClose={() => {
          if (isInitialized) {
            setShowNewGame(false);
          }
        }}
      />

      {/* Budget Modal */}
      <BudgetModal isOpen={showBudget} onClose={() => setShowBudget(false)} />
    </div>
  );
}
