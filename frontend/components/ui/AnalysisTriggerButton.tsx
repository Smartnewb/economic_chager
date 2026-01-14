"use client";

import { useState } from "react";

// 4 Investment Master Personas - The AI Board of Directors
export const INVESTMENT_MASTERS = [
    {
        id: "kostolany",
        name: "Kostolany",
        subtitle: "The Speculator",
        fullName: "André Kostolany",
        emoji: "🥚",
        color: "from-amber-500 to-orange-600",
        borderColor: "border-amber-500/30",
        bgColor: "bg-amber-500/10",
        focus: "Liquidity + Psychology",
        philosophy: "Trend = Money + Psychology",
    },
    {
        id: "buffett",
        name: "Buffett",
        subtitle: "The Oracle",
        fullName: "Warren Buffett",
        emoji: "🏦",
        color: "from-blue-500 to-indigo-600",
        borderColor: "border-blue-500/30",
        bgColor: "bg-blue-500/10",
        focus: "Intrinsic Value + Risk-Free Rate",
        philosophy: "Interest rates act on asset prices like gravity",
    },
    {
        id: "munger",
        name: "Munger",
        subtitle: "The Rationalist",
        fullName: "Charlie Munger",
        emoji: "📚",
        color: "from-purple-500 to-pink-600",
        borderColor: "border-purple-500/30",
        bgColor: "bg-purple-500/10",
        focus: "Risk Assessment + Inversion",
        philosophy: "Invert, always invert",
    },
    {
        id: "dalio",
        name: "Dalio",
        subtitle: "The Mechanic",
        fullName: "Ray Dalio",
        emoji: "⚙️",
        color: "from-cyan-500 to-blue-600",
        borderColor: "border-cyan-500/30",
        bgColor: "bg-cyan-500/10",
        focus: "Debt Cycles + Macro",
        philosophy: "The economy is a machine driven by debt cycles",
    },
];

interface AnalysisTriggerButtonProps {
    onAnalyze: () => void;
    isAnalyzing: boolean;
    isDisabled?: boolean;
    loadingText?: string;
    buttonText?: string;
    subText?: string;
    disabledText?: string;
}

export default function AnalysisTriggerButton({
    onAnalyze,
    isAnalyzing,
    isDisabled = false,
    loadingText = "The Board is analyzing...",
    buttonText = "Summon the Board",
    subText = "Get AI insights from investment masters",
    disabledText = "Loading market data...",
}: AnalysisTriggerButtonProps) {
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = () => {
        if (!isAnalyzing && !isDisabled) {
            onAnalyze();
        }
    };

    return (
        <div className="relative">
            {/* Main Button */}
            <button
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                disabled={isAnalyzing || isDisabled}
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
                            : "bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-105"
                    }
                `}
            >
                {/* Glow Effect */}
                {!isAnalyzing && !isDisabled && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 blur-lg opacity-50 group-hover:opacity-75 transition-opacity -z-10" />
                )}

                {/* Pulsing Ring Animation */}
                {!isAnalyzing && !isDisabled && (
                    <>
                        <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/50 animate-ping opacity-20" />
                        <div className="absolute inset-0 rounded-2xl border border-cyan-400/30 animate-pulse" />
                    </>
                )}

                {/* Button Content */}
                <div className="flex items-center gap-3">
                    {isAnalyzing ? (
                        <>
                            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            <span>{loadingText}</span>
                        </>
                    ) : (
                        <>
                            <span className="text-2xl">🎯</span>
                            <span>{buttonText}</span>
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
                    absolute left-1/2 -translate-x-1/2 -top-20
                    flex items-center gap-3
                    transition-all duration-300
                    ${isHovered && !isAnalyzing && !isDisabled ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}
                `}
            >
                {INVESTMENT_MASTERS.map((master, index) => (
                    <div
                        key={master.id}
                        className={`
                            relative
                            w-14 h-14
                            rounded-full
                            bg-gradient-to-br ${master.color}
                            flex items-center justify-center
                            text-2xl
                            border-2 border-white/20
                            shadow-lg shadow-black/30
                            transform transition-all duration-300
                            hover:scale-110 hover:z-10
                        `}
                        style={{
                            transitionDelay: `${index * 50}ms`,
                        }}
                    >
                        {master.emoji}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center">
                            <span className="text-xs text-gray-300 whitespace-nowrap font-medium">
                                {master.name}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Subtext */}
            <p className="text-center text-sm text-gray-500 mt-3">
                {isDisabled ? disabledText : subText}
            </p>
        </div>
    );
}
