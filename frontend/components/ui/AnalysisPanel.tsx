"use client";

import { INVESTMENT_MASTERS } from "./AnalysisTriggerButton";
import { ReactNode, useEffect, useCallback, useState } from "react";
import TypewriterText from "./TypewriterText";

// Analysis Result with all 4 investment master responses
export interface AnalysisResult {
    topic?: string;
    timestamp?: string;
    perspectives?: Array<{
        persona: string;
        analysis: string;
    }>;
    kostolany_response?: string;
    buffett_response?: string;
    munger_response?: string;
    dalio_response?: string;
    synthesis?: string;
}

interface AnalysisPanelProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading?: boolean;
    isAnalyzing?: boolean;
    currentAgent?: string | null;
    result?: AnalysisResult | null;
    analysisResult?: AnalysisResult | null;
    analysisError?: string | null;
    title?: string;
    topic?: string;
    subtitle?: string;
    loadingSubtitle?: string;
    marketContext?: ReactNode;
    enableTypewriter?: boolean;
    onFollowUp?: (question: string) => void;
}

export default function AnalysisPanel({
    isOpen,
    onClose,
    isLoading,
    isAnalyzing,
    currentAgent,
    result,
    analysisResult,
    analysisError,
    title,
    topic,
    subtitle = "AI insights from investment masters",
    loadingSubtitle = "Analyzing market conditions...",
    marketContext,
    enableTypewriter = true,
    onFollowUp,
}: AnalysisPanelProps) {
    const loading = isLoading || isAnalyzing;
    const data = result || analysisResult;
    const displayTitle = title || topic || "Board Analysis";
    const [animatedResponses, setAnimatedResponses] = useState<Set<string>>(new Set());
    const [followUpQuestion, setFollowUpQuestion] = useState("");
    const [showFollowUp, setShowFollowUp] = useState(false);
    const [feedbackGiven, setFeedbackGiven] = useState<'helpful' | 'not_helpful' | null>(null);
    const [showFeedbackThanks, setShowFeedbackThanks] = useState(false);

    // Handle ESC key to close panel
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape' && isOpen) {
            onClose();
        }
    }, [isOpen, onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    // Reset animation state when panel opens with new data
    useEffect(() => {
        if (isOpen && data) {
            setAnimatedResponses(new Set());
            setFeedbackGiven(null);
            setShowFeedbackThanks(false);
        }
    }, [isOpen, data]);

    // Handle feedback submission
    const handleFeedback = (type: 'helpful' | 'not_helpful') => {
        setFeedbackGiven(type);
        setShowFeedbackThanks(true);
        // Log feedback for analytics (could be sent to backend)
        console.log('User feedback:', { type, topic: displayTitle, timestamp: new Date().toISOString() });
        // Hide thanks message after 2 seconds
        setTimeout(() => setShowFeedbackThanks(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Panel - Full screen on mobile, side drawer on desktop */}
            <div className="fixed inset-0 sm:inset-auto sm:right-0 sm:top-0 sm:h-full sm:w-full sm:max-w-2xl bg-gray-900/95 backdrop-blur-lg sm:border-l border-white/10 z-50 overflow-hidden flex flex-col animate-slide-in-right sm:animate-slide-in-right">
                {/* Header - Responsive */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 safe-area-top">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-white truncate">{displayTitle}</h2>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1 truncate">
                            {loading ? loadingSubtitle : subtitle}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-3 p-2.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
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

                {/* Content - Responsive padding */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Error State */}
                    {analysisError && (
                        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                            <p className="text-red-400">{analysisError}</p>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                                <div>
                                    <p className="text-white font-medium">
                                        {currentAgent
                                            ? `${INVESTMENT_MASTERS.find((a) => a.id === currentAgent)?.fullName || currentAgent} is thinking...`
                                            : "Gathering insights from the Board..."}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        Each master analyzes from their unique perspective
                                    </p>
                                </div>
                            </div>
                            {/* Skeleton Loaders */}
                            {INVESTMENT_MASTERS.map((master) => (
                                <div
                                    key={master.id}
                                    className={`p-4 rounded-xl border ${master.borderColor} ${master.bgColor} opacity-50`}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${master.color} flex items-center justify-center text-lg`}>
                                            {master.emoji}
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
                    {data && !loading && (
                        <div className="space-y-4">
                            {/* Market Context (optional) */}
                            {marketContext && (
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <h3 className="text-sm font-medium text-gray-400 mb-3">
                                        Market Context
                                    </h3>
                                    {marketContext}
                                </div>
                            )}

                            {/* Investment Master Responses - Support both formats */}
                            {data.perspectives ? (
                                // New format: perspectives array
                                data.perspectives.map((perspective, index) => {
                                    const master = INVESTMENT_MASTERS.find(m => m.id === perspective.persona);
                                    if (!master) return null;

                                    return (
                                        <div
                                            key={perspective.persona}
                                            className={`p-4 rounded-xl border ${master.borderColor} ${master.bgColor} transform transition-all duration-500`}
                                            style={{
                                                animationDelay: `${index * 150}ms`,
                                            }}
                                        >
                                            <div className="flex items-center gap-3 mb-4">
                                                <div
                                                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${master.color} flex items-center justify-center text-xl shadow-lg`}
                                                >
                                                    {master.emoji}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">
                                                        {master.subtitle}
                                                    </p>
                                                    <p className="text-sm text-gray-400">
                                                        {master.fullName}
                                                    </p>
                                                </div>
                                                <div className="ml-auto text-right">
                                                    <p className="text-xs text-gray-500">
                                                        {master.focus}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                                {enableTypewriter && !animatedResponses.has(perspective.persona) ? (
                                                    <TypewriterText
                                                        text={perspective.analysis}
                                                        speed={10}
                                                        onComplete={() => setAnimatedResponses(prev => new Set([...prev, perspective.persona]))}
                                                    />
                                                ) : (
                                                    perspective.analysis
                                                )}
                                            </p>
                                        </div>
                                    );
                                })
                            ) : (
                                // Legacy format: individual response fields
                                INVESTMENT_MASTERS.map((master, index) => {
                                    const responseKey = `${master.id}_response` as keyof AnalysisResult;
                                    const response = data[responseKey];

                                    if (!response || typeof response !== 'string') return null;

                                    return (
                                        <div
                                            key={master.id}
                                            className={`p-4 rounded-xl border ${master.borderColor} ${master.bgColor} transform transition-all duration-500`}
                                            style={{
                                                animationDelay: `${index * 150}ms`,
                                            }}
                                        >
                                            <div className="flex items-center gap-3 mb-4">
                                                <div
                                                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${master.color} flex items-center justify-center text-xl shadow-lg`}
                                                >
                                                    {master.emoji}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">
                                                        {master.subtitle}
                                                    </p>
                                                    <p className="text-sm text-gray-400">
                                                        {master.fullName}
                                                    </p>
                                                </div>
                                                <div className="ml-auto text-right">
                                                    <p className="text-xs text-gray-500">
                                                        {master.focus}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                                {enableTypewriter && !animatedResponses.has(master.id) ? (
                                                    <TypewriterText
                                                        text={response as string}
                                                        speed={10}
                                                        onComplete={() => setAnimatedResponses(prev => new Set([...prev, master.id]))}
                                                    />
                                                ) : (
                                                    response
                                                )}
                                            </p>
                                        </div>
                                    );
                                })
                            )}

                            {/* Synthesis */}
                            {data.synthesis && (
                                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-xl">🎯</span>
                                        <h3 className="font-bold text-white">Board Synthesis</h3>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                        {enableTypewriter && !animatedResponses.has('synthesis') ? (
                                            <TypewriterText
                                                text={data.synthesis}
                                                speed={10}
                                                onComplete={() => setAnimatedResponses(prev => new Set([...prev, 'synthesis']))}
                                            />
                                        ) : (
                                            data.synthesis
                                        )}
                                    </p>
                                </div>
                            )}

                            {/* Response Rating */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-400">Was this analysis helpful?</p>
                                    {showFeedbackThanks ? (
                                        <span className="text-sm text-green-400 animate-pulse">Thanks for your feedback!</span>
                                    ) : feedbackGiven ? (
                                        <span className="text-sm text-gray-500">
                                            You rated this as {feedbackGiven === 'helpful' ? '👍 helpful' : '👎 not helpful'}
                                        </span>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleFeedback('helpful')}
                                                className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 rounded-lg text-sm transition-colors flex items-center gap-1"
                                            >
                                                <span>👍</span> Helpful
                                            </button>
                                            <button
                                                onClick={() => handleFeedback('not_helpful')}
                                                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg text-sm transition-colors flex items-center gap-1"
                                            >
                                                <span>👎</span> Not Helpful
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer - Responsive with safe area */}
                <div className="p-3 sm:p-4 border-t border-white/10 space-y-2 sm:space-y-3 safe-area-bottom">
                    {/* Follow-up Question Section */}
                    {data && !loading && onFollowUp && (
                        <div className="space-y-2">
                            {showFollowUp ? (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={followUpQuestion}
                                        onChange={(e) => setFollowUpQuestion(e.target.value)}
                                        placeholder="Ask a follow-up question..."
                                        className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 bg-white/5 border border-white/20 rounded-xl text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && followUpQuestion.trim()) {
                                                onFollowUp(followUpQuestion);
                                                setFollowUpQuestion("");
                                                setShowFollowUp(false);
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            if (followUpQuestion.trim()) {
                                                onFollowUp(followUpQuestion);
                                                setFollowUpQuestion("");
                                                setShowFollowUp(false);
                                            }
                                        }}
                                        disabled={!followUpQuestion.trim()}
                                        className="px-3 sm:px-4 py-2.5 sm:py-2 bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-colors touch-manipulation text-sm sm:text-base"
                                    >
                                        Ask
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowFollowUp(false);
                                            setFollowUpQuestion("");
                                        }}
                                        className="px-3 py-2.5 sm:py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-gray-400 rounded-xl transition-colors touch-manipulation"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowFollowUp(true)}
                                    className="w-full py-2.5 sm:py-2 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 hover:from-cyan-600/30 hover:to-purple-600/30 active:from-cyan-600/40 active:to-purple-600/40 border border-cyan-500/30 text-cyan-400 rounded-xl transition-colors flex items-center justify-center gap-2 touch-manipulation text-sm sm:text-base"
                                >
                                    <span>💬</span>
                                    Ask Follow-up Question
                                </button>
                            )}
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="w-full py-3.5 sm:py-3 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl transition-colors touch-manipulation text-sm sm:text-base font-medium"
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
                @keyframes slide-up {
                    from {
                        transform: translateY(100%);
                    }
                    to {
                        transform: translateY(0);
                    }
                }
                .animate-slide-in-right {
                    animation: slide-up 0.3s ease-out forwards;
                }
                @media (min-width: 640px) {
                    .animate-slide-in-right {
                        animation: slide-in-right 0.3s ease-out forwards;
                    }
                }
                .safe-area-top {
                    padding-top: max(1rem, env(safe-area-inset-top));
                }
                .safe-area-bottom {
                    padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
                }
            `}</style>
        </>
    );
}
