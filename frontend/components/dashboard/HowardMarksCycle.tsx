"use client";

interface HowardMarksData {
  position: number;
  zone: string;
  zone_name: string;
  zone_description: string;
  action: string;
  action_color: string;
  key_insight: string;
}

interface Props {
  data: HowardMarksData;
  compact?: boolean;
}

export default function HowardMarksCycle({ data, compact = false }: Props) {
  const getZoneColor = (zone: string): string => {
    switch (zone) {
      case 'extreme_fear': return '#10b981';
      case 'fear': return '#22c55e';
      case 'neutral': return '#3b82f6';
      case 'greed': return '#f59e0b';
      case 'extreme_greed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const zoneColor = getZoneColor(data.zone);
  const pendulumAngle = (data.position / 100) * 60;

  if (compact) {
    return (
      <div className="p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-gray-500">Howard Marks</span>
          <span
            className="text-[10px] px-2 py-0.5 rounded"
            style={{ backgroundColor: `${data.action_color}20`, color: data.action_color }}
          >
            {data.action}
          </span>
        </div>
        <div className="text-sm font-bold text-white mb-1">{data.zone_name}</div>
        <div className="relative h-3 bg-gradient-to-r from-green-500 via-blue-500 to-red-500 rounded-full">
          <div
            className="absolute top-0 w-2 h-3 bg-white rounded-full shadow-lg transition-all"
            style={{ left: `${(data.position + 100) / 2}%`, transform: 'translateX(-50%)' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0f] rounded-lg border border-[#27272a] p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-gray-400">HOWARD MARKS PENDULUM</h4>
        <span
          className="text-[10px] px-2 py-0.5 rounded"
          style={{ backgroundColor: `${zoneColor}20`, color: zoneColor }}
        >
          {data.zone_name}
        </span>
      </div>

      <div className="flex justify-center mb-4">
        <div className="relative w-48 h-32">
          <svg viewBox="0 0 200 110" className="w-full h-full">
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#27272a"
              strokeWidth="20"
            />

            <defs>
              <linearGradient id="pendulumGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="25%" stopColor="#4ade80" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="75%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="url(#pendulumGradient)"
              strokeWidth="16"
              strokeOpacity="0.4"
            />

            <g transform={`rotate(${pendulumAngle} 100 100)`}>
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="30"
                stroke={zoneColor}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="100" cy="30" r="10" fill={zoneColor} />
            </g>

            <text x="15" y="108" className="text-[8px] fill-green-400">FEAR</text>
            <text x="165" y="108" className="text-[8px] fill-red-400">GREED</text>
          </svg>
        </div>
      </div>

      <div className="text-center mb-3">
        <div className="text-2xl font-bold" style={{ color: zoneColor }}>
          {data.position > 0 ? '+' : ''}{data.position}
        </div>
        <div className="text-[10px] text-gray-500">Sentiment Position</div>
      </div>

      <div
        className="p-2 rounded text-center mb-3"
        style={{ backgroundColor: `${data.action_color}10`, borderColor: `${data.action_color}30` }}
      >
        <div className="text-xs font-bold" style={{ color: data.action_color }}>
          {data.action}
        </div>
        <div className="text-[10px] text-gray-400 mt-1">{data.zone_description}</div>
      </div>

      <div className="text-[10px] text-gray-500 italic text-center">
        &quot;{data.key_insight}&quot;
      </div>
    </div>
  );
}
