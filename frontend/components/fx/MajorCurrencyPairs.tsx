"use client";

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';

interface CurrencyPair {
  pair: string;
  base: string;
  quote: string;
  rate: number;
  change_24h: number;
  high_24h: number;
  low_24h: number;
  bid: number;
  ask: number;
  trend: 'up' | 'down' | 'neutral';
}

interface MajorCurrencyPairsProps {
  onPairClick?: (pair: string) => void;
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
  KRW: '🇰🇷',
  CNY: '🇨🇳',
  DXY: '💵',
  BASKET: '🌐',
};

export default function MajorCurrencyPairs({ onPairClick }: MajorCurrencyPairsProps) {
  const [pairs, setPairs] = useState<Record<string, CurrencyPair>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPairs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/fx/live-pairs');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setPairs(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to load currency data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPairs();
    const interval = setInterval(fetchPairs, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const renderTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  if (loading && Object.keys(pairs).length === 0) {
    return (
      <div className="bg-[#0f1117] rounded-xl border border-white/5 p-6">
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const majorPairs = Object.entries(pairs).filter(([key]) => key !== 'DXY');
  const dxy = pairs['DXY'];

  return (
    <div className="space-y-4">
      {/* DXY Card - Dollar Index */}
      {dxy && (
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💵</span>
              <div>
                <h3 className="text-lg font-bold text-white">US Dollar Index (DXY)</h3>
                <p className="text-sm text-gray-400">Dollar strength vs major currencies basket</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-mono font-bold text-white">
                {dxy.rate?.toFixed(2)}
              </div>
              <div className={`flex items-center justify-end gap-1 ${getChangeColor(dxy.change_24h)}`}>
                {renderTrendIcon(dxy.trend)}
                <span className="font-mono">
                  {dxy.change_24h > 0 ? '+' : ''}{dxy.change_24h?.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">24h High</span>
              <span className="font-mono text-white">{dxy.high_24h?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">24h Low</span>
              <span className="font-mono text-white">{dxy.low_24h?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Major Currency Pairs</h2>
        <button
          onClick={fetchPairs}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Last update time */}
      {lastUpdate && (
        <p className="text-xs text-gray-500">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      )}

      {/* Currency Pairs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {majorPairs.map(([key, pair]) => (
          <div
            key={key}
            onClick={() => onPairClick?.(key)}
            className="bg-[#0f1117] rounded-xl border border-white/5 p-4 hover:border-white/10 hover:bg-white/5 transition-all cursor-pointer"
          >
            {/* Pair Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{FLAG_EMOJIS[pair.base] || '🏳️'}</span>
                <span className="text-lg">{FLAG_EMOJIS[pair.quote] || '🏳️'}</span>
                <span className="font-semibold text-white">{pair.pair}</span>
              </div>
              {renderTrendIcon(pair.trend)}
            </div>

            {/* Rate */}
            <div className="text-2xl font-mono font-bold text-white mb-2">
              {pair.rate?.toFixed(4)}
            </div>

            {/* Change */}
            <div className={`text-sm font-mono ${getChangeColor(pair.change_24h)} mb-3`}>
              {pair.change_24h > 0 ? '+' : ''}{pair.change_24h?.toFixed(2)}%
            </div>

            {/* Bid/Ask */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Bid</span>
                <span className="font-mono text-gray-300 ml-2">{pair.bid?.toFixed(4)}</span>
              </div>
              <div>
                <span className="text-gray-500">Ask</span>
                <span className="font-mono text-gray-300 ml-2">{pair.ask?.toFixed(4)}</span>
              </div>
            </div>

            {/* High/Low bar */}
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Low: {pair.low_24h?.toFixed(4)}</span>
                <span>High: {pair.high_24h?.toFixed(4)}</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full relative">
                <div
                  className="absolute h-full bg-gradient-to-r from-red-500 via-gray-500 to-green-500 rounded-full"
                  style={{ width: '100%' }}
                />
                {pair.high_24h !== pair.low_24h && (
                  <div
                    className="absolute w-2 h-2 bg-white rounded-full -top-0.5 transform -translate-x-1/2"
                    style={{
                      left: `${((pair.rate - pair.low_24h) / (pair.high_24h - pair.low_24h)) * 100}%`
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="text-center py-4 text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
