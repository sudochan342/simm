'use client';

import React from 'react';
import { useGameStore } from '@/store/gameStore';

export default function StatsBar() {
  const { stats, timeOfDay, weather, gameSpeed, isPaused, setGameSpeed, togglePause } = useGameStore();

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
    switch (weather) {
      case 'rain': return '🌧️';
      case 'cloudy': return '☁️';
      default:
        if (timeOfDay < 6 || timeOfDay > 20) return '🌙';
        return '☀️';
    }
  };

  const getPowerStatus = (): { color: string; text: string } => {
    const ratio = stats.powerDemand > 0 ? stats.power / stats.powerDemand : 1;
    if (ratio >= 1) return { color: 'text-green-400', text: 'OK' };
    if (ratio >= 0.5) return { color: 'text-yellow-400', text: 'LOW' };
    return { color: 'text-red-400', text: 'CRITICAL' };
  };

  const powerStatus = getPowerStatus();

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-2 flex items-center justify-between border-b border-slate-700 shadow-lg">
      {/* City Info */}
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {stats.cityName}
          </span>
          <span className="text-xs text-slate-400">Day {stats.day}</span>
        </div>

        <div className="h-8 w-px bg-slate-700" />

        {/* Time & Weather */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getWeatherIcon()}</span>
          <span className="text-sm font-mono">{formatTime(timeOfDay)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4">
        {/* Population */}
        <div className="flex flex-col items-center px-3 py-1 bg-slate-800/50 rounded-lg">
          <div className="flex items-center gap-1">
            <span className="text-lg">👥</span>
            <span className="font-bold text-green-400">
              {stats.population.toLocaleString()}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            / {stats.maxPopulation.toLocaleString()} max
          </span>
        </div>

        {/* Money */}
        <div className="flex flex-col items-center px-3 py-1 bg-slate-800/50 rounded-lg">
          <div className="flex items-center gap-1">
            <span className="text-lg">💰</span>
            <span className="font-bold text-yellow-400">{formatMoney(stats.money)}</span>
          </div>
          <span className={`text-xs ${stats.income - stats.expenses >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.income - stats.expenses >= 0 ? '+' : ''}{formatMoney(stats.income - stats.expenses)}/day
          </span>
        </div>

        {/* Happiness */}
        <div className="flex flex-col items-center px-3 py-1 bg-slate-800/50 rounded-lg">
          <div className="flex items-center gap-1">
            <span className="text-lg">{stats.happiness >= 70 ? '😊' : stats.happiness >= 40 ? '😐' : '😢'}</span>
            <span className={`font-bold ${
              stats.happiness >= 70 ? 'text-green-400' :
              stats.happiness >= 40 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {Math.round(stats.happiness)}%
            </span>
          </div>
          <span className="text-xs text-slate-400">Happiness</span>
        </div>

        {/* Power */}
        <div className="flex flex-col items-center px-3 py-1 bg-slate-800/50 rounded-lg">
          <div className="flex items-center gap-1">
            <span className="text-lg">⚡</span>
            <span className={`font-bold ${powerStatus.color}`}>
              {stats.power}/{stats.powerDemand}
            </span>
          </div>
          <span className={`text-xs ${powerStatus.color}`}>{powerStatus.text}</span>
        </div>

        {/* Jobs */}
        <div className="flex flex-col items-center px-3 py-1 bg-slate-800/50 rounded-lg">
          <div className="flex items-center gap-1">
            <span className="text-lg">💼</span>
            <span className="font-bold text-blue-400">{stats.jobs}</span>
          </div>
          <span className="text-xs text-slate-400">
            {stats.unemployed > 0 ? (
              <span className="text-orange-400">{stats.unemployed} unemployed</span>
            ) : 'Jobs'}
          </span>
        </div>

        {/* Pollution */}
        <div className="flex flex-col items-center px-3 py-1 bg-slate-800/50 rounded-lg">
          <div className="flex items-center gap-1">
            <span className="text-lg">{stats.pollution > 50 ? '🏭' : '🌿'}</span>
            <span className={`font-bold ${
              stats.pollution > 75 ? 'text-red-400' :
              stats.pollution > 50 ? 'text-orange-400' :
              stats.pollution > 25 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {stats.pollution}
            </span>
          </div>
          <span className="text-xs text-slate-400">Pollution</span>
        </div>
      </div>

      {/* Game Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={togglePause}
          className={`px-3 py-1 rounded font-bold transition-all ${
            isPaused
              ? 'bg-green-600 hover:bg-green-500'
              : 'bg-yellow-600 hover:bg-yellow-500'
          }`}
        >
          {isPaused ? '▶️ Play' : '⏸️ Pause'}
        </button>

        <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg px-2 py-1">
          {[1, 2, 3].map((speed) => (
            <button
              key={speed}
              onClick={() => setGameSpeed(speed)}
              className={`px-2 py-1 rounded text-sm font-bold transition-all ${
                gameSpeed === speed
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
