"use client";

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CurrencyStrength {
  currency: string;
  strength: number;
  change: number;
  rank: number;
  trend: 'strong' | 'weak' | 'neutral';
}

const FLAG_EMOJIS: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  JPY: '🇯🇵',
  CHF: '🇨🇭',
  AUD: '🇦🇺',
  CAD: '🇨🇦',
  NZD: '🇳🇿',
};

const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  CHF: 'Swiss Franc',
  AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar',
  NZD: 'New Zealand Dollar',
};

export default function CurrencyStrengthHeatmap() {
  const [strengths, setStrengths] = useState<Record<string, CurrencyStrength>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStrength = async () => {
      try {
        const response = await fetch('/api/fx/currency-strength');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setStrengths(data);
      } catch (err) {
        console.error('Error fetching currency strength:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStrength();
    const interval = setInterval(fetchStrength, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStrengthColor = (strength: number) => {
    if (strength >= 70) return 'from-green-500 to-emerald-600';
    if (strength >= 55) return 'from-green-400/50 to-emerald-500/50';
    if (strength >= 45) return 'from-gray-500/50 to-gray-600/50';
    if (strength >= 30) return 'from-red-400/50 to-rose-500/50';
    return 'from-red-500 to-rose-600';
  };

  const getStrengthBorderColor = (strength: number) => {
    if (strength >= 70) return 'border-green-500/50';
    if (strength >= 55) return 'border-green-400/30';
    if (strength >= 45) return 'border-gray-500/30';
    if (strength >= 30) return 'border-red-400/30';
    return 'border-red-500/50';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'strong':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'weak':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
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

  const sortedCurrencies = Object.values(strengths).sort((a, b) => a.rank - b.rank);

  return (
    <div className="bg-[#0f1117] rounded-xl border border-white/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Currency Strength</h2>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-gray-400">Strong</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-500" />
            <span className="text-gray-400">Neutral</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-gray-400">Weak</span>
          </div>
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="space-y-4">
        {sortedCurrencies.map((curr) => (
          <div key={curr.currency} className="flex items-center gap-4">
            {/* Currency Info */}
            <div className="w-32 flex items-center gap-2">
              <span className="text-xl">{FLAG_EMOJIS[curr.currency]}</span>
              <div>
                <div className="font-semibold text-white">{curr.currency}</div>
                <div className="text-xs text-gray-500 truncate">
                  {CURRENCY_NAMES[curr.currency]}
                </div>
              </div>
            </div>

            {/* Strength Bar */}
            <div className="flex-1">
              <div className="h-8 bg-gray-800/50 rounded-lg overflow-hidden relative">
                <div
                  className={`h-full bg-gradient-to-r ${getStrengthColor(curr.strength)} transition-all duration-500`}
                  style={{ width: `${curr.strength}%` }}
                />
                <div className="absolute inset-0 flex items-center px-3">
                  <span className="font-mono font-bold text-white text-sm drop-shadow-lg">
                    {curr.strength.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Rank Badge */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              curr.rank === 1 ? 'bg-amber-500/20 text-amber-400' :
              curr.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
              curr.rank === 3 ? 'bg-orange-700/20 text-orange-400' :
              'bg-gray-800 text-gray-500'
            }`}>
              {curr.rank}
            </div>

            {/* Trend */}
            <div className="w-12 flex items-center justify-center">
              {getTrendIcon(curr.trend)}
            </div>

            {/* Change */}
            <div className={`w-16 text-right font-mono text-sm ${
              curr.change > 0 ? 'text-green-400' :
              curr.change < 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
              {curr.change > 0 ? '+' : ''}{curr.change.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>

      {/* Interpretation */}
      <div className="mt-6 pt-4 border-t border-white/5">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-sm text-gray-300">
            <strong className="text-blue-400">Interpretation:</strong>{' '}
            {sortedCurrencies[0]?.currency && sortedCurrencies[sortedCurrencies.length - 1]?.currency ? (
              <>
                <span className="text-green-400">{sortedCurrencies[0].currency}</span> is currently the strongest currency,
                while <span className="text-red-400">{sortedCurrencies[sortedCurrencies.length - 1].currency}</span> is the weakest.
                This suggests {sortedCurrencies[0].currency === 'USD' || sortedCurrencies[0].currency === 'JPY' || sortedCurrencies[0].currency === 'CHF'
                  ? 'risk-off sentiment in the market.'
                  : 'risk-on appetite among traders.'}
              </>
            ) : (
              'Loading market sentiment...'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
