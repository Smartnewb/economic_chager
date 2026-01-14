"use client";

import { usePolicyStore } from "@/store/policyStore";

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

export default function PolicyAnalysisPanel() {
    const {
        showAnalysisPanel,
        closeAnalysisPanel,
        isAnalyzing,
        currentAgent,
        analysisResult,
        analysisError,
        centralBanks,
        upcomingMeetings,
    } = usePolicyStore();

    if (!showAnalysisPanel) return null;

    // Calculate metrics for display
    const usBank = centralBanks.find((b) => b.code === "US");
    const hikingBanks = centralBanks.filter((b) => b.status === "hiking");
    const cuttingBanks = centralBanks.filter((b) => b.status === "cutting");
    const nextMeeting = upcomingMeetings[0];

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
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                Central Bank Policy Debate
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">
                                Investment Legends Analysis
                            </p>
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

                    {/* Policy Metrics Summary */}
                    <div className="mt-4 grid grid-cols-4 gap-3">
                        <div className="p-3 bg-white/5 rounded-lg">
                            <div className="text-xs text-gray-400">Fed Rate</div>
                            <div className="text-lg font-bold text-white">
                                {usBank?.currentRate.toFixed(2) || "--"}%
                            </div>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg">
                            <div className="text-xs text-gray-400">Real Rate</div>
                            <div
                                className={`text-lg font-bold ${
                                    usBank && usBank.realRate >= 0
                                        ? "text-purple-400"
                                        : "text-green-400"
                                }`}
                            >
                                {usBank
                                    ? `${usBank.realRate >= 0 ? "+" : ""}${usBank.realRate.toFixed(1)}%`
                                    : "--"}
                            </div>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg">
                            <div className="text-xs text-gray-400">Hiking</div>
                            <div className="text-lg font-bold text-red-400">
                                🔥 {hikingBanks.length}
                            </div>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg">
                            <div className="text-xs text-gray-400">Cutting</div>
                            <div className="text-lg font-bold text-blue-400">
                                💧 {cuttingBanks.length}
                            </div>
                        </div>
                    </div>

                    {/* Next meeting alert */}
                    {nextMeeting && (
                        <div className="mt-3 p-2 bg-yellow-500/10 rounded-lg flex items-center gap-2">
                            <span>{nextMeeting.flag}</span>
                            <span className="text-sm text-yellow-400">
                                {nextMeeting.country} decision in {nextMeeting.daysUntil} days
                            </span>
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
                                        <span>🏛️</span>
                                        Policy Synthesis
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
                        financial advice.
                    </p>
                </div>
            </div>
        </div>
    );
}
