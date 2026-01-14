"use client";

import {
    CountryFXData,
    CountryBondData,
    CountryStockData,
    CountryPolicyData,
} from "@/store/countryStore";

// FX Card Component
const FXCard = ({ data, currencyCode }: { data: CountryFXData; currencyCode: string }) => {
    const isStrong = data.change1m < 0; // Lower exchange rate = stronger local currency
    const rangePosition = data.percentOfRange;

    return (
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">💱</span>
                    <div>
                        <h4 className="font-bold text-white">Currency</h4>
                        <p className="text-xs text-gray-400">{data.pair}</p>
                    </div>
                </div>
                <div
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                        isStrong
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                    }`}
                >
                    {isStrong ? "Strong" : "Weak"}
                </div>
            </div>

            {/* Rate */}
            <div className="text-3xl font-bold text-white mb-2">
                {data.rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            {/* Changes */}
            <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div>
                    <div className="text-gray-500">24H</div>
                    <div className={data.change24h >= 0 ? "text-red-400" : "text-green-400"}>
                        {data.change24h >= 0 ? "+" : ""}{data.change24h}%
                    </div>
                </div>
                <div>
                    <div className="text-gray-500">1W</div>
                    <div className={data.change1w >= 0 ? "text-red-400" : "text-green-400"}>
                        {data.change1w >= 0 ? "+" : ""}{data.change1w}%
                    </div>
                </div>
                <div>
                    <div className="text-gray-500">1M</div>
                    <div className={data.change1m >= 0 ? "text-red-400" : "text-green-400"}>
                        {data.change1m >= 0 ? "+" : ""}{data.change1m}%
                    </div>
                </div>
            </div>

            {/* 52W Range */}
            <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>52W Low: {data.low52w}</span>
                    <span>52W High: {data.high52w}</span>
                </div>
                <div className="relative h-2 bg-white/10 rounded-full">
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-purple-500 border-2 border-white"
                        style={{ left: `${Math.min(100, Math.max(0, rangePosition))}%`, transform: "translate(-50%, -50%)" }}
                    />
                </div>
                <div className="text-center text-xs text-gray-400 mt-1">
                    {rangePosition.toFixed(0)}% of 52W range
                </div>
            </div>
        </div>
    );
};

// Bond Card Component
const BondCard = ({ data }: { data: CountryBondData }) => {
    return (
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🏛️</span>
                    <div>
                        <h4 className="font-bold text-white">Bonds</h4>
                        <p className="text-xs text-gray-400">10Y Yield</p>
                    </div>
                </div>
                {data.isInverted && (
                    <div className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">
                        ⚠️ Inverted
                    </div>
                )}
            </div>

            {/* 10Y Yield */}
            <div className="text-3xl font-bold text-white mb-2">
                {data.yield10y.toFixed(2)}%
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-white/5 rounded-lg">
                    <div className="text-xs text-gray-500">2Y Yield</div>
                    <div className="text-white font-medium">{data.yield2y.toFixed(2)}%</div>
                </div>
                <div className="p-2 bg-white/5 rounded-lg">
                    <div className="text-xs text-gray-500">10Y-2Y Spread</div>
                    <div className={`font-medium ${data.spread >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {data.spread >= 0 ? "+" : ""}{data.spread.toFixed(2)}%
                    </div>
                </div>
            </div>

            {/* vs US */}
            <div className="mt-3 p-2 bg-white/5 rounded-lg">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">vs US 10Y</span>
                    <span className={`text-sm font-medium ${data.vsUSSpread >= 0 ? "text-blue-400" : "text-purple-400"}`}>
                        {data.vsUSSpread >= 0 ? "+" : ""}{data.vsUSSpread.toFixed(2)}%
                    </span>
                </div>
            </div>
        </div>
    );
};

