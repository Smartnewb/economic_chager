"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const LineChart = dynamic(
  () => import('recharts').then(mod => mod.LineChart),
  { ssr: false }
);
const Line = dynamic(
  () => import('recharts').then(mod => mod.Line),
  { ssr: false }
);

interface CurvePoint {
  maturity: string;
  yield_value: number;
}

interface CountryCurve {
  country_code: string;
  country_name: string;
  flag: string;
  currency: string;
  curve: CurvePoint[];
  spread_2_10: number;
  spread_10_30: number;
  curve_shape: string;
}

interface CurvesResponse {
  curves: CountryCurve[];
  maturities: string[];
  timestamp: string;
}

const COUNTRY_COLORS: Record<string, string> = {
  US: '#22c55e',
  DE: '#3b82f6',
  JP: '#f97316',
  GB: '#a855f7',
  CN: '#ef4444',
  CH: '#14b8a6',
  AU: '#f59e0b',
  KR: '#ec4899',
  FR: '#6366f1',
  CA: '#84cc16'
};

interface Props {
  selectedCountries?: string[];
}

export default function GlobalCurveComparison({ selectedCountries: initialSelected }: Props) {
  const [data, setData] = useState<CurvesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    initialSelected || ['US', 'DE', 'JP', 'GB', 'CN']
  );

  useEffect(() => {
    fetchCurves();
  }, [selectedCountries]);

  const fetchCurves = async () => {
    try {
      const countriesParam = selectedCountries.join(',');
      const res = await fetch(`http://localhost:8000/api/bonds/curves-comparison?countries=${countriesParam}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch curves:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCountry = (code: string) => {
    setSelectedCountries(prev => {
      if (prev.includes(code)) {
        if (prev.length <= 1) return prev;
        return prev.filter(c => c !== code);
      }
      if (prev.length >= 5) return prev;
      return [...prev, code];
    });
  };

  const getCurveShapeColor = (shape: string): string => {
    if (shape === 'inverted') return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (shape === 'flat') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-green-400 bg-green-500/10 border-green-500/20';
  };

  const chartData = data?.maturities.map(maturity => {
    const point: Record<string, string | number> = { maturity };
    data.curves.forEach(curve => {
      const curvePoint = curve.curve.find(p => p.maturity === maturity);
      if (curvePoint) {
        point[curve.country_code] = curvePoint.yield_value;
      }
    });
    return point;
  }) || [];

  const availableCountries = ['US', 'DE', 'JP', 'GB', 'CN', 'CH', 'AU', 'KR', 'FR', 'CA'];

  if (loading) {
    return (
      <div className="bg-[#111116] border border-[#27272a] rounded-lg p-4">
        <div className="h-8 w-48 bg-gray-700 rounded animate-pulse mb-4"></div>
        <div className="h-80 bg-gray-800 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#111116] border border-[#27272a] rounded-lg p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-sm font-bold text-gray-300">
          GLOBAL YIELD CURVES COMPARISON
        </h3>

        <div className="flex flex-wrap gap-1">
          {availableCountries.map(code => (
            <button
              key={code}
              onClick={() => toggleCountry(code)}
              className={`px-2 py-1 text-[10px] rounded border transition-all ${
                selectedCountries.includes(code)
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'bg-transparent border-[#27272a] text-gray-500 hover:border-gray-500'
              }`}
              style={{
                borderColor: selectedCountries.includes(code) ? COUNTRY_COLORS[code] : undefined
              }}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[280px] sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="maturity"
              stroke="#52525b"
              tick={{ fontSize: 10 }}
              tickLine={{ stroke: '#27272a' }}
            />
            <YAxis
              stroke="#52525b"
              tick={{ fontSize: 10 }}
              domain={['auto', 'auto']}
              tickFormatter={(value) => `${value.toFixed(1)}%`}
              tickLine={{ stroke: '#27272a' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', fontSize: '12px' }}
              itemStyle={{ color: '#e4e4e7' }}
              formatter={(value) => typeof value === 'number' ? [`${value.toFixed(2)}%`, ''] : ['', '']}
            />
            <Legend />
            {data?.curves.map(curve => (
              <Line
                key={curve.country_code}
                type="monotone"
                dataKey={curve.country_code}
                name={`${curve.flag} ${curve.country_code}`}
                stroke={COUNTRY_COLORS[curve.country_code] || '#888'}
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {data?.curves.map(curve => (
          <div
            key={curve.country_code}
            className="p-2 bg-[#0a0a0f] rounded border border-[#27272a]"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{curve.flag}</span>
              <span className="text-xs font-medium text-white">{curve.country_code}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500">2Y-10Y Spread</span>
                <span className={curve.spread_2_10 < 0 ? 'text-red-400' : 'text-green-400'}>
                  {curve.spread_2_10 > 0 ? '+' : ''}{curve.spread_2_10} bps
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500">10Y-30Y Spread</span>
                <span className={curve.spread_10_30 < 0 ? 'text-red-400' : 'text-green-400'}>
                  {curve.spread_10_30 > 0 ? '+' : ''}{curve.spread_10_30} bps
                </span>
              </div>
              <div className={`text-[10px] px-2 py-0.5 rounded border ${getCurveShapeColor(curve.curve_shape)} text-center mt-1`}>
                {curve.curve_shape.toUpperCase()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
