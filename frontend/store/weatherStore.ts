import { create } from "zustand";

// Economic Weather State - Aggregated from all data sources
export interface EconomicWeather {
    // Overall Sentiment
    globalSentiment: "risk_on" | "risk_off" | "neutral";
    sentimentScore: number; // -100 to 100

    // Money Flow Direction
    flowDirection: "to_safety" | "to_risk" | "balanced";
    dominantFlow: {
        from: string;
        to: string;
        volume: number;
    } | null;

    // Key Indicators Summary
    dollarStrength: "strong" | "weak" | "neutral";
    yieldEnvironment: "rising" | "falling" | "stable";
    volatilityLevel: "calm" | "elevated" | "storm";

    // AI-Generated Headline
    headline: string;
    subheadline: string;

    // Quick Stats
    stats: {
        dollarIndex: number;
        dollarChange: number;
        vix: number;
        vixChange: number;
        sp500Change: number;
        bondYield10Y: number;
        bondYieldChange: number;
    };

    // Timestamp
    lastUpdate: string;
}

// Module Summary for Quick Navigation
export interface ModuleSummary {
    id: string;
    name: string;
    userFriendlyName: string;
    icon: string;
    status: "bullish" | "bearish" | "neutral" | "warning";
    oneLiner: string;
    href: string;
}

interface WeatherState {
    // Data
    weather: EconomicWeather | null;
    moduleSummaries: ModuleSummary[];

    // UI State
    isLoading: boolean;
    error: string | null;
    selectedModule: string | null;
    showDebatePanel: boolean;

    // Actions
    fetchWeatherData: () => Promise<void>;
    setSelectedModule: (module: string | null) => void;
    openDebatePanel: () => void;
    closeDebatePanel: () => void;
}

// Generate headline based on conditions
function generateHeadline(
    sentiment: string,
    dollarStrength: string,
    flowDirection: string,
    language: string = "en"
): { headline: string; subheadline: string } {
    const headlines: Record<string, Record<string, { headline: string; subheadline: string }>> = {
        en: {
            "risk_off_strong_to_safety": {
                headline: "Money is seeking shelter in the Dollar today.",
                subheadline: "Global capital is flowing to safe havens as uncertainty rises."
            },
            "risk_off_weak_to_safety": {
                headline: "Investors are running scared, but not to the Dollar.",
                subheadline: "Gold and bonds are the preferred safe havens today."
            },
            "risk_on_weak_to_risk": {
                headline: "Risk appetite is back. The Dollar is weakening.",
                subheadline: "Money is flowing into emerging markets and risk assets."
            },
            "risk_on_strong_to_risk": {
                headline: "Unusual: Strong Dollar with Risk-On sentiment.",
                subheadline: "US exceptionalism is attracting both safe and risk capital."
            },
            "neutral_neutral_balanced": {
                headline: "Markets are waiting and watching.",
                subheadline: "No clear direction today. Key data releases ahead."
            },
            "default": {
                headline: "Global capital flows are in motion.",
                subheadline: "Track where the money is going in real-time."
            }
        },
        ko: {
            "risk_off_strong_to_safety": {
                headline: "오늘 자금이 달러로 피난 중입니다.",
                subheadline: "불확실성이 높아지면서 글로벌 자본이 안전자산으로 이동 중."
            },
            "risk_off_weak_to_safety": {
                headline: "투자자들이 공포에 질렸지만, 달러는 아닙니다.",
                subheadline: "오늘은 금과 채권이 선호되는 안전자산입니다."
            },
            "risk_on_weak_to_risk": {
                headline: "위험 선호가 돌아왔습니다. 달러가 약세입니다.",
                subheadline: "신흥시장과 위험자산으로 자금이 흐르고 있습니다."
            },
            "risk_on_strong_to_risk": {
                headline: "이례적: 위험선호 심리에도 달러 강세.",
                subheadline: "미국 예외주의가 안전자본과 위험자본 모두를 끌어들이고 있습니다."
            },
            "neutral_neutral_balanced": {
                headline: "시장이 관망하며 기다리고 있습니다.",
                subheadline: "오늘은 뚜렷한 방향이 없습니다. 주요 데이터 발표 예정."
            },
            "default": {
                headline: "글로벌 자본 흐름이 움직이고 있습니다.",
                subheadline: "실시간으로 자금의 이동을 추적하세요."
            }
        },
        zh: {
            "risk_off_strong_to_safety": {
                headline: "资金正在涌向美元避险。",
                subheadline: "不确定性上升，全球资本正流向安全资产。"
            },
            "risk_off_weak_to_safety": {
                headline: "投资者恐慌，但没有选择美元。",
                subheadline: "黄金和债券是今天首选的避险资产。"
            },
            "risk_on_weak_to_risk": {
                headline: "风险偏好回归，美元走弱。",
                subheadline: "资金正流入新兴市场和风险资产。"
            },
            "risk_on_strong_to_risk": {
                headline: "异常：风险偏好情绪下美元走强。",
                subheadline: "美国例外主义正在吸引安全资本和风险资本。"
            },
            "neutral_neutral_balanced": {
                headline: "市场正在观望等待。",
                subheadline: "今天没有明确方向。关键数据即将发布。"
            },
            "default": {
                headline: "全球资本流动正在进行中。",
                subheadline: "实时追踪资金流向。"
            }
        },
        ja: {
            "risk_off_strong_to_safety": {
                headline: "資金がドルに避難しています。",
                subheadline: "不確実性が高まり、グローバル資本が安全資産に流れています。"
            },
            "risk_off_weak_to_safety": {
                headline: "投資家はパニックですが、ドルには向かっていません。",
                subheadline: "今日は金と債券が好まれる安全資産です。"
            },
            "risk_on_weak_to_risk": {
                headline: "リスク選好が戻りました。ドルは弱含み。",
                subheadline: "新興市場とリスク資産に資金が流れています。"
            },
            "risk_on_strong_to_risk": {
                headline: "異例：リスクオン心理でもドル高。",
                subheadline: "米国例外主義が安全資本とリスク資本の両方を引き付けています。"
            },
            "neutral_neutral_balanced": {
                headline: "市場は様子見しています。",
                subheadline: "今日は明確な方向性がありません。重要データ発表予定。"
            },
            "default": {
                headline: "グローバル資本フローが動いています。",
                subheadline: "リアルタイムで資金の流れを追跡してください。"
            }
        }
    };

    const key = `${sentiment}_${dollarStrength}_${flowDirection}`;
    const langHeadlines = headlines[language] || headlines.en;
    return langHeadlines[key] || langHeadlines.default;
}

