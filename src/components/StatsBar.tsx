'use client';

import React from 'react';
import { useGameStore } from '@/store/gameStore';

interface StatsBarProps {
  onNewGame: () => void;
}

export default function StatsBar({ onNewGame }: StatsBarProps) {
  const { stats, timeOfDay, weather, gameSpeed, isPaused, setGameSpeed, togglePause, isInitialized } = useGameStore();

  const formatMoney = (amount: number): string => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount}`;
  };

  const formatTime = (time: number): string => {
    const hours = Math.floor(time);
    const minutes = Math.floor((time % 1) * 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getWeatherIcon = (): string => {
    if (weather === 'rain') return '🌧️';
    if (weather === 'cloudy') return '☁️';
    if (timeOfDay < 6 || timeOfDay > 20) return '🌙';
    return '☀️';
  };

  const getPowerPercent = (): number => {
    if (stats.powerDemand === 0) return 100;
    return Math.min(100, Math.round((stats.power / stats.powerDemand) * 100));
  };

  const getHappinessEmoji = (): string => {
    if (stats.happiness >= 80) return '😄';
    if (stats.happiness >= 60) return '🙂';
    if (stats.happiness >= 40) return '😐';
    if (stats.happiness >= 20) return '😕';
    return '😢';
  };

  return (
    <header className="bg-[#0d1117] border-b border-[#21262d] px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Logo & City Name */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-sm">🏙️</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-bold text-white leading-none">
                {isInitialized ? stats.cityName : 'SimCity'}
              </h1>
              {isInitialized && (
                <span className="text-[10px] text-[#8b949e]">Day {stats.day}</span>
              )}
            </div>
          </div>

          {/* Time & Weather */}
          {isInitialized && (
            <div className="flex items-center gap-2 px-3 py-1 bg-[#161b22] rounded-lg border border-[#21262d]">
              <span className="text-base">{getWeatherIcon()}</span>
              <span className="text-xs font-mono text-[#c9d1d9]">{formatTime(timeOfDay)}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        {isInitialized && (
          <div className="flex items-center gap-2">
            {/* Population */}
            <StatCard
              icon="👥"
              value={stats.population.toLocaleString()}
              label={`/ ${stats.maxPopulation.toLocaleString()}`}
              color="emerald"
            />

            {/* Money */}
            <StatCard
              icon="💵"
              value={formatMoney(stats.money)}
              label={
                <span className={stats.income - stats.expenses >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {stats.income - stats.expenses >= 0 ? '+' : ''}{formatMoney(stats.income - stats.expenses)}/d
                </span>
              }
              color="amber"
            />

            {/* Happiness */}
            <StatCard
              icon={getHappinessEmoji()}
              value={`${Math.round(stats.happiness)}%`}
              progress={stats.happiness}
              color={stats.happiness >= 60 ? 'emerald' : stats.happiness >= 40 ? 'amber' : 'red'}
            />

            {/* Power */}
            <StatCard
              icon="⚡"
              value={`${stats.power}/${stats.powerDemand}`}
              progress={getPowerPercent()}
              color={getPowerPercent() >= 100 ? 'cyan' : getPowerPercent() >= 50 ? 'amber' : 'red'}
            />

            {/* Jobs */}
            <StatCard
              icon="💼"
              value={stats.jobs.toString()}
              label={stats.unemployed > 0 ? (
                <span className="text-orange-400">{stats.unemployed} idle</span>
              ) : undefined}
              color="blue"
            />

            {/* Pollution */}
            <StatCard
              icon={stats.pollution > 50 ? '🏭' : '🌿'}
              value={stats.pollution.toString()}
              progress={100 - stats.pollution}
              color={stats.pollution < 30 ? 'emerald' : stats.pollution < 60 ? 'amber' : 'red'}
            />
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2">
          {isInitialized && (
            <>
              <button
                onClick={togglePause}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isPaused
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                }`}
              >
                {isPaused ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                    Play
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
                    </svg>
                    Pause
                  </>
                )}
              </button>

              <div className="flex bg-[#161b22] rounded-lg border border-[#21262d] overflow-hidden">
                {[1, 2, 3].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setGameSpeed(speed)}
                    className={`px-2.5 py-1.5 text-xs font-medium transition-all ${
                      gameSpeed === speed
                        ? 'bg-[#238636] text-white'
                        : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </>
          )}

          <button
            onClick={onNewGame}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium rounded-lg transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New City
          </button>
        </div>
      </div>
    </header>
  );
}

function StatCard({
  icon,
  value,
  label,
  progress,
  color,
}: {
  icon: string;
  value: string;
  label?: React.ReactNode;
  progress?: number;
  color: 'emerald' | 'amber' | 'red' | 'blue' | 'cyan';
}) {
  const colorMap = {
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/20',
    red: 'from-red-500/20 to-red-600/10 border-red-500/20',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20',
  };

  const progressColorMap = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    cyan: 'bg-cyan-500',
  };

  return (
    <div className={`relative px-3 py-1.5 bg-gradient-to-b ${colorMap[color]} rounded-lg border min-w-[80px]`}>
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-bold text-white">{value}</span>
      </div>
      {label && <div className="text-[10px] text-[#8b949e]">{label}</div>}
      {progress !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/20 rounded-b-lg overflow-hidden">
          <div
            className={`h-full ${progressColorMap[color]} transition-all duration-300`}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}
