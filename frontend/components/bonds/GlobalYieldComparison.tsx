"use client";

import { useEffect, useState } from 'react';

interface CountryYield {
  country_code: string;
  country_name: string;
  flag: string;
  currency: string;
  rating: string;
  region: string;
  yields: {
    "2Y": number;
    "5Y": number;
    "10Y": number;
    "30Y": number;
  };
  changes: {
    "2Y": number;
    "5Y": number;
    "10Y": number;
    "30Y": number;
  };
  yield_10y: number;
  change_24h: number;
  trend: string;
}

interface GlobalYieldsResponse {
  countries: CountryYield[];
  timestamp: string;
  maturities: string[];
}

interface Props {
  selectedRegion?: string;
  onCountrySelect?: (countryCode: string) => void;
}

export default function GlobalYieldComparison({ selectedRegion, onCountrySelect }: Props) {
  const [data, setData] = useState<GlobalYieldsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'yield' | 'name' | 'change'>('yield');
  const [filterRegion, setFilterRegion] = useState<string>(selectedRegion || 'all');

  useEffect(() => {
    fetchGlobalYields();
  }, []);

  const fetchGlobalYields = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/bonds/global-yields');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch global yields:', err);
    } finally {
      setLoading(false);
    }
  };

  const getYieldColor = (yieldValue: number): string => {
    if (yieldValue >= 8) return 'text-red-400';
    if (yieldValue >= 5) return 'text-orange-400';
    if (yieldValue >= 3) return 'text-yellow-400';
    if (yieldValue >= 1) return 'text-green-400';
    return 'text-blue-400';
  };

  const getChangeColor = (change: number): string => {
    if (change > 0.05) return 'text-red-400';
    if (change > 0) return 'text-red-300';
    if (change < -0.05) return 'text-green-400';
    if (change < 0) return 'text-green-300';
    return 'text-gray-400';
  };

  const getRatingColor = (rating: string): string => {
    if (rating.startsWith('AAA')) return 'text-emerald-400';
    if (rating.startsWith('AA')) return 'text-green-400';
    if (rating.startsWith('A')) return 'text-yellow-400';
    if (rating.startsWith('BBB')) return 'text-orange-400';
    return 'text-red-400';
  };

  const filteredCountries = data?.countries?.filter(c =>
    filterRegion === 'all' || c.region === filterRegion
  ) || [];

  const sortedCountries = [...filteredCountries].sort((a, b) => {
    if (sortBy === 'yield') return b.yield_10y - a.yield_10y;
    if (sortBy === 'change') return Math.abs(b.change_24h) - Math.abs(a.change_24h);
    return a.country_name.localeCompare(b.country_name);
  });

  const regions = ['all', 'americas', 'europe', 'asia'];

  if (loading) {
    return (
      <div className="bg-[#111116] border border-[#27272a] rounded-lg p-4">
        <div className="h-8 w-48 bg-gray-700 rounded animate-pulse mb-4"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-gray-800 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111116] border border-[#27272a] rounded-lg p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
          GLOBAL SOVEREIGN YIELDS
          <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
            {sortedCountries.length} Countries
          </span>
        </h3>

        <div className="flex items-center gap-2">
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="bg-[#0a0a0f] border border-[#27272a] rounded px-2 py-1 text-xs text-gray-300"
          >
            {regions.map(region => (
              <option key={region} value={region}>
                {region === 'all' ? 'All Regions' : region.charAt(0).toUpperCase() + region.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'yield' | 'name' | 'change')}
            className="bg-[#0a0a0f] border border-[#27272a] rounded px-2 py-1 text-xs text-gray-300"
          >
            <option value="yield">Sort by Yield</option>
            <option value="change">Sort by Change</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-[#27272a]">
              <th className="py-2 text-left">Country</th>
              <th className="py-2 text-right">Rating</th>
              <th className="py-2 text-right">2Y</th>
              <th className="py-2 text-right">5Y</th>
              <th className="py-2 text-right">10Y</th>
              <th className="py-2 text-right">30Y</th>
              <th className="py-2 text-right">24h Chg</th>
            </tr>
          </thead>
          <tbody>
            {sortedCountries.map((country) => (
              <tr
                key={country.country_code}
                className="border-b border-[#27272a]/50 hover:bg-[#1a1a20] cursor-pointer transition-colors"
                onClick={() => onCountrySelect?.(country.country_code)}
              >
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{country.flag}</span>
                    <div>
                      <div className="font-medium text-white">{country.country_code}</div>
                      <div className="text-[10px] text-gray-500">{country.country_name}</div>
                    </div>
                  </div>
                </td>
                <td className={`py-2 text-right font-mono ${getRatingColor(country.rating)}`}>
                  {country.rating}
                </td>
                <td className={`py-2 text-right font-mono ${getYieldColor(country.yields["2Y"])}`}>
                  {country.yields["2Y"].toFixed(2)}%
                </td>
                <td className={`py-2 text-right font-mono ${getYieldColor(country.yields["5Y"])}`}>
                  {country.yields["5Y"].toFixed(2)}%
                </td>
                <td className={`py-2 text-right font-mono font-bold ${getYieldColor(country.yields["10Y"])}`}>
                  {country.yields["10Y"].toFixed(2)}%
                </td>
                <td className={`py-2 text-right font-mono ${getYieldColor(country.yields["30Y"])}`}>
                  {country.yields["30Y"].toFixed(2)}%
                </td>
                <td className={`py-2 text-right font-mono ${getChangeColor(country.change_24h)}`}>
                  {country.change_24h >= 0 ? '+' : ''}{country.change_24h.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 pt-3 border-t border-[#27272a] flex flex-wrap gap-4 text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>AAA Rated</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400"></span>
          <span>AA Rated</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
          <span>A Rated</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-400"></span>
          <span>BBB Rated</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400"></span>
          <span>Below BBB</span>
        </div>
      </div>
    </div>
  );
}
