'use client';

import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { SC3000_COLORS } from '@/game/types';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BudgetModal({ isOpen, onClose }: BudgetModalProps) {
  const { budget, setBudget, stats } = useGameStore();

  if (!isOpen) return null;

  const formatMoney = (amount: number): string => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.8)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl mx-4 rounded-xl overflow-hidden"
        style={{
          background: SC3000_COLORS.uiPanel,
          border: `3px solid ${SC3000_COLORS.uiBorder}`,
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: `2px solid ${SC3000_COLORS.uiBorder}` }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <h2 className="text-xl font-bold" style={{ color: SC3000_COLORS.uiText }}>
              City Budget
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded hover:brightness-110"
            style={{ color: SC3000_COLORS.uiTextDim }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Summary */}
          <div
            className="grid grid-cols-3 gap-4 p-4 rounded-lg mb-6"
            style={{ background: SC3000_COLORS.uiBackground }}
          >
            <div className="text-center">
              <div className="text-xs uppercase" style={{ color: SC3000_COLORS.uiTextDim }}>Income</div>
              <div className="text-lg font-bold" style={{ color: '#00ff00' }}>
                +{formatMoney(stats.income)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs uppercase" style={{ color: SC3000_COLORS.uiTextDim }}>Expenses</div>
              <div className="text-lg font-bold" style={{ color: '#ff4444' }}>
                -{formatMoney(stats.expenses)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs uppercase" style={{ color: SC3000_COLORS.uiTextDim }}>Net</div>
              <div
                className="text-lg font-bold"
                style={{ color: stats.income - stats.expenses >= 0 ? '#00ff00' : '#ff4444' }}
              >
                {stats.income - stats.expenses >= 0 ? '+' : ''}{formatMoney(stats.income - stats.expenses)}
              </div>
            </div>
          </div>

          {/* Tax Rates */}
          <div className="mb-6">
            <h3 className="text-sm font-bold mb-3" style={{ color: SC3000_COLORS.uiText }}>
              Tax Rates
            </h3>
            <div className="space-y-3">
              <TaxSlider
                label="Residential Tax"
                icon="🏠"
                color="#00aa00"
                value={budget.taxResidential}
                onChange={(v) => setBudget({ taxResidential: v })}
              />
              <TaxSlider
                label="Commercial Tax"
                icon="🏪"
                color="#0066cc"
                value={budget.taxCommercial}
                onChange={(v) => setBudget({ taxCommercial: v })}
              />
              <TaxSlider
                label="Industrial Tax"
                icon="🏭"
                color="#cccc00"
                value={budget.taxIndustrial}
                onChange={(v) => setBudget({ taxIndustrial: v })}
              />
            </div>
          </div>

          {/* Department Funding */}
          <div>
            <h3 className="text-sm font-bold mb-3" style={{ color: SC3000_COLORS.uiText }}>
              Department Funding
            </h3>
            <div className="space-y-3">
              <FundingSlider
                label="Police"
                icon="🚔"
                value={budget.fundingPolice}
                onChange={(v) => setBudget({ fundingPolice: v })}
              />
              <FundingSlider
                label="Fire Department"
                icon="🚒"
                value={budget.fundingFire}
                onChange={(v) => setBudget({ fundingFire: v })}
              />
              <FundingSlider
                label="Health"
                icon="🏥"
                value={budget.fundingHealth}
                onChange={(v) => setBudget({ fundingHealth: v })}
              />
              <FundingSlider
                label="Education"
                icon="🎓"
                value={budget.fundingEducation}
                onChange={(v) => setBudget({ fundingEducation: v })}
              />
              <FundingSlider
                label="Transportation"
                icon="🚌"
                value={budget.fundingTransportation}
                onChange={(v) => setBudget({ fundingTransportation: v })}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex justify-end"
          style={{ borderTop: `2px solid ${SC3000_COLORS.uiBorder}` }}
        >
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg font-medium transition-all hover:brightness-110"
            style={{ background: SC3000_COLORS.uiHighlight, color: SC3000_COLORS.uiText }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function TaxSlider({
  label,
  icon,
  color,
  value,
  onChange,
}: {
  label: string;
  icon: string;
  color: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg"
      style={{ background: SC3000_COLORS.uiBackground }}
    >
      <span className="text-xl">{icon}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs" style={{ color: SC3000_COLORS.uiText }}>{label}</span>
          <span className="text-xs font-bold" style={{ color }}>{value}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="20"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${color} ${value * 5}%, ${SC3000_COLORS.uiBorder} ${value * 5}%)`,
          }}
        />
      </div>
    </div>
  );
}

function FundingSlider({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const color = value >= 80 ? '#00ff00' : value >= 50 ? '#ffcc00' : '#ff4444';

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg"
      style={{ background: SC3000_COLORS.uiBackground }}
    >
      <span className="text-xl">{icon}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs" style={{ color: SC3000_COLORS.uiText }}>{label}</span>
          <span className="text-xs font-bold" style={{ color }}>{value}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${color} ${value}%, ${SC3000_COLORS.uiBorder} ${value}%)`,
          }}
        />
      </div>
    </div>
  );
}
