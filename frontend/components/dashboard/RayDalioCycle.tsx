"use client";

interface RayDalioData {
  short_term_cycle: {
    position: number;
    phase: string;
    phase_name: string;
    description: string;
    typical_duration?: string;
  };
  long_term_cycle: {
    position: number;
    phase: string;
    phase_name: string;
    description: string;
    typical_duration?: string;
  };
  key_insight: string;
  all_weather_allocation?: Record<string, number>;
}

interface Props {
  data: RayDalioData;
  compact?: boolean;
}

const getPhaseColor = (phase: string): string => {
  switch (phase) {
    case 'early_expansion': return '#22c55e';
    case 'late_expansion': return '#3b82f6';
    case 'early_contraction': return '#f59e0b';
    case 'late_contraction': return '#ef4444';
    case 'accumulation': return '#22c55e';
    case 'bubble': return '#f59e0b';
    case 'deleveraging': return '#ef4444';
    case 'recovery': return '#3b82f6';
    default: return '#6b7280';
  }
};

export default function RayDalioCycle({ data, compact = false }: Props) {
  const shortColor = getPhaseColor(data.short_term_cycle.phase);
  const longColor = getPhaseColor(data.long_term_cycle.phase);

  if (compact) {
    return (
      <div className="p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-gray-500">Ray Dalio</span>
          <span className="text-[10px] text-blue-400">Debt Cycles</span>
        </div>
        <div className="space-y-2">
          <div>
            <div className="text-[9px] text-gray-500">Short-term</div>
            <div className="text-xs font-bold text-white">{data.short_term_cycle.phase_name}</div>
          </div>
          <div>
            <div className="text-[9px] text-gray-500">Long-term</div>
            <div className="text-xs font-bold text-white">{data.long_term_cycle.phase_name}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0f] rounded-lg border border-[#27272a] p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-gray-400">RAY DALIO DEBT CYCLES</h4>
        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
          Economic Machine
        </span>
      </div>

      <div className="space-y-4 mb-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">Short-Term Cycle (5-8 years)</span>
            <span className="text-[10px]" style={{ color: shortColor }}>
              {data.short_term_cycle.phase_name}
            </span>
          </div>
          <div className="h-3 bg-[#1a1a20] rounded-full overflow-hidden">
            <div className="h-full flex">
              <div className="flex-1 bg-green-500/30"></div>
              <div className="flex-1 bg-blue-500/30"></div>
              <div className="flex-1 bg-yellow-500/30"></div>
              <div className="flex-1 bg-red-500/30"></div>
            </div>
          </div>
          <div className="relative h-0">
            <div
              className="absolute top-[-12px] w-3 h-3 rounded-full border-2 border-white"
              style={{
                left: `${data.short_term_cycle.position}%`,
                transform: 'translateX(-50%)',
                backgroundColor: shortColor
              }}
            />
          </div>
          <div className="flex justify-between text-[8px] text-gray-600 mt-2">
            <span>Early Expansion</span>
            <span>Late Expansion</span>
            <span>Early Contraction</span>
            <span>Late Contraction</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{data.short_term_cycle.description}</p>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">Long-Term Cycle (75-100 years)</span>
            <span className="text-[10px]" style={{ color: longColor }}>
              {data.long_term_cycle.phase_name}
            </span>
          </div>
          <div className="h-3 bg-[#1a1a20] rounded-full overflow-hidden">
            <div className="h-full flex">
              <div className="flex-1 bg-green-500/30"></div>
              <div className="flex-1 bg-blue-500/30"></div>
              <div className="flex-1 bg-yellow-500/30"></div>
              <div className="flex-1 bg-red-500/30"></div>
            </div>
          </div>
          <div className="relative h-0">
            <div
              className="absolute top-[-12px] w-3 h-3 rounded-full border-2 border-white"
              style={{
                left: `${data.long_term_cycle.position}%`,
                transform: 'translateX(-50%)',
                backgroundColor: longColor
              }}
            />
          </div>
          <div className="flex justify-between text-[8px] text-gray-600 mt-2">
            <span>Accumulation</span>
            <span>Bubble</span>
            <span>Deleveraging</span>
            <span>Recovery</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{data.long_term_cycle.description}</p>
        </div>
      </div>

      {data.all_weather_allocation && (
        <div className="mb-3">
          <div className="text-[10px] text-gray-500 mb-1">All Weather Portfolio</div>
          <div className="flex gap-1">
            {Object.entries(data.all_weather_allocation).map(([asset, pct]) => (
              <div key={asset} className="flex-1 text-center p-1 bg-[#111116] rounded">
                <div className="text-[9px] text-gray-500 truncate">{asset.replace(/_/g, ' ')}</div>
                <div className="text-xs font-bold text-white">{pct}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-[10px] text-gray-500 italic text-center">
        &quot;{data.key_insight}&quot;
      </div>
    </div>
  );
}
