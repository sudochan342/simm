'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  ToolType,
  BuildingCategory,
  BUILDINGS,
  getBuildingsByCategory,
  SC3000_COLORS,
} from '@/game/types';

const TOOL_GROUPS = [
  {
    id: 'zones',
    label: 'Zones',
    tools: [
      { id: 'zone_r_light', label: 'R$', color: '#00aa00', title: 'Light Residential' },
      { id: 'zone_r_medium', label: 'R$$', color: '#00aa00', title: 'Medium Residential' },
      { id: 'zone_r_dense', label: 'R$$$', color: '#00aa00', title: 'Dense Residential' },
      { id: 'zone_c_light', label: 'C$', color: '#0066cc', title: 'Light Commercial' },
      { id: 'zone_c_medium', label: 'C$$', color: '#0066cc', title: 'Medium Commercial' },
      { id: 'zone_c_dense', label: 'C$$$', color: '#0066cc', title: 'Dense Commercial' },
      { id: 'zone_i_light', label: 'I$', color: '#cccc00', title: 'Light Industrial' },
      { id: 'zone_i_medium', label: 'I$$', color: '#cccc00', title: 'Medium Industrial' },
      { id: 'zone_i_dense', label: 'I$$$', color: '#cccc00', title: 'Dense Industrial' },
    ],
  },
  {
    id: 'infrastructure',
    label: 'Roads & Utilities',
    tools: [
      { id: 'road', label: '🛤️', title: 'Road ($10)' },
      { id: 'highway', label: '🛣️', title: 'Highway ($100)' },
      { id: 'rail', label: '🚃', title: 'Rail ($50)' },
      { id: 'power_line', label: '⚡', title: 'Power Line ($5)' },
      { id: 'water_pipe', label: '💧', title: 'Water Pipe ($5)' },
    ],
  },
];

const BUILDING_CATEGORIES: { id: BuildingCategory; label: string; icon: string }[] = [
  { id: 'power', label: 'Power', icon: '🔌' },
  { id: 'water', label: 'Water', icon: '💧' },
  { id: 'safety', label: 'Safety', icon: '🚔' },
  { id: 'health', label: 'Health', icon: '🏥' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'recreation', label: 'Recreation', icon: '🌳' },
  { id: 'transportation', label: 'Transport', icon: '🚌' },
  { id: 'civic', label: 'Civic', icon: '🏛️' },
  { id: 'landmark', label: 'Landmarks', icon: '🗽' },
];

