"use client";

import { EconomicMetrics } from "@/store/countryStore";
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

// Metric labels for display
const METRIC_LABELS: Record<keyof EconomicMetrics, { label: string; icon: string; description: string }> = {
    currencyPower: { label: "Currency", icon: "💱", description: "FX strength vs USD" },
    marketSentiment: { label: "Market", icon: "📈", description: "Stock market performance" },
    creditRisk: { label: "Credit", icon: "🏦", description: "Bond quality & risk" },
    liquidity: { label: "Liquidity", icon: "💧", description: "Monetary policy stance" },
    inflation: { label: "Inflation", icon: "📊", description: "Price stability" },
    growth: { label: "Growth", icon: "🚀", description: "Economic outlook" },
};

// Get color based on score
const getScoreColor = (score: number): string => {
    if (score >= 80) return "#22c55e"; // Green
    if (score >= 60) return "#84cc16"; // Lime
    if (score >= 40) return "#eab308"; // Yellow
    if (score >= 20) return "#f97316"; // Orange
    return "#ef4444"; // Red
};

// Get grade color
const getGradeColor = (grade: string): string => {
    if (grade.startsWith("A")) return "#22c55e";
    if (grade.startsWith("B")) return "#84cc16";
    if (grade.startsWith("C")) return "#eab308";
    if (grade.startsWith("D")) return "#f97316";
    return "#ef4444";
};

// Custom tooltip
const CustomTooltip = ({
    active,
    payload,
}: {
    active?: boolean;
    payload?: Array<{ payload: { metric: string; value: number; fullMark: number } }>;
}) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const metricKey = Object.keys(METRIC_LABELS).find(
        (k) => METRIC_LABELS[k as keyof EconomicMetrics].label === data.metric
    ) as keyof EconomicMetrics;

    const metricInfo = metricKey ? METRIC_LABELS[metricKey] : null;

    return (
        <div className="bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
                <span>{metricInfo?.icon}</span>
                <span className="font-bold text-white">{data.metric}</span>
            </div>
            <div className="text-sm text-gray-400">{metricInfo?.description}</div>
            <div className="mt-2 flex items-center gap-2">
                <div
                    className="text-2xl font-bold"
                    style={{ color: getScoreColor(data.value) }}
                >
                    {data.value.toFixed(0)}
                </div>
                <span className="text-gray-500">/ 100</span>
            </div>
        </div>
    );
};

interface EconomicRadarChartProps {
    metrics: EconomicMetrics;
    overallScore: number;
    overallGrade: string;
    countryName: string;
    countryFlag: string;
}

export default function EconomicRadarChart({
    metrics,
    overallScore,
    overallGrade,
    countryName,
    countryFlag,
}: EconomicRadarChartProps) {
    // Transform metrics for radar chart
    const chartData = Object.entries(metrics).map(([key, value]) => ({
        metric: METRIC_LABELS[key as keyof EconomicMetrics].label,
        value: Math.round(value),
        fullMark: 100,
    }));

    const gradeColor = getGradeColor(overallGrade);
    const avgScore = Math.round(
        Object.values(metrics).reduce((sum, v) => sum + v, 0) / Object.values(metrics).length
    );

    return (
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-4xl">{countryFlag}</span>
                    <div>
                        <h3 className="text-xl font-bold text-white">{countryName}</h3>
                        <p className="text-sm text-gray-400">Economic Health Index</p>
                    </div>
                </div>
                {/* Overall Grade */}
                <div className="text-center">
                    <div
                        className="text-5xl font-black"
                        style={{ color: gradeColor }}
                    >
                        {overallGrade}
                    </div>
                    <div className="text-sm text-gray-400">
                        Score: {overallScore}/100
                    </div>
                </div>
            </div>

            {/* Radar Chart */}
            <div className="h-[350px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                        <PolarGrid stroke="#374151" />
                        <PolarAngleAxis
                            dataKey="metric"
                            tick={{ fill: "#9ca3af", fontSize: 12 }}
                        />
                        <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={{ fill: "#6b7280", fontSize: 10 }}
                            tickCount={5}
                        />
                        <Radar
                            name="Score"
                            dataKey="value"
                            stroke={gradeColor}
                            fill={gradeColor}
                            fillOpacity={0.3}
                            strokeWidth={2}
                        />
                        <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                </ResponsiveContainer>

                {/* Center score */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                        className="text-6xl font-black opacity-10"
                        style={{ color: gradeColor }}
                    >
                        {avgScore}
                    </div>
                </div>
            </div>

            {/* Metric breakdown */}
            <div className="mt-4 grid grid-cols-3 gap-3">
                {Object.entries(metrics).map(([key, value]) => {
                    const info = METRIC_LABELS[key as keyof EconomicMetrics];
                    const score = Math.round(value);
                    return (
                        <div
                            key={key}
                            className="p-3 bg-white/5 rounded-lg"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span>{info.icon}</span>
                                <span className="text-xs text-gray-400">{info.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div
                                    className="text-lg font-bold"
                                    style={{ color: getScoreColor(score) }}
                                >
                                    {score}
                                </div>
                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${score}%`,
                                            backgroundColor: getScoreColor(score),
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-gray-400">80+ Strong</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-gray-400">40-79 Moderate</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-gray-400">&lt;40 Weak</span>
                </div>
            </div>
        </div>
    );
}
