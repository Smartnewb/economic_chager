"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useFXStore } from "@/store/fxStore";
import { useDebateStore } from "@/store/debateStore";
import { useI18n } from "@/lib/i18n";
import Navigation from "@/components/Navigation";
import CurrencyPairChart from "@/components/fx/CurrencyPairChart";
import DollarIndexGauge from "@/components/fx/DollarIndexGauge";
import ScenarioInput from "@/components/ScenarioInput";
import BoardRoom from "@/components/BoardRoom";

// Dynamically import Globe to avoid SSR issues
const Globe = dynamic(() => import("@/components/Globe"), { ssr: false });

export default function Home() {
  const { fetchFXData, metrics } = useFXStore();
  const { runDebate, isLoading, reset } = useDebateStore();
  const { t } = useI18n();

  useEffect(() => {
    fetchFXData();
  }, [fetchFXData]);

  return (
    <main className="h-screen w-screen bg-[#050505] text-white overflow-hidden flex flex-col font-sans selection:bg-blue-500/30">
      {/* 1. Top Navigation Bar (Fixed Height) */}
      <Navigation
        statusIndicator={
          <div className="flex items-center gap-6 px-4 py-1.5 bg-[#111116] border border-[#27272a] rounded-md mx-4">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${metrics?.riskSentiment === "risk_on" ? "bg-amber-400 animate-pulse box-shadow-glow" : "bg-gray-600"}`} />
              <span className={`text-[10px] uppercase font-bold tracking-wider ${metrics?.riskSentiment === "risk_on" ? "text-amber-400" : "text-gray-500"}`}>Risk On</span>
            </div>
            <div className="w-px h-3 bg-gray-700"></div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${metrics?.riskSentiment === "risk_off" ? "bg-blue-400 animate-pulse box-shadow-glow" : "bg-gray-600"}`} />
              <span className={`text-[10px] uppercase font-bold tracking-wider ${metrics?.riskSentiment === "risk_off" ? "text-blue-400" : "text-gray-500"}`}>Risk Off</span>
            </div>
          </div>
        }
      />

      {/* 2. Main Dashboard Grid (Flex grow to fill rest of screen) */}
      <div className="flex-1 p-2 gap-2 grid grid-cols-12 min-h-0">

        {/* LEFT PANEL (3/12): Control & Input */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-2 min-h-0">
          {/* Scenario Input (Order Entry) */}
          <div className="flex-none">
            <ScenarioInput onSubmit={runDebate} isLoading={isLoading} />
          </div>

          {/* Market Gauge (Mini Chart) */}
          <div className="flex-1 trading-panel p-4 relative min-h-[200px] flex flex-col">
            <h3 className="text-xs text-gray-400 uppercase font-bold mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-purple-500 rounded-sm"></span>
              DXY Index Gauge
            </h3>
            <div className="flex-1 flex items-center justify-center">
              <DollarIndexGauge />
            </div>
          </div>
        </div>

        {/* CENTER PANEL (6/12): Visualization (The Map) */}
        <div className="col-span-12 lg:col-span-6 trading-panel relative overflow-hidden flex flex-col min-h-0 group">

          {/* Header Overlay */}
          <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none flex justify-between items-start">
            <div>
              <h2 className="text-sm font-bold text-white tracking-widest uppercase">Global Capital Flow</h2>
              <div className="text-[10px] text-emerald-400 font-mono mt-1">LIVE DATA FEED • 24ms LATENCY</div>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-black/50 border border-white/10 rounded text-[10px] text-gray-300 backdrop-blur">3D VIEW</span>
            </div>
          </div>

          {/* Map Container */}
          <div className="flex-1 relative bg-[#0a0a0f]">
            <Globe />

            {/* Bottom Overlay Chart - Floating */}
            <div className="absolute bottom-4 left-4 right-4 h-32 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-2 transition-transform translate-y-[calc(100%-40px)] hover:translate-y-0 duration-300 z-20">
              <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-[10px] text-gray-400 uppercase font-bold">Currency Strength</span>
                <span className="text-[10px] text-gray-600">▲ EXPAND</span>
              </div>
              {/* Simplified chart view or placeholder for now */}
              <CurrencyPairChart />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL (3/12): Intelligence & Logs */}
        <div className="col-span-12 lg:col-span-3 flex flex-col min-h-0">
          <BoardRoom onNewScenario={reset} />
        </div>

      </div>
    </main>
  );
}
