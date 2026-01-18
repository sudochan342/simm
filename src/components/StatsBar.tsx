'use client';

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useGameStore } from '@/store/gameStore';

// SC3000 authentic UI colors
const SC3K = {
  panelDark: '#0a2040',
  panelMid: '#1a3a6a',
  panelLight: '#2a5a9a',
  border: '#4a7aba',
  borderLight: '#6a9ada',
  borderDark: '#0a1830',
  text: '#e0e8f0',
  textDim: '#8090a0',
  highlight: '#4a90d9',
  green: '#32cd32',
  yellow: '#ffd700',
  red: '#ff4444',
  cyan: '#00d4ff',
};

interface StatsBarProps {
  onNewGame: () => void;
  onBudget: () => void;
}

export default function StatsBar({ onNewGame, onBudget }: StatsBarProps) {
  const { stats, year, month, day, speed, setSpeed, isInitialized, cityName, news } = useGameStore();
  const { connected, publicKey } = useWallet();

  const formatMoney = (amount: number): string => {
    if (amount >= 1000000) return `§${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `§${(amount / 1000).toFixed(1)}K`;
    return `§${amount}`;
  };

  const getMonthName = (m: number): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[m - 1] || 'Jan';
  };

  const latestNews = news[0];

  return (
    <header
      className="h-14 flex items-center justify-between px-2"
      style={{
        background: `linear-gradient(180deg, ${SC3K.panelMid} 0%, ${SC3K.panelDark} 100%)`,
        borderBottom: `3px solid ${SC3K.border}`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
      }}
    >
      {/* Left: Logo & City Info */}
      <div className="flex items-center gap-2">
        <SC3KInfoPanel>
          <div
            className="text-[10px] font-bold tracking-wider"
            style={{ color: SC3K.textDim }}
          >
            SIMCITY 3000
          </div>
          <div
            className="text-sm font-bold"
            style={{ color: SC3K.text, textShadow: '1px 1px 0 #000' }}
          >
            {isInitialized ? cityName : 'Web Edition'}
          </div>
        </SC3KInfoPanel>

        {isInitialized && (
          <SC3KInfoPanel>
            <div
              className="text-[10px] font-bold tracking-wider"
              style={{ color: SC3K.textDim }}
            >
              DATE
            </div>
            <div
              className="text-xs font-bold"
              style={{ color: SC3K.cyan, textShadow: '1px 1px 0 #000' }}
            >
              {getMonthName(month)} {day}, {year}
            </div>
          </SC3KInfoPanel>
        )}

        {/* Speed Controls */}
        {isInitialized && (
          <SC3KButtonGroup>
            {[0, 1, 2, 3].map(s => (
              <SC3KSpeedButton
                key={s}
                isActive={speed === s}
                onClick={() => setSpeed(s as 0 | 1 | 2 | 3)}
              >
                {s === 0 ? '||' : '>'.repeat(s)}
              </SC3KSpeedButton>
            ))}
          </SC3KButtonGroup>
        )}
      </div>

      {/* Center: Stats */}
      {isInitialized && (
        <div className="flex items-center gap-1">
          <SC3KStatBox
            label="POPULATION"
            value={stats.population.toLocaleString()}
            color={SC3K.text}
          />
          <SC3KStatBox
            label="FUNDS"
            value={formatMoney(stats.money)}
            subValue={`${stats.income - stats.expenses >= 0 ? '+' : ''}${formatMoney(stats.income - stats.expenses)}/mo`}
            color={stats.money < 0 ? SC3K.red : SC3K.green}
          />
          <SC3KStatBox
            label="POWER"
            value={`${Math.round((stats.power / Math.max(1, stats.powerDemand)) * 100)}%`}
            subValue={`${stats.power}/${stats.powerDemand}MW`}
            color={stats.power >= stats.powerDemand ? SC3K.cyan : SC3K.yellow}
          />
          <SC3KStatBox
            label="APPROVAL"
            value={`${Math.round(stats.happiness)}%`}
            color={stats.happiness >= 60 ? SC3K.green : stats.happiness >= 40 ? SC3K.yellow : SC3K.red}
          />
        </div>
      )}

      {/* News Ticker */}
      {isInitialized && latestNews && (
        <SC3KInfoPanel style={{ maxWidth: '280px', flex: 1 }}>
          <div
            className="text-[9px] font-bold tracking-wider"
            style={{ color: SC3K.textDim }}
          >
            NEWS
          </div>
          <div
            className="text-[11px] truncate"
            style={{
              color: latestNews.type === 'warning' ? SC3K.yellow : latestNews.type === 'disaster' ? SC3K.red : SC3K.text,
              textShadow: '1px 1px 0 #000',
            }}
          >
            {latestNews.title}
          </div>
        </SC3KInfoPanel>
      )}

      {/* Right: Controls */}
      <div className="flex items-center gap-1">
        {isInitialized && (
          <SC3KButton onClick={onBudget}>
            BUDGET
          </SC3KButton>
        )}

        <SC3KButton onClick={onNewGame} highlight>
          NEW CITY
        </SC3KButton>

        {/* Wallet Button */}
        <div className="wallet-button-wrapper">
          <WalletMultiButton />
        </div>

        {connected && publicKey && (
          <SC3KInfoPanel>
            <div
              className="text-[9px] font-bold tracking-wider"
              style={{ color: SC3K.textDim }}
            >
              WALLET
            </div>
            <div
              className="text-[10px] font-mono"
              style={{ color: SC3K.cyan }}
            >
              {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
            </div>
          </SC3KInfoPanel>
        )}
      </div>
    </header>
  );
}

// SC3000 Style Info Panel
function SC3KInfoPanel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      className="px-2 py-1"
      style={{
        background: SC3K.panelDark,
        border: `2px solid ${SC3K.border}`,
        borderTopColor: SC3K.panelMid,
        borderLeftColor: SC3K.panelMid,
        borderBottomColor: SC3K.borderDark,
        borderRightColor: SC3K.borderDark,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// SC3000 Style Stat Box
function SC3KStatBox({
  label,
  value,
  subValue,
  color,
}: {
  label: string;
  value: string;
  subValue?: string;
  color: string;
}) {
  return (
    <div
      className="px-2 py-1 text-center"
      style={{
        background: SC3K.panelDark,
        border: `2px solid ${SC3K.border}`,
        borderTopColor: SC3K.panelMid,
        borderLeftColor: SC3K.panelMid,
        borderBottomColor: SC3K.borderDark,
        borderRightColor: SC3K.borderDark,
        minWidth: '70px',
      }}
    >
      <div
        className="text-[8px] font-bold tracking-wider"
        style={{ color: SC3K.textDim }}
      >
        {label}
      </div>
      <div
        className="text-sm font-bold"
        style={{ color, textShadow: '1px 1px 0 #000', fontFamily: 'monospace' }}
      >
        {value}
      </div>
      {subValue && (
        <div
          className="text-[9px]"
          style={{ color: SC3K.textDim }}
        >
          {subValue}
        </div>
      )}
    </div>
  );
}

// SC3000 Style Button
function SC3KButton({
  children,
  onClick,
  highlight = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-[11px] font-bold transition-all hover:brightness-125"
      style={{
        background: highlight ? SC3K.highlight : SC3K.panelDark,
        border: `2px solid ${highlight ? SC3K.borderLight : SC3K.border}`,
        borderTopColor: highlight ? SC3K.borderLight : SC3K.panelMid,
        borderLeftColor: highlight ? SC3K.borderLight : SC3K.panelMid,
        borderBottomColor: SC3K.borderDark,
        borderRightColor: SC3K.borderDark,
        color: SC3K.text,
        textShadow: '1px 1px 0 #000',
        letterSpacing: '0.5px',
      }}
    >
      {children}
    </button>
  );
}

// SC3000 Style Button Group
function SC3KButtonGroup({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex"
      style={{
        background: SC3K.panelDark,
        border: `2px solid ${SC3K.border}`,
        borderTopColor: SC3K.panelMid,
        borderLeftColor: SC3K.panelMid,
        borderBottomColor: SC3K.borderDark,
        borderRightColor: SC3K.borderDark,
      }}
    >
      {children}
    </div>
  );
}

// SC3000 Style Speed Button
function SC3KSpeedButton({
  children,
  isActive,
  onClick,
}: {
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1 text-xs font-bold transition-all hover:brightness-125"
      style={{
        background: isActive ? SC3K.highlight : 'transparent',
        color: isActive ? SC3K.text : SC3K.textDim,
        borderRight: `1px solid ${SC3K.border}`,
        fontFamily: 'monospace',
        minWidth: '28px',
      }}
    >
      {children}
    </button>
  );
}
