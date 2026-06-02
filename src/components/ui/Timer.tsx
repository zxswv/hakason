// components/Timer.tsx
"use client";

import { useTimer } from '@/hooks/useTimer';

export default function Timer({ startAt = 60 }: { startAt?: number }) {
  const { seconds, isActive, toggle, reset } = useTimer(startAt);

  // 時間を表示形式（分:秒）に変換
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8 bg-slate-900 text-white rounded-2xl shadow-xl flex flex-col items-center gap-6">
      <div className="text-6xl font-mono font-bold tracking-widest">
        {formatTime(seconds)}
      </div>
      
      <div className="flex gap-4">
        <button 
          onClick={toggle}
          className={`px-6 py-2 rounded-full font-bold transition ${
            isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
          }`}
        >
          {isActive ? '一時停止' : 'スタート'}
        </button>
        
        <button 
          onClick={reset}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-full font-bold transition"
        >
          リセット
        </button>
      </div>
    </div>
  );
}