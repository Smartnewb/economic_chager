"use client";

import { InsightAnalysisResult, InsightArticle } from "@/store/insightStore";

interface InsightAnalysisPanelProps {
  article: InsightArticle | null;
  result: InsightAnalysisResult | null;
  isAnalyzing: boolean;
  error: string | null;
  onClose: () => void;
}

export default function InsightAnalysisPanel({
  article,
  result,
  isAnalyzing,
  error,
  onClose,
}: InsightAnalysisPanelProps) {
  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-[#0a0a0f]/95 backdrop-blur-xl border-l border-white/10 z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-xl">{article?.source_icon || "📰"}</span>
          <div>
            <h2 className="text-sm font-bold text-white">AI Analysis</h2>
            <p className="text-xs text-white/50">{article?.source}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-white/60 text-sm">Translating complex report...</p>
            <p className="text-white/40 text-xs">Making it easy to understand</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <span className="text-4xl">⚠️</span>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : result ? (
          <div className="space-y-4">
            {/* Original Title */}
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/40 mb-1">Original Title</p>
              <p className="text-sm text-white/80">{article?.title}</p>
            </div>

            {/* AI Synthesis - Render as formatted text */}
            <div className="prose prose-invert prose-sm max-w-none">
              <div
                className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: result.synthesis
                    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-white mt-6 mb-3">$1</h2>')
                    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-white/90 mt-4 mb-2">$1</h3>')
                    .replace(/^\- (.+)$/gm, '<li class="text-white/70 ml-4">$1</li>')
                    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                    .replace(/\n\n/g, '<br/><br/>')
                }}
              />
            </div>

            {/* Original Link */}
            <div className="pt-4 border-t border-white/10">
              <a
                href={article?.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>Read Original Report</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <span className="text-4xl">📖</span>
            <p className="text-white/60 text-sm">Select an article to analyze</p>
          </div>
        )}
      </div>
    </div>
  );
}
