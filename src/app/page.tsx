'use client';

import dynamic from 'next/dynamic';
import WalletProvider from '@/components/WalletProvider';
import { SC3000_COLORS } from '@/game/types';

// Dynamic import to avoid SSR issues with canvas
const Game = dynamic(() => import('@/components/Game'), {
  ssr: false,
  loading: () => (
    <div
      className="h-screen w-screen flex items-center justify-center"
      style={{ background: SC3000_COLORS.uiBackground }}
    >
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">🏙️</div>
        <h1 className="text-2xl font-bold" style={{ color: SC3000_COLORS.uiText }}>
          Loading SimCity 3000...
        </h1>
        <p className="mt-2" style={{ color: SC3000_COLORS.uiTextDim }}>
          Preparing your city...
        </p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <WalletProvider>
      <Game />
    </WalletProvider>
  );
}
