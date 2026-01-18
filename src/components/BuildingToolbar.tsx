'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { BuildingCategory, BuildingType, BUILDING_TYPES, getCategoryColor } from '@/game/types';

const CATEGORIES: { id: BuildingCategory; name: string; icon: string }[] = [
  { id: 'residential', name: 'Residential', icon: '🏠' },
  { id: 'commercial', name: 'Commercial', icon: '🏪' },
  { id: 'industrial', name: 'Industrial', icon: '🏭' },
  { id: 'road', name: 'Roads', icon: '🛣️' },
  { id: 'park', name: 'Parks', icon: '🌳' },
  { id: 'utility', name: 'Utilities', icon: '⚡' },
  { id: 'special', name: 'Special', icon: '🏛️' },
];

export default function BuildingToolbar() {
  const [selectedCategory, setSelectedCategory] = useState<BuildingCategory | null>(null);
  const [showBuildMenu, setShowBuildMenu] = useState(false);

  const { selectedTool, selectTool, stats, toggleGrid, showGrid, saveGame, resetGame } = useGameStore();

  const availableBuildings = BUILDING_TYPES.filter(
    (b) => !b.unlockPopulation || stats.population >= b.unlockPopulation
  );

  const getBuildingsByCategory = (category: BuildingCategory): BuildingType[] => {
    return availableBuildings.filter((b) => b.category === category);
  };

  const handleCategoryClick = (category: BuildingCategory) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
      setShowBuildMenu(false);
    } else {
      setSelectedCategory(category);
      setShowBuildMenu(true);
    }
  };

  const handleBuildingSelect = (building: BuildingType) => {
    selectTool(building);
    setShowBuildMenu(false);
    setSelectedCategory(null);
  };

  const formatCost = (cost: number): string => {
    if (cost >= 1000) return `$${(cost / 1000).toFixed(1)}K`;
    return `$${cost}`;
  };

  const handleSave = () => {
    const saveData = saveGame();
    localStorage.setItem('simcity_save', saveData);
    alert('Game saved!');
  };

  const handleLoad = () => {
    const saveData = localStorage.getItem('simcity_save');
    if (saveData) {
      const store = useGameStore.getState();
      store.loadGame(saveData);
      alert('Game loaded!');
    } else {
      alert('No save game found!');
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 border-t border-slate-700 shadow-2xl">
      {/* Building Categories */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1">
          {/* Tool buttons */}
          <button
            onClick={() => selectTool('select')}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all ${
              selectedTool === 'select'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <span className="text-xl">👆</span>
            <span className="text-xs">Select</span>
          </button>

          <button
            onClick={() => selectTool('bulldoze')}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all ${
              selectedTool === 'bulldoze'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <span className="text-xl">🚧</span>
            <span className="text-xs">Bulldoze</span>
          </button>

          <div className="h-10 w-px bg-slate-600 mx-2" />

          {/* Category buttons */}
          {CATEGORIES.map((cat) => {
            const buildings = getBuildingsByCategory(cat.id);
            const isSelected = selectedCategory === cat.id;
            const isToolFromCategory =
              selectedTool !== null && typeof selectedTool === 'object' && selectedTool.category === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                disabled={buildings.length === 0}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all ${
                  isSelected || isToolFromCategory
                    ? 'bg-slate-600'
                    : buildings.length === 0
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                style={{
                  borderColor: getCategoryColor(cat.id),
                  boxShadow: isSelected || isToolFromCategory ? `0 0 0 2px ${getCategoryColor(cat.id)}` : undefined,
                }}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="text-xs truncate w-full text-center">{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Tool Info */}
        <div className="flex items-center gap-4">
          {selectedTool !== null && typeof selectedTool === 'object' && (
            <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
              <span className="text-2xl">{selectedTool.emoji}</span>
              <div className="flex flex-col">
                <span className="font-bold text-white">{selectedTool.name}</span>
                <span className="text-xs text-yellow-400">{formatCost(selectedTool.cost)}</span>
              </div>
            </div>
          )}

          <div className="h-10 w-px bg-slate-600" />

          {/* Utility buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleGrid}
              className={`px-3 py-2 rounded-lg transition-all ${
                showGrid ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              <span className="text-lg">📐</span>
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-green-600 transition-all"
            >
              <span className="text-lg">💾</span>
            </button>
            <button
              onClick={handleLoad}
              className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-blue-600 transition-all"
            >
              <span className="text-lg">📂</span>
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to start a new city?')) {
                  resetGame();
                }
              }}
              className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-red-600 transition-all"
            >
              <span className="text-lg">🗑️</span>
            </button>
          </div>
        </div>
      </div>

      {/* Building Selection Menu */}
      {showBuildMenu && selectedCategory && (
        <div className="absolute bottom-20 left-4 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-4 max-w-3xl z-50">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-600">
            <span className="text-xl">
              {CATEGORIES.find((c) => c.id === selectedCategory)?.icon}
            </span>
            <h3 className="text-lg font-bold text-white">
              {CATEGORIES.find((c) => c.id === selectedCategory)?.name}
            </h3>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {getBuildingsByCategory(selectedCategory).map((building) => {
              const canAfford = stats.money >= building.cost;
              const isSelected =
                selectedTool !== null && typeof selectedTool === 'object' && selectedTool.id === building.id;

              return (
                <button
                  key={building.id}
                  onClick={() => handleBuildingSelect(building)}
                  disabled={!canAfford}
                  className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-blue-600 ring-2 ring-blue-400'
                      : canAfford
                      ? 'bg-slate-700 hover:bg-slate-600'
                      : 'bg-slate-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <span className="text-3xl mb-1">{building.emoji}</span>
                  <span className="text-sm font-medium text-white truncate w-full text-center">
                    {building.name}
                  </span>
                  <span
                    className={`text-xs ${canAfford ? 'text-yellow-400' : 'text-red-400'}`}
                  >
                    {formatCost(building.cost)}
                  </span>

                  {/* Building stats preview */}
                  <div className="flex flex-wrap gap-1 mt-1 justify-center">
                    {building.population && (
                      <span className="text-xs bg-green-600/30 text-green-300 px-1 rounded">
                        👥{building.population}
                      </span>
                    )}
                    {building.jobs && (
                      <span className="text-xs bg-blue-600/30 text-blue-300 px-1 rounded">
                        💼{building.jobs}
                      </span>
                    )}
                    {building.power && (
                      <span className="text-xs bg-yellow-600/30 text-yellow-300 px-1 rounded">
                        ⚡+{building.power}
                      </span>
                    )}
                    {building.powerConsumption && (
                      <span className="text-xs bg-orange-600/30 text-orange-300 px-1 rounded">
                        ⚡-{building.powerConsumption}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Building description */}
          {selectedTool !== null && typeof selectedTool === 'object' && selectedTool.category === selectedCategory && (
            <div className="mt-3 pt-2 border-t border-slate-600">
              <p className="text-sm text-slate-300">{selectedTool.description}</p>
              <div className="flex gap-4 mt-2 text-xs text-slate-400">
                <span>Size: {selectedTool.width}x{selectedTool.height}</span>
                {selectedTool.happiness && <span>Happiness: +{selectedTool.happiness}</span>}
                {selectedTool.pollution && (
                  <span className={selectedTool.pollution > 0 ? 'text-red-400' : 'text-green-400'}>
                    Pollution: {selectedTool.pollution > 0 ? '+' : ''}{selectedTool.pollution}
                  </span>
                )}
                {selectedTool.income && <span className="text-yellow-400">Income: +${selectedTool.income}/day</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
