"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

// Dictionary of economic terms with simple explanations
const TERM_DICTIONARY: Record<string, { short: string; long: string; analogy?: string }> = {
    // Interest Rate Related
    "yield curve": {
        short: "The shape of interest rates over time",
        long: "A graph showing what interest rates banks charge for different loan lengths. When it 'inverts' (short-term rates higher than long-term), it often predicts a recession.",
        analogy: "Like a weather forecast - an inverted curve is like storm clouds gathering"
    },
    "yield curve inversion": {
        short: "When short-term rates exceed long-term rates",
        long: "Normally, you get paid more for locking up money longer. When the opposite happens, it signals that investors expect trouble ahead.",
        analogy: "Like a traffic jam - everyone's rushing to the exits"
    },
    "fed funds rate": {
        short: "The interest rate banks charge each other",
        long: "The main tool the Federal Reserve uses to control the economy. Higher = slower economy, lower = faster economy.",
        analogy: "Like a thermostat for the economy"
    },
    "quantitative easing": {
        short: "Central bank buying bonds to inject money",
        long: "When the Fed buys bonds from banks, it gives banks cash to lend. This is like printing money without physically printing it.",
        analogy: "Like giving the economy an adrenaline shot"
    },
    "quantitative tightening": {
        short: "Central bank selling bonds to remove money",
        long: "The opposite of QE - the Fed sells bonds, which takes cash out of the system and tightens financial conditions.",
        analogy: "Like draining water from a pool"
    },

    // Market Sentiment
    "risk on": {
        short: "Investors are seeking higher returns",
        long: "When investors feel confident, they move money into riskier assets like stocks, emerging markets, and crypto for higher potential returns.",
        analogy: "Like sunny weather - people go outside and take risks"
    },
    "risk off": {
        short: "Investors are seeking safety",
        long: "When fear rises, money flows to safe assets like US Treasury bonds, gold, and the US dollar, even if returns are lower.",
        analogy: "Like seeking shelter in a storm"
    },
    "vix": {
        short: "The 'fear gauge' of the stock market",
        long: "VIX measures expected volatility in the S&P 500. Above 20 = elevated fear, above 30 = high fear, above 40 = panic.",
        analogy: "Like the market's blood pressure reading"
    },
    "volatility": {
        short: "How much prices swing up and down",
        long: "High volatility means big price swings in either direction. It's a measure of uncertainty, not direction.",
        analogy: "Like choppy vs calm seas"
    },

    // Currency & FX
    "dollar index": {
        short: "The strength of USD vs major currencies",
        long: "A basket measuring the dollar against Euro, Yen, Pound, etc. Higher = stronger dollar. A strong dollar can hurt US exporters.",
        analogy: "Like a report card for the dollar"
    },
    "dxy": {
        short: "Another name for the Dollar Index",
        long: "The DXY tracks the US dollar against 6 major currencies. It's the go-to gauge for dollar strength.",
        analogy: "The dollar's weight on a scale"
    },
    "carry trade": {
        short: "Borrowing cheap, investing expensive",
        long: "Investors borrow in low-interest currencies (like Yen) and invest in higher-yielding assets. Risky because currency moves can wipe out gains.",
        analogy: "Like borrowing from a friend at 1% to earn 5% in a savings account"
    },
    "capital flight": {
        short: "Money rapidly leaving a country",
        long: "When investors lose confidence in a country's economy, they pull money out fast. This weakens the currency and can cause crises.",
        analogy: "Like passengers rushing to exit a plane"
    },

    // Valuation
    "cape ratio": {
        short: "10-year average price-to-earnings ratio",
        long: "A measure of how expensive the stock market is compared to long-term earnings. High CAPE = expensive market = lower future returns.",
        analogy: "Like checking if a house price is fair compared to 10 years of rent"
    },
    "pe ratio": {
        short: "Price divided by earnings",
        long: "How much you pay for $1 of company profit. A PE of 20 means you pay $20 for each $1 of annual profit.",
        analogy: "Like years of profit needed to pay back your investment"
    },

    // Economic Indicators
    "pmi": {
        short: "Manufacturing health survey",
        long: "Purchasing Managers' Index - a survey of factory managers. Above 50 = expansion, below 50 = contraction.",
        analogy: "Like taking the economy's temperature"
    },
    "cpi": {
        short: "Consumer price inflation",
        long: "Measures how much prices rise for everyday goods. The Fed targets about 2% annually.",
        analogy: "Like how much your grocery bill goes up each year"
    },
    "gdp": {
        short: "Total economic output",
        long: "Gross Domestic Product - the total value of everything a country produces. Growth = good, shrinking = recession.",
        analogy: "The country's total paycheck"
    },
    "real rate": {
        short: "Interest rate minus inflation",
        long: "What you actually earn after inflation eats into your returns. If rates are 5% and inflation is 3%, your real rate is 2%.",
        analogy: "Your actual purchasing power growth"
    },

    // Bonds
    "treasury yield": {
        short: "Interest rate on government bonds",
        long: "What the US government pays to borrow money. It's considered 'risk-free' and affects all other interest rates.",
        analogy: "The foundation that all other rates are built on"
    },
    "credit spread": {
        short: "Extra yield for taking risk",
        long: "How much extra interest companies must pay vs government bonds. Wider spreads = more fear about defaults.",
        analogy: "Like the risk premium for lending to a friend vs a bank"
    },
    "liquidity": {
        short: "How easily assets can be sold",
        long: "High liquidity = easy to buy/sell without moving the price. Low liquidity = hard to exit positions.",
        analogy: "Like how easily you can convert to cash at a fair price"
    },

    // Market Structure
    "deleveraging": {
        short: "Reducing debt levels",
        long: "When investors and companies reduce their borrowed money. Often happens during crises and causes asset prices to fall.",
        analogy: "Like paying down your credit cards"
    },
    "contagion": {
        short: "Crisis spreading between markets",
        long: "When problems in one market spread to others. Like the 2008 crisis spreading from US housing to global banks.",
        analogy: "Like a virus spreading between countries"
    }
};

