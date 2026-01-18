'use client';

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useGameStore } from '@/store/gameStore';

// Clean UI colors
const UI = {
  bg: '#1a1a2e',
  bgLight: '#252542',
  border: '#3a3a5c',
  text: '#e0e0e0',
  textDim: '#888',
  accent: '#4a90d9',
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  cyan: '#06b6d4',
};

interface StatsBarProps {
  onBudget: () => void;
}

export default function StatsBar({ onBudget }: StatsBarProps) {
  const { stats, year, month, day, speed, setSpeed, isInitialized, cityName } = useGameStore();
  const { connected, publicKey } = useWallet();

  const formatMoney = (amount: number): string => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount}`;
  };

  const getMonthName = (m: number): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[m - 1] || 'Jan';
  };

  return (
    <header
      className="h-12 flex items-center justify-between px-3"
      style={{
        background: UI.bg,
        borderBottom: `1px solid ${UI.border}`,
      }}
    >
      {/* Left: Logo & Date */}
      <div className="flex items-center gap-4">
        <div className="font-bold text-lg" style={{ color: UI.text }}>
          SIMM
        </div>

        {isInitialized && (
          <>
            <div className="text-sm" style={{ color: UI.cyan }}>
              {getMonthName(month)} {day}, {year}
            </div>

            {/* Speed Controls */}
            <div className="flex gap-0.5">
              {[0, 1, 2, 3].map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s as 0 | 1 | 2 | 3)}
                  className="px-2 py-1 text-xs rounded transition-all"
                  style={{
                    background: speed === s ? UI.accent : UI.bgLight,
                    color: speed === s ? '#fff' : UI.textDim,
                  }}
                >
                  {s === 0 ? '||' : '>'.repeat(s)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Center: Stats */}
      {isInitialized && (
        <div className="flex items-center gap-4">
          <StatBox label="POP" value={stats.population.toLocaleString()} />
          <StatBox
            label="FUNDS"
            value={formatMoney(stats.money)}
            color={stats.money < 0 ? UI.red : UI.green}
          />
          <StatBox
            label="POWER"
            value={`${Math.round((stats.power / Math.max(1, stats.powerDemand)) * 100)}%`}
            color={stats.power >= stats.powerDemand ? UI.cyan : UI.yellow}
          />
          <StatBox
            label="APPROVAL"
            value={`${Math.round(stats.happiness)}%`}
            color={stats.happiness >= 60 ? UI.green : stats.happiness >= 40 ? UI.yellow : UI.red}
          />
        </div>
      )}

      {/* Right: Wallet & Budget */}
      <div className="flex items-center gap-2">
        {isInitialized && (
          <button
            onClick={onBudget}
            className="px-3 py-1.5 text-xs font-medium rounded transition-all hover:brightness-110"
            style={{
              background: UI.bgLight,
              color: UI.text,
              border: `1px solid ${UI.border}`,
            }}
          >
            Budget
          </button>
        )}

        <div className="wallet-button-wrapper">
          <WalletMultiButton />
        </div>

        {connected && publicKey && (
          <div className="text-xs" style={{ color: UI.cyan }}>
            {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
          </div>
        )}
      </div>
    </header>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center">
      <div className="text-[10px] font-medium" style={{ color: UI.textDim }}>{label}</div>
      <div className="text-sm font-bold" style={{ color: color || UI.text }}>{value}</div>
    </div>
  );
}
