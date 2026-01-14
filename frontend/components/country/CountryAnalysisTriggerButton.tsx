"use client";

import { useCountryStore } from "@/store/countryStore";
import { useI18n } from "@/lib/i18n";

export default function CountryAnalysisTriggerButton() {
    const { triggerAnalysis, openAnalysisPanel, isAnalyzing, countryData, analysisResult } = useCountryStore();
    const { language } = useI18n();

    if (!countryData) return null;

    const handleAnalysis = () => {
        // If we already have analysis result, just open the panel
        if (analysisResult) {
            openAnalysisPanel();
        } else {
            triggerAnalysis(language);
        }
    };

    return (
        <button
            onClick={handleAnalysis}
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
                            Analyzing {countryData.profile.name}...
                        </span>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-3xl">{analysisResult ? "📊" : "🔬"}</span>
                            <span className="text-xl font-bold text-white">
                                {analysisResult ? "View" : "Analyze"} {countryData.profile.flag} {countryData.profile.name}
                            </span>
                        </div>
                        <p className="text-sm text-white/70 mb-4 text-left">
                            {analysisResult
                                ? "View the AI Board's analysis of this country's economic health"
                                : "Four investment legends analyze this country: Kostolany, Buffett, Munger, and Dalio"
                            }
                        </p>

                        {/* Quick preview */}
                        <div className="flex flex-wrap gap-3 text-xs">
                            <div className="px-3 py-1 bg-white/10 rounded-full">
                                Grade: <span className="font-bold">{countryData.overallGrade}</span>
                            </div>
                            <div className="px-3 py-1 bg-white/10 rounded-full">
                                Score: <span className="font-bold">{countryData.overallScore}/100</span>
                            </div>
                            <div className={`px-3 py-1 rounded-full ${
                                countryData.policy.status === "hiking"
                                    ? "bg-red-500/20 text-red-300"
                                    : countryData.policy.status === "cutting"
                                      ? "bg-blue-500/20 text-blue-300"
                                      : "bg-yellow-500/20 text-yellow-300"
                            }`}>
                                Policy: {countryData.policy.status}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </button>
    );
}
