import React from 'react';

export default function ChartSkeleton() {
  return (
    <div className="h-80 rounded-2xl border border-slate-850 bg-[#121622]/80 p-5 animate-pulse">
      <div className="h-3 w-32 rounded bg-slate-800" />
      <div className="mt-4 flex h-56 items-end gap-3">
        {[35, 55, 42, 72, 60, 88, 76].map((height, index) => (
          <div key={index} className="flex-1 rounded-t-lg bg-slate-800/80" style={{ height: `${height}%` }} />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-4 gap-3">
        <div className="h-2 rounded bg-slate-850" />
        <div className="h-2 rounded bg-slate-850" />
        <div className="h-2 rounded bg-slate-850" />
        <div className="h-2 rounded bg-slate-850" />
      </div>
    </div>
  );
}
