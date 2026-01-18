'use client';

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useGameStore } from '@/store/gameStore';
import { SC3000_COLORS } from '@/game/types';

interface StatsBarProps {
  onNewGame: () => void;
  onBudget: () => void;
}

export default function StatsBar({ onNewGame, onBudget }: StatsBarProps) {
  const { stats, year, month, day, speed, setSpeed, isInitialized, cityName, news } = useGameStore();
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

  const latestNews = news[0];

  return (
    <header
      className="h-12 flex items-center justify-between px-3"
      style={{
        background: `linear-gradient(to bottom, ${SC3000_COLORS.uiPanel}, ${SC3000_COLORS.uiBackground})`,
        borderBottom: `2px solid ${SC3000_COLORS.uiBorder}`,
      }}
    >
      {/* Left: Logo & City Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ background: SC3000_COLORS.uiHighlight }}
          >
            🏙️
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: SC3000_COLORS.uiText }}>
              {isInitialized ? cityName : 'SimCity 3000'}
            </div>
            {isInitialized && (
              <div className="text-[10px]" style={{ color: SC3000_COLORS.uiTextDim }}>
                {getMonthName(month)} {day}, {year}
              </div>
            )}
          </div>
        </div>

        {/* Speed Controls */}
        {isInitialized && (
          <div
            className="flex items-center rounded overflow-hidden"
            style={{ background: SC3000_COLORS.uiBackground, border: `1px solid ${SC3000_COLORS.uiBorder}` }}
          >
            {[0, 1, 2, 3].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s as 0 | 1 | 2 | 3)}
                className={`px-2 py-1 text-xs font-medium transition-all ${
                  speed === s ? 'text-white' : ''
                }`}
                style={{
                  background: speed === s ? SC3000_COLORS.uiHighlight : 'transparent',
                  color: speed === s ? SC3000_COLORS.uiText : SC3000_COLORS.uiTextDim,
                }}
              >
                {s === 0 ? '⏸' : '▶'.repeat(s)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Center: Stats */}
      {isInitialized && (
        <div className="flex items-center gap-3">
          <StatPill icon="👥" value={stats.population.toLocaleString()} label="Pop" />
          <StatPill
            icon="💵"
            value={formatMoney(stats.money)}
            label={`${stats.income - stats.expenses >= 0 ? '+' : ''}${formatMoney(stats.income - stats.expenses)}/mo`}
            valueColor={stats.money < 0 ? '#ff4444' : '#00ff00'}
          />
          <StatPill
            icon="⚡"
            value={`${Math.round((stats.power / Math.max(1, stats.powerDemand)) * 100)}%`}
            label={`${stats.power}/${stats.powerDemand}`}
            valueColor={stats.power >= stats.powerDemand ? '#00ffff' : '#ff6600'}
          />
          <StatPill
            icon={stats.happiness >= 60 ? '😊' : stats.happiness >= 40 ? '😐' : '😟'}
            value={`${Math.round(stats.happiness)}%`}
            label="Happy"
            valueColor={stats.happiness >= 60 ? '#00ff00' : stats.happiness >= 40 ? '#ffcc00' : '#ff4444'}
          />
        </div>
      )}

      {/* News Ticker */}
      {isInitialized && latestNews && (
        <div
          className="flex-1 mx-4 px-3 py-1 rounded text-xs truncate"
          style={{
            background: SC3000_COLORS.uiBackground,
            color: latestNews.type === 'warning' ? '#ffcc00' : latestNews.type === 'disaster' ? '#ff4444' : SC3000_COLORS.uiText,
            maxWidth: '300px',
          }}
        >
          📰 {latestNews.title}: {latestNews.message}
        </div>
      )}

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        {isInitialized && (
          <button
            onClick={onBudget}
            className="px-3 py-1.5 rounded text-xs font-medium transition-all hover:brightness-110"
            style={{ background: SC3000_COLORS.uiBackground, color: SC3000_COLORS.uiText }}
          >
            💰 Budget
          </button>
        )}

        <button
          onClick={onNewGame}
          className="px-3 py-1.5 rounded text-xs font-medium transition-all hover:brightness-110"
          style={{ background: SC3000_COLORS.uiHighlight, color: SC3000_COLORS.uiText }}
        >
          🏗️ New City
        </button>

        {/* Wallet Button */}
        <div className="wallet-button-wrapper">
          <WalletMultiButton />
        </div>

        {connected && publicKey && (
          <div
            className="px-2 py-1 rounded text-[10px]"
            style={{ background: SC3000_COLORS.uiBackground, color: SC3000_COLORS.uiTextDim }}
          >
            {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
          </div>
        )}
      </div>
    </header>
  );
}

function StatPill({
  icon,
  value,
  label,
  valueColor = SC3000_COLORS.uiText,
}: {
  icon: string;
  value: string;
  label: string;
  valueColor?: string;
}) {
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded"
      style={{ background: SC3000_COLORS.uiBackground }}
    >
      <span className="text-sm">{icon}</span>
      <div>
        <div className="text-xs font-bold" style={{ color: valueColor }}>
          {value}
        </div>
        <div className="text-[9px]" style={{ color: SC3000_COLORS.uiTextDim }}>
          {label}
        </div>
      </div>
    </div>
  );
}
