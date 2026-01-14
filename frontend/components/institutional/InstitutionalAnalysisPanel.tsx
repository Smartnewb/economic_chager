"use client";

import { useInstitutionalStore } from "@/store/institutionalStore";
import ReactMarkdown from "react-markdown";

interface InstitutionalAnalysisPanelProps {
    countryCode: string;
    countryName: string;
    language?: string;
}

export default function InstitutionalAnalysisPanel({ countryCode, countryName, language = "en" }: InstitutionalAnalysisPanelProps) {
    const {
        imfOutlook,
        analysisResult,
        isAnalyzing,
        currentAgent,
        runInstitutionalAnalysis,
        error,
    } = useInstitutionalStore();

    const handleAnalyze = () => {
        runInstitutionalAnalysis(countryCode, countryName, language);
    };

    return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="text-2xl">🧠</span>
                        Institutional Intelligence Analysis
                    </h3>
                    <p className="text-sm text-slate-400">
                        Contrarian (Soros) vs Structural (Dalio) perspectives on IMF data
                    </p>
                </div>

                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !imfOutlook}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        isAnalyzing
                            ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-500 text-white"
                    }`}
                >
                    {isAnalyzing ? (
                        <span className="flex items-center gap-2">
                            <span className="animate-spin">⚙️</span>
                            {currentAgent === "soros" ? "Soros analyzing..." : "Dalio analyzing..."}
                        </span>
                    ) : (
                        "Run Analysis"
                    )}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-500/10 border-b border-red-500/30">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Agent Progress */}
            {isAnalyzing && (
                <div className="p-4 border-b border-slate-700">
                    <div className="flex items-center gap-4">
                        <AgentIndicator
                            name="Soros"
                            icon="🦅"
                            active={currentAgent === "soros"}
                            complete={currentAgent === "dalio" || !!analysisResult}
                        />
                        <div className="flex-1 h-0.5 bg-slate-700">
                            <div
                                className={`h-full bg-blue-500 transition-all duration-1000 ${
                                    currentAgent === "dalio" ? "w-full" : "w-0"
                                }`}
                            />
                        </div>
                        <AgentIndicator
                            name="Dalio"
                            icon="⚙️"
                            active={currentAgent === "dalio"}
                            complete={!!analysisResult}
                        />
                    </div>
                </div>
            )}

            {/* Results */}
            {analysisResult && (
                <div className="p-4 space-y-6">
                    {/* Soros View */}
                    <PersonaCard
                        name="George Soros"
                        icon="🦅"
                        subtitle="Contrarian View - Reflexivity Theory"
                        accentColor="purple"
                        content={analysisResult.soros_response}
                    />

                    {/* Dalio View */}
                    <PersonaCard
                        name="Ray Dalio"
                        icon="⚙️"
                        subtitle="Structural View - Economic Machine"
                        accentColor="blue"
                        content={analysisResult.dalio_response}
                    />

                    {/* Synthesis */}
                    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-slate-600 rounded-xl p-4">
                        <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <span>⚖️</span> Balanced Synthesis
                        </h4>
                        <div className="prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown>{analysisResult.synthesis}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!analysisResult && !isAnalyzing && (
                <div className="p-8 text-center">
                    <p className="text-slate-400">
                        {imfOutlook
                            ? "Click 'Run Analysis' to get Soros & Dalio's perspectives on IMF data"
                            : "Loading IMF data..."}
                    </p>
                </div>
            )}
        </div>
    );
}

function AgentIndicator({ name, icon, active, complete }: {
    name: string;
    icon: string;
    active: boolean;
    complete: boolean;
}) {
    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            active ? "bg-blue-500/20 text-blue-400" :
            complete ? "bg-green-500/20 text-green-400" :
            "bg-slate-700/50 text-slate-400"
        }`}>
            <span className={active ? "animate-pulse" : ""}>{icon}</span>
            <span className="text-sm font-medium">{name}</span>
            {complete && <span>✓</span>}
        </div>
    );
}

function PersonaCard({ name, icon, subtitle, accentColor, content }: {
    name: string;
    icon: string;
    subtitle: string;
    accentColor: "purple" | "blue";
    content: string;
}) {
    const borderColor = accentColor === "purple" ? "border-purple-500/30" : "border-blue-500/30";
    const bgColor = accentColor === "purple" ? "bg-purple-500/10" : "bg-blue-500/10";

    return (
        <div className={`${bgColor} border ${borderColor} rounded-xl p-4`}>
            <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{icon}</span>
                <div>
                    <h4 className="text-lg font-semibold text-white">{name}</h4>
                    <p className="text-xs text-slate-400">{subtitle}</p>
                </div>
            </div>
            <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
            </div>
        </div>
    );
}
