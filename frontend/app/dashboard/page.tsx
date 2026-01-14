"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useWeatherStore } from "@/store/weatherStore";
import { useI18n } from "@/lib/i18n";
import Navigation from "@/components/Navigation";
import AIHeadline from "@/components/weather/AIHeadline";
import ModuleCards from "@/components/weather/ModuleCards";
import CouncilDebate from "@/components/weather/CouncilDebate";

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
    const { t } = useI18n();
    const [showCouncil, setShowCouncil] = useState(false);

    useEffect(() => {
        fetchWeatherData();
        // Refresh every 5 minutes
        const interval = setInterval(fetchWeatherData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchWeatherData]);

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
                <section className="relative min-h-[70vh] flex flex-col items-center justify-center px-6">
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

                    {/* Scroll Indicator */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                        <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
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
