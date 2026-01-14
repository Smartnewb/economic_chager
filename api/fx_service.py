"""
FX Service - Foreign Exchange Data Service
Provides comprehensive FX analysis including:
- Major currency pairs live rates
- Currency strength index
- Carry trade analysis
- Interest rate differentials
- PPP (Purchasing Power Parity) analysis
- Central bank policy tracking
"""

import yfinance as yf
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)

# Major currency pairs
MAJOR_PAIRS = [
    ("EUR", "USD", "EURUSD=X"),
    ("GBP", "USD", "GBPUSD=X"),
    ("USD", "JPY", "USDJPY=X"),
    ("USD", "CHF", "USDCHF=X"),
    ("AUD", "USD", "AUDUSD=X"),
    ("USD", "CAD", "USDCAD=X"),
    ("NZD", "USD", "NZDUSD=X"),
    ("EUR", "GBP", "EURGBP=X"),
    ("EUR", "JPY", "EURJPY=X"),
    ("GBP", "JPY", "GBPJPY=X"),
    ("USD", "KRW", "USDKRW=X"),
    ("USD", "CNY", "USDCNY=X"),
]

# Major currencies for strength calculation
MAJOR_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "NZD"]

# Central bank interest rates (as of latest data)
CENTRAL_BANK_RATES = {
    "USD": {"bank": "Federal Reserve", "rate": 5.25, "next_meeting": "2024-03-20", "trend": "hold"},
    "EUR": {"bank": "European Central Bank", "rate": 4.50, "next_meeting": "2024-03-07", "trend": "hold"},
    "GBP": {"bank": "Bank of England", "rate": 5.25, "next_meeting": "2024-03-21", "trend": "hold"},
    "JPY": {"bank": "Bank of Japan", "rate": -0.10, "next_meeting": "2024-03-19", "trend": "hike"},
    "CHF": {"bank": "Swiss National Bank", "rate": 1.75, "next_meeting": "2024-03-21", "trend": "hold"},
    "AUD": {"bank": "Reserve Bank of Australia", "rate": 4.35, "next_meeting": "2024-03-19", "trend": "hold"},
    "CAD": {"bank": "Bank of Canada", "rate": 5.00, "next_meeting": "2024-03-06", "trend": "hold"},
    "NZD": {"bank": "Reserve Bank of New Zealand", "rate": 5.50, "next_meeting": "2024-02-28", "trend": "hold"},
    "KRW": {"bank": "Bank of Korea", "rate": 3.50, "next_meeting": "2024-02-22", "trend": "hold"},
    "CNY": {"bank": "People's Bank of China", "rate": 3.45, "next_meeting": None, "trend": "cut"},
}

# PPP fair values (approximate based on OECD data)
PPP_FAIR_VALUES = {
    "EURUSD": 1.35,
    "GBPUSD": 1.45,
    "USDJPY": 100.0,
    "USDCHF": 0.85,
    "AUDUSD": 0.72,
    "USDCAD": 1.22,
    "NZDUSD": 0.68,
}


