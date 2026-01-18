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

  const { initializeGame, isInitialized } = useGameStore();

  const MAP_SIZES = {
    small: { width: 30, height: 30, label: 'Small', desc: 'Quick games, fast performance' },
    medium: { width: 50, height: 50, label: 'Medium', desc: 'Balanced gameplay' },
    large: { width: 75, height: 75, label: 'Large', desc: 'Epic cities, more resources needed' },
  };

  const handleStartGame = () => {
    const size = MAP_SIZES[mapSize];
    initializeGame(size.width, size.height, cityName || 'New City');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={isInitialized ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-[#0d1117] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative px-6 pt-8 pb-6 text-center bg-gradient-to-b from-[#161b22] to-transparent">
          {/* Logo */}
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl blur-xl opacity-50" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-4xl">🏙️</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">SimCity Web</h1>
          <p className="text-sm text-[#8b949e]">Build your dream city</p>

          {/* Close button (only if game exists) */}
          {isInitialized && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-[#8b949e] hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-5">
          {/* City Name Input */}
          <div>
            <label className="block text-xs font-medium text-[#8b949e] uppercase tracking-wider mb-2">
              City Name
            </label>
            <input
              type="text"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              placeholder="Enter city name..."
              className="w-full px-4 py-3 bg-[#161b22] border border-[#30363d] rounded-xl text-white placeholder-[#6e7681] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Map Size Selection */}
          <div>
            <label className="block text-xs font-medium text-[#8b949e] uppercase tracking-wider mb-2">
              Map Size
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(MAP_SIZES) as Array<keyof typeof MAP_SIZES>).map((size) => {
                const sizeData = MAP_SIZES[size];
                const isSelected = mapSize === size;

                return (
                  <button
                    key={size}
                    onClick={() => setMapSize(size)}
                    className={`
                      relative p-3 rounded-xl border transition-all text-center
                      ${isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 ring-1 ring-emerald-500/50'
                        : 'bg-[#161b22] border-[#30363d] hover:border-[#8b949e]'
                      }
                    `}
                  >
                    <div className="text-2xl mb-1">
                      {size === 'small' ? '🏘️' : size === 'medium' ? '🏙️' : '🌆'}
                    </div>
                    <div className={`text-sm font-medium ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                      {sizeData.label}
                    </div>
                    <div className="text-[10px] text-[#8b949e]">
                      {sizeData.width}x{sizeData.height}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-[#6e7681] text-center">
              {MAP_SIZES[mapSize].desc}
            </p>
          </div>

          {/* Starting Resources Info */}
          <div className="p-4 bg-[#161b22] rounded-xl border border-[#21262d]">
            <div className="text-xs font-medium text-[#8b949e] uppercase tracking-wider mb-3">
              Starting Resources
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">💵</span>
                <div>
                  <div className="text-sm font-medium text-emerald-400">$50,000</div>
                  <div className="text-[10px] text-[#6e7681]">Starting funds</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🏗️</span>
                <div>
                  <div className="text-sm font-medium text-white">20+ Buildings</div>
                  <div className="text-[10px] text-[#6e7681]">Available to build</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="space-y-1.5">
            <Tip icon="💡" text="Start with a Power Plant to supply electricity" />
            <Tip icon="🛤️" text="Roads connect buildings and boost efficiency" />
            <Tip icon="⚖️" text="Balance residential, commercial & industrial zones" />
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartGame}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Start Building
          </button>

          {/* Resume hint */}
          {isInitialized && (
            <p className="text-center text-xs text-[#6e7681]">
              Press <kbd className="px-1.5 py-0.5 bg-[#21262d] border border-[#30363d] rounded text-[10px]">Esc</kbd> to return to your city
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
      <span className="text-[#8b949e]">{text}</span>
    </div>
  );
}
