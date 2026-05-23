import React from 'react';

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-2xl border border-slate-850 bg-[#121622]/70 p-6">
        <div className="h-4 w-44 rounded bg-slate-800" />
        <div className="mt-3 h-8 w-72 max-w-full rounded bg-slate-850" />
        <div className="mt-3 h-3 w-full max-w-xl rounded bg-slate-900" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((card) => (
          <div key={card} className="h-32 rounded-2xl border border-slate-850 bg-[#121622]/80 p-5">
            <div className="h-3 w-28 rounded bg-slate-800" />
            <div className="mt-5 h-6 w-20 rounded bg-slate-850" />
            <div className="mt-5 h-3 w-36 rounded bg-slate-900" />
          </div>
        ))}
      </div>
      <div className="h-72 rounded-2xl border border-slate-850 bg-[#121622]/60" />
    </div>
  );
}
