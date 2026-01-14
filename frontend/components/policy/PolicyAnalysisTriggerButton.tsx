"use client";

import { usePolicyStore } from "@/store/policyStore";
import { useI18n } from "@/lib/i18n";

export default function PolicyAnalysisTriggerButton() {
    const {
        triggerAnalysis,
        isAnalyzing,
        centralBanks,
        upcomingMeetings,
    } = usePolicyStore();
    const { language } = useI18n();

    // Find key metrics for preview
    const usBank = centralBanks.find((b) => b.code === "US");
    const hikingCount = centralBanks.filter((b) => b.status === "hiking").length;
    const cuttingCount = centralBanks.filter((b) => b.status === "cutting").length;
    const nextMeeting = upcomingMeetings[0];

    // Determine global stance
    const globalStance =
        hikingCount > cuttingCount
            ? "Tightening"
            : cuttingCount > hikingCount
              ? "Easing"
              : "Mixed";

    return (
        <button
            onClick={() => triggerAnalysis(language)}
            disabled={isAnalyzing}
            className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
                isAnalyzing
                    ? "bg-purple-900/50 cursor-wait"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
            }`}
        >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-white/10 to-purple-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

            {/* Content */}
            <div className="relative">
                {isAnalyzing ? (
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-lg font-bold text-white">
                            Analyzing Policy Landscape...
                        </span>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-3xl">🏛️</span>
                            <span className="text-xl font-bold text-white">
                                Analyze Central Bank Policy
                            </span>
                        </div>
                        <p className="text-sm text-white/70 mb-4 text-left">
                            The Hawk 🦅, the Dove 🕊️, and the Pragmatist ⚖️ debate monetary policy
                        </p>

                        {/* Quick preview */}
                        <div className="flex flex-wrap gap-3 text-xs">
                            {usBank && (
                                <div className="px-3 py-1 bg-white/10 rounded-full">
                                    🇺🇸 Fed: {usBank.currentRate.toFixed(2)}%
                                </div>
                            )}
                            <div
                                className={`px-3 py-1 rounded-full ${
                                    globalStance === "Tightening"
                                        ? "bg-purple-500/20 text-purple-300"
                                        : globalStance === "Easing"
                                          ? "bg-green-500/20 text-green-300"
                                          : "bg-yellow-500/20 text-yellow-300"
                                }`}
                            >
                                Global: {globalStance}
                            </div>
                            {nextMeeting && (
                                <div className="px-3 py-1 bg-white/10 rounded-full">
                                    Next: {nextMeeting.flag} D-{nextMeeting.daysUntil}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </button>
    );
}
