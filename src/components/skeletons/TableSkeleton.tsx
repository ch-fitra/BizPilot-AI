import React from 'react';

export default function TableSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-850 bg-[#0b0e16] overflow-hidden animate-pulse">
      <div className="grid grid-cols-4 gap-4 border-b border-slate-850 bg-[#121622] p-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-3 rounded bg-slate-800" />
        ))}
      </div>
      <div className="divide-y divide-slate-900">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="grid grid-cols-4 gap-4 p-4">
            <div className="h-3 rounded bg-slate-800" />
            <div className="h-3 rounded bg-slate-850" />
            <div className="h-3 rounded bg-slate-850" />
            <div className="h-3 rounded bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
