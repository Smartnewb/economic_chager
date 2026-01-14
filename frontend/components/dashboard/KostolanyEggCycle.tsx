"use client";

interface KostolanyData {
  position: number;
  phase: string;
  phase_name: string;
  description: string;
  investor_type: string;
  action: string;
  action_color: string;
  key_insight: string;
  liquidity_score?: number;
  psychology_score?: number;
  phases?: Array<{
    name: string;
    angle_start: number;
    angle_end: number;
    color: string;
  }>;
}

interface Props {
  data: KostolanyData;
  compact?: boolean;
}

export default function KostolanyEggCycle({ data, compact = false }: Props) {
  const getPhaseColor = (phase: string): string => {
    switch (phase) {
      case 'accumulation': return '#22c55e';
      case 'markup': return '#3b82f6';
      case 'distribution': return '#ef4444';
      case 'markdown': return '#f59e0b';
      default: return '#888';
    }
  };

  const phaseColor = getPhaseColor(data.phase);
  const angle = (data.position - 90) * (Math.PI / 180);
  const radius = 55;
  const markerX = 70 + radius * Math.cos(angle);
  const markerY = 70 + radius * Math.sin(angle);

  if (compact) {
    return (
      <div className="p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-gray-500">Kostolany</span>
          <span
            className="text-[10px] px-2 py-0.5 rounded"
            style={{ backgroundColor: `${data.action_color}20`, color: data.action_color }}
          >
            {data.action}
          </span>
        </div>
        <div className="text-sm font-bold text-white mb-1">{data.phase_name}</div>
        <div className="text-[10px] text-gray-400">{data.investor_type}</div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0f] rounded-lg border border-[#27272a] p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-gray-400">KOSTOLANY EGG</h4>
        <span
          className="text-[10px] px-2 py-0.5 rounded"
          style={{ backgroundColor: `${phaseColor}20`, color: phaseColor }}
        >
          {data.phase_name}
        </span>
      </div>

      <div className="flex justify-center mb-4">
        <div className="relative w-36 h-44">
          <svg viewBox="0 0 140 180" className="w-full h-full">
            <defs>
              <clipPath id="eggClip">
                <ellipse cx="70" cy="90" rx="55" ry="70" />
              </clipPath>
            </defs>

            <g clipPath="url(#eggClip)">
              <path d="M 70 90 L 125 20 L 125 90 Z" fill="#22c55e20" />
              <path d="M 70 90 L 125 90 L 125 160 L 70 160 Z" fill="#3b82f620" />
              <path d="M 70 90 L 70 160 L 15 160 L 15 90 Z" fill="#ef444420" />
              <path d="M 70 90 L 15 90 L 15 20 L 70 20 Z" fill="#f59e0b20" />
            </g>

            <ellipse
              cx="70"
              cy="90"
              rx="55"
              ry="70"
              fill="none"
              stroke="#27272a"
              strokeWidth="2"
            />

            <text x="100" y="55" className="text-[8px] fill-green-400">A</text>
            <text x="100" y="130" className="text-[8px] fill-blue-400">B</text>
            <text x="35" y="130" className="text-[8px] fill-red-400">C</text>
            <text x="35" y="55" className="text-[8px] fill-amber-400">D</text>

            <circle
              cx={markerX}
              cy={markerY}
              r="8"
              fill={phaseColor}
              stroke="white"
              strokeWidth="2"
            />

            <text x="70" y="75" textAnchor="middle" className="text-[7px] fill-gray-500">
              Firm Hands
            </text>
            <text x="70" y="110" textAnchor="middle" className="text-[7px] fill-gray-500">
              Weak Hands
            </text>
          </svg>
        </div>
      </div>

      <div
        className="p-2 rounded text-center mb-3"
        style={{ backgroundColor: `${data.action_color}10` }}
      >
        <div className="text-xs font-bold" style={{ color: data.action_color }}>
          {data.action}
        </div>
        <div className="text-[10px] text-gray-400 mt-1">{data.investor_type}</div>
      </div>

      <div className="text-[10px] text-gray-400 text-center mb-3">
        {data.description}
      </div>

      {data.liquidity_score !== undefined && data.psychology_score !== undefined && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-2 bg-[#111116] rounded text-center">
            <div className="text-[10px] text-gray-500">Liquidity</div>
            <div className="text-sm font-bold text-cyan-400">{data.liquidity_score}</div>
          </div>
          <div className="p-2 bg-[#111116] rounded text-center">
            <div className="text-[10px] text-gray-500">Psychology</div>
            <div className="text-sm font-bold text-purple-400">{data.psychology_score}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-1 text-[8px] mb-3">
        {['accumulation', 'markup', 'distribution', 'markdown'].map((phase) => (
          <div
            key={phase}
            className={`px-1 py-1 rounded text-center capitalize ${
              phase === data.phase ? 'ring-1 ring-white/50' : ''
            }`}
            style={{
              backgroundColor: `${getPhaseColor(phase)}20`,
              color: getPhaseColor(phase)
            }}
          >
            {phase.slice(0, 4)}
          </div>
        ))}
      </div>

      <div className="text-[10px] text-gray-500 italic text-center">
        &quot;{data.key_insight}&quot;
      </div>
    </div>
  );
}
