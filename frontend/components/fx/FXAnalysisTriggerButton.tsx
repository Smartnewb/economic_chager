"use client";

import { useFXStore } from "@/store/fxStore";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";

const AGENTS = [
    {
        id: "musk",
        name: "Musk",
        emoji: "🚀",
        color: "from-orange-500 to-red-600",
    },
    {
        id: "buffett",
        name: "Buffett",
        emoji: "🏦",
        color: "from-blue-500 to-indigo-600",
    },
    {
        id: "thiel",
        name: "Thiel",
        emoji: "♟️",
        color: "from-purple-500 to-pink-600",
    },
];

export default function FXAnalysisTriggerButton() {
    const { isAnalyzing, requestAnalysis, metrics, selectedPair } = useFXStore();
    const { language } = useI18n();
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = () => {
        if (!isAnalyzing && metrics) {
            requestAnalysis(language);
        }
    };

    return (
        <div className="relative">
            {/* Main Button */}
            <button
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                disabled={isAnalyzing || !metrics}
                className={`
                    relative group
                    px-8 py-4
                    rounded-2xl
                    font-bold text-lg
                    transition-all duration-300
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                        isAnalyzing
                            ? "bg-gray-800 text-gray-400"
                            : "bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 text-white hover:shadow-lg hover:shadow-orange-500/30 hover:scale-105"
                    }
                `}
            >
                {/* Glow Effect */}
                {!isAnalyzing && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 blur-lg opacity-50 group-hover:opacity-75 transition-opacity -z-10" />
                )}

                {/* Button Content */}
                <div className="flex items-center gap-3">
                    {isAnalyzing ? (
                        <>
                            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            <span>The Board is analyzing...</span>
                        </>
                    ) : (
                        <>
                            <span className="text-2xl">🌍</span>
                            <span>Analyze the Flow</span>
                            <svg
                                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                                />
                            </svg>
                        </>
                    )}
                </div>
            </button>

            {/* Agent Avatars on Hover */}
            <div
                className={`
                    absolute left-1/2 -translate-x-1/2 -top-16
                    flex items-center gap-2
                    transition-all duration-300
                    ${isHovered && !isAnalyzing ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}
                `}
            >
                {AGENTS.map((agent, index) => (
                    <div
                        key={agent.id}
                        className={`
                            relative
                            w-12 h-12
                            rounded-full
                            bg-gradient-to-br ${agent.color}
                            flex items-center justify-center
                            text-xl
                            border-2 border-white/20
                            shadow-lg
                            transform transition-all duration-300
                            hover:scale-110 hover:z-10
                        `}
                        style={{
                            transitionDelay: `${index * 50}ms`,
                        }}
                    >
                        {agent.emoji}
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
                            {agent.name}
                        </span>
                    </div>
                ))}
            </div>

            {/* Subtext */}
            <p className="text-center text-sm text-gray-500 mt-3">
                {metrics
                    ? `Get AI insights on ${selectedPair} and global FX flows`
                    : "Loading market data..."}
            </p>
        </div>
    );
}