class FXService:
    """Foreign Exchange Data Service"""

    def __init__(self):
        self._cache = {}
        self._cache_duration = 300  # 5 minutes

    def _get_cache_key(self, method: str, *args) -> str:
        """Generate cache key"""
        timestamp_bucket = int(datetime.now().timestamp()) // self._cache_duration
        return f"{method}:{':'.join(str(a) for a in args)}:{timestamp_bucket}"

    def _fetch_pair_data(self, symbol: str) -> Dict:
        """Fetch single currency pair data from yfinance"""
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            hist = ticker.history(period="2d")

            if hist.empty:
                return None

            current_price = hist['Close'].iloc[-1] if len(hist) > 0 else 0
            prev_price = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
            change_pct = ((current_price - prev_price) / prev_price * 100) if prev_price > 0 else 0

            high_24h = hist['High'].iloc[-1] if len(hist) > 0 else current_price
            low_24h = hist['Low'].iloc[-1] if len(hist) > 0 else current_price
            volume = hist['Volume'].iloc[-1] if len(hist) > 0 and 'Volume' in hist else 0

            return {
                "rate": round(current_price, 4),
                "change_24h": round(change_pct, 2),
                "high_24h": round(high_24h, 4),
                "low_24h": round(low_24h, 4),
                "volume": int(volume) if volume else 0,
                "bid": round(current_price * 0.9999, 4),
                "ask": round(current_price * 1.0001, 4),
                "trend": "up" if change_pct > 0 else "down" if change_pct < 0 else "neutral"
            }
        except Exception as e:
            logger.error(f"Error fetching {symbol}: {e}")
            return None

    def get_major_pairs_live(self) -> Dict:
        """
        Get live rates for all major currency pairs
        Returns dict with pair name as key
        """
        cache_key = self._get_cache_key("major_pairs")
        if cache_key in self._cache:
            return self._cache[cache_key]

        result = {}
        for base, quote, symbol in MAJOR_PAIRS:
            pair_name = f"{base}/{quote}"
            data = self._fetch_pair_data(symbol)
            if data:
                result[pair_name] = {
                    "pair": pair_name,
                    "base": base,
                    "quote": quote,
                    "symbol": symbol,
                    **data
                }

        # Add DXY (Dollar Index)
        dxy_data = self._fetch_pair_data("DX-Y.NYB")
        if dxy_data:
            result["DXY"] = {
                "pair": "DXY",
                "name": "US Dollar Index",
                "base": "USD",
                "quote": "BASKET",
                "symbol": "DX-Y.NYB",
                **dxy_data
            }

        self._cache[cache_key] = result
        return result

    def get_currency_strength(self) -> Dict:
        """
        Calculate currency strength index for major currencies
        Based on performance against all other major currencies
        Returns: Dict with currency code as key, strength score 0-100
        """
        cache_key = self._get_cache_key("currency_strength")
        if cache_key in self._cache:
            return self._cache[cache_key]

        pairs = self.get_major_pairs_live()

        # Calculate strength for each currency
        strength_scores = {curr: [] for curr in MAJOR_CURRENCIES}

        for pair_name, data in pairs.items():
            if pair_name == "DXY" or "/" not in pair_name:
                continue

            base, quote = pair_name.split("/")
            change = data.get("change_24h", 0)

            # Base currency gains when pair goes up
            if base in strength_scores:
                strength_scores[base].append(change)
            # Quote currency loses when pair goes up
            if quote in strength_scores:
                strength_scores[quote].append(-change)

        # Calculate average and normalize to 0-100
        result = {}
        all_averages = []
        for curr, changes in strength_scores.items():
            if changes:
                avg = sum(changes) / len(changes)
                all_averages.append((curr, avg))

        if all_averages:
            min_avg = min(a[1] for a in all_averages)
            max_avg = max(a[1] for a in all_averages)
            range_avg = max_avg - min_avg if max_avg != min_avg else 1

            for curr, avg in all_averages:
                normalized = ((avg - min_avg) / range_avg) * 100
                result[curr] = {
                    "currency": curr,
                    "strength": round(normalized, 1),
                    "change": round(avg, 2),
                    "rank": 0,  # Will be filled below
                    "trend": "strong" if normalized >= 66 else "weak" if normalized <= 33 else "neutral"
                }

        # Assign ranks
        sorted_currencies = sorted(result.items(), key=lambda x: x[1]["strength"], reverse=True)
        for rank, (curr, data) in enumerate(sorted_currencies, 1):
            result[curr]["rank"] = rank

        self._cache[cache_key] = result
        return result

    def get_cross_rates_matrix(self) -> Dict:
        """
        Get cross rates matrix for all major currencies
        Returns NxN matrix of exchange rates
        """
        cache_key = self._get_cache_key("cross_rates")
        if cache_key in self._cache:
            return self._cache[cache_key]

        pairs = self.get_major_pairs_live()

        # Build direct rates lookup
        direct_rates = {}
        for pair_name, data in pairs.items():
            if "/" in pair_name:
                direct_rates[pair_name] = data.get("rate", 0)
                # Add inverse
                base, quote = pair_name.split("/")
                inverse_pair = f"{quote}/{base}"
                if data.get("rate", 0) > 0:
                    direct_rates[inverse_pair] = 1 / data.get("rate")

        # Build matrix
        matrix = {}
        for base in MAJOR_CURRENCIES:
            matrix[base] = {}
            for quote in MAJOR_CURRENCIES:
                if base == quote:
                    matrix[base][quote] = 1.0
                else:
                    pair = f"{base}/{quote}"
                    if pair in direct_rates:
                        matrix[base][quote] = round(direct_rates[pair], 4)
                    else:
                        # Try to calculate via USD
                        base_usd = direct_rates.get(f"{base}/USD") or (1/direct_rates.get(f"USD/{base}", 1))
                        quote_usd = direct_rates.get(f"{quote}/USD") or (1/direct_rates.get(f"USD/{quote}", 1))
                        if base_usd and quote_usd:
                            matrix[base][quote] = round(base_usd / quote_usd, 4)
                        else:
                            matrix[base][quote] = None

        self._cache[cache_key] = {
            "currencies": MAJOR_CURRENCIES,
            "matrix": matrix,
            "timestamp": datetime.now().isoformat()
        }
        return self._cache[cache_key]

    def get_carry_trade_opportunities(self) -> List[Dict]:
        """
        Analyze carry trade opportunities based on interest rate differentials
        Returns sorted list of opportunities by expected return
        """
        cache_key = self._get_cache_key("carry_trades")
        if cache_key in self._cache:
            return self._cache[cache_key]

        pairs = self.get_major_pairs_live()
        opportunities = []

        for pair_name, data in pairs.items():
            if "/" not in pair_name or pair_name == "DXY":
                continue

            base, quote = pair_name.split("/")

            if base not in CENTRAL_BANK_RATES or quote not in CENTRAL_BANK_RATES:
                continue

            base_rate = CENTRAL_BANK_RATES[base]["rate"]
            quote_rate = CENTRAL_BANK_RATES[quote]["rate"]
            rate_diff = base_rate - quote_rate

            # Carry trade: borrow low rate currency, invest in high rate
            if rate_diff > 0:
                # Long base (high rate), short quote (low rate)
                direction = "long"
                carry_return = rate_diff
            else:
                # Long quote (high rate), short base (low rate)
                direction = "short"
                carry_return = -rate_diff

            # Calculate volatility impact (simplified)
            volatility_estimate = abs(data.get("change_24h", 0)) * 15  # Annualized estimate
            risk_adjusted_return = carry_return - (volatility_estimate * 0.5)

            opportunities.append({
                "pair": pair_name,
                "direction": direction,
                "base_rate": base_rate,
                "quote_rate": quote_rate,
                "rate_differential": round(abs(rate_diff), 2),
                "carry_return": round(carry_return, 2),
                "volatility_estimate": round(volatility_estimate, 2),
                "risk_adjusted_return": round(risk_adjusted_return, 2),
                "current_rate": data.get("rate", 0),
                "recommendation": "strong" if risk_adjusted_return > 3 else "moderate" if risk_adjusted_return > 1 else "weak"
            })

        # Sort by risk-adjusted return
        opportunities.sort(key=lambda x: x["risk_adjusted_return"], reverse=True)

        self._cache[cache_key] = opportunities
        return opportunities

    def get_interest_rate_differentials(self) -> Dict:
        """
        Get interest rate differentials for major pairs
        """
        cache_key = self._get_cache_key("rate_differentials")
        if cache_key in self._cache:
            return self._cache[cache_key]

        result = {}
        processed_pairs = set()

        for base in MAJOR_CURRENCIES:
            for quote in MAJOR_CURRENCIES:
                if base == quote:
                    continue

                pair = f"{base}/{quote}"
                if pair in processed_pairs or f"{quote}/{base}" in processed_pairs:
                    continue

                if base in CENTRAL_BANK_RATES and quote in CENTRAL_BANK_RATES:
                    base_rate = CENTRAL_BANK_RATES[base]["rate"]
                    quote_rate = CENTRAL_BANK_RATES[quote]["rate"]
                    diff = base_rate - quote_rate

                    result[pair] = {
                        "pair": pair,
                        "base_currency": base,
                        "quote_currency": quote,
                        "base_rate": base_rate,
                        "quote_rate": quote_rate,
                        "differential": round(diff, 2),
                        "direction": "favor_base" if diff > 0 else "favor_quote" if diff < 0 else "neutral",
                        "base_bank": CENTRAL_BANK_RATES[base]["bank"],
                        "quote_bank": CENTRAL_BANK_RATES[quote]["bank"]
                    }
                    processed_pairs.add(pair)

        self._cache[cache_key] = result
        return result

    def get_ppp_analysis(self) -> Dict:
        """
        Get PPP (Purchasing Power Parity) analysis
        Shows overvalued/undervalued currencies
        """
        cache_key = self._get_cache_key("ppp_analysis")
        if cache_key in self._cache:
            return self._cache[cache_key]

        pairs = self.get_major_pairs_live()
        result = {}

        for pair_key, fair_value in PPP_FAIR_VALUES.items():
            pair_name = f"{pair_key[:3]}/{pair_key[3:]}"

            if pair_name in pairs:
                current_rate = pairs[pair_name].get("rate", 0)

                if current_rate > 0:
                    deviation_pct = ((current_rate - fair_value) / fair_value) * 100

                    result[pair_name] = {
                        "pair": pair_name,
                        "current_rate": current_rate,
                        "ppp_fair_value": fair_value,
                        "deviation_pct": round(deviation_pct, 1),
                        "base_status": "overvalued" if deviation_pct > 10 else "undervalued" if deviation_pct < -10 else "fairly_valued",
                        "interpretation": self._get_ppp_interpretation(pair_name, deviation_pct)
                    }

        self._cache[cache_key] = result
        return result

    def _get_ppp_interpretation(self, pair: str, deviation: float) -> str:
        """Generate interpretation text for PPP deviation"""
        base = pair.split("/")[0]

        if deviation > 20:
            return f"{base} is significantly overvalued. May face downward pressure long-term."
        elif deviation > 10:
            return f"{base} appears overvalued relative to PPP. Consider hedging exposure."
        elif deviation < -20:
            return f"{base} is significantly undervalued. Potential appreciation opportunity."
        elif deviation < -10:
            return f"{base} appears undervalued. Favorable for {base} assets."
        else:
            return f"{base} is trading near fair value based on PPP."

    def get_central_bank_calendar(self) -> List[Dict]:
        """
        Get central bank meeting calendar and rate expectations
        """
        calendar = []

        for currency, data in CENTRAL_BANK_RATES.items():
            if data.get("next_meeting"):
                calendar.append({
                    "currency": currency,
                    "bank": data["bank"],
                    "current_rate": data["rate"],
                    "next_meeting": data["next_meeting"],
                    "trend": data["trend"],
                    "expected_action": self._get_expected_action(data["trend"]),
                    "days_until": self._days_until(data["next_meeting"])
                })

        # Sort by next meeting date
        calendar.sort(key=lambda x: x["next_meeting"] if x["next_meeting"] else "9999-12-31")

        return calendar

    def _get_expected_action(self, trend: str) -> str:
        """Convert trend to expected action text"""
        actions = {
            "hike": "Rate Hike Expected",
            "cut": "Rate Cut Expected",
            "hold": "Hold Expected"
        }
        return actions.get(trend, "Unknown")

    def _days_until(self, date_str: str) -> int:
        """Calculate days until a date"""
        if not date_str:
            return -1
        try:
            target = datetime.strptime(date_str, "%Y-%m-%d")
            diff = (target - datetime.now()).days
            return max(0, diff)
        except:
            return -1

    def get_fx_summary(self) -> Dict:
        """
        Get comprehensive FX market summary
        """
        pairs = self.get_major_pairs_live()
        strength = self.get_currency_strength()
        carry = self.get_carry_trade_opportunities()

        # Find strongest and weakest
        sorted_strength = sorted(strength.items(), key=lambda x: x[1].get("strength", 0), reverse=True)
        strongest = sorted_strength[0] if sorted_strength else None
        weakest = sorted_strength[-1] if sorted_strength else None

        # Get DXY status
        dxy = pairs.get("DXY", {})
        dxy_status = "strong" if dxy.get("change_24h", 0) > 0.3 else "weak" if dxy.get("change_24h", 0) < -0.3 else "neutral"

        # Best carry trade
        best_carry = carry[0] if carry else None

        return {
            "timestamp": datetime.now().isoformat(),
            "dxy": {
                "value": dxy.get("rate", 0),
                "change": dxy.get("change_24h", 0),
                "status": dxy_status
            },
            "strongest_currency": {
                "currency": strongest[0] if strongest else None,
                "strength": strongest[1].get("strength", 0) if strongest else 0
            },
            "weakest_currency": {
                "currency": weakest[0] if weakest else None,
                "strength": weakest[1].get("strength", 0) if weakest else 0
            },
            "best_carry_trade": {
                "pair": best_carry.get("pair") if best_carry else None,
                "return": best_carry.get("risk_adjusted_return") if best_carry else 0
            },
            "total_pairs_tracked": len([p for p in pairs if "/" in p]),
            "market_regime": self._determine_market_regime(dxy_status, strength)
        }

    def _determine_market_regime(self, dxy_status: str, strength: Dict) -> str:
        """Determine current FX market regime"""
        # Strong USD = Risk-off typically
        if dxy_status == "strong":
            return "risk_off"
        elif dxy_status == "weak":
            # Weak USD often means risk-on
            return "risk_on"
        else:
            return "neutral"


# Singleton instance
fx_service = FXService()
