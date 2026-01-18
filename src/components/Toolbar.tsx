'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  ToolType,
  BuildingCategory,
  BUILDINGS,
  getBuildingsByCategory,
} from '@/game/types';

// Clean color palette
const UI = {
  bg: '#1a1a2e',
  bgLight: '#252542',
  border: '#3a3a5c',
  text: '#e0e0e0',
  textDim: '#888',
  accent: '#4a90d9',
  zoneR: '#22c55e',
  zoneC: '#3b82f6',
  zoneI: '#eab308',
  danger: '#ef4444',
};

// Simplified tool groups - no density options
const TOOLS = {
  zones: [
    { id: 'zone_r', label: 'R', color: UI.zoneR, title: 'Residential Zone - $10', cost: 10 },
    { id: 'zone_c', label: 'C', color: UI.zoneC, title: 'Commercial Zone - $10', cost: 10 },
    { id: 'zone_i', label: 'I', color: UI.zoneI, title: 'Industrial Zone - $10', cost: 10 },
  ],
  infra: [
    { id: 'road', label: 'Road', title: 'Road - $10' },
    { id: 'power_line', label: 'Power', title: 'Power Line - $5' },
  ],
};

const BUILDING_CATS: { id: BuildingCategory; label: string }[] = [
  { id: 'power', label: 'Power' },
  { id: 'water', label: 'Water' },
  { id: 'safety', label: 'Safety' },
  { id: 'health', label: 'Health' },
  { id: 'education', label: 'Education' },
  { id: 'recreation', label: 'Parks' },
];

export default function Toolbar() {
  const [showBuildings, setShowBuildings] = useState<BuildingCategory | null>(null);
  const { selectedTool, selectTool, stats, isInitialized, zoom, setZoom } = useGameStore();

  if (!isInitialized) return null;

  const handleZone = (zoneId: string) => {
    // Convert zone_r to zone_r_light for compatibility
    selectTool(`${zoneId}_light` as ToolType);
  };

  const handleBuilding = (buildingId: string) => {
    const building = BUILDINGS.find(b => b.id === buildingId);
    if (building) {
      selectTool(building);
      setShowBuildings(null);
    }
  };

  const isZoneSelected = (zoneId: string) => {
    return typeof selectedTool === 'string' && selectedTool.startsWith(zoneId);
  };

  return (
    <div
      className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2"
      style={{ width: '140px' }}
    >
      {/* Main Tools */}
      <Panel title="Tools">
        <div className="flex gap-1">
          <ToolBtn
            label="Select"
            active={selectedTool === 'pointer'}
            onClick={() => selectTool('pointer')}
          />
          <ToolBtn
            label="Bulldoze"
            active={selectedTool === 'bulldoze'}
            onClick={() => selectTool('bulldoze')}
            variant="danger"
          />
        </div>
      </Panel>

      {/* Zones - Simple R/C/I */}
      <Panel title="Zones">
        <div className="flex gap-1">
          {TOOLS.zones.map(zone => (
            <button
              key={zone.id}
              onClick={() => handleZone(zone.id)}
              title={zone.title}
              className="flex-1 py-2 font-bold text-lg transition-all hover:brightness-110"
              style={{
                background: isZoneSelected(zone.id) ? zone.color : UI.bgLight,
                color: isZoneSelected(zone.id) ? '#fff' : zone.color,
                border: `2px solid ${zone.color}`,
                borderRadius: '4px',
              }}
            >
              {zone.label}
            </button>
          ))}
        </div>
      </Panel>

      {/* Infrastructure */}
      <Panel title="Infrastructure">
        <div className="flex flex-col gap-1">
          {TOOLS.infra.map(tool => (
            <ToolBtn
              key={tool.id}
              label={tool.label}
              title={tool.title}
              active={selectedTool === tool.id}
              onClick={() => selectTool(tool.id as ToolType)}
              fullWidth
            />
          ))}
        </div>
      </Panel>

      {/* Buildings */}
      <Panel title="Buildings">
        <div className="flex flex-col gap-1">
          {BUILDING_CATS.map(cat => {
            const buildings = getBuildingsByCategory(cat.id).filter(
              b => !b.unlockPopulation || stats.population >= b.unlockPopulation
            );

            return (
              <div key={cat.id} className="relative">
                <ToolBtn
                  label={cat.label}
                  active={showBuildings === cat.id}
                  onClick={() => setShowBuildings(showBuildings === cat.id ? null : cat.id)}
                  fullWidth
                  badge={buildings.length}
                />

                {showBuildings === cat.id && buildings.length > 0 && (
                  <div
                    className="absolute left-full top-0 ml-2 p-2 min-w-[160px] z-20"
                    style={{
                      background: UI.bg,
                      border: `1px solid ${UI.border}`,
                      borderRadius: '4px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    }}
                  >
                    {buildings.map(b => {
                      const canAfford = stats.money >= b.cost;
                      const isSelected = typeof selectedTool === 'object' && selectedTool?.id === b.id;

                      return (
                        <button
                          key={b.id}
                          onClick={() => handleBuilding(b.id)}
                          disabled={!canAfford}
                          className="w-full text-left p-2 mb-1 last:mb-0 transition-all"
                          style={{
                            background: isSelected ? UI.accent : UI.bgLight,
                            border: `1px solid ${isSelected ? UI.accent : UI.border}`,
                            borderRadius: '3px',
                            opacity: canAfford ? 1 : 0.5,
                            cursor: canAfford ? 'pointer' : 'not-allowed',
                          }}
                        >
                          <div style={{ color: UI.text, fontSize: '12px', fontWeight: 500 }}>
                            {b.name}
                          </div>
                          <div style={{ color: canAfford ? UI.zoneR : UI.danger, fontSize: '11px' }}>
                            ${b.cost.toLocaleString()}
                            {b.power > 0 && <span style={{ color: UI.zoneI, marginLeft: '8px' }}>+{b.power}MW</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: UI.bg,
        border: `1px solid ${UI.border}`,
        borderRadius: '6px',
        padding: '8px',
      }}
    >
      <div
        style={{
          color: UI.textDim,
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '6px',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function ToolBtn({
  label,
  title,
  active,
  onClick,
  variant = 'default',
  fullWidth = false,
  badge,
}: {
  label: string;
  title?: string;
  active: boolean;
  onClick: () => void;
  variant?: 'default' | 'danger';
  fullWidth?: boolean;
  badge?: number;
}) {
  const bgColor = active
    ? variant === 'danger' ? UI.danger : UI.accent
    : UI.bgLight;

  return (
    <button
      onClick={onClick}
      title={title}
      className="relative transition-all hover:brightness-110"
      style={{
        width: fullWidth ? '100%' : 'auto',
        padding: '6px 10px',
        background: bgColor,
        border: `1px solid ${active ? bgColor : UI.border}`,
        borderRadius: '4px',
        color: UI.text,
        fontSize: '11px',
        fontWeight: 500,
        textAlign: 'left',
      }}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span
          style={{
            position: 'absolute',
            right: '6px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: UI.accent,
            color: '#fff',
            fontSize: '9px',
            padding: '1px 5px',
            borderRadius: '3px',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
