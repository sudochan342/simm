'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewGameModal({ isOpen, onClose }: NewGameModalProps) {
  const [cityName, setCityName] = useState('');
  const [mapSize, setMapSize] = useState<'small' | 'medium' | 'large'>('medium');

  const { initializeGame } = useGameStore();

  const MAP_SIZES = {
    small: { width: 30, height: 30, label: 'Small (30x30)' },
    medium: { width: 50, height: 50, label: 'Medium (50x50)' },
    large: { width: 80, height: 80, label: 'Large (80x80)' },
  };

  const handleStartGame = () => {
    const size = MAP_SIZES[mapSize];
    initializeGame(size.width, size.height, cityName || 'New City');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-600 max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">🏙️ SimCity Web</h1>
          <p className="text-blue-100">Build your dream city!</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* City Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              City Name
            </label>
            <input
              type="text"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              placeholder="Enter your city name..."
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Map Size */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Map Size
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(MAP_SIZES) as Array<keyof typeof MAP_SIZES>).map((size) => (
                <button
                  key={size}
                  onClick={() => setMapSize(size)}
                  className={`p-3 rounded-lg border transition-all ${
                    mapSize === size
                      ? 'bg-blue-600 border-blue-400 text-white'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <div className="text-xl mb-1">
                    {size === 'small' ? '🏘️' : size === 'medium' ? '🏙️' : '🌆'}
                  </div>
                  <div className="text-sm font-medium capitalize">{size}</div>
                  <div className="text-xs opacity-75">
                    {MAP_SIZES[size].width}x{MAP_SIZES[size].height}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Starting Info */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="font-medium text-white mb-2">Starting Resources</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <span>💰</span>
                <span>$10,000 Starting Cash</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🏗️</span>
                <span>All Basic Buildings</span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="text-xs text-slate-400 space-y-1">
            <p>💡 Tip: Start with roads and a power plant!</p>
            <p>💡 Tip: Balance residential, commercial, and industrial zones.</p>
            <p>💡 Tip: Use right-click or middle-click to pan the map.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={handleStartGame}
            className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-green-600/30"
          >
            🚀 Start New City
          </button>
        </div>
      </div>
    </div>
  );
}
