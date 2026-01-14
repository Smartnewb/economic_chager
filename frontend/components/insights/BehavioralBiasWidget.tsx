"use client";

import { BehavioralBias } from "@/store/insightStore";

interface BehavioralBiasWidgetProps {
  bias: BehavioralBias | null;
}

export default function BehavioralBiasWidget({ bias }: BehavioralBiasWidgetProps) {
  if (!bias) return null;

  const getBgColor = (condition: string) => {
    switch (condition) {
      case "high_fear":
        return "bg-red-500/20 border-red-500/40";
      case "market_overheated":
        return "bg-orange-500/20 border-orange-500/40";
      case "low_volatility":
        return "bg-yellow-500/20 border-yellow-500/40";
      case "moderate_gains":
        return "bg-green-500/20 border-green-500/40";
      case "trending_market":
        return "bg-purple-500/20 border-purple-500/40";
      default:
        return "bg-blue-500/20 border-blue-500/40";
    }
  };

  return (
    <div className={`rounded-xl p-4 border backdrop-blur-sm ${getBgColor(bias.condition)}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{bias.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-bold text-white">{bias.name}</h4>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">
              {bias.indicator}
            </span>
          </div>
          <p className="text-sm text-white/80">{bias.warning}</p>
        </div>
      </div>
    </div>
  );
}
