"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useWeatherStore } from "@/store/weatherStore";
import { useDashboardStore } from "@/store/dashboardStore";
import { useI18n } from "@/lib/i18n";
import Navigation from "@/components/Navigation";
import AIHeadline from "@/components/weather/AIHeadline";
import ModuleCards from "@/components/weather/ModuleCards";
import CouncilDebate from "@/components/weather/CouncilDebate";
import CycleTheoriesPanel from "@/components/dashboard/CycleTheoriesPanel";

// Dynamically import the globe to avoid SSR issues
const WeatherGlobe = dynamic(() => import("@/components/weather/WeatherGlobe"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
    )
});

export default function DashboardPage() {
    const { fetchWeatherData, weather, isLoading } = useWeatherStore();
    const { data: dashboardData, loading: dashboardLoading, fetchDashboardData } = useDashboardStore();
    const { t } = useI18n();
    const [showCouncil, setShowCouncil] = useState(false);

    useEffect(() => {
        fetchWeatherData();
        fetchDashboardData();
        const interval = setInterval(() => {
            fetchWeatherData();
            fetchDashboardData();
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchWeatherData, fetchDashboardData]);

    return (
        <main className="relative w-full min-h-screen bg-[#0a0a0f] overflow-hidden">
            {/* Animated Background Gradient */}
            <div
                className="fixed inset-0 pointer-events-none transition-all duration-1000"
                style={{
                    background: weather?.globalSentiment === "risk_on"
                        ? "radial-gradient(ellipse at 50% 0%, rgba(251, 191, 36, 0.1) 0%, transparent 50%)"
                        : weather?.globalSentiment === "risk_off"
                        ? "radial-gradient(ellipse at 50% 0%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)"
                        : "radial-gradient(ellipse at 50% 0%, rgba(107, 114, 128, 0.1) 0%, transparent 50%)"
                }}
            />

            {/* Navigation Header */}
            <Navigation
                statusIndicator={
                    <div className="flex items-center gap-3">
                        {/* Sentiment Indicator */}
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                            weather?.globalSentiment === "risk_on"
                                ? "bg-amber-500/20 text-amber-400"
                                : weather?.globalSentiment === "risk_off"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-gray-500/20 text-gray-400"
                        }`}>
                            <div className={`w-2 h-2 rounded-full animate-pulse ${
                                weather?.globalSentiment === "risk_on"
                                    ? "bg-amber-400"
                                    : weather?.globalSentiment === "risk_off"
                                    ? "bg-blue-400"
                                    : "bg-gray-400"
                            }`} />
                            <span className="text-xs font-medium">
                                {weather?.globalSentiment === "risk_on" ? "Risk On" :
                                 weather?.globalSentiment === "risk_off" ? "Risk Off" : "Neutral"}
                            </span>
                        </div>

                        {/* Live Indicator */}
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                                weather ? "bg-green-500 animate-pulse" : "bg-yellow-500"
                            }`} />
                            <span className="text-xs text-gray-400">
                                {weather ? "Live" : "Loading..."}
                            </span>
                        </div>
                    </div>
                }
            />

            {/* Main Content */}
            <div className="relative z-10 pt-20">
                {/* Hero Section: Globe + Headline */}
                <section className="relative min-h-[50vh] flex flex-col items-center justify-center px-6 pb-8">
                    {/* Globe Background */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60">
                        <div className="w-full max-w-2xl aspect-square">
                            <WeatherGlobe />
                        </div>
                    </div>

                    {/* Headline Overlay */}
                    <div className="relative z-10 w-full max-w-4xl mx-auto text-center mb-8">
                        {/* Logo / Brand */}
                        <div className="mb-8">
                            <h1 className="text-5xl md:text-6xl font-black text-white mb-2">
                                <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                                    Insight Flow
                                </span>
                            </h1>
                            <p className="text-gray-400 text-lg">
                                Economic Intelligence for Everyone
                            </p>
                        </div>
                    </div>

                    {/* AI Headline Card */}
                    <div className="relative z-10 w-full">
                        <AIHeadline />
                    </div>

                    {/* Council Button */}
                    <div className="relative z-10 mt-8">
                        <button
                            onClick={() => setShowCouncil(true)}
                            className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 rounded-2xl transition-all"
                        >
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-xs font-bold text-white border-2 border-gray-900">WB</div>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-xs font-bold text-white border-2 border-gray-900">RD</div>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-xs font-bold text-white border-2 border-gray-900">GS</div>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-xs font-bold text-white border-2 border-gray-900">AK</div>
                            </div>
                            <div className="text-left">
                                <p className="text-white font-semibold text-sm">Ask the Council</p>
                                <p className="text-xs text-gray-400">What would the legends say?</p>
                            </div>
                            <svg className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                </section>

                {/* Dashboard Summary Cards */}
                <section className="relative px-6 py-8">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-xl font-bold text-white mb-6 text-center">Market Snapshot</h2>
                        {dashboardLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Market Health Card */}
                                <div className="p-5 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <span className="text-xl">📊</span>
                                        </div>
                                        <h3 className="text-white font-semibold">Market Health</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 text-sm">VIX (Fear Index)</span>
                                            <span className={`font-mono font-bold ${
                                                (dashboardData.marketHealth?.vix ?? 20) >= 25 ? 'text-red-400' :
                                                (dashboardData.marketHealth?.vix ?? 20) >= 20 ? 'text-yellow-400' : 'text-green-400'
                                            }`}>
                                                {dashboardData.marketHealth?.vix?.toFixed(1) ?? 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 text-sm">10Y-2Y Spread</span>
                                            <span className={`font-mono font-bold ${
                                                (dashboardData.marketHealth?.spread10y2y ?? 0) < 0 ? 'text-red-400' : 'text-green-400'
                                            }`}>
                                                {dashboardData.marketHealth?.spread10y2y?.toFixed(2) ?? 'N/A'}%
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2">
                                            Status: <span className={`font-medium ${
                                                dashboardData.marketHealth?.spreadStatus === 'INVERTED' ? 'text-red-400' :
                                                dashboardData.marketHealth?.spreadStatus === 'FLAT' ? 'text-yellow-400' : 'text-green-400'
                                            }`}>{dashboardData.marketHealth?.spreadStatus ?? 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Whale Activity Card */}
                                <div className="p-5 rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                            <span className="text-xl">🐋</span>
                                        </div>
                                        <h3 className="text-white font-semibold">Whale Activity</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {dashboardData.whaleActivity?.topAlerts?.slice(0, 3).map((alert, i) => (
                                            <div key={i} className="flex items-center gap-2 text-sm">
                                                <span className={`w-2 h-2 rounded-full ${
                                                    alert.signal === 'bullish' ? 'bg-green-400' :
                                                    alert.signal === 'bearish' ? 'bg-red-400' : 'bg-gray-400'
                                                }`} />
                                                <span className="font-mono text-amber-400">{alert.symbol}</span>
                                                <span className="text-gray-400 truncate">{alert.headline.slice(0, 30)}...</span>
                                            </div>
                                        )) ?? (
                                            <div className="text-gray-500 text-sm">No whale activity</div>
                                        )}
                                        <div className="text-xs text-gray-500 mt-2">
                                            {dashboardData.whaleActivity?.insiderCount ?? 0} insider trades detected
                                        </div>
                                    </div>
                                </div>

                                {/* Economic Snapshot Card */}
                                <div className="p-5 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                            <span className="text-xl">🏭</span>
                                        </div>
                                        <h3 className="text-white font-semibold">Economic Snapshot</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 text-sm">PMI Composite</span>
                                            <span className={`font-mono font-bold ${
                                                (dashboardData.economicSnapshot?.pmiComposite ?? 50) >= 50 ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                                {dashboardData.economicSnapshot?.pmiComposite?.toFixed(1) ?? 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 text-sm">Dr. Copper</span>
                                            <span className={`font-mono font-bold ${
                                                dashboardData.economicSnapshot?.drCopperStatus === 'bullish' ? 'text-green-400' :
                                                dashboardData.economicSnapshot?.drCopperStatus === 'bearish' ? 'text-red-400' : 'text-gray-400'
                                            }`}>
                                                {dashboardData.economicSnapshot?.drCopperChange?.toFixed(1) ?? 'N/A'}%
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2">
                                            Trend: <span className={`font-medium ${
                                                dashboardData.economicSnapshot?.pmiTrend === 'expanding' ? 'text-green-400' :
                                                dashboardData.economicSnapshot?.pmiTrend === 'contracting' ? 'text-red-400' : 'text-gray-400'
                                            }`}>{dashboardData.economicSnapshot?.pmiTrend ?? 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* FX & Flows Card */}
                                <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                            <span className="text-xl">💱</span>
                                        </div>
                                        <h3 className="text-white font-semibold">FX & Flows</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 text-sm">DXY Index</span>
                                            <span className="font-mono font-bold text-white">
                                                {dashboardData.fxFlows?.dxyValue?.toFixed(2) ?? 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 text-sm">24h Change</span>
                                            <span className={`font-mono font-bold ${
                                                (dashboardData.fxFlows?.dxyChange ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                                {dashboardData.fxFlows?.dxyChange?.toFixed(2) ?? 'N/A'}%
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2">
                                            Sentiment: <span className={`font-medium ${
                                                dashboardData.fxFlows?.riskSentiment === 'risk_on' ? 'text-green-400' :
                                                dashboardData.fxFlows?.riskSentiment === 'risk_off' ? 'text-red-400' : 'text-gray-400'
                                            }`}>{dashboardData.fxFlows?.riskSentiment?.replace('_', ' ').toUpperCase() ?? 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Investment Cycle Theories Section */}
                <section className="relative px-6 py-8">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-xl font-bold text-white mb-6 text-center">Investment Cycle Analysis</h2>
                        <CycleTheoriesPanel />
                    </div>
                </section>

                {/* Module Cards Section */}
                <section className="relative px-6 py-16 bg-gradient-to-b from-transparent to-black/30">
                    <div className="max-w-7xl mx-auto">
                        <ModuleCards />
                    </div>
                </section>

                {/* Quick Actions / Deep Dive Section */}
                <section className="px-6 py-16">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Ready to Dive Deeper?
                            </h2>
                            <p className="text-gray-400">
                                Choose your analysis path
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Quick Analysis */}
                            <Link href="/">
                                <div className="group p-6 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 hover:border-yellow-500/40 transition-all cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                                            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                                <path strokeWidth="2" d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-white text-lg">Money Weather Map</h3>
                                            <p className="text-sm text-gray-400">Track global capital flows in real-time</p>
                                        </div>
                                        <svg className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>

                            {/* Country Scanner */}
                            <Link href="/country">
                                <div className="group p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                                            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-white text-lg">Country X-Ray</h3>
                                            <p className="text-sm text-gray-400">Analyze any country's economic health</p>
                                        </div>
                                        <svg className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="px-6 py-8 border-t border-white/10">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">IF</span>
                            </div>
                            <span className="text-gray-400 text-sm">Insight Flow</span>
                        </div>

                        <p className="text-xs text-gray-500 text-center">
                            Educational purposes only. Not financial advice.
                            Data refreshes automatically every 5 minutes.
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            {weather?.lastUpdate && (
                                <span>
                                    Last updated: {new Date(weather.lastUpdate).toLocaleTimeString()}
                                </span>
                            )}
                        </div>
                    </div>
                </footer>
            </div>

            {/* Council Debate Panel */}
            <CouncilDebate
                isOpen={showCouncil}
                onClose={() => setShowCouncil(false)}
            />
        </main>
    );
}
