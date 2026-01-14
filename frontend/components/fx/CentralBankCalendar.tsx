"use client";

import { useEffect, useState } from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';

interface CentralBankMeeting {
  currency: string;
  bank: string;
  current_rate: number;
  next_meeting: string;
  trend: 'hike' | 'cut' | 'hold';
  expected_action: string;
  days_until: number;
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
};

export default function CentralBankCalendar() {
  const [calendar, setCalendar] = useState<CentralBankMeeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const response = await fetch('/api/fx/central-bank-calendar');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setCalendar(data);
      } catch (err) {
        console.error('Error fetching central bank calendar:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'hike':
        return <TrendingUp className="w-4 h-4 text-red-400" />;
      case 'cut':
        return <TrendingDown className="w-4 h-4 text-green-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'hike':
        return 'border-red-500/30 bg-red-500/10';
      case 'cut':
        return 'border-green-500/30 bg-green-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 7) return 'text-red-400';
    if (days <= 14) return 'text-amber-400';
    return 'text-gray-400';
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
        <Calendar className="w-5 h-5 text-emerald-400" />
        <h2 className="text-xl font-bold text-white">Central Bank Calendar</h2>
      </div>

      {/* Upcoming Meetings */}
      <div className="space-y-3">
        {calendar.map((meeting) => (
          <div
            key={meeting.currency}
            className={`rounded-lg border p-4 ${getTrendColor(meeting.trend)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{FLAG_EMOJIS[meeting.currency] || '🏦'}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{meeting.currency}</span>
                    <span className="text-sm text-gray-400">({meeting.bank})</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    Current Rate: <span className="font-mono text-white">{meeting.current_rate.toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  {getTrendIcon(meeting.trend)}
                  <span className={`text-sm font-medium ${
                    meeting.trend === 'hike' ? 'text-red-400' :
                    meeting.trend === 'cut' ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {meeting.expected_action}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1 justify-end">
                  <Clock className={`w-3 h-3 ${getUrgencyColor(meeting.days_until)}`} />
                  <span className={`text-sm ${getUrgencyColor(meeting.days_until)}`}>
                    {meeting.days_until === 0 ? 'Today' :
                     meeting.days_until === 1 ? 'Tomorrow' :
                     `${meeting.days_until} days`}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {meeting.next_meeting}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-white/5">
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-red-400" />
            <span className="text-gray-400">Rate Hike Expected</span>
          </div>
          <div className="flex items-center gap-1">
            <Minus className="w-3 h-3 text-gray-400" />
            <span className="text-gray-400">Hold Expected</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-green-400" />
            <span className="text-gray-400">Rate Cut Expected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
