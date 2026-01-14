"use client";

import { useEffect, useState } from 'react';
import HowardMarksCycle from './HowardMarksCycle';
import RayDalioCycle from './RayDalioCycle';
import KostolanyEggCycle from './KostolanyEggCycle';

interface CycleTheoriesData {
  howard_marks: HowardMarksData;
  ray_dalio: RayDalioData;
  kostolany: KostolanyData;
  combined_signal: {
    score: number;
    signal: string;
    signal_color: string;
    recommendation: string;
  };
  timestamp: string;
}

interface HowardMarksData {
  position: number;
  zone: string;
  zone_name: string;
  zone_description: string;
  action: string;
  action_color: string;
  key_insight: string;
}

interface RayDalioData {
  short_term_cycle: {
    position: number;
    phase: string;
    phase_name: string;
    description: string;
  };
  long_term_cycle: {
    position: number;
    phase: string;
    phase_name: string;
    description: string;
  };
  key_insight: string;
  all_weather_allocation: Record<string, number>;
}

interface KostolanyData {
  position: number;
  phase: string;
  phase_name: string;
  description: string;
  investor_type: string;
  action: string;
  action_color: string;
  key_insight: string;
  liquidity_score: number;
  psychology_score: number;
}

interface Props {
  compact?: boolean;
}

export default function CycleTheoriesPanel({ compact = false }: Props) {
  const [data, setData] = useState<CycleTheoriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTheory, setActiveTheory] = useState<'all' | 'marks' | 'dalio' | 'kostolany'>('all');

  useEffect(() => {
    fetchCycleTheories();
  }, []);

  const fetchCycleTheories = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/dashboard/cycle-theories');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch cycle theories:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#111116] border border-[#27272a] rounded-lg p-4">
        <div className="h-8 w-48 bg-gray-700 rounded animate-pulse mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-800 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[#111116] border border-[#27272a] rounded-lg p-4">
        <div className="text-gray-400 text-center py-8">Failed to load cycle theories</div>
      </div>
    );
  }

  return (
    <div className="bg-[#111116] border border-[#27272a] rounded-lg p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
            INVESTMENT CYCLE THEORIES
            <span
              className="text-[10px] px-2 py-0.5 rounded border"
              style={{
                backgroundColor: `${data.combined_signal.signal_color}20`,
                color: data.combined_signal.signal_color,
                borderColor: `${data.combined_signal.signal_color}40`
              }}
            >
              {data.combined_signal.signal}
            </span>
          </h3>
          <p className="text-[10px] text-gray-500 mt-1">{data.combined_signal.recommendation}</p>
        </div>

        {!compact && (
          <div className="flex gap-1">
            {(['all', 'marks', 'dalio', 'kostolany'] as const).map(theory => (
              <button
                key={theory}
                onClick={() => setActiveTheory(theory)}
                className={`px-3 py-1 text-[10px] rounded transition-colors ${
                  activeTheory === theory
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
              >
                {theory === 'all' ? 'All' :
                 theory === 'marks' ? 'H. Marks' :
                 theory === 'dalio' ? 'R. Dalio' : 'Kostolany'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Theory Cards */}
      {compact ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <HowardMarksCycle data={data.howard_marks} compact />
          <RayDalioCycle data={data.ray_dalio} compact />
          <KostolanyEggCycle data={data.kostolany} compact />
        </div>
      ) : (
        <div className="space-y-4">
          {(activeTheory === 'all' || activeTheory === 'marks') && (
            <HowardMarksCycle data={data.howard_marks} />
          )}
          {(activeTheory === 'all' || activeTheory === 'dalio') && (
            <RayDalioCycle data={data.ray_dalio} />
          )}
          {(activeTheory === 'all' || activeTheory === 'kostolany') && (
            <KostolanyEggCycle data={data.kostolany} />
          )}
        </div>
      )}

      {/* Combined Signal Footer */}
      <div className="mt-4 p-3 bg-[#0a0a0f] rounded border border-[#27272a] flex items-center justify-between">
        <div className="text-xs text-gray-400">Combined Signal Score</div>
        <div className="flex items-center gap-3">
          <div className="w-32 h-2 bg-[#1a1a20] rounded-full overflow-hidden">
            <div
              className="h-full transition-all"
              style={{
                width: `${Math.abs(data.combined_signal.score) + 50}%`,
                backgroundColor: data.combined_signal.signal_color
              }}
            />
          </div>
          <span
            className="text-sm font-bold"
            style={{ color: data.combined_signal.signal_color }}
          >
            {data.combined_signal.score > 0 ? '+' : ''}{data.combined_signal.score}
          </span>
        </div>
      </div>
    </div>
  );
}
