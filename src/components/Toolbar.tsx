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

// SC3000 authentic color palette for toolbar
const SC3K_UI = {
  panelDark: '#0a2040',
  panelMid: '#1a3a6a',
  panelLight: '#2a5a9a',
  border: '#4a7aba',
  borderLight: '#6a9ada',
  borderDark: '#0a1830',
  text: '#e0e8f0',
  textDim: '#8090a0',
  highlight: '#4a90d9',
  danger: '#aa3030',
  zoneRes: '#32cd32',
  zoneCom: '#4169e1',
  zoneInd: '#ffd700',
};

const TOOL_GROUPS = [
  {
    id: 'zones',
    label: 'Zones',
    icon: 'Z',
    tools: [
      { id: 'zone_r_light', label: 'R§', color: SC3K_UI.zoneRes, title: 'Light Residential ($10)' },
      { id: 'zone_r_medium', label: 'R§§', color: SC3K_UI.zoneRes, title: 'Medium Residential ($20)' },
      { id: 'zone_r_dense', label: 'R§§§', color: SC3K_UI.zoneRes, title: 'Dense Residential ($50)' },
      { id: 'zone_c_light', label: 'C§', color: SC3K_UI.zoneCom, title: 'Light Commercial ($10)' },
      { id: 'zone_c_medium', label: 'C§§', color: SC3K_UI.zoneCom, title: 'Medium Commercial ($20)' },
      { id: 'zone_c_dense', label: 'C§§§', color: SC3K_UI.zoneCom, title: 'Dense Commercial ($50)' },
      { id: 'zone_i_light', label: 'I§', color: SC3K_UI.zoneInd, title: 'Light Industrial ($10)' },
      { id: 'zone_i_medium', label: 'I§§', color: SC3K_UI.zoneInd, title: 'Medium Industrial ($20)' },
      { id: 'zone_i_dense', label: 'I§§§', color: SC3K_UI.zoneInd, title: 'Dense Industrial ($50)' },
    ],
  },
  {
    id: 'infrastructure',
    label: 'Transportation',
    icon: 'T',
    tools: [
      { id: 'road', label: 'RD', color: '#484848', title: 'Road ($10)' },
      { id: 'highway', label: 'HW', color: '#383838', title: 'Highway ($100)' },
      { id: 'rail', label: 'RL', color: '#5a5a5a', title: 'Rail ($50)' },
      { id: 'power_line', label: 'PW', color: '#ffcc00', title: 'Power Line ($5)' },
      { id: 'water_pipe', label: 'WP', color: '#4a90d9', title: 'Water Pipe ($5)' },
    ],
  },
];

const BUILDING_CATEGORIES: { id: BuildingCategory; label: string; icon: string }[] = [
  { id: 'power', label: 'Power Plants', icon: 'P' },
  { id: 'water', label: 'Water Works', icon: 'W' },
  { id: 'safety', label: 'Safety', icon: 'S' },
  { id: 'health', label: 'Health', icon: 'H' },
  { id: 'education', label: 'Education', icon: 'E' },
  { id: 'recreation', label: 'Parks', icon: 'K' },
  { id: 'transportation', label: 'Transit', icon: 'B' },
  { id: 'civic', label: 'Civic', icon: 'G' },
  { id: 'landmark', label: 'Rewards', icon: 'L' },
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
    <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-10">
      {/* SC3000 Style Panel */}
      <SC3KPanel title="TOOLS">
        {/* Pointer tool */}
        <SC3KToolButton
          label="SEL"
          title="Select/Query"
          isActive={selectedTool === 'pointer'}
          onClick={() => selectTool('pointer')}
        />

        {/* Bulldozer */}
        <SC3KToolButton
          label="BLD"
          title="Bulldoze ($10)"
          isActive={selectedTool === 'bulldoze'}
          onClick={() => selectTool('bulldoze')}
          variant="danger"
        />
      </SC3KPanel>

      <SC3KPanel title="ZONES">
        {/* Tool Groups */}
        {TOOL_GROUPS.map(group => (
          <div key={group.id} className="relative">
            <SC3KToolButton
              label={group.icon}
              title={group.label}
              isActive={activeGroup === group.id}
              onClick={() => setActiveGroup(activeGroup === group.id ? null : group.id)}
            />

            {activeGroup === group.id && (
              <SC3KPopup>
                <div className="text-[10px] font-bold mb-1 px-1" style={{ color: SC3K_UI.text }}>
                  {group.label.toUpperCase()}
                </div>
                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: group.id === 'zones' ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
                  }}
                >
                  {group.tools.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => handleToolSelect(tool.id)}
                      title={tool.title}
                      className="transition-all hover:brightness-125"
                      style={{
                        width: '36px',
                        height: '28px',
                        background: selectedTool === tool.id
                          ? SC3K_UI.highlight
                          : (tool as { color?: string }).color || SC3K_UI.panelMid,
                        border: `2px solid ${selectedTool === tool.id ? SC3K_UI.borderLight : SC3K_UI.border}`,
                        borderTopColor: selectedTool === tool.id ? SC3K_UI.borderLight : SC3K_UI.panelLight,
                        borderLeftColor: selectedTool === tool.id ? SC3K_UI.borderLight : SC3K_UI.panelLight,
                        borderBottomColor: selectedTool === tool.id ? SC3K_UI.borderDark : SC3K_UI.borderDark,
                        borderRightColor: selectedTool === tool.id ? SC3K_UI.borderDark : SC3K_UI.borderDark,
                        color: SC3K_UI.text,
                        fontSize: '9px',
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        textShadow: '1px 1px 0 #000',
                      }}
                    >
                      {tool.label}
                    </button>
                  ))}
                </div>
              </SC3KPopup>
            )}
          </div>
        ))}
      </SC3KPanel>

      <SC3KPanel title="BUILD">
        {/* Building Categories */}
        {BUILDING_CATEGORIES.map(cat => (
          <div key={cat.id} className="relative">
            <SC3KToolButton
              label={cat.icon}
              title={cat.label}
              isActive={activeCategory === cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              badge={availableBuildings(cat.id).length}
            />

            {activeCategory === cat.id && (
              <SC3KPopup wide>
                <div className="text-[10px] font-bold mb-2 px-1" style={{ color: SC3K_UI.text }}>
                  {cat.label.toUpperCase()}
                </div>
                <div className="flex flex-col gap-1 max-h-[280px] overflow-y-auto">
                  {availableBuildings(cat.id).map(building => {
                    const canAfford = stats.money >= building.cost;
                    const isSelected = typeof selectedTool === 'object' && selectedTool?.id === building.id;

                    return (
                      <button
                        key={building.id}
                        onClick={() => handleBuildingSelect(building.id)}
                        disabled={!canAfford}
                        className={`
                          flex items-center gap-2 p-1.5 transition-all text-left
                          ${canAfford ? 'hover:brightness-110' : 'opacity-50 cursor-not-allowed'}
                        `}
                        style={{
                          background: isSelected ? SC3K_UI.highlight : SC3K_UI.panelDark,
                          border: `2px solid ${isSelected ? SC3K_UI.borderLight : SC3K_UI.border}`,
                          borderTopColor: isSelected ? SC3K_UI.borderLight : SC3K_UI.panelMid,
                          borderLeftColor: isSelected ? SC3K_UI.borderLight : SC3K_UI.panelMid,
                          borderBottomColor: SC3K_UI.borderDark,
                          borderRightColor: SC3K_UI.borderDark,
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-[11px] font-bold truncate"
                            style={{ color: SC3K_UI.text, textShadow: '1px 1px 0 #000' }}
                          >
                            {building.name}
                          </div>
                          <div className="flex items-center gap-2 text-[9px]" style={{ color: SC3K_UI.textDim }}>
                            <span style={{ color: canAfford ? '#00ff00' : '#ff0000', fontWeight: 'bold' }}>
                              §{building.cost.toLocaleString()}
                            </span>
                            {building.power > 0 && <span style={{ color: '#ffcc00' }}>+{building.power}MW</span>}
                            {building.power < 0 && <span style={{ color: '#ff6600' }}>{building.power}MW</span>}
                            <span>{building.width}×{building.height}</span>
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
                        className="flex items-center gap-2 p-1.5 opacity-40"
                        style={{
                          background: SC3K_UI.panelDark,
                          border: `2px solid ${SC3K_UI.border}`,
                        }}
                      >
                        <div className="flex-1">
                          <div className="text-[11px] font-bold" style={{ color: SC3K_UI.textDim }}>
                            🔒 {building.name}
                          </div>
                          <div className="text-[9px]" style={{ color: SC3K_UI.textDim }}>
                            Unlock: {building.unlockPopulation?.toLocaleString()} pop
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </SC3KPopup>
            )}
          </div>
        ))}
      </SC3KPanel>
    </div>
  );
}

// SC3000 Style Panel Component
function SC3KPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col gap-0.5 p-1"
      style={{
        background: `linear-gradient(180deg, ${SC3K_UI.panelMid} 0%, ${SC3K_UI.panelDark} 100%)`,
        border: `3px solid ${SC3K_UI.border}`,
        borderTopColor: SC3K_UI.panelLight,
        borderLeftColor: SC3K_UI.panelLight,
        borderBottomColor: SC3K_UI.borderDark,
        borderRightColor: SC3K_UI.borderDark,
        boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.1), 2px 2px 4px rgba(0,0,0,0.5)',
      }}
    >
      <div
        className="text-[8px] font-bold text-center mb-0.5 pb-0.5"
        style={{
          color: SC3K_UI.text,
          borderBottom: `1px solid ${SC3K_UI.border}`,
          textShadow: '1px 1px 0 #000',
          letterSpacing: '1px',
        }}
      >
        {title}
      </div>
      <div className="flex flex-col gap-0.5">
        {children}
      </div>
    </div>
  );
}

// SC3000 Style Popup
function SC3KPopup({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div
      className="absolute left-full top-0 ml-2 p-2 z-20"
      style={{
        minWidth: wide ? '180px' : '130px',
        background: `linear-gradient(180deg, ${SC3K_UI.panelMid} 0%, ${SC3K_UI.panelDark} 100%)`,
        border: `3px solid ${SC3K_UI.border}`,
        borderTopColor: SC3K_UI.panelLight,
        borderLeftColor: SC3K_UI.panelLight,
        borderBottomColor: SC3K_UI.borderDark,
        borderRightColor: SC3K_UI.borderDark,
        boxShadow: '3px 3px 8px rgba(0,0,0,0.6)',
      }}
    >
      {children}
    </div>
  );
}

// SC3000 Style Tool Button
function SC3KToolButton({
  label,
  title,
  isActive,
  onClick,
  variant = 'default',
  badge,
}: {
  label: string;
  title: string;
  isActive: boolean;
  onClick: () => void;
  variant?: 'default' | 'danger';
  badge?: number;
}) {
  const bgColor = isActive
    ? variant === 'danger' ? SC3K_UI.danger : SC3K_UI.highlight
    : SC3K_UI.panelDark;

  return (
    <button
      onClick={onClick}
      title={title}
      className="relative transition-all hover:brightness-125"
      style={{
        width: '32px',
        height: '28px',
        background: bgColor,
        border: `2px solid ${isActive ? SC3K_UI.borderLight : SC3K_UI.border}`,
        borderTopColor: isActive ? SC3K_UI.borderLight : SC3K_UI.panelMid,
        borderLeftColor: isActive ? SC3K_UI.borderLight : SC3K_UI.panelMid,
        borderBottomColor: SC3K_UI.borderDark,
        borderRightColor: SC3K_UI.borderDark,
        color: SC3K_UI.text,
        fontSize: '11px',
        fontWeight: 'bold',
        fontFamily: 'monospace',
        textShadow: '1px 1px 0 #000',
        boxShadow: isActive ? 'inset 0 0 3px rgba(255,255,255,0.3)' : 'none',
      }}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center"
          style={{
            width: '12px',
            height: '12px',
            background: SC3K_UI.highlight,
            border: `1px solid ${SC3K_UI.borderLight}`,
            color: SC3K_UI.text,
            fontSize: '8px',
            fontWeight: 'bold',
            borderRadius: '2px',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
