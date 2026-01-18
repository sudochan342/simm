'use client';

import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with canvas
const Game = dynamic(() => import('@/components/Game'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🏙️</div>
        <h1 className="text-2xl font-bold text-white">Loading SimCity...</h1>
        <p className="text-slate-400 mt-2">Building your city...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return <Game />;
}
