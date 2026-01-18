'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { BuildingCategory, BuildingType, BUILDING_TYPES, getCategoryColor } from '@/game/types';

const CATEGORIES: { id: BuildingCategory; name: string; icon: string }[] = [
  { id: 'residential', name: 'Homes', icon: '🏠' },
  { id: 'commercial', name: 'Shops', icon: '🏪' },
  { id: 'industrial', name: 'Industry', icon: '🏭' },
  { id: 'road', name: 'Roads', icon: '🛤️' },
  { id: 'park', name: 'Parks', icon: '🌳' },
  { id: 'utility', name: 'Services', icon: '⚡' },
  { id: 'special', name: 'Landmarks', icon: '🏛️' },
];

export default function BuildingToolbar() {
  const [selectedCategory, setSelectedCategory] = useState<BuildingCategory | null>(null);

  const { selectedTool, selectTool, stats, toggleGrid, showGrid, saveGame, isInitialized } = useGameStore();

  const availableBuildings = BUILDING_TYPES.filter(
    (b) => !b.unlockPopulation || stats.population >= b.unlockPopulation
  );

  const lockedBuildings = BUILDING_TYPES.filter(
    (b) => b.unlockPopulation && stats.population < b.unlockPopulation
  );

  const getBuildingsByCategory = (category: BuildingCategory): BuildingType[] => {
    return availableBuildings.filter((b) => b.category === category);
  };

  const handleCategoryClick = (category: BuildingCategory) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const handleBuildingSelect = (building: BuildingType) => {
    selectTool(building);
  };

  const formatCost = (cost: number): string => {
    if (cost >= 1000) return `$${(cost / 1000).toFixed(0)}K`;
    return `$${cost}`;
  };

  const handleSave = () => {
    const saveData = saveGame();
    localStorage.setItem('simcity_save', saveData);
  };

  const handleLoad = () => {
    const saveData = localStorage.getItem('simcity_save');
    if (saveData) {
      const store = useGameStore.getState();
      store.loadGame(saveData);
    }
  };

  if (!isInitialized) {
    return (
      <div className="bg-[#0d1117] border-t border-[#21262d] h-20 flex items-center justify-center">
        <span className="text-[#8b949e] text-sm">Start a new city to begin building</span>
      </div>
    );
  }

  return (
    <div className="bg-[#0d1117] border-t border-[#21262d]">
      {/* Main toolbar */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Tool buttons */}
        <div className="flex items-center gap-1">
          <ToolButton
            icon="👆"
            label="Select"
            isActive={selectedTool === 'select'}
            onClick={() => selectTool('select')}
          />
          <ToolButton
            icon="🚧"
            label="Bulldoze"
            isActive={selectedTool === 'bulldoze'}
            onClick={() => selectTool('bulldoze')}
            variant="danger"
          />
        </div>

        <div className="w-px h-10 bg-[#30363d]" />

        {/* Category buttons */}
        <div className="flex items-center gap-1">
          {CATEGORIES.map((cat) => {
            const buildings = getBuildingsByCategory(cat.id);
            const isSelected = selectedCategory === cat.id;
            const isToolFromCategory =
              selectedTool !== null && typeof selectedTool === 'object' && selectedTool.category === cat.id;
            const hasBuildings = buildings.length > 0;

            return (
              <button
                key={cat.id}
                onClick={() => hasBuildings && handleCategoryClick(cat.id)}
                disabled={!hasBuildings}
                className={`
                  relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all
                  ${isSelected ? 'bg-[#21262d] scale-105' : ''}
                  ${hasBuildings ? 'hover:bg-[#161b22] cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                `}
                style={{
                  boxShadow: isToolFromCategory ? `0 0 0 2px ${getCategoryColor(cat.id)}` : undefined,
                }}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="text-[10px] text-[#8b949e] mt-0.5">{cat.name}</span>
                {buildings.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#238636] rounded-full text-[9px] text-white flex items-center justify-center">
                    {buildings.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        {/* Selected tool display */}
        {selectedTool !== null && typeof selectedTool === 'object' && (
          <div className="flex items-center gap-3 px-4 py-2 bg-[#161b22] rounded-xl border border-[#30363d]">
            <span className="text-2xl">{selectedTool.emoji}</span>
            <div>
              <div className="text-sm font-medium text-white">{selectedTool.name}</div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${stats.money >= selectedTool.cost ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCost(selectedTool.cost)}
                </span>
                {selectedTool.width > 1 || selectedTool.height > 1 ? (
                  <span className="text-[10px] text-[#8b949e]">{selectedTool.width}x{selectedTool.height}</span>
                ) : null}
              </div>
            </div>
          </div>
        )}

        <div className="w-px h-10 bg-[#30363d]" />

        {/* Utility buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleGrid}
            className={`p-2.5 rounded-lg transition-all ${
              showGrid ? 'bg-[#238636] text-white' : 'bg-[#21262d] text-[#8b949e] hover:text-white'
            }`}
            title="Toggle Grid (G)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16M6 4v16M12 4v16M18 4v16" />
            </svg>
          </button>
          <button
            onClick={handleSave}
            className="p-2.5 rounded-lg bg-[#21262d] text-[#8b949e] hover:text-white hover:bg-[#30363d] transition-all"
            title="Save Game"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </button>
          <button
            onClick={handleLoad}
            className="p-2.5 rounded-lg bg-[#21262d] text-[#8b949e] hover:text-white hover:bg-[#30363d] transition-all"
            title="Load Game"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Building selection panel */}
      {selectedCategory && (
        <div className="border-t border-[#21262d] bg-[#161b22]">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{CATEGORIES.find(c => c.id === selectedCategory)?.icon}</span>
                <h3 className="text-sm font-semibold text-white">
                  {CATEGORIES.find(c => c.id === selectedCategory)?.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-[#8b949e] hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {getBuildingsByCategory(selectedCategory).map((building) => {
                const canAfford = stats.money >= building.cost;
                const isSelected = selectedTool !== null && typeof selectedTool === 'object' && selectedTool.id === building.id;

                return (
                  <button
                    key={building.id}
                    onClick={() => handleBuildingSelect(building)}
                    disabled={!canAfford}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg border transition-all min-w-[180px]
                      ${isSelected
                        ? 'bg-[#238636]/20 border-[#238636] ring-1 ring-[#238636]'
                        : canAfford
                          ? 'bg-[#0d1117] border-[#30363d] hover:border-[#8b949e] hover:bg-[#21262d]'
                          : 'bg-[#0d1117] border-[#21262d] opacity-50 cursor-not-allowed'
                      }
                    `}
                  >
                    <span className="text-2xl">{building.emoji}</span>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-white">{building.name}</div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className={canAfford ? 'text-emerald-400' : 'text-red-400'}>
                          {formatCost(building.cost)}
                        </span>
                        {building.population && (
                          <span className="text-[#8b949e]">👥 {building.population}</span>
                        )}
                        {building.jobs && (
                          <span className="text-[#8b949e]">💼 {building.jobs}</span>
                        )}
                        {building.power && (
                          <span className="text-cyan-400">⚡+{building.power}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Show locked buildings */}
              {lockedBuildings.filter(b => b.category === selectedCategory).map((building) => (
                <div
                  key={building.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[#21262d] bg-[#0d1117] opacity-40 min-w-[180px]"
                >
                  <span className="text-2xl grayscale">🔒</span>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-[#8b949e]">{building.name}</div>
                    <div className="text-[10px] text-[#6e7681]">
                      Unlock at {building.unlockPopulation?.toLocaleString()} pop
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Building info */}
            {selectedTool !== null && typeof selectedTool === 'object' && selectedTool.category === selectedCategory && (
              <div className="mt-3 pt-3 border-t border-[#30363d]">
                <p className="text-xs text-[#8b949e] mb-2">{selectedTool.description}</p>
                <div className="flex flex-wrap gap-3 text-[10px] text-[#8b949e]">
                  <span>Size: {selectedTool.width}x{selectedTool.height}</span>
                  {selectedTool.happiness && (
                    <span className={selectedTool.happiness > 0 ? 'text-emerald-400' : 'text-red-400'}>
                      Happiness: {selectedTool.happiness > 0 ? '+' : ''}{selectedTool.happiness}
                    </span>
                  )}
                  {selectedTool.pollution && (
                    <span className={selectedTool.pollution > 0 ? 'text-red-400' : 'text-emerald-400'}>
                      Pollution: {selectedTool.pollution > 0 ? '+' : ''}{selectedTool.pollution}
                    </span>
                  )}
                  {selectedTool.income && (
                    <span className="text-amber-400">Income: +${selectedTool.income}/day</span>
                  )}
                  {selectedTool.powerConsumption && (
                    <span className="text-orange-400">Power: -{selectedTool.powerConsumption}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ToolButton({
  icon,
  label,
  isActive,
  onClick,
  variant = 'default',
}: {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
  variant?: 'default' | 'danger';
}) {
  const baseClasses = 'flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all';
  const activeClasses = variant === 'danger'
    ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/30'
    : 'bg-[#238636]/20 text-emerald-400 ring-2 ring-[#238636]/30';
  const inactiveClasses = 'bg-[#21262d] text-[#8b949e] hover:text-white hover:bg-[#30363d]';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] mt-0.5">{label}</span>
    </button>
  );
}
