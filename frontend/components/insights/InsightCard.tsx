"use client";

import { InsightArticle } from "@/store/insightStore";

interface InsightCardProps {
  article: InsightArticle;
  onSelect: (article: InsightArticle) => void;
  isSelected: boolean;
}

export default function InsightCard({ article, onSelect, isSelected }: InsightCardProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <div
      onClick={() => onSelect(article)}
      className={`
        p-4 rounded-xl cursor-pointer transition-all duration-300
        border backdrop-blur-sm
        ${isSelected
          ? "border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/20"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
        }
      `}
    >
      {/* Source Badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{article.source_icon}</span>
        <span className="text-xs text-white/60 font-medium">{article.source}</span>
        <span className="text-xs text-white/40 ml-auto">{formatDate(article.published)}</span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-white/90 line-clamp-2 mb-2">
        {article.title}
      </h3>

      {/* Summary Preview */}
      <p className="text-xs text-white/50 line-clamp-2">
        {article.summary_raw}
      </p>

      {/* Action Hint */}
      {isSelected && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <span className="text-xs text-blue-400">Click "Analyze" to get AI summary</span>
        </div>
      )}
    </div>
  );
}