// Stock Card Component
const StockCard = ({ data }: { data: CountryStockData }) => {
    const isBullish = data.change3m > 0;

    return (
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">📈</span>
                    <div>
                        <h4 className="font-bold text-white">Stocks</h4>
                        <p className="text-xs text-gray-400">{data.indexName}</p>
                    </div>
                </div>
                <div
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                        isBullish
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                    }`}
                >
                    {isBullish ? "Bullish" : "Bearish"}
                </div>
            </div>

            {/* Price */}
            <div className="text-3xl font-bold text-white mb-1">
                {data.price.toLocaleString()}
            </div>
            <div className={`text-sm font-medium ${data.change1d >= 0 ? "text-green-400" : "text-red-400"}`}>
                {data.change1d >= 0 ? "+" : ""}{data.change1d}% today
            </div>

            {/* Performance */}
            <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div className="p-2 bg-white/5 rounded-lg text-center">
                    <div className="text-gray-500">1M</div>
                    <div className={data.change1m >= 0 ? "text-green-400" : "text-red-400"}>
                        {data.change1m >= 0 ? "+" : ""}{data.change1m}%
                    </div>
                </div>
                <div className="p-2 bg-white/5 rounded-lg text-center">
                    <div className="text-gray-500">3M</div>
                    <div className={data.change3m >= 0 ? "text-green-400" : "text-red-400"}>
                        {data.change3m >= 0 ? "+" : ""}{data.change3m}%
                    </div>
                </div>
                <div className="p-2 bg-white/5 rounded-lg text-center">
                    <div className="text-gray-500">YTD</div>
                    <div className={data.changeYTD >= 0 ? "text-green-400" : "text-red-400"}>
                        {data.changeYTD >= 0 ? "+" : ""}{data.changeYTD}%
                    </div>
                </div>
            </div>

            {/* Valuation */}
            <div className="mt-3 flex gap-2">
                <div className="flex-1 p-2 bg-white/5 rounded-lg">
                    <div className="text-xs text-gray-500">P/E Ratio</div>
                    <div className={`font-bold ${data.per < 15 ? "text-green-400" : data.per > 25 ? "text-red-400" : "text-white"}`}>
                        {data.per.toFixed(1)}x
                    </div>
                </div>
                <div className="flex-1 p-2 bg-white/5 rounded-lg">
                    <div className="text-xs text-gray-500">P/B Ratio</div>
                    <div className={`font-bold ${data.pbr < 1.5 ? "text-green-400" : data.pbr > 3 ? "text-red-400" : "text-white"}`}>
                        {data.pbr.toFixed(2)}x
                    </div>
                </div>
            </div>
        </div>
    );
};

// Policy Card Component
const PolicyCard = ({ data }: { data: CountryPolicyData }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case "hiking": return "text-red-400 bg-red-500/20";
            case "cutting": return "text-blue-400 bg-blue-500/20";
            case "paused": return "text-yellow-400 bg-yellow-500/20";
            default: return "text-green-400 bg-green-500/20";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "hiking": return "🔥";
            case "cutting": return "💧";
            case "paused": return "⏸️";
            default: return "🌱";
        }
    };

    return (
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🏦</span>
                    <div>
                        <h4 className="font-bold text-white">Policy</h4>
                        <p className="text-xs text-gray-400">{data.centralBank}</p>
                    </div>
                </div>
                <div className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusColor(data.status)}`}>
                    {getStatusIcon(data.status)} {data.status}
                </div>
            </div>

            {/* Policy Rate */}
            <div className="text-3xl font-bold text-white mb-2">
                {data.policyRate.toFixed(2)}%
            </div>

            {/* Real Rate & Inflation */}
            <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-white/5 rounded-lg">
                    <div className="text-xs text-gray-500">Real Rate</div>
                    <div className={`font-medium ${data.realRate >= 0 ? "text-purple-400" : "text-green-400"}`}>
                        {data.realRate >= 0 ? "+" : ""}{data.realRate.toFixed(2)}%
                    </div>
                </div>
                <div className="p-2 bg-white/5 rounded-lg">
                    <div className="text-xs text-gray-500">Inflation</div>
                    <div className={`font-medium ${data.inflationRate > 3 ? "text-red-400" : data.inflationRate > 2 ? "text-yellow-400" : "text-green-400"}`}>
                        {data.inflationRate.toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* Next Meeting */}
            <div className="mt-3 p-2 bg-white/5 rounded-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="text-xs text-gray-500">Next Meeting</div>
                        <div className="text-white text-sm">{data.nextMeetingDate}</div>
                    </div>
                    <div className={`text-lg font-bold ${data.nextMeetingDays <= 7 ? "text-red-400" : data.nextMeetingDays <= 14 ? "text-yellow-400" : "text-gray-400"}`}>
                        D-{data.nextMeetingDays}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main component
interface FourPillarCardsProps {
    fx: CountryFXData;
    bond: CountryBondData;
    stock: CountryStockData;
    policy: CountryPolicyData;
    currencyCode: string;
}

export default function FourPillarCards({
    fx,
    bond,
    stock,
    policy,
    currencyCode,
}: FourPillarCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FXCard data={fx} currencyCode={currencyCode} />
            <BondCard data={bond} />
            <StockCard data={stock} />
            <PolicyCard data={policy} />
        </div>
    );
}
