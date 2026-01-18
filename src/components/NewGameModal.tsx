'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { SC3000_COLORS } from '@/game/types';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewGameModal({ isOpen, onClose }: NewGameModalProps) {
  const [cityName, setCityName] = useState('');
  const [mayorName, setMayorName] = useState('');
  const [mapSize, setMapSize] = useState<'small' | 'medium' | 'large'>('medium');

  const { initializeGame, isInitialized } = useGameStore();

  const MAP_SIZES = {
    small: { width: 50, height: 50, label: 'Small', desc: 'Quick games, easy management' },
    medium: { width: 100, height: 100, label: 'Medium', desc: 'Balanced gameplay' },
    large: { width: 150, height: 150, label: 'Large', desc: 'Massive cities, more challenge' },
  };

  const handleStartGame = () => {
    const size = MAP_SIZES[mapSize];
    initializeGame(size.width, size.height, cityName || 'New City', mayorName || 'Mayor');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.8)' }}
        onClick={isInitialized ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg mx-4 rounded-xl overflow-hidden"
        style={{
          background: SC3000_COLORS.uiPanel,
          border: `3px solid ${SC3000_COLORS.uiBorder}`,
          boxShadow: `0 0 30px ${SC3000_COLORS.uiHighlight}40`,
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 text-center"
          style={{
            background: `linear-gradient(to bottom, ${SC3000_COLORS.uiHighlight}40, transparent)`,
          }}
        >
          <div className="text-5xl mb-3">🏙️</div>
          <h1 className="text-2xl font-bold" style={{ color: SC3000_COLORS.uiText }}>
            SimCity 3000 Web
          </h1>
          <p className="text-sm mt-1" style={{ color: SC3000_COLORS.uiTextDim }}>
            Build the city of your dreams
          </p>

          {isInitialized && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded"
              style={{ color: SC3000_COLORS.uiTextDim }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-5">
          {/* City Name */}
          <div>
            <label
              className="block text-xs font-medium uppercase tracking-wider mb-2"
              style={{ color: SC3000_COLORS.uiTextDim }}
            >
              City Name
            </label>
            <input
              type="text"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              placeholder="Enter city name..."
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
              style={{
                background: SC3000_COLORS.uiBackground,
                color: SC3000_COLORS.uiText,
                border: `2px solid ${SC3000_COLORS.uiBorder}`,
              }}
            />
          </div>

          {/* Mayor Name */}
          <div>
            <label
              className="block text-xs font-medium uppercase tracking-wider mb-2"
              style={{ color: SC3000_COLORS.uiTextDim }}
            >
              Mayor Name
            </label>
            <input
              type="text"
              value={mayorName}
              onChange={(e) => setMayorName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
              style={{
                background: SC3000_COLORS.uiBackground,
                color: SC3000_COLORS.uiText,
                border: `2px solid ${SC3000_COLORS.uiBorder}`,
              }}
            />
          </div>

          {/* Map Size */}
          <div>
            <label
              className="block text-xs font-medium uppercase tracking-wider mb-2"
              style={{ color: SC3000_COLORS.uiTextDim }}
            >
              Map Size
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(MAP_SIZES) as Array<keyof typeof MAP_SIZES>).map((size) => {
                const sizeData = MAP_SIZES[size];
                const isSelected = mapSize === size;

                return (
                  <button
                    key={size}
                    onClick={() => setMapSize(size)}
                    className="p-4 rounded-lg text-center transition-all"
                    style={{
                      background: isSelected ? SC3000_COLORS.uiHighlight + '40' : SC3000_COLORS.uiBackground,
                      border: `2px solid ${isSelected ? SC3000_COLORS.uiHighlight : SC3000_COLORS.uiBorder}`,
                    }}
                  >
                    <div className="text-2xl mb-1">
                      {size === 'small' ? '🏘️' : size === 'medium' ? '🏙️' : '🌆'}
                    </div>
                    <div
                      className="text-sm font-medium"
                      style={{ color: isSelected ? SC3000_COLORS.uiHighlight : SC3000_COLORS.uiText }}
                    >
                      {sizeData.label}
                    </div>
                    <div className="text-[10px]" style={{ color: SC3000_COLORS.uiTextDim }}>
                      {sizeData.width}x{sizeData.height}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-center" style={{ color: SC3000_COLORS.uiTextDim }}>
              {MAP_SIZES[mapSize].desc}
            </p>
          </div>

          {/* Starting Resources */}
          <div
            className="p-4 rounded-lg"
            style={{ background: SC3000_COLORS.uiBackground, border: `1px solid ${SC3000_COLORS.uiBorder}` }}
          >
            <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: SC3000_COLORS.uiTextDim }}>
              Starting Resources
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">💵</span>
                <div>
                  <div className="text-sm font-medium" style={{ color: '#00ff00' }}>$50,000</div>
                  <div className="text-[10px]" style={{ color: SC3000_COLORS.uiTextDim }}>Starting funds</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🔌</span>
                <div>
                  <div className="text-sm font-medium" style={{ color: SC3000_COLORS.uiText }}>Power Plants</div>
                  <div className="text-[10px]" style={{ color: SC3000_COLORS.uiTextDim }}>Build first!</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="space-y-1.5">
            <Tip icon="💡" text="Build a Power Plant first to supply electricity" />
            <Tip icon="🛤️" text="Roads connect zones and allow development" />
            <Tip icon="⚖️" text="Balance Residential, Commercial & Industrial zones" />
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartGame}
            className="w-full py-4 rounded-lg font-bold text-lg transition-all hover:brightness-110 flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(to right, ${SC3000_COLORS.uiHighlight}, #ff6b6b)`,
              color: SC3000_COLORS.uiText,
              boxShadow: `0 4px 20px ${SC3000_COLORS.uiHighlight}50`,
            }}
          >
            🏗️ Found City
          </button>

          {isInitialized && (
            <p className="text-center text-xs" style={{ color: SC3000_COLORS.uiTextDim }}>
              Press Esc to return to your city
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Tip({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span>{icon}</span>
      <span style={{ color: SC3000_COLORS.uiTextDim }}>{text}</span>
    </div>
  );
}
