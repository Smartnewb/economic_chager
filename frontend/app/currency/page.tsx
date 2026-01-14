"use client";

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import MajorCurrencyPairs from '@/components/fx/MajorCurrencyPairs';
import CurrencyStrengthHeatmap from '@/components/fx/CurrencyStrengthHeatmap';
import CarryTradeAnalysis from '@/components/fx/CarryTradeAnalysis';
import CentralBankCalendar from '@/components/fx/CentralBankCalendar';
import { AnalysisTriggerButton, AnalysisPanel, AnalysisResult } from '@/components/ui';

export default function CurrencyPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [selectedPair, setSelectedPair] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      // First check for cached analysis
      const cachedResponse = await fetch(`/api/analyze/fx/cached?language=ko&selected_pair=${selectedPair || 'USD/JPY'}`);
      const cachedData = await cachedResponse.json();

      if (cachedData.cached && cachedData.result) {
        setAnalysisResult(cachedData.result);
        setShowPanel(true);
        setIsAnalyzing(false);
        return;
      }

      // No cache, fetch fresh analysis
      const response = await fetch('/api/analyze/fx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dollar_index: 104.5,
          dollar_trend: 'strengthening',
          selected_pair: selectedPair || 'USD/JPY',
          risk_sentiment: 'mixed',
          major_pairs: [],
          language: 'ko',
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');
      const data = await response.json();
      setAnalysisResult(data);
      setShowPanel(true);
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePairClick = (pair: string) => {
    setSelectedPair(pair);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <Navigation />

      <div className="pt-20 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Currency & FX Analysis
                </h1>
                <p className="text-gray-400">
                  Real-time foreign exchange rates, currency strength, and carry trade opportunities
                </p>
              </div>

              <AnalysisTriggerButton
                isLoading={isAnalyzing}
                onClick={handleAnalyze}
                variant="primary"
                label="Analyze FX Market"
              />
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="space-y-8">
            {/* Major Currency Pairs */}
            <section>
              <MajorCurrencyPairs onPairClick={handlePairClick} />
            </section>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Currency Strength */}
              <section>
                <CurrencyStrengthHeatmap />
              </section>

              {/* Central Bank Calendar */}
              <section>
                <CentralBankCalendar />
              </section>
            </div>

            {/* Carry Trade Analysis - Full Width */}
            <section>
              <CarryTradeAnalysis />
            </section>

            {/* Key Insights */}
            <section className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20 p-6">
              <h2 className="text-xl font-bold text-white mb-4">FX Trading Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-emerald-400 font-semibold mb-2">💡 DXY Interpretation</h3>
                  <p className="text-sm text-gray-300">
                    When DXY rises, it means USD is strengthening against major currencies.
                    This typically signals <strong>risk-off sentiment</strong> in global markets.
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-emerald-400 font-semibold mb-2">🔄 Carry Trade Strategy</h3>
                  <p className="text-sm text-gray-300">
                    Borrow in low-yield currency (JPY, CHF), invest in high-yield (AUD, NZD).
                    Watch for <strong>risk-off events</strong> that can unwind trades rapidly.
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-emerald-400 font-semibold mb-2">🏦 Central Bank Impact</h3>
                  <p className="text-sm text-gray-300">
                    Interest rate decisions drive currency strength.
                    <strong>Higher rates = Stronger currency</strong> as investors seek yield.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Analysis Panel */}
      <AnalysisPanel
        isOpen={showPanel}
        onClose={() => setShowPanel(false)}
        result={analysisResult}
        title="FX Market Analysis"
        moduleType="fx"
      />
    </main>
  );
}
