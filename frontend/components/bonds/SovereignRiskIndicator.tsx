"use client";

import { useEffect, useState } from 'react';

interface SovereignCDS {
  country_code: string;
  country_name: string;
  flag: string;
  rating: string;
  cds_spread: number;
  change_24h: number;
  risk_level: string;
}

interface CDSResponse {
  sovereign_cds: SovereignCDS[];
  timestamp: string;
}

interface Props {
  onCountrySelect?: (countryCode: string) => void;
}

export default function SovereignRiskIndicator({ onCountrySelect }: Props) {
  const [data, setData] = useState<CDSResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'risk' | 'change' | 'name'>('risk');

  useEffect(() => {
    fetchCDSData();
  }, []);

  const fetchCDSData = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/bonds/sovereign-cds');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch CDS data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string): string => {
    switch (level) {
      case 'low': return 'text-green-400 bg-green-500/10';
      case 'moderate': return 'text-yellow-400 bg-yellow-500/10';
      case 'elevated': return 'text-orange-400 bg-orange-500/10';
      case 'high': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getCDSBarColor = (spread: number): string => {
    if (spread < 30) return 'bg-green-500';
    if (spread < 60) return 'bg-yellow-500';
    if (spread < 100) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const sortedCDS = [...(data?.sovereign_cds || [])].sort((a, b) => {
    if (sortBy === 'risk') return a.cds_spread - b.cds_spread;
    if (sortBy === 'change') return Math.abs(b.change_24h) - Math.abs(a.change_24h);
    return a.country_name.localeCompare(b.country_name);
  });

  const maxSpread = Math.max(...(data?.sovereign_cds.map(c => c.cds_spread) || [100]));

  if (loading) {
    return (
      <div className="bg-[#111116] border border-[#27272a] rounded-lg p-4">
        <div className="h-8 w-48 bg-gray-700 rounded animate-pulse mb-4"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 bg-gray-800 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111116] border border-[#27272a] rounded-lg p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
          SOVEREIGN CDS SPREADS
          <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20">
            Credit Risk
          </span>
        </h3>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'risk' | 'change' | 'name')}
          className="bg-[#0a0a0f] border border-[#27272a] rounded px-2 py-1 text-xs text-gray-300"
        >
          <option value="risk">Sort by Risk (Low to High)</option>
          <option value="change">Sort by Change</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      <div className="space-y-2">
        {sortedCDS.map((country) => (
          <div
            key={country.country_code}
            className="p-2 rounded bg-[#0a0a0f] border border-[#27272a] hover:border-[#3f3f46] cursor-pointer transition-colors"
            onClick={() => onCountrySelect?.(country.country_code)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{country.flag}</span>
                <div>
                  <span className="text-xs font-medium text-white">{country.country_code}</span>
                  <span className="text-[10px] text-gray-500 ml-2">{country.country_name}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded ${getRiskColor(country.risk_level)}`}>
                  {country.risk_level.toUpperCase()}
                </span>
                <span className="text-xs font-mono text-gray-400">{country.rating}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-[#1a1a20] rounded-full overflow-hidden">
                <div
                  className={`h-full ${getCDSBarColor(country.cds_spread)} transition-all`}
                  style={{ width: `${(country.cds_spread / maxSpread) * 100}%` }}
                />
              </div>
              <div className="text-right min-w-[80px]">
                <span className="text-xs font-mono text-white font-bold">{country.cds_spread}</span>
                <span className="text-[10px] text-gray-500 ml-1">bps</span>
                <span className={`text-[10px] ml-2 ${country.change_24h >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {country.change_24h >= 0 ? '+' : ''}{country.change_24h}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
        <h4 className="text-[10px] font-bold text-gray-400 mb-2">UNDERSTANDING CDS SPREADS</h4>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-green-500"></span>
            <span>&lt; 30 bps - Very Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-yellow-500"></span>
            <span>30-60 bps - Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-orange-500"></span>
            <span>60-100 bps - Moderate Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-red-500"></span>
            <span>&gt; 100 bps - Elevated Risk</span>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-gray-500">
          CDS (Credit Default Swap) spread indicates the cost to insure against sovereign default.
          Higher spreads = higher perceived default risk.
        </p>
      </div>
    </div>
  );
}
