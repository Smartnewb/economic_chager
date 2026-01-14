"use client";

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Info } from 'lucide-react';
import { HelpTooltip } from '@/components/ui/HelpTooltip';

interface CarryTrade {
  pair: string;
  direction: 'long' | 'short';
  base_rate: number;
  quote_rate: number;
  rate_differential: number;
  carry_return: number;
  volatility_estimate: number;
  risk_adjusted_return: number;
  current_rate: number;
  recommendation: 'strong' | 'moderate' | 'weak';
}

export default function CarryTradeAnalysis() {
  const [trades, setTrades] = useState<CarryTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCarryTrades = async () => {
      try {
        const response = await fetch('/api/fx/carry-trades');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setTrades(data);
      } catch (err) {
        console.error('Error fetching carry trades:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCarryTrades();
  }, []);

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'strong':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'moderate':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0f1117] rounded-xl border border-white/5 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0f1117] rounded-xl border border-white/5 p-6">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-xl font-bold text-white">Carry Trade Opportunities</h2>
        <HelpTooltip
          title="Carry Trade"
          content="Borrow in low-interest currency, invest in high-interest currency. Profit comes from interest rate differential, but currency fluctuations can offset gains."
        />
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p className="font-semibold text-blue-400 mb-1">How to read this</p>
            <p>
              <strong>Long</strong> = Buy base currency (high rate), <strong>Short</strong> = Sell base currency (low rate).
              Risk-adjusted return accounts for estimated volatility.
            </p>
          </div>
        </div>
      </div>

      {/* Carry Trade Cards */}
      <div className="space-y-4">
        {trades.slice(0, 6).map((trade) => (
          <div
            key={trade.pair}
            className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-white">{trade.pair}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  trade.direction === 'long'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {trade.direction.toUpperCase()}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRecommendationColor(trade.recommendation)}`}>
                {trade.recommendation.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Rate Diff</span>
                <div className="font-mono font-semibold text-white">
                  {trade.rate_differential.toFixed(2)}%
                </div>
              </div>
              <div>
                <span className="text-gray-500">Carry Return</span>
                <div className={`font-mono font-semibold ${
                  trade.carry_return > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {trade.carry_return > 0 ? '+' : ''}{trade.carry_return.toFixed(2)}%
                </div>
              </div>
              <div>
                <span className="text-gray-500">Volatility Est.</span>
                <div className="font-mono font-semibold text-amber-400">
                  {trade.volatility_estimate.toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="text-gray-500">Risk-Adj Return</span>
                <div className={`font-mono font-semibold ${
                  trade.risk_adjusted_return > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {trade.risk_adjusted_return > 0 ? '+' : ''}{trade.risk_adjusted_return.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Interest Rates Bar */}
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Base Rate:</span>
                  <span className="font-mono text-white">{trade.base_rate.toFixed(2)}%</span>
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-1 bg-gray-700 rounded-full relative">
                    <div
                      className="absolute h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, trade.rate_differential * 10 + 50)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Quote Rate:</span>
                  <span className="font-mono text-white">{trade.quote_rate.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Risk Warning */}
      <div className="mt-6 flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
        <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
        <div className="text-sm text-gray-300">
          <p className="font-semibold text-amber-400 mb-1">Risk Warning</p>
          <p>
            Carry trades can suffer sudden losses during risk-off events when high-yield currencies depreciate sharply.
            Always consider your risk tolerance and use proper position sizing.
          </p>
        </div>
      </div>
    </div>
  );
}
