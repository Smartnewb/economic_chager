"use client";

import { PMIData } from "@/store/economyStore";

// Get PMI status color
const getPMIColor = (value: number) => {
    if (value >= 55) return { bg: "bg-green-500", text: "text-green-400", label: "Strong Expansion" };
    if (value >= 50) return { bg: "bg-lime-500", text: "text-lime-400", label: "Expansion" };
    if (value >= 47) return { bg: "bg-yellow-500", text: "text-yellow-400", label: "Mild Contraction" };
    if (value >= 45) return { bg: "bg-orange-500", text: "text-orange-400", label: "Contraction" };
    return { bg: "bg-red-500", text: "text-red-400", label: "Severe Contraction" };
};

// Get surprise color
const getSurpriseColor = (surprise: number) => {
    if (surprise > 1) return "text-green-400"; // Big beat
    if (surprise > 0) return "text-lime-400"; // Small beat
    if (surprise < -1) return "text-red-400"; // Big miss
    if (surprise < 0) return "text-orange-400"; // Small miss
    return "text-gray-400"; // In line
};

// Single PMI Card with gauge
const PMICard = ({ data }: { data: PMIData }) => {
    const colors = getPMIColor(data.value);
    const surpriseColor = getSurpriseColor(data.surprise);

    // Calculate gauge rotation (30-70 range mapped to -90 to 90 degrees)
    const clampedValue = Math.max(30, Math.min(70, data.value));
    const rotation = ((clampedValue - 30) / 40) * 180 - 90;

    return (
        <div className="p-4 bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{data.flag}</span>
                    <div>
                        <h4 className="font-bold text-white text-sm">{data.country}</h4>
                        <p className="text-xs text-gray-500">{data.shortName}</p>
                    </div>
                </div>
                <div className={`px-2 py-0.5 rounded text-xs font-medium ${data.isExpansion ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {data.isExpansion ? "📈 Expansion" : "📉 Contraction"}
                </div>
            </div>

            {/* Gauge */}
            <div className="relative h-24 mb-3">
                {/* Semicircle background */}
                <svg viewBox="0 0 100 60" className="w-full h-full">
                    {/* Background arc */}
                    <path
                        d="M 10 55 A 40 40 0 0 1 90 55"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="8"
                        strokeLinecap="round"
                    />
                    {/* Contraction zone (red) */}
                    <path
                        d="M 10 55 A 40 40 0 0 1 50 15"
                        fill="none"
                        stroke="rgba(239,68,68,0.3)"
                        strokeWidth="8"
                        strokeLinecap="round"
                    />
                    {/* Expansion zone (green) */}
                    <path
                        d="M 50 15 A 40 40 0 0 1 90 55"
                        fill="none"
                        stroke="rgba(34,197,94,0.3)"
                        strokeWidth="8"
                        strokeLinecap="round"
                    />
                    {/* 50 marker */}
                    <line x1="50" y1="15" x2="50" y2="22" stroke="white" strokeWidth="2" />
                    <text x="50" y="12" textAnchor="middle" fill="#9ca3af" fontSize="6">50</text>

                    {/* Needle */}
                    <g transform={`rotate(${rotation}, 50, 55)`}>
                        <line
                            x1="50"
                            y1="55"
                            x2="50"
                            y2="22"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                        <circle cx="50" cy="55" r="4" fill="white" />
                    </g>
                </svg>

                {/* Value display */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                    <div className={`text-2xl font-black ${colors.text}`}>
                        {data.value.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">{colors.label}</div>
                </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-white/5 rounded">
                    <div className="text-gray-500">Previous</div>
                    <div className="text-white font-medium">{data.previousValue.toFixed(1)}</div>
                </div>
                <div className="text-center p-2 bg-white/5 rounded">
                    <div className="text-gray-500">Consensus</div>
                    <div className="text-white font-medium">{data.consensus.toFixed(1)}</div>
                </div>
                <div className="text-center p-2 bg-white/5 rounded">
                    <div className="text-gray-500">Surprise</div>
                    <div className={`font-medium ${surpriseColor}`}>
                        {data.surprise > 0 ? "+" : ""}{data.surprise.toFixed(1)}
                    </div>
                </div>
            </div>

            {/* Trend indicator */}
            <div className="mt-3 flex items-center justify-center gap-2">
                <span className={`text-sm ${
                    data.trend === "improving" ? "text-green-400" :
                    data.trend === "worsening" ? "text-red-400" : "text-gray-400"
                }`}>
                    {data.trend === "improving" && "↗️"}
                    {data.trend === "worsening" && "↘️"}
                    {data.trend === "stable" && "➡️"}
                </span>
                <span className="text-xs text-gray-400 capitalize">{data.trend}</span>
            </div>
        </div>
    );
};

// Main PMI Gauge component
interface PMIGaugeProps {
    data: PMIData[];
}

export default function PMIGauge({ data }: PMIGaugeProps) {
    // Sort by value descending (strongest to weakest)
    const sortedData = [...data].sort((a, b) => b.value - a.value);

    // Calculate global average
    const avgPMI = data.reduce((sum, d) => sum + d.value, 0) / data.length;
    const globalColor = getPMIColor(avgPMI);

    // Count expansions vs contractions
    const expansions = data.filter((d) => d.isExpansion).length;
    const contractions = data.length - expansions;

    return (
        <div className="space-y-6">
            {/* Global Overview */}
            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            🌡️ 경기 온도계 (PMI)
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                            제조업 구매관리자지수 - 50 이상이면 경기 확장
                        </p>
                    </div>
                    <div className="text-right">
                        <div className={`text-3xl font-black ${globalColor.text}`}>
                            {avgPMI.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-400">Global Avg</div>
                    </div>
                </div>

                {/* Expansion vs Contraction bar */}
                <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-green-400">{expansions} Expanding</span>
                        <span className="text-red-400">{contractions} Contracting</span>
                    </div>
                    <div className="h-2 bg-red-500/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${(expansions / data.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* PMI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedData.map((pmi) => (
                    <PMICard key={pmi.countryCode} data={pmi} />
                ))}
            </div>

            {/* Interpretation Guide */}
            <div className="p-4 bg-black/30 rounded-xl border border-white/10">
                <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    📖 PMI 해석 가이드
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                    <div className="p-2 bg-green-500/10 rounded text-center">
                        <div className="text-green-400 font-bold">55+</div>
                        <div className="text-gray-400">강한 확장</div>
                    </div>
                    <div className="p-2 bg-lime-500/10 rounded text-center">
                        <div className="text-lime-400 font-bold">50-55</div>
                        <div className="text-gray-400">완만한 확장</div>
                    </div>
                    <div className="p-2 bg-yellow-500/10 rounded text-center">
                        <div className="text-yellow-400 font-bold">47-50</div>
                        <div className="text-gray-400">약한 수축</div>
                    </div>
                    <div className="p-2 bg-orange-500/10 rounded text-center">
                        <div className="text-orange-400 font-bold">45-47</div>
                        <div className="text-gray-400">수축 경고</div>
                    </div>
                    <div className="p-2 bg-red-500/10 rounded text-center">
                        <div className="text-red-400 font-bold">&lt;45</div>
                        <div className="text-gray-400">심각한 수축</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
