"use client";

import { useBondStore } from "@/store/bondStore";

const AGENTS = [
    {
        id: "kostolany",
        name: "The Speculator Sage",
        subtitle: "André Kostolany",
        emoji: "🥚",
        color: "from-amber-500 to-orange-600",
        borderColor: "border-amber-500/30",
        bgColor: "bg-amber-500/10",
        responseKey: "kostolany_response" as const,
    },
    {
        id: "buffett",
        name: "The Value Oracle",
        subtitle: "Warren Buffett",
        emoji: "🏦",
        color: "from-blue-500 to-indigo-600",
        borderColor: "border-blue-500/30",
        bgColor: "bg-blue-500/10",
        responseKey: "buffett_response" as const,
    },
    {
        id: "munger",
        name: "The Rational Critic",
        subtitle: "Charlie Munger",
        emoji: "📚",
        color: "from-purple-500 to-pink-600",
        borderColor: "border-purple-500/30",
        bgColor: "bg-purple-500/10",
        responseKey: "munger_response" as const,
    },
    {
        id: "dalio",
        name: "The Machine Thinker",
        subtitle: "Ray Dalio",
        emoji: "⚙️",
        color: "from-cyan-500 to-blue-600",
        borderColor: "border-cyan-500/30",
        bgColor: "bg-cyan-500/10",
        responseKey: "dalio_response" as const,
    },
];

export default function AnalysisPanel() {
    const {
        showAnalysisPanel,
        closeAnalysisPanel,
        isAnalyzing,
        currentAgent,
        analysisResult,
        analysisError,
    } = useBondStore();

    if (!showAnalysisPanel) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={closeAnalysisPanel}
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-gray-900/95 backdrop-blur-lg border-l border-white/10 z-50 overflow-hidden flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-xl font-bold text-white">Board Analysis</h2>
                        <p className="text-sm text-gray-400 mt-1">
                            {isAnalyzing
                                ? "Analyzing bond market conditions..."
                                : "AI insights on current yield data"}
                        </p>
                    </div>
                    <button
                        onClick={closeAnalysisPanel}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <svg
                            className="w-6 h-6 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Error State */}
                    {analysisError && (
                        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                            <p className="text-red-400">{analysisError}</p>
                        </div>
                    )}

                    {/* Loading State */}
                    {isAnalyzing && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                                <div>
                                    <p className="text-white font-medium">
                                        {currentAgent
                                            ? `${AGENTS.find((a) => a.id === currentAgent)?.name} is thinking...`
                                            : "Gathering insights..."}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        Analyzing yield curves and market signals
                                    </p>
                                </div>
                            </div>
                            {/* Skeleton Loaders */}
                            {AGENTS.map((agent) => (
                                <div
                                    key={agent.id}
                                    className={`p-4 rounded-xl border ${agent.borderColor} ${agent.bgColor} opacity-50`}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${agent.color} flex items-center justify-center text-lg`}>
                                            {agent.emoji}
                                        </div>
                                        <div>
                                            <div className="h-4 w-32 bg-white/20 rounded animate-pulse" />
                                            <div className="h-3 w-24 bg-white/10 rounded mt-1 animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-3 w-full bg-white/10 rounded animate-pulse" />
                                        <div className="h-3 w-4/5 bg-white/10 rounded animate-pulse" />
                                        <div className="h-3 w-3/5 bg-white/10 rounded animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Results */}
                    {analysisResult && !isAnalyzing && (
                        <div className="space-y-4">
                            {/* Market Context Header */}
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                <h3 className="text-sm font-medium text-gray-400 mb-2">
                                    Market Context
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">2Y Yield</p>
                                        <p className="text-lg font-bold text-blue-400">
                                            {analysisResult.yield2Y.toFixed(2)}%
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">10Y Yield</p>
                                        <p className="text-lg font-bold text-cyan-400">
                                            {analysisResult.yield10Y.toFixed(2)}%
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Spread</p>
                                        <p
                                            className={`text-lg font-bold ${
                                                analysisResult.spread < 0
                                                    ? "text-red-400"
                                                    : "text-green-400"
                                            }`}
                                        >
                                            {analysisResult.spread >= 0 ? "+" : ""}
                                            {analysisResult.spread.toFixed(2)}%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Agent Responses */}
                            {AGENTS.map((agent, index) => (
                                <div
                                    key={agent.id}
                                    className={`p-4 rounded-xl border ${agent.borderColor} ${agent.bgColor} transform transition-all duration-500`}
                                    style={{
                                        animationDelay: `${index * 150}ms`,
                                    }}
                                >
                                    {/* Agent Header */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div
                                            className={`w-12 h-12 rounded-full bg-gradient-to-br ${agent.color} flex items-center justify-center text-xl shadow-lg`}
                                        >
                                            {agent.emoji}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">
                                                {agent.name}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                {agent.subtitle}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Agent Response */}
                                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                        {analysisResult[agent.responseKey]}
                                    </p>
                                </div>
                            ))}

                            {/* Synthesis */}
                            {analysisResult.synthesis && (
                                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-xl">🎯</span>
                                        <h3 className="font-bold text-white">Board Synthesis</h3>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                        {analysisResult.synthesis}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={closeAnalysisPanel}
                        className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                    >
                        Close Panel
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes slide-in-right {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out forwards;
                }
            `}</style>
        </>
    );
}
