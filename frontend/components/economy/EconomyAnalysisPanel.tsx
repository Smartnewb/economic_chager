"use client";

import { useEconomyStore } from "@/store/economyStore";

const PersonaCard = ({
    name,
    avatar,
    style,
    response,
    isActive,
}: {
    name: string;
    avatar: string;
    style: string;
    response: string;
    isActive: boolean;
}) => {
    return (
        <div
            className={`p-4 rounded-xl border transition-all duration-300 ${
                isActive
                    ? "bg-purple-500/10 border-purple-500/30"
                    : "bg-white/5 border-white/10"
            }`}
        >
            <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{avatar}</span>
                <div>
                    <h4 className="font-bold text-white">{name}</h4>
                    <p className="text-xs text-gray-400">{style}</p>
                </div>
                {isActive && (
                    <div className="ml-auto">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                            <div
                                className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                            />
                            <div
                                className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                            />
                        </div>
                    </div>
                )}
            </div>
            {response ? (
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {response}
                </div>
            ) : isActive ? (
                <div className="text-sm text-gray-500 italic">Thinking...</div>
            ) : (
                <div className="text-sm text-gray-600">Waiting...</div>
            )}
        </div>
    );
};

export default function EconomyAnalysisPanel() {
    const {
        showAnalysisPanel,
        closeAnalysisPanel,
        isAnalyzing,
        currentAgent,
        analysisResult,
        analysisError,
        commodities,
    } = useEconomyStore();

    if (!showAnalysisPanel) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={closeAnalysisPanel}
            />

            {/* Panel */}
            <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-gray-900/95 border-l border-white/10 overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-white/10 p-6 z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">🔬</span>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    Real Economy Analysis
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">
                                    Commodity & Macro Indicator Deep Dive
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={closeAnalysisPanel}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <svg
                                className="w-5 h-5 text-white"
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

                    {/* Current Signal */}
                    {commodities && (
                        <div className="mt-4 flex items-center gap-4">
                            <div className="flex gap-2">
                                <div className="p-2 bg-white/5 rounded-lg text-center">
                                    <div className="text-xs text-gray-400">Oil</div>
                                    <div className={`text-lg font-bold ${
                                        commodities.oil.signal === "bullish" ? "text-green-400" :
                                        commodities.oil.signal === "bearish" ? "text-red-400" : "text-yellow-400"
                                    }`}>
                                        {commodities.oil.change1m >= 0 ? "+" : ""}{commodities.oil.change1m}%
                                    </div>
                                </div>
                                <div className="p-2 bg-white/5 rounded-lg text-center">
                                    <div className="text-xs text-gray-400">Gold</div>
                                    <div className={`text-lg font-bold ${
                                        commodities.gold.signal === "bullish" ? "text-green-400" :
                                        commodities.gold.signal === "bearish" ? "text-red-400" : "text-yellow-400"
                                    }`}>
                                        {commodities.gold.change1m >= 0 ? "+" : ""}{commodities.gold.change1m}%
                                    </div>
                                </div>
                                <div className="p-2 bg-white/5 rounded-lg text-center">
                                    <div className="text-xs text-gray-400">Copper</div>
                                    <div className={`text-lg font-bold ${
                                        commodities.copper.signal === "bullish" ? "text-green-400" :
                                        commodities.copper.signal === "bearish" ? "text-red-400" : "text-yellow-400"
                                    }`}>
                                        {commodities.copper.change1m >= 0 ? "+" : ""}{commodities.copper.change1m}%
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 p-2 bg-white/5 rounded-lg">
                                <div className="text-xs text-gray-400">Signal</div>
                                <div className="text-lg font-bold text-purple-400 capitalize">
                                    {commodities.overallSignal.replace("_", " ")}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {analysisError ? (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                            <p className="text-red-400">{analysisError}</p>
                        </div>
                    ) : (
                        <>
                            {/* Persona Responses */}
                            <div className="space-y-4">
                                <PersonaCard
                                    name="The Speculator Sage"
                                    avatar="🥚"
                                    style="André Kostolany - Psychology & Liquidity"
                                    response={analysisResult?.kostolany_response || ""}
                                    isActive={currentAgent === "kostolany"}
                                />
                                <PersonaCard
                                    name="The Value Oracle"
                                    avatar="🏦"
                                    style="Warren Buffett - Value & Interest Rates"
                                    response={analysisResult?.buffett_response || ""}
                                    isActive={currentAgent === "buffett"}
                                />
                                <PersonaCard
                                    name="The Rational Critic"
                                    avatar="📚"
                                    style="Charlie Munger - Risk & Rationality"
                                    response={analysisResult?.munger_response || ""}
                                    isActive={currentAgent === "munger"}
                                />
                                <PersonaCard
                                    name="The Machine Thinker"
                                    avatar="⚙️"
                                    style="Ray Dalio - Macro Economic Cycles"
                                    response={analysisResult?.dalio_response || ""}
                                    isActive={currentAgent === "dalio"}
                                />
                            </div>

                            {/* Synthesis */}
                            {analysisResult?.synthesis && (
                                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl">
                                    <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                                        <span>📋</span>
                                        Real Economy Verdict
                                    </h4>
                                    <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                        {analysisResult.synthesis}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm border-t border-white/10 p-4">
                    <p className="text-xs text-gray-500 text-center">
                        This is AI-generated analysis for educational purposes only. Not
                        financial or investment advice.
                    </p>
                </div>
            </div>
        </div>
    );
}
