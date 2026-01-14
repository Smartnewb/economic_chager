"use client";

import { useEffect } from "react";
import { useInstitutionalStore } from "@/store/institutionalStore";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface IMFOutlookChartProps {
    countryCode: string;
}

export default function IMFOutlookChart({ countryCode }: IMFOutlookChartProps) {
    const { imfOutlook, isLoadingIMF, fetchIMFOutlook } = useInstitutionalStore();

    useEffect(() => {
        if (countryCode) {
            fetchIMFOutlook(countryCode);
        }
    }, [countryCode, fetchIMFOutlook]);

    if (isLoadingIMF) {
        return (
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-slate-700 rounded w-1/2"></div>
                    <div className="h-48 bg-slate-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (!imfOutlook) {
        return null;
    }

    const getSentimentBadge = () => {
        switch (imfOutlook.sentiment) {
            case "bullish":
                return <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">🐂 Bullish</span>;
            case "bearish":
                return <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs">🐻 Bearish</span>;
            default:
                return <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs">➖ Neutral</span>;
        }
    };

    // Prepare chart data
    const chartData = imfOutlook.gdp_growth?.map((item) => ({
        year: item.year,
        gdp: item.value,
        isForecast: item.is_forecast,
    })) || [];

    const currentYear = new Date().getFullYear();

    return (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="text-2xl">📊</span>
                        IMF Economic Outlook
                    </h3>
                    <p className="text-sm text-slate-400">{imfOutlook.country_name} - {imfOutlook.weo_edition}</p>
                </div>
                {getSentimentBadge()}
            </div>

            {/* GDP Growth Chart */}
            <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="gdpGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}%`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                            labelStyle={{ color: "#f1f5f9" }}
                            formatter={(value: number | undefined, _name: string | undefined, props: any) => [
                                value ? `${value.toFixed(1)}%` : 'N/A',
                                props?.payload?.isForecast ? "GDP Growth (Forecast)" : "GDP Growth (Actual)"
                            ]}
                        />
                        <ReferenceLine x={currentYear} stroke="#fbbf24" strokeDasharray="5 5" label={{ value: "Now", fill: "#fbbf24", fontSize: 10 }} />
                        <Area type="monotone" dataKey="gdp" stroke="#3b82f6" fill="url(#gdpGradient)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <MetricBox
                    label="GDP Growth"
                    value={imfOutlook.gdp_growth?.find(f => f.is_forecast)?.value}
                    unit="%"
                    trend={imfOutlook.sentiment === "bullish" ? "up" : imfOutlook.sentiment === "bearish" ? "down" : "flat"}
                />
                <MetricBox
                    label="Inflation"
                    value={imfOutlook.inflation?.find(f => f.is_forecast)?.value}
                    unit="%"
                />
                <MetricBox
                    label="Govt Debt"
                    value={imfOutlook.government_debt?.slice(-1)[0]?.value}
                    unit="% GDP"
                    warning={imfOutlook.government_debt?.slice(-1)[0]?.value > 100}
                />
                <MetricBox
                    label="Current A/C"
                    value={imfOutlook.current_account?.slice(-1)[0]?.value}
                    unit="% GDP"
                    showSign
                />
            </div>

            {/* Key Risks */}
            {imfOutlook.key_risks.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <h4 className="text-red-400 text-sm font-medium mb-2">⚠️ IMF Key Risks</h4>
                    <ul className="text-sm text-slate-300 space-y-1">
                        {imfOutlook.key_risks.map((risk, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <span className="text-red-400">•</span>
                                {risk}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function MetricBox({ label, value, unit, trend, warning, showSign }: {
    label: string;
    value?: number;
    unit: string;
    trend?: "up" | "down" | "flat";
    warning?: boolean;
    showSign?: boolean;
}) {
    const displayValue = value !== undefined
        ? (showSign && value > 0 ? "+" : "") + value.toFixed(1) + unit
        : "N/A";

    const getTrendColor = () => {
        if (warning) return "text-red-400";
        if (trend === "up") return "text-green-400";
        if (trend === "down") return "text-red-400";
        return "text-slate-300";
    };

    return (
        <div className="bg-slate-700/50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className={`text-lg font-semibold ${getTrendColor()}`}>{displayValue}</p>
        </div>
    );
}
