"use client";

import { useEffect, useState } from 'react';

interface CycleData {
  current_phase: string;
  phase_name: string;
  phase_color: string;
  description: string;
  confidence: number;
  cycle_position: number;
  characteristics: string[];
  sectors_favored: string[];
  sectors_avoided: string[];
  investment_strategy: string;
  all_scores: Record<string, number>;
  indicators_used: Record<string, number>;
  timestamp: string;
}

const PHASES = [
  { name: 'Recovery', position: 0, icon: '🌱' },
  { name: 'Expansion', position: 90, icon: '📈' },
  { name: 'Peak', position: 180, icon: '🏔️' },
  { name: 'Contraction', position: 270, icon: '📉' }
];

export default function MarketCycleIndicator() {
  const [data, setData] = useState<CycleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchCycleData();
  }, []);

  const fetchCycleData = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/stocks/cycle');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch cycle data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 70) return 'text-green-400';
    if (confidence >= 50) return 'text-yellow-400';
    return 'text-orange-400';
  };

  if (loading) {
    return (
      <div className="bg-[#111116] border border-[#27272a] rounded-lg p-4">
        <div className="h-8 w-48 bg-gray-700 rounded animate-pulse mb-4"></div>
        <div className="h-64 bg-gray-800 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[#111116] border border-[#27272a] rounded-lg p-4">
        <div className="text-gray-400 text-center py-8">Failed to load cycle data</div>
      </div>
    );
  }

  return (
    <div className="bg-[#111116] border border-[#27272a] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
          MARKET CYCLE POSITION
          <span
            className="text-[10px] px-2 py-0.5 rounded border"
            style={{
              backgroundColor: `${data.phase_color}20`,
              color: data.phase_color,
              borderColor: `${data.phase_color}40`
            }}
          >
            {data.phase_name.toUpperCase()}
          </span>
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Circular Cycle Diagram */}
      <div className="flex justify-center mb-6">
        <div className="relative w-64 h-64">
          {/* Background Circle */}
          <svg className="w-full h-full" viewBox="0 0 200 200">
            {/* Background gradient sections */}
            <defs>
              <linearGradient id="recoveryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="expansionGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="peakGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="contractionGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Quadrant arcs */}
            <path
              d="M 100 100 L 100 20 A 80 80 0 0 1 180 100 Z"
              fill="#22c55e"
              fillOpacity="0.15"
              stroke="#22c55e"
              strokeOpacity="0.3"
            />
            <path
              d="M 100 100 L 180 100 A 80 80 0 0 1 100 180 Z"
              fill="#3b82f6"
              fillOpacity="0.15"
              stroke="#3b82f6"
              strokeOpacity="0.3"
            />
            <path
              d="M 100 100 L 100 180 A 80 80 0 0 1 20 100 Z"
              fill="#f59e0b"
              fillOpacity="0.15"
              stroke="#f59e0b"
              strokeOpacity="0.3"
            />
            <path
              d="M 100 100 L 20 100 A 80 80 0 0 1 100 20 Z"
              fill="#ef4444"
              fillOpacity="0.15"
              stroke="#ef4444"
              strokeOpacity="0.3"
            />

            {/* Center circle */}
            <circle cx="100" cy="100" r="35" fill="#0a0a0f" stroke="#27272a" strokeWidth="2" />

            {/* Current position marker */}
            <g transform={`rotate(${data.cycle_position - 90} 100 100)`}>
              <line x1="100" y1="100" x2="100" y2="30" stroke={data.phase_color} strokeWidth="3" />
              <circle cx="100" cy="30" r="8" fill={data.phase_color} />
            </g>
          </svg>

          {/* Phase Labels */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-medium text-green-400">
            🌱 Recovery
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-medium text-blue-400">
            📈 Expansion
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-medium text-amber-400">
            🏔️ Peak
          </div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] font-medium text-red-400">
            📉 Contraction
          </div>

          {/* Center Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: data.phase_color }}>
                {data.phase_name}
              </div>
              <div className={`text-xs ${getConfidenceColor(data.confidence)}`}>
                {data.confidence}% confidence
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Probability Bars */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {Object.entries(data.all_scores).map(([phase, score]) => (
          <div key={phase} className="text-center">
            <div className="h-16 relative bg-[#0a0a0f] rounded overflow-hidden">
              <div
                className="absolute bottom-0 w-full transition-all"
                style={{
                  height: `${score}%`,
                  backgroundColor: PHASES.find(p => p.name.toLowerCase() === phase)?.position === 0 ? '#22c55e' :
                    PHASES.find(p => p.name.toLowerCase() === phase)?.position === 90 ? '#3b82f6' :
                    PHASES.find(p => p.name.toLowerCase() === phase)?.position === 180 ? '#f59e0b' : '#ef4444',
                  opacity: data.current_phase === phase ? 1 : 0.5
                }}
              />
            </div>
            <div className="text-[10px] text-gray-400 mt-1 capitalize">{phase}</div>
            <div className="text-xs font-mono text-white">{score}%</div>
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="p-3 bg-[#0a0a0f] rounded border border-[#27272a] mb-4">
        <p className="text-xs text-gray-300">{data.description}</p>
      </div>

      {showDetails && (
        <>
          {/* Characteristics */}
          <div className="mb-4">
            <h4 className="text-xs font-bold text-gray-400 mb-2">CURRENT PHASE CHARACTERISTICS</h4>
            <div className="space-y-1">
              {data.characteristics.map((char, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                  <span style={{ color: data.phase_color }}>•</span>
                  <span>{char}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sector Recommendations */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-green-500/5 border border-green-500/20 rounded">
              <h4 className="text-[10px] font-bold text-green-400 mb-2">SECTORS FAVORED</h4>
              <div className="space-y-1">
                {data.sectors_favored.map((sector, i) => (
                  <div key={i} className="text-xs text-gray-300">✓ {sector}</div>
                ))}
              </div>
            </div>
            <div className="p-3 bg-red-500/5 border border-red-500/20 rounded">
              <h4 className="text-[10px] font-bold text-red-400 mb-2">SECTORS TO AVOID</h4>
              <div className="space-y-1">
                {data.sectors_avoided.map((sector, i) => (
                  <div key={i} className="text-xs text-gray-300">✗ {sector}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Investment Strategy */}
          <div className="p-3 rounded border" style={{ backgroundColor: `${data.phase_color}10`, borderColor: `${data.phase_color}30` }}>
            <h4 className="text-[10px] font-bold text-gray-400 mb-1">INVESTMENT STRATEGY</h4>
            <p className="text-sm" style={{ color: data.phase_color }}>{data.investment_strategy}</p>
          </div>

          {/* Indicators Used */}
          <div className="mt-4">
            <h4 className="text-[10px] font-bold text-gray-400 mb-2">INDICATORS USED</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(data.indicators_used).map(([key, value]) => (
                <div key={key} className="p-2 bg-[#0a0a0f] rounded text-center">
                  <div className="text-[10px] text-gray-500 uppercase">{key.replace(/_/g, ' ')}</div>
                  <div className="text-sm font-mono text-white">{typeof value === 'number' ? value.toFixed(1) : value}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