export const useWeatherStore = create<WeatherState>((set, get) => ({
    // Initial State
    weather: null,
    moduleSummaries: [],
    isLoading: false,
    error: null,
    selectedModule: null,
    showDebatePanel: false,

    // Fetch aggregated weather data from multiple endpoints
    fetchWeatherData: async () => {
        set({ isLoading: true, error: null });

        try {
            // Fetch data from multiple sources in parallel
            const [fxResponse, bondsResponse, stocksResponse] = await Promise.allSettled([
                fetch("http://localhost:8000/api/fx/rates"),
                fetch("http://localhost:8000/api/bonds/yields"),
                fetch("http://localhost:8000/api/stocks/indices")
            ]);

            // Parse responses
            let fxData = null, bondsData = null, stocksData = null;

            if (fxResponse.status === "fulfilled" && fxResponse.value.ok) {
                fxData = await fxResponse.value.json();
            }
            if (bondsResponse.status === "fulfilled" && bondsResponse.value.ok) {
                bondsData = await bondsResponse.value.json();
            }
            if (stocksResponse.status === "fulfilled" && stocksResponse.value.ok) {
                stocksData = await stocksResponse.value.json();
            }

            // Calculate sentiment from data
            const dollarIndex = fxData?.dollar_index?.value || 103;
            const dollarChange = fxData?.dollar_index?.change_1d || 0;
            const vix = stocksData?.vix?.value || 15;
            const sp500Change = stocksData?.indices?.find((i: { code: string }) => i.code === "SPX")?.change_1d || 0;
            const bondYield10Y = bondsData?.us?.["10Y"]?.yield || 4.5;

            // Determine sentiment
            let globalSentiment: "risk_on" | "risk_off" | "neutral" = "neutral";
            if (vix > 25 || dollarChange > 0.5) {
                globalSentiment = "risk_off";
            } else if (vix < 15 && sp500Change > 0.5) {
                globalSentiment = "risk_on";
            }

            // Determine dollar strength
            let dollarStrength: "strong" | "weak" | "neutral" = "neutral";
            if (dollarChange > 0.3) dollarStrength = "strong";
            else if (dollarChange < -0.3) dollarStrength = "weak";

            // Determine flow direction
            let flowDirection: "to_safety" | "to_risk" | "balanced" = "balanced";
            if (globalSentiment === "risk_off") flowDirection = "to_safety";
            else if (globalSentiment === "risk_on") flowDirection = "to_risk";

            // Determine volatility
            let volatilityLevel: "calm" | "elevated" | "storm" = "calm";
            if (vix > 30) volatilityLevel = "storm";
            else if (vix > 20) volatilityLevel = "elevated";

            // Generate headline
            const { headline, subheadline } = generateHeadline(
                globalSentiment,
                dollarStrength,
                flowDirection,
                "en" // Will be dynamic based on user's language
            );

            const weather: EconomicWeather = {
                globalSentiment,
                sentimentScore: globalSentiment === "risk_on" ? 50 : globalSentiment === "risk_off" ? -50 : 0,
                flowDirection,
                dominantFlow: flowDirection === "to_safety"
                    ? { from: "Emerging Markets", to: "US Dollar", volume: 0.8 }
                    : flowDirection === "to_risk"
                    ? { from: "US Dollar", to: "Emerging Markets", volume: 0.6 }
                    : null,
                dollarStrength,
                yieldEnvironment: bondsData ? "stable" : "stable",
                volatilityLevel,
                headline,
                subheadline,
                stats: {
                    dollarIndex,
                    dollarChange,
                    vix,
                    vixChange: stocksData?.vix?.change_1d || 0,
                    sp500Change,
                    bondYield10Y,
                    bondYieldChange: bondsData?.us?.["10Y"]?.change_1d || 0
                },
                lastUpdate: new Date().toISOString()
            };

            // Generate module summaries
            const moduleSummaries: ModuleSummary[] = [
                {
                    id: "fx",
                    name: "FX & Macro",
                    userFriendlyName: "Money Weather Map",
                    icon: "globe",
                    status: dollarStrength === "strong" ? "bearish" : dollarStrength === "weak" ? "bullish" : "neutral",
                    oneLiner: dollarStrength === "strong"
                        ? "Dollar vacuum is ON"
                        : dollarStrength === "weak"
                        ? "Dollar is releasing pressure"
                        : "Currency markets are calm",
                    href: "/"
                },
                {
                    id: "bonds",
                    name: "Bond Market",
                    userFriendlyName: "Risk Gauge",
                    icon: "gauge",
                    status: bondYield10Y > 4.5 ? "warning" : bondYield10Y < 3.5 ? "bullish" : "neutral",
                    oneLiner: bondYield10Y > 4.5
                        ? "Yields are elevated - caution advised"
                        : "Safe to invest based on rates",
                    href: "/bonds"
                },
                {
                    id: "stocks",
                    name: "Stock Market",
                    userFriendlyName: "Market Pulse",
                    icon: "pulse",
                    status: sp500Change > 1 ? "bullish" : sp500Change < -1 ? "bearish" : "neutral",
                    oneLiner: sp500Change > 1
                        ? "Markets are surging"
                        : sp500Change < -1
                        ? "Markets under pressure"
                        : "Steady trading day",
                    href: "/stocks"
                },
                {
                    id: "policy",
                    name: "Central Banks",
                    userFriendlyName: "The Money Tap",
                    icon: "tap",
                    status: "neutral",
                    oneLiner: "Fed is watching inflation closely",
                    href: "/policy"
                },
                {
                    id: "economy",
                    name: "Real Economy",
                    userFriendlyName: "Economic Health",
                    icon: "health",
                    status: "neutral",
                    oneLiner: "PMI signals expansion",
                    href: "/economy"
                },
                {
                    id: "history",
                    name: "History",
                    userFriendlyName: "Deja Vu Engine",
                    icon: "history",
                    status: "warning",
                    oneLiner: "Current conditions echo 1999",
                    href: "/economy#history"
                }
            ];

            set({
                weather,
                moduleSummaries,
                isLoading: false
            });

        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch weather data",
                isLoading: false
            });
        }
    },

    setSelectedModule: (module) => set({ selectedModule: module }),
    openDebatePanel: () => set({ showDebatePanel: true }),
    closeDebatePanel: () => set({ showDebatePanel: false })
}));