// Normalize term for lookup
function normalizeTerm(term: string): string {
    return term.toLowerCase().trim();
}

// Find matching term
function findTerm(text: string): { term: string; definition: typeof TERM_DICTIONARY[string] } | null {
    const normalized = normalizeTerm(text);

    // Direct match
    if (TERM_DICTIONARY[normalized]) {
        return { term: normalized, definition: TERM_DICTIONARY[normalized] };
    }

    // Partial match
    for (const [key, value] of Object.entries(TERM_DICTIONARY)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return { term: key, definition: value };
        }
    }

    return null;
}

interface TranslatorTooltipProps {
    term: string;
    children?: ReactNode;
    className?: string;
}

export function TranslatorTooltip({ term, children, className = "" }: TranslatorTooltipProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<"top" | "bottom">("top");
    const triggerRef = useRef<HTMLSpanElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const definition = findTerm(term);

    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const spaceAbove = rect.top;
            const spaceBelow = window.innerHeight - rect.bottom;

            setPosition(spaceAbove > spaceBelow ? "top" : "bottom");
        }
    }, [isOpen]);

    if (!definition) {
        return <span className={className}>{children || term}</span>;
    }

    return (
        <span className="relative inline-block">
            <span
                ref={triggerRef}
                className={`
                    border-b border-dashed border-amber-500/50
                    cursor-help hover:border-amber-500
                    transition-colors ${className}
                `}
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
                onClick={() => setIsOpen(!isOpen)}
            >
                {children || term}
            </span>

            {isOpen && (
                <div
                    ref={tooltipRef}
                    className={`
                        absolute z-50 w-72 p-4
                        bg-gray-900/95 backdrop-blur-lg
                        border border-amber-500/30 rounded-xl
                        shadow-xl shadow-black/50
                        animate-fade-in
                        ${position === "top" ? "bottom-full mb-2" : "top-full mt-2"}
                        left-1/2 -translate-x-1/2
                    `}
                    onMouseEnter={() => setIsOpen(true)}
                    onMouseLeave={() => setIsOpen(false)}
                >
                    {/* Arrow */}
                    <div
                        className={`
                            absolute left-1/2 -translate-x-1/2
                            w-3 h-3 rotate-45
                            bg-gray-900 border-amber-500/30
                            ${position === "top"
                                ? "bottom-[-6px] border-r border-b"
                                : "top-[-6px] border-l border-t"
                            }
                        `}
                    />

                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="font-bold text-amber-400 capitalize">
                            {definition.term}
                        </span>
                    </div>

                    {/* Short Definition */}
                    <p className="text-white text-sm font-medium mb-2">
                        {definition.definition.short}
                    </p>

                    {/* Long Explanation */}
                    <p className="text-gray-400 text-xs leading-relaxed mb-2">
                        {definition.definition.long}
                    </p>

                    {/* Analogy */}
                    {definition.definition.analogy && (
                        <div className="pt-2 border-t border-white/10">
                            <p className="text-xs text-amber-400/80 italic">
                                "{definition.definition.analogy}"
                            </p>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(${position === "top" ? "4px" : "-4px"});
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.15s ease-out forwards;
                }
            `}</style>
        </span>
    );
}

// Auto-highlight terms in text
interface TranslatorTextProps {
    text: string;
    className?: string;
}

export function TranslatorText({ text, className = "" }: TranslatorTextProps) {
    const terms = Object.keys(TERM_DICTIONARY);

    // Create regex pattern for all terms
    const pattern = new RegExp(
        `\\b(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
        'gi'
    );

    // Split text and highlight matching terms
    const parts = text.split(pattern);

    return (
        <span className={className}>
            {parts.map((part, i) => {
                const match = findTerm(part);
                if (match) {
                    return (
                        <TranslatorTooltip key={i} term={part}>
                            {part}
                        </TranslatorTooltip>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
}

// Export the dictionary for external use
export { TERM_DICTIONARY };
