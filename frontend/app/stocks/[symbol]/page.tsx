"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Area,
    AreaChart,
} from "recharts";

interface StockQuote {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changesPercentage: number;
    dayHigh: number;
    dayLow: number;
    yearHigh: number;
    yearLow: number;
    marketCap: number;
    volume: number;
    avgVolume: number;
    pe: number;
    eps: number;
    beta: number;
    exchange: string;
}

interface StockNews {
    title: string;
    url: string;
    publishedDate: string;
    site: string;
    text: string;
    symbol: string;
}

interface HistoricalPrice {
    date: string;
    close: number;
    open: number;
    high: number;
    low: number;
    volume: number;
}

interface InsiderTrade {
    symbol: string;
    reporterName: string;
    reporterTitle: string;
    transactionType: string;
    transactionDate: string;
    sharesTransacted: number;
    price: number;
    totalValue: number;
}

type Period = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y";

export default function StockDetailPage() {
    const params = useParams();
    const router = useRouter();
    const symbol = (params.symbol as string)?.toUpperCase() || "";

    const [quote, setQuote] = useState<StockQuote | null>(null);
    const [news, setNews] = useState<StockNews[]>([]);
    const [historicalData, setHistoricalData] = useState<HistoricalPrice[]>([]);
    const [insiderTrades, setInsiderTrades] = useState<InsiderTrade[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<Period>("1M");

    useEffect(() => {
        if (symbol) {
            fetchStockData();
        }
    }, [symbol, selectedPeriod]);

    const fetchStockData = async () => {
        setLoading(true);
        setError(null);

        try {
            const [quoteRes, newsRes, historyRes, insiderRes] = await Promise.allSettled([
                fetch(`http://localhost:8000/api/stocks/${symbol}/quote`),
                fetch(`http://localhost:8000/api/stocks/${symbol}/news?limit=10`),
                fetch(`http://localhost:8000/api/stocks/${symbol}/history?period=${selectedPeriod}`),
                fetch(`http://localhost:8000/api/whale/insider/${symbol}?limit=10`),
            ]);

            // Process quote
            if (quoteRes.status === "fulfilled" && quoteRes.value.ok) {
                const data = await quoteRes.value.json();
                setQuote(data);
            }

            // Process news
            if (newsRes.status === "fulfilled" && newsRes.value.ok) {
                const data = await newsRes.value.json();
                setNews(data.news || []);
            }

            // Process historical data
            if (historyRes.status === "fulfilled" && historyRes.value.ok) {
                const data = await historyRes.value.json();
                setHistoricalData(data.historical || []);
            }

            // Process insider trades
            if (insiderRes.status === "fulfilled" && insiderRes.value.ok) {
                const data = await insiderRes.value.json();
                const trades = (data.trades || []).map((t: Record<string, unknown>) => ({
                    symbol: t.symbol,
                    reporterName: t.reporter_name,
                    reporterTitle: t.reporter_title,
                    transactionType: t.transaction_type,
                    transactionDate: t.transaction_date,
                    sharesTransacted: t.shares_transacted,
                    price: t.price,
                    totalValue: t.total_value,
                }));
                setInsiderTrades(trades);
            }
        } catch (err) {
            console.error("Failed to fetch stock data:", err);
            setError("Failed to load stock data");
        } finally {
            setLoading(false);
        }
    };

    const formatLargeNumber = (num: number): string => {
        if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
        if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
        if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
        return `$${num.toLocaleString()}`;
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const getChartColor = (): string => {
        if (!quote) return "#3b82f6";
        return quote.change >= 0 ? "#22c55e" : "#ef4444";
    };

    const periods: Period[] = ["1D", "1W", "1M", "3M", "1Y", "5Y"];

    if (loading) {
        return (
            <main className="min-h-screen bg-[#050505] text-white">
                <Navigation />
                <div className="pt-20 flex items-center justify-center h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        <span className="text-gray-400">Loading {symbol} data...</span>
                    </div>
                </div>
            </main>
        );
    }

    if (error || !quote) {
        return (
            <main className="min-h-screen bg-[#050505] text-white">
                <Navigation />
                <div className="pt-20 flex items-center justify-center h-[60vh]">
                    <div className="text-center">
                        <div className="text-red-400 mb-4">{error || "Stock not found"}</div>
                        <button
                            onClick={() => router.back()}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#050505] text-white">
            <Navigation />

            <div className="pt-20 px-6 pb-20 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-400 hover:text-white text-sm mb-4 flex items-center gap-2"
                    >
                        ← Back
                    </button>

                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold">{quote.symbol}</h1>
                                <span className="text-xs px-2 py-1 bg-white/10 rounded text-gray-400">
                                    {quote.exchange}
                                </span>
                            </div>
                            <p className="text-gray-400">{quote.name}</p>
                        </div>

                        <div className="text-right">
                            <div className="text-4xl font-bold font-mono">${quote.price.toFixed(2)}</div>
                            <div
                                className={`text-lg font-semibold ${
                                    quote.change >= 0 ? "text-green-400" : "text-red-400"
                                }`}
                            >
                                {quote.change >= 0 ? "+" : ""}
                                {quote.change.toFixed(2)} ({quote.changesPercentage.toFixed(2)}%)
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="bg-[#111116] border border-[#27272a] rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold">Price Chart</h2>
                        <div className="flex gap-1">
                            {periods.map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setSelectedPeriod(period)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                        selectedPeriod === period
                                            ? "bg-blue-500 text-white"
                                            : "bg-white/5 text-gray-400 hover:bg-white/10"
                                    }`}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={historicalData}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={getChartColor()} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={getChartColor()} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    stroke="#52525b"
                                    tickFormatter={formatDate}
                                    tick={{ fontSize: 10 }}
                                />
                                <YAxis
                                    stroke="#52525b"
                                    domain={["auto", "auto"]}
                                    tick={{ fontSize: 10 }}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#18181b",
                                        border: "1px solid #27272a",
                                        borderRadius: "8px",
                                    }}
                                    labelStyle={{ color: "#a1a1aa" }}
                                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="close"
                                    stroke={getChartColor()}
                                    strokeWidth={2}
                                    fill="url(#colorPrice)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                    {[
                        { label: "Market Cap", value: formatLargeNumber(quote.marketCap) },
                        { label: "P/E Ratio", value: quote.pe?.toFixed(2) || "N/A" },
                        { label: "EPS", value: quote.eps ? `$${quote.eps.toFixed(2)}` : "N/A" },
                        { label: "Beta", value: quote.beta?.toFixed(2) || "N/A" },
                        { label: "52W High", value: `$${quote.yearHigh?.toFixed(2)}` },
                        { label: "52W Low", value: `$${quote.yearLow?.toFixed(2)}` },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-[#111116] border border-[#27272a] rounded-lg p-4"
                        >
                            <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
                            <div className="text-lg font-semibold font-mono">{stat.value}</div>
                        </div>
                    ))}
                </div>

                {/* Two Column Layout: News + Insider Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* News Section */}
                    <div className="bg-[#111116] border border-[#27272a] rounded-xl p-6">
                        <h2 className="text-lg font-semibold mb-4">Latest News</h2>
                        <div className="space-y-4">
                            {news.length === 0 ? (
                                <div className="text-gray-500 text-center py-8">No news available</div>
                            ) : (
                                news.slice(0, 5).map((item, i) => (
                                    <a
                                        key={i}
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                    >
                                        <div className="text-sm font-medium text-white mb-1 line-clamp-2">
                                            {item.title}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>{item.site}</span>
                                            <span>•</span>
                                            <span>
                                                {new Date(item.publishedDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </a>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Insider Activity Section */}
                    <div className="bg-[#111116] border border-[#27272a] rounded-xl p-6">
                        <h2 className="text-lg font-semibold mb-4">Recent Insider Activity</h2>
                        <div className="space-y-3">
                            {insiderTrades.length === 0 ? (
                                <div className="text-gray-500 text-center py-8">
                                    No insider activity found
                                </div>
                            ) : (
                                insiderTrades.slice(0, 5).map((trade, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                                    >
                                        <div>
                                            <div className="font-medium text-sm">{trade.reporterName}</div>
                                            <div className="text-xs text-gray-500">
                                                {trade.reporterTitle}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div
                                                className={`text-sm font-semibold ${
                                                    trade.transactionType.includes("P")
                                                        ? "text-green-400"
                                                        : "text-red-400"
                                                }`}
                                            >
                                                {trade.transactionType.includes("P") ? "Buy" : "Sell"}{" "}
                                                {trade.sharesTransacted.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                ${trade.totalValue.toLocaleString()} •{" "}
                                                {new Date(trade.transactionDate).toLocaleDateString(
                                                    "en-US",
                                                    { month: "short", day: "numeric" }
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
