"use client";

import { useState } from "react";
import { useWeatherStore } from "@/store/weatherStore";
import { useI18n } from "@/lib/i18n";

// The Council Members (Giants)
const COUNCIL_MEMBERS = [
    {
        id: "buffett",
        name: "Warren Buffett",
        title: "The Value Oracle",
        avatar: "WB",
        color: "from-blue-600 to-blue-800",
        expertise: "Value & Long-term",
        style: "Conservative, patient, focuses on intrinsic value"
    },
    {
        id: "dalio",
        name: "Ray Dalio",
        title: "The Macro Architect",
        avatar: "RD",
        color: "from-purple-600 to-purple-800",
        expertise: "Macro Cycles",
        style: "Systematic, cycle-focused, risk parity"
    },
    {
        id: "soros",
        name: "George Soros",
        title: "The Reflexive Trader",
        avatar: "GS",
        color: "from-emerald-600 to-emerald-800",
        expertise: "Market Psychology",
        style: "Contrarian, reflexivity theory, bold bets"
    },
    {
        id: "kostolany",
        name: "Andre Kostolany",
        title: "The Market Philosopher",
        avatar: "AK",
        color: "from-amber-600 to-amber-800",
        expertise: "Sentiment & Patience",
        style: "Philosophical, contrarian, patience-focused"
    }
];

// Generate debate responses based on current conditions
function generateDebateResponse(
    memberId: string,
    sentiment: string,
    dollarStrength: string,
    volatility: string
): string {
    const responses: Record<string, Record<string, string>> = {
        buffett: {
            risk_off: "When others are fearful, that's when I get greedy. Quality companies at discounted prices are emerging.",
            risk_on: "Be careful when others are greedy. I'm holding more cash than usual. The market seems expensive.",
            neutral: "I don't try to time the market. I look for wonderful businesses at fair prices, regardless of conditions."
        },
        dalio: {
            risk_off: "This is a classic deleveraging phase. The debt cycle is contracting. Expect more volatility ahead.",
            risk_on: "We're in an expansion phase, but watch the credit markets. The machine has clear patterns here.",
            neutral: "The economy is in transition. Diversification across uncorrelated assets is crucial right now."
        },
        soros: {
            risk_off: "The reflexive feedback loop is intensifying fear. This creates opportunity for those who can see through it.",
            risk_on: "Market participants are reinforcing the uptrend. But remember - trends persist until they break violently.",
            neutral: "The market is searching for direction. I'm looking for asymmetric opportunities where perception diverges from reality."
        },
        kostolany: {
            risk_off: "Buy when blood is in the streets - but make sure you have the patience to wait. This is not for the weak.",
            risk_on: "The masses are euphoric. I prefer to be early than late. Consider taking some profits.",
            neutral: "The market is like a man walking his dog. The dog runs ahead and behind, but always returns to the master."
        }
    };

    return responses[memberId]?.[sentiment] || responses[memberId]?.neutral || "Interesting times require careful analysis.";
}

interface CouncilDebateProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CouncilDebate({ isOpen, onClose }: CouncilDebateProps) {
    const { weather } = useWeatherStore();
    const { t } = useI18n();
    const [activeMember, setActiveMember] = useState<string | null>(null);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed inset-x-4 bottom-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:bottom-8 md:w-full md:max-w-4xl bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-3xl z-50 overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                Council of Giants
                            </h2>
                            <p className="text-sm text-gray-400">
                                Legendary investors debate today's market
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Market Context */}
                {weather && (
                    <div className="px-6 py-4 bg-white/5 border-b border-white/10">
                        <p className="text-sm text-gray-400 mb-2">Current Market Context:</p>
                        <div className="flex flex-wrap gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                weather.globalSentiment === "risk_on"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : weather.globalSentiment === "risk_off"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-gray-500/20 text-gray-400"
                            }`}>
                                {weather.globalSentiment === "risk_on" ? "Risk-On Environment" :
                                 weather.globalSentiment === "risk_off" ? "Risk-Off Environment" : "Neutral"}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm ${
                                weather.dollarStrength === "strong"
                                    ? "bg-green-500/20 text-green-400"
                                    : weather.dollarStrength === "weak"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-gray-500/20 text-gray-400"
                            }`}>
                                Dollar: {weather.dollarStrength.charAt(0).toUpperCase() + weather.dollarStrength.slice(1)}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm ${
                                weather.volatilityLevel === "storm"
                                    ? "bg-red-500/20 text-red-400"
                                    : weather.volatilityLevel === "elevated"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : "bg-green-500/20 text-green-400"
                            }`}>
                                Volatility: {weather.volatilityLevel.charAt(0).toUpperCase() + weather.volatilityLevel.slice(1)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Council Members */}
                <div className="p-6 max-h-[50vh] overflow-y-auto">
                    <div className="space-y-4">
                        {COUNCIL_MEMBERS.map((member) => {
                            const response = generateDebateResponse(
                                member.id,
                                weather?.globalSentiment || "neutral",
                                weather?.dollarStrength || "neutral",
                                weather?.volatilityLevel || "calm"
                            );
                            const isActive = activeMember === member.id;

                            return (
                                <div
                                    key={member.id}
                                    className={`
                                        p-4 rounded-2xl border transition-all cursor-pointer
                                        ${isActive
                                            ? "bg-white/10 border-white/20"
                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                        }
                                    `}
                                    onClick={() => setActiveMember(isActive ? null : member.id)}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                                            {member.avatar}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-white">
                                                    {member.name}
                                                </h3>
                                                <span className="text-xs text-gray-500">
                                                    {member.title}
                                                </span>
                                            </div>

                                            {/* Expertise Tag */}
                                            <div className="mb-2">
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-400">
                                                    {member.expertise}
                                                </span>
                                            </div>

                                            {/* Quote */}
                                            <div className="relative pl-4 border-l-2 border-white/20">
                                                <span className="absolute -left-2 -top-1 text-2xl text-white/20">"</span>
                                                <p className="text-gray-300 text-sm leading-relaxed">
                                                    {response}
                                                </p>
                                            </div>

                                            {/* Expanded Style Info */}
                                            {isActive && (
                                                <div className="mt-4 pt-4 border-t border-white/10 animate-fade-in">
                                                    <p className="text-xs text-gray-500">
                                                        <span className="font-medium text-gray-400">Investment Style:</span>{" "}
                                                        {member.style}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Expand Icon */}
                                        <div className="flex-shrink-0">
                                            <svg
                                                className={`w-5 h-5 text-gray-500 transition-transform ${isActive ? "rotate-180" : ""}`}
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/10 bg-white/5">
                    <p className="text-xs text-gray-500 text-center italic">
                        These are AI-generated perspectives inspired by the investment philosophies of these legendary investors.
                        Not actual quotes or financial advice.
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(100%) translateX(-50%);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) translateX(-50%);
                    }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out forwards;
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out forwards;
                }
                @media (max-width: 768px) {
                    @keyframes slide-up {
                        from {
                            opacity: 0;
                            transform: translateY(100%);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                }
            `}</style>
        </>
    );
}