export default function Toolbar() {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<BuildingCategory | null>(null);

  const { selectedTool, selectTool, stats, isInitialized } = useGameStore();

  if (!isInitialized) {
    return null;
  }

  const handleToolSelect = (toolId: string) => {
    selectTool(toolId as ToolType);
    setActiveGroup(null);
    setActiveCategory(null);
  };

  const handleBuildingSelect = (buildingId: string) => {
    const building = BUILDINGS.find(b => b.id === buildingId);
    if (building) {
      selectTool(building);
      setActiveCategory(null);
    }
  };

  const availableBuildings = (category: BuildingCategory) => {
    return getBuildingsByCategory(category).filter(
      b => !b.unlockPopulation || stats.population >= b.unlockPopulation
    );
  };

  return (
    <div
      className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-1 p-2 rounded-r-lg z-10"
      style={{ background: SC3000_COLORS.uiPanel, borderRight: `2px solid ${SC3000_COLORS.uiBorder}` }}
    >
      {/* Pointer tool */}
      <ToolButton
        icon="👆"
        title="Pointer"
        isActive={selectedTool === 'pointer'}
        onClick={() => selectTool('pointer')}
      />

      {/* Bulldozer */}
      <ToolButton
        icon="🚧"
        title="Bulldoze ($10)"
        isActive={selectedTool === 'bulldoze'}
        onClick={() => selectTool('bulldoze')}
        variant="danger"
      />

      <div className="w-full h-px my-1" style={{ background: SC3000_COLORS.uiBorder }} />

      {/* Tool Groups */}
      {TOOL_GROUPS.map(group => (
        <div key={group.id} className="relative">
          <ToolButton
            icon={group.id === 'zones' ? '🏠' : '🛤️'}
            title={group.label}
            isActive={activeGroup === group.id}
            onClick={() => setActiveGroup(activeGroup === group.id ? null : group.id)}
          />

          {activeGroup === group.id && (
            <div
              className="absolute left-full top-0 ml-2 p-2 rounded-lg grid gap-1 z-20"
              style={{
                background: SC3000_COLORS.uiPanel,
                border: `2px solid ${SC3000_COLORS.uiBorder}`,
                gridTemplateColumns: group.id === 'zones' ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
              }}
            >
              {group.tools.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => handleToolSelect(tool.id)}
                  title={tool.title}
                  className={`
                    w-10 h-10 rounded flex items-center justify-center text-xs font-bold transition-all
                    ${selectedTool === tool.id ? 'ring-2 ring-white' : 'hover:brightness-110'}
                  `}
                  style={{
                    background: (tool as { color?: string }).color || SC3000_COLORS.uiBackground,
                    color: SC3000_COLORS.uiText,
                  }}
                >
                  {tool.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="w-full h-px my-1" style={{ background: SC3000_COLORS.uiBorder }} />

      {/* Building Categories */}
      {BUILDING_CATEGORIES.map(cat => (
        <div key={cat.id} className="relative">
          <ToolButton
            icon={cat.icon}
            title={cat.label}
            isActive={activeCategory === cat.id}
            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
            badge={availableBuildings(cat.id).length}
          />

          {activeCategory === cat.id && (
            <div
              className="absolute left-full top-0 ml-2 p-2 rounded-lg z-20 min-w-[200px]"
              style={{
                background: SC3000_COLORS.uiPanel,
                border: `2px solid ${SC3000_COLORS.uiBorder}`,
              }}
            >
              <div className="text-xs font-bold mb-2" style={{ color: SC3000_COLORS.uiText }}>
                {cat.label}
              </div>
              <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
                {availableBuildings(cat.id).map(building => {
                  const canAfford = stats.money >= building.cost;
                  const isSelected = typeof selectedTool === 'object' && selectedTool?.id === building.id;

                  return (
                    <button
                      key={building.id}
                      onClick={() => handleBuildingSelect(building.id)}
                      disabled={!canAfford}
                      className={`
                        flex items-center gap-2 p-2 rounded text-left transition-all
                        ${isSelected ? 'ring-2 ring-white' : ''}
                        ${canAfford ? 'hover:brightness-110' : 'opacity-50 cursor-not-allowed'}
                      `}
                      style={{ background: SC3000_COLORS.uiBackground }}
                    >
                      <div className="flex-1">
                        <div className="text-xs font-medium" style={{ color: SC3000_COLORS.uiText }}>
                          {building.name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px]" style={{ color: SC3000_COLORS.uiTextDim }}>
                          <span style={{ color: canAfford ? '#00ff00' : '#ff0000' }}>
                            ${building.cost.toLocaleString()}
                          </span>
                          {building.power > 0 && <span style={{ color: '#ffcc00' }}>⚡+{building.power}</span>}
                          {building.power < 0 && <span style={{ color: '#ff6600' }}>⚡{building.power}</span>}
                          <span>{building.width}x{building.height}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Show locked buildings */}
                {getBuildingsByCategory(cat.id)
                  .filter(b => b.unlockPopulation && stats.population < b.unlockPopulation)
                  .map(building => (
                    <div
                      key={building.id}
                      className="flex items-center gap-2 p-2 rounded opacity-40"
                      style={{ background: SC3000_COLORS.uiBackground }}
                    >
                      <div className="flex-1">
                        <div className="text-xs font-medium" style={{ color: SC3000_COLORS.uiTextDim }}>
                          🔒 {building.name}
                        </div>
                        <div className="text-[10px]" style={{ color: SC3000_COLORS.uiTextDim }}>
                          Unlock at {building.unlockPopulation?.toLocaleString()} pop
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ToolButton({
  icon,
  title,
  isActive,
  onClick,
  variant = 'default',
  badge,
}: {
  icon: string;
  title: string;
  isActive: boolean;
  onClick: () => void;
  variant?: 'default' | 'danger';
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        relative w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all
        ${isActive ? '' : 'hover:brightness-125'}
      `}
      style={{
        background: isActive
          ? variant === 'danger' ? '#cc3333' : SC3000_COLORS.uiHighlight
          : SC3000_COLORS.uiBackground,
        boxShadow: isActive ? `0 0 0 2px ${variant === 'danger' ? '#ff6666' : SC3000_COLORS.uiHighlight}` : undefined,
      }}
    >
      {icon}
      {badge !== undefined && badge > 0 && (
        <span
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center"
          style={{ background: SC3000_COLORS.uiHighlight, color: SC3000_COLORS.uiText }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
