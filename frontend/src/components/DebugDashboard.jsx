// File: dojo-jam/frontend/src/components/DebugDashboard.jsx
import React from 'react';
import { useRaceState } from '../hooks/useRaceState';

const DebugDashboard = () => {
  const { races, knights, wagers, loading, error } = useRaceState();

  if (error) return <div className="p-4 bg-red-900 text-white">Torii Error: {error.message}</div>;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-slate-900/90 text-cyan-400 p-6 font-mono text-sm border-t border-cyan-500/30 backdrop-blur-md z-50 overflow-x-auto">

      {/* 3-Column Grid for 2K displays */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Races Column */}
        <section className="bg-black/50 p-4 border border-slate-700 rounded-lg">
          <h3 className="text-white border-b border-slate-700 pb-2 mb-3">🏆 Race Models ({races.length})</h3>
          <pre className="max-h-64 overflow-y-auto scrollbar-hide">
            {JSON.stringify(races, null, 2)}
          </pre>
        </section>

        {/* Knights Column */}
        <section className="bg-black/50 p-4 border border-slate-700 rounded-lg">
          <h3 className="text-white border-b border-slate-700 pb-2 mb-3">🏇 Knight Models ({knights.length})</h3>
          <pre className="max-h-64 overflow-y-auto scrollbar-hide">
            {JSON.stringify(knights, null, 2)}
          </pre>
        </section>

        {/* Wagers Column */}
        <section className="bg-black/50 p-4 border border-slate-700 rounded-lg">
          <h3 className="text-white border-b border-slate-700 pb-2 mb-3">💰 Wager Models ({wagers.length})</h3>
          <pre className="max-h-64 overflow-y-auto scrollbar-hide">
            {JSON.stringify(wagers, null, 2)}
          </pre>
        </section>

      </div>
    </div>
  );
};

export default DebugDashboard;