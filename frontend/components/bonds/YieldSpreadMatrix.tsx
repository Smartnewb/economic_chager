"use client";

import { useEffect, useState } from 'react';

interface SpreadMatrixResponse {
  matrix: Record<string, Record<string, number>>;
  country_codes: string[];
  countries: Record<string, { name: string; flag: string }>;
  timestamp: string;
}

interface Props {
  baseCountry?: string;
  onCellClick?: (from: string, to: string) => void;
}

export default function YieldSpreadMatrix({ baseCountry = "US", onCellClick }: Props) {
  const [data, setData] = useState<SpreadMatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{ from: string; to: string } | null>(null);

  useEffect(() => {
    fetchSpreadMatrix();
  }, []);

  const fetchSpreadMatrix = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/bonds/spread-matrix');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch spread matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSpreadColor = (spread: number): string => {
    if (spread === 0) return 'bg-[#1a1a20]';
    if (spread >= 500) return 'bg-red-900/60';
    if (spread >= 200) return 'bg-red-700/50';
    if (spread >= 100) return 'bg-orange-600/40';
    if (spread >= 50) return 'bg-yellow-600/30';
    if (spread > 0) return 'bg-yellow-500/20';
    if (spread <= -500) return 'bg-blue-900/60';
    if (spread <= -200) return 'bg-blue-700/50';
    if (spread <= -100) return 'bg-cyan-600/40';
    if (spread <= -50) return 'bg-cyan-500/30';
    return 'bg-cyan-400/20';
  };

  const getSpreadTextColor = (spread: number): string => {
    if (spread === 0) return 'text-gray-600';
    if (spread > 0) return 'text-red-300';
    return 'text-cyan-300';
  };

  if (loading) {
    return (
      <div className="bg-[#111116] border border-[#27272a] rounded-lg p-4">
        <div className="h-8 w-48 bg-gray-700 rounded animate-pulse mb-4"></div>
        <div className="h-64 bg-gray-800 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[#111116] border border-[#27272a] rounded-lg p-4">
        <div className="text-gray-400 text-center py-8">Failed to load spread matrix</div>
      </div>
    );
  }

  const codes = data.country_codes.slice(0, 10);

  return (
    <div className="bg-[#111116] border border-[#27272a] rounded-lg p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
          YIELD SPREAD MATRIX
          <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded border border-purple-500/20">
            10Y Spreads (bps)
          </span>
        </h3>
        <div className="text-[10px] text-gray-500">
          Row - Column = Spread
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr>
              <th className="p-1 text-gray-500 text-left"></th>
              {codes.map(code => (
                <th key={code} className="p-1 text-gray-400 font-medium">
                  <div className="flex flex-col items-center">
                    <span>{data.countries[code]?.flag}</span>
                    <span>{code}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {codes.map(rowCode => (
              <tr key={rowCode}>
                <td className="p-1 text-gray-400 font-medium">
                  <div className="flex items-center gap-1">
                    <span>{data.countries[rowCode]?.flag}</span>
                    <span>{rowCode}</span>
                  </div>
                </td>
                {codes.map(colCode => {
                  const spread = data.matrix[rowCode]?.[colCode] ?? 0;
                  const isHovered = hoveredCell?.from === rowCode && hoveredCell?.to === colCode;

                  return (
                    <td
                      key={colCode}
                      className={`p-1 text-center cursor-pointer transition-all ${getSpreadColor(spread)} ${isHovered ? 'ring-2 ring-white/50' : ''}`}
                      onClick={() => onCellClick?.(rowCode, colCode)}
                      onMouseEnter={() => setHoveredCell({ from: rowCode, to: colCode })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <span className={`font-mono ${getSpreadTextColor(spread)}`}>
                        {spread === 0 ? '-' : spread > 0 ? `+${spread}` : spread}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hoveredCell && hoveredCell.from !== hoveredCell.to && (
        <div className="mt-3 p-2 bg-[#0a0a0f] rounded text-xs text-gray-300">
          {data.countries[hoveredCell.from]?.flag} {data.countries[hoveredCell.from]?.name} vs{' '}
          {data.countries[hoveredCell.to]?.flag} {data.countries[hoveredCell.to]?.name}:{' '}
          <span className={`font-bold ${getSpreadTextColor(data.matrix[hoveredCell.from]?.[hoveredCell.to] ?? 0)}`}>
            {data.matrix[hoveredCell.from]?.[hoveredCell.to] ?? 0} bps
          </span>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-[#27272a]">
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500">
          <span>Color Scale:</span>
          <div className="flex items-center gap-1">
            <span className="w-4 h-3 bg-cyan-500/40 rounded"></span>
            <span>Lower yield</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-3 bg-[#1a1a20] rounded"></span>
            <span>Same</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-3 bg-red-600/40 rounded"></span>
            <span>Higher yield</span>
          </div>
        </div>
      </div>
    </div>
  );
}
