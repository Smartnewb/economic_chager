/**
 * Help Content - Definitions and explanations for all indicators and concepts
 */

export interface HelpItem {
    title: string;
    shortDescription: string;
    fullDescription: string;
    interpretation?: {
        bullish: string;
        bearish: string;
        neutral?: string;
    };
    learnMoreUrl?: string;
}

export const helpContent: Record<string, HelpItem> = {
    // Market Indicators
    vix: {
        title: 'VIX (Fear Index)',
        shortDescription: 'Measures expected market volatility over the next 30 days',
        fullDescription: 'The CBOE Volatility Index (VIX) represents the market\'s expectation of 30-day forward-looking volatility, derived from S&P 500 index options. It\'s often called the "Fear Index" because it tends to spike during market stress.',
        interpretation: {
            bullish: 'VIX below 15 indicates complacency - markets calm but potential for surprises',
            bearish: 'VIX above 30 indicates panic - historically good buying opportunities',
            neutral: 'VIX 15-25 is normal market conditions',
        },
        learnMoreUrl: 'https://www.investopedia.com/terms/v/vix.asp',
    },

    yield_curve: {
        title: 'Yield Curve (10Y-2Y Spread)',
        shortDescription: 'Difference between 10-year and 2-year Treasury yields',
        fullDescription: 'The yield curve spread measures the difference between long-term (10Y) and short-term (2Y) interest rates. An inverted yield curve (negative spread) has historically preceded recessions by 6-18 months.',
        interpretation: {
            bullish: 'Positive spread (steepening) suggests economic expansion ahead',
            bearish: 'Negative spread (inversion) historically precedes recessions',
            neutral: 'Flat curve suggests uncertainty about future growth',
        },
        learnMoreUrl: 'https://www.investopedia.com/terms/y/yieldcurve.asp',
    },

    buffett_indicator: {
        title: 'Buffett Indicator',
        shortDescription: 'Total market cap to GDP ratio',
        fullDescription: 'Named after Warren Buffett, this indicator compares total US stock market capitalization to GDP. Values above 140% historically suggest overvaluation, while below 80% suggests undervaluation.',
        interpretation: {
            bullish: 'Below 80% - historically undervalued, good entry point',
            bearish: 'Above 140% - historically overvalued, caution advised',
            neutral: '80-120% is considered fair value range',
        },
        learnMoreUrl: 'https://www.currentmarketvaluation.com/models/buffett-indicator.php',
    },

    cape: {
        title: 'CAPE (Shiller P/E)',
        shortDescription: 'Cyclically-adjusted price-to-earnings ratio',
        fullDescription: 'The Cyclically Adjusted Price-to-Earnings (CAPE) ratio, developed by Robert Shiller, uses inflation-adjusted earnings averaged over 10 years. It provides a smoother valuation metric than traditional P/E.',
        interpretation: {
            bullish: 'CAPE below 15 suggests undervaluation',
            bearish: 'CAPE above 30 suggests overvaluation',
            neutral: 'Historical average is around 16-17',
        },
        learnMoreUrl: 'https://www.investopedia.com/terms/c/cape-ratio.asp',
    },

    credit_spread: {
        title: 'Credit Spread',
        shortDescription: 'Yield difference between corporate and government bonds',
        fullDescription: 'Credit spreads measure the additional yield investors demand for holding corporate bonds over "risk-free" government bonds. Widening spreads indicate increasing credit risk concerns.',
        interpretation: {
            bullish: 'Tight spreads (< 1%) indicate confidence in corporate credit',
            bearish: 'Wide spreads (> 3%) indicate stress in credit markets',
            neutral: 'Normal range is 1-2%',
        },
        learnMoreUrl: 'https://www.investopedia.com/terms/c/creditspread.asp',
    },

    m2_growth: {
        title: 'M2 Money Supply Growth',
        shortDescription: 'Year-over-year change in money supply',
        fullDescription: 'M2 includes cash, checking deposits, and easily convertible near-money. Changes in M2 growth affect liquidity in the financial system and can influence asset prices.',
        interpretation: {
            bullish: 'Positive growth (> 5%) indicates liquidity expansion',
            bearish: 'Negative growth (contraction) can stress asset prices',
            neutral: '3-5% growth is historically normal',
        },
        learnMoreUrl: 'https://www.investopedia.com/terms/m/m2.asp',
    },

    // Whale & Institutional Concepts
    insider_trading: {
        title: 'Insider Trading (Legal)',
        shortDescription: 'Trades by company executives and directors',
        fullDescription: 'Corporate insiders (executives, directors, major shareholders) must report their stock transactions to the SEC. These legal insider trades can signal insider confidence or concerns about the company.',
        interpretation: {
            bullish: 'Cluster buying by multiple insiders is a strong positive signal',
            bearish: 'Large selling by CEO/CFO may indicate concerns',
            neutral: 'Routine selling for diversification is normal',
        },
        learnMoreUrl: 'https://www.sec.gov/fast-answers/answersinsiderhtm.html',
    },

    thirteen_f: {
        title: '13F Filing',
        shortDescription: 'Quarterly holdings report by institutional investors',
        fullDescription: 'Institutional investment managers with over $100M in assets must file Form 13F quarterly, disclosing their equity holdings. This reveals positions of major investors like hedge funds and mutual funds.',
        interpretation: {
            bullish: 'Multiple gurus adding same position suggests conviction',
            bearish: 'Large position reductions by top investors',
            neutral: 'Normal portfolio rebalancing is expected',
        },
        learnMoreUrl: 'https://www.sec.gov/divisions/investment/13ffaq.htm',
    },

    guru_consensus: {
        title: 'Guru Consensus',
        shortDescription: 'Stocks held by multiple legendary investors',
        fullDescription: 'When multiple well-known value investors (Warren Buffett, Bill Ackman, etc.) hold the same stock, it may indicate strong fundamental value. Based on their 13F filings.',
        interpretation: {
            bullish: 'High guru count (3+) suggests strong conviction',
            bearish: 'Mass selling by gurus is a warning sign',
            neutral: 'Single guru position requires more research',
        },
    },

    // Economic Indicators
    cpi: {
        title: 'CPI (Consumer Price Index)',
        shortDescription: 'Measures inflation in consumer goods',
        fullDescription: 'The Consumer Price Index measures average changes in prices paid by consumers for a basket of goods and services. It\'s the primary inflation measure used by the Federal Reserve.',
        interpretation: {
            bullish: 'Low inflation (1-2%) is healthy for economy',
            bearish: 'High inflation (> 5%) erodes purchasing power',
            neutral: 'Fed targets 2% annual inflation',
        },
        learnMoreUrl: 'https://www.bls.gov/cpi/',
    },

    unemployment: {
        title: 'Unemployment Rate',
        shortDescription: 'Percentage of labor force without jobs',
        fullDescription: 'The unemployment rate measures the percentage of the total labor force that is unemployed but actively seeking employment. It\'s a key indicator of economic health.',
        interpretation: {
            bullish: 'Low unemployment (< 4%) indicates strong economy',
            bearish: 'Rising unemployment suggests economic weakness',
            neutral: 'NAIRU (natural rate) is around 4-5%',
        },
        learnMoreUrl: 'https://www.bls.gov/cps/',
    },

    fed_funds: {
        title: 'Federal Funds Rate',
        shortDescription: 'Interest rate banks charge each other overnight',
        fullDescription: 'The federal funds rate is the target interest rate set by the Federal Open Market Committee (FOMC). It influences all other interest rates in the economy.',
        interpretation: {
            bullish: 'Rate cuts stimulate economic growth',
            bearish: 'Rate hikes tighten financial conditions',
            neutral: 'Neutral rate is estimated around 2-3%',
        },
        learnMoreUrl: 'https://www.federalreserve.gov/monetarypolicy/fomc.htm',
    },

    // Country Metrics
    gdp_growth: {
        title: 'GDP Growth',
        shortDescription: 'Annual economic output growth',
        fullDescription: 'Gross Domestic Product (GDP) growth measures the annual percentage change in a country\'s total economic output. It\'s the broadest measure of economic health.',
        interpretation: {
            bullish: 'Strong growth (> 3%) indicates economic expansion',
            bearish: 'Negative growth (recession) is concerning',
            neutral: '2-3% growth is considered healthy',
        },
    },

    current_account: {
        title: 'Current Account Balance',
        shortDescription: 'Trade balance plus income flows',
        fullDescription: 'The current account measures a country\'s trade balance (exports minus imports) plus international income transfers. A deficit means importing more than exporting.',
        interpretation: {
            bullish: 'Surplus indicates competitive exports',
            bearish: 'Large deficit may pressure currency',
            neutral: 'Small deficit can be sustainable',
        },
    },

    debt_to_gdp: {
        title: 'Debt-to-GDP Ratio',
        shortDescription: 'Government debt relative to economic output',
        fullDescription: 'This ratio compares a country\'s total government debt to its annual GDP. Higher ratios indicate higher debt burden and potential fiscal stress.',
        interpretation: {
            bullish: 'Low ratio (< 60%) indicates fiscal flexibility',
            bearish: 'Very high ratio (> 120%) raises sustainability concerns',
            neutral: '60-90% is common for developed nations',
        },
    },
};

export function getHelpContent(key: string): HelpItem | undefined {
    return helpContent[key];
}

export function getAllHelpKeys(): string[] {
    return Object.keys(helpContent);
}
