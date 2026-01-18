'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import GameCanvas from './GameCanvas';
import StatsBar from './StatsBar';
import BuildingToolbar from './BuildingToolbar';
import NewGameModal from './NewGameModal';

export default function Game() {
  const [showNewGame, setShowNewGame] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  const { tick, isPaused, gameSpeed, isInitialized } = useGameStore();

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

    if (!isPaused) {
      const interval = Math.max(100, 800 / gameSpeed);
      tickRef.current = setInterval(() => {
        tick();
      }, interval);
    }

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
      }
    };
  }, [isClient, isInitialized, isPaused, gameSpeed, tick]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isClient) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const store = useGameStore.getState();
      if (!store.isInitialized) return;

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
        case 'n':
        case 'N':
          setShowNewGame(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isClient]);

  if (!isClient) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#1a1f2e]">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl rotate-6" />
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl flex items-center justify-center">
                <span className="text-4xl">🏙️</span>
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#1a1f2e] flex flex-col select-none">
      {/* Top Stats Bar */}
      <StatsBar onNewGame={() => setShowNewGame(true)} />

      {/* Game Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <GameCanvas />

        {/* Controls overlay - collapsible */}
        {isInitialized && <ControlsOverlay />}

        {/* Achievement notifications */}
        <UnlockNotifications />
      </div>

      {/* Bottom Toolbar */}
      <BuildingToolbar />

      {/* New Game Modal */}
      <NewGameModal
        isOpen={showNewGame}
        onClose={() => {
          if (isInitialized) {
            setShowNewGame(false);
          }
        }}
      />
    </div>
  );
}

function ControlsOverlay() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="absolute top-3 right-3">
      <div
        className={`bg-[#0d1117]/90 backdrop-blur-md border border-[#30363d] rounded-xl overflow-hidden transition-all duration-300 ${
          collapsed ? 'w-10' : 'w-48'
        }`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full px-3 py-2 flex items-center justify-between text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
        >
          {!collapsed && <span className="text-xs font-medium uppercase tracking-wider">Controls</span>}
          <svg
            className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {!collapsed && (
          <div className="px-3 pb-3 space-y-1.5">
            <ControlItem keys={['LMB']} action="Place" />
            <ControlItem keys={['RMB']} action="Pan view" />
            <ControlItem keys={['Scroll']} action="Zoom" />
            <ControlItem keys={['Space']} action="Pause" />
            <ControlItem keys={['G']} action="Toggle grid" />
            <ControlItem keys={['B']} action="Bulldoze" />
            <ControlItem keys={['1', '2', '3']} action="Speed" />
            <ControlItem keys={['N']} action="New city" />
          </div>
        )}
      </div>
    </div>
  );
}

function ControlItem({ keys, action }: { keys: string[]; action: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex gap-1">
        {keys.map((key) => (
          <kbd
            key={key}
            className="px-1.5 py-0.5 bg-[#21262d] border border-[#30363d] rounded text-[#8b949e] font-mono text-[10px]"
          >
            {key}
          </kbd>
        ))}
      </div>
      <span className="text-[#8b949e]">{action}</span>
    </div>
  );
}

function UnlockNotifications() {
  const [notifications, setNotifications] = useState<Array<{ id: number; msg: string }>>([]);
  const { stats } = useGameStore();
  const lastPopRef = useRef(0);
  const idRef = useRef(0);

  useEffect(() => {
    const milestones = [
      { pop: 50, msg: 'Medium Houses unlocked!' },
      { pop: 100, msg: 'Department Store & Large Park unlocked!' },
      { pop: 200, msg: 'Apartments & Hospital unlocked!' },
      { pop: 300, msg: 'Office Building unlocked!' },
      { pop: 500, msg: 'City Hall & Highway unlocked!' },
      { pop: 1000, msg: 'Residential Tower unlocked!' },
      { pop: 2000, msg: 'Stadium unlocked!' },
      { pop: 3000, msg: 'Casino unlocked!' },
      { pop: 5000, msg: 'Monument unlocked!' },
      { pop: 10000, msg: 'Airport unlocked - Metropolis achieved!' },
    ];

    milestones.forEach(({ pop, msg }) => {
      if (stats.population >= pop && lastPopRef.current < pop) {
        const id = idRef.current++;
        setNotifications((prev) => [...prev, { id, msg }]);
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 4000);
      }
    });

    lastPopRef.current = stats.population;
  }, [stats.population]);

  return (
    <div className="absolute top-3 left-3 space-y-2 pointer-events-none">
      {notifications.map(({ id, msg }) => (
        <div
          key={id}
          className="flex items-center gap-3 bg-gradient-to-r from-amber-500/90 to-orange-500/90 backdrop-blur-sm text-white px-4 py-2.5 rounded-lg shadow-lg shadow-orange-500/20 animate-[slideIn_0.3s_ease-out]"
          style={{
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          <span className="text-xl">🎉</span>
          <span className="font-medium text-sm">{msg}</span>
        </div>
      ))}
    </div>
  );
}
