'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGameStore } from '@/store/gameStore';
import GameCanvas from './GameCanvas';
import StatsBar from './StatsBar';
import Toolbar from './Toolbar';
import BudgetModal from './BudgetModal';

const THEME = {
  bg: '#0f0f1a',
  bgLight: '#1a1a2e',
  border: '#3a3a5c',
  text: '#e0e0e0',
  textDim: '#888',
  accent: '#4a90d9',
};

export default function Game() {
  const [showBudget, setShowBudget] = useState(false);
  const [showCitySetup, setShowCitySetup] = useState(false);
  const [cityName, setCityName] = useState('');
  const [mayorName, setMayorName] = useState('');
  const [isClient, setIsClient] = useState(false);
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  const { tick, speed, isInitialized, initializeGame, setWallet } = useGameStore();
  const { connected, publicKey } = useWallet();

  // Client-side only
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-initialize shared world
  useEffect(() => {
    if (isClient && !isInitialized) {
      initializeGame(100, 100, 'Shared World', 'Community');
    }
  }, [isClient, isInitialized, initializeGame]);

  // Handle wallet connection
  useEffect(() => {
    if (connected && publicKey) {
      setWallet(publicKey.toBase58());
      // Check if this wallet has registered a city name
      const savedCity = localStorage.getItem(`city_${publicKey.toBase58()}`);
      if (!savedCity) {
        setShowCitySetup(true);
      }
    } else {
      setWallet(null);
    }
  }, [connected, publicKey, setWallet]);

  const handleCitySetup = () => {
    if (cityName.trim() && mayorName.trim() && publicKey) {
      localStorage.setItem(`city_${publicKey.toBase58()}`, JSON.stringify({
        cityName: cityName.trim(),
        mayorName: mayorName.trim(),
      }));
      setShowCitySetup(false);
    }
  };

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
      if (showCitySetup) return;
      const store = useGameStore.getState();

      switch (e.key) {
        case 'Escape':
          if (showBudget) {
            setShowBudget(false);
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isClient, showBudget, showCitySetup]);

  if (!isClient) {
    return (
      <div
        className="h-screen w-screen flex items-center justify-center"
        style={{ background: THEME.bg }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: THEME.text }}>
            SIMM
          </h1>
          <p style={{ color: THEME.textDim }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col select-none"
      style={{ background: THEME.bg }}
    >
      {/* Top Stats Bar */}
      <StatsBar onBudget={() => setShowBudget(true)} />

      {/* Main Game Area */}
      <div className="flex-1 relative overflow-hidden">
        <GameCanvas />
        <Toolbar />

        {/* Keyboard shortcuts hint */}
        {isInitialized && (
          <div
            className="absolute bottom-4 right-4 p-3 rounded text-xs"
            style={{
              background: 'rgba(15, 15, 26, 0.9)',
              border: `1px solid ${THEME.border}`,
              color: THEME.textDim,
            }}
          >
            <div className="font-bold mb-2" style={{ color: THEME.text }}>Shortcuts</div>
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

      {/* Budget Modal */}
      <BudgetModal isOpen={showBudget} onClose={() => setShowBudget(false)} />

      {/* City Setup Modal for new wallets */}
      {showCitySetup && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.8)' }}
        >
          <div
            className="p-6 rounded-lg max-w-sm w-full mx-4"
            style={{ background: THEME.bgLight, border: `1px solid ${THEME.border}` }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: THEME.text }}>
              Welcome to SIMM
            </h2>
            <p className="text-sm mb-4" style={{ color: THEME.textDim }}>
              Set up your city in the shared world. Other players will see your buildings!
            </p>

            <div className="mb-4">
              <label className="block text-xs mb-1" style={{ color: THEME.textDim }}>
                City Name
              </label>
              <input
                type="text"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="Enter city name..."
                className="w-full px-3 py-2 rounded text-sm"
                style={{
                  background: THEME.bg,
                  border: `1px solid ${THEME.border}`,
                  color: THEME.text,
                }}
              />
            </div>

            <div className="mb-6">
              <label className="block text-xs mb-1" style={{ color: THEME.textDim }}>
                Mayor Name
              </label>
              <input
                type="text"
                value={mayorName}
                onChange={(e) => setMayorName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-3 py-2 rounded text-sm"
                style={{
                  background: THEME.bg,
                  border: `1px solid ${THEME.border}`,
                  color: THEME.text,
                }}
              />
            </div>

            <button
              onClick={handleCitySetup}
              disabled={!cityName.trim() || !mayorName.trim()}
              className="w-full py-2 rounded font-medium transition-all"
              style={{
                background: cityName.trim() && mayorName.trim() ? THEME.accent : THEME.border,
                color: '#fff',
                cursor: cityName.trim() && mayorName.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Start Building
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
