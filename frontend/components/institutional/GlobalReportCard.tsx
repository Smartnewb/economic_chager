"use client";

import { useEffect } from "react";
import { useInstitutionalStore } from "@/store/institutionalStore";

interface GlobalReportCardProps {
    countryCode: string;
}

export default function GlobalReportCard({ countryCode }: GlobalReportCardProps) {
    const { reportCard, isLoadingReportCard, fetchReportCard } = useInstitutionalStore();

    useEffect(() => {
        if (countryCode) {
            fetchReportCard(countryCode);
        }
    }, [countryCode, fetchReportCard]);

    if (isLoadingReportCard) {
        return (
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-slate-700 rounded w-1/3"></div>
                    <div className="h-20 bg-slate-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (!reportCard) {
        return null;
    }

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case "bullish": return "text-green-400 bg-green-400/10";
            case "bearish": return "text-red-400 bg-red-400/10";
            default: return "text-yellow-400 bg-yellow-400/10";
        }
    };

    const getConsensusLabel = (consensus: string) => {
        switch (consensus) {
            case "bullish": return "Institutions are Optimistic";
            case "bearish": return "Institutions are Cautious";
            default: return "Mixed Institutional Views";
        }
    };

    return (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="text-2xl">🏛️</span>
                    Global Report Card
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(reportCard.consensus_view)}`}>
                    {getConsensusLabel(reportCard.consensus_view)}
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-slate-400 border-b border-slate-700">
                            <th className="text-left py-2 px-2">Institution</th>
                            <th className="text-left py-2 px-2">Last Report</th>
                            <th className="text-left py-2 px-2">Key Keywords</th>
                            <th className="text-center py-2 px-2">Sentiment</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportCard.report_cards.map((card, idx) => (
                            <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                <td className="py-3 px-2 font-medium text-white">{card.institution}</td>
                                <td className="py-3 px-2 text-slate-400">{card.last_report_date}</td>
                                <td className="py-3 px-2">
                                    <div className="flex flex-wrap gap-1">
                                        {card.key_keywords.map((kw, i) => (
                                            <span key={i} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="py-3 px-2 text-center">
                                    <span className={`px-2 py-1 rounded ${getSentimentColor(card.sentiment)}`}>
                                        {card.sentiment_icon} {card.sentiment}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-slate-500 mt-4">
                Data aggregated from IMF WEO, OECD Economic Outlook, and major rating agencies.
            </p>
        </div>
    );
}
