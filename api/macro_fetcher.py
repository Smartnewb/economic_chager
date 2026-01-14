"""
Macro Intelligence Engine - FRED API Integration
Fetches real macroeconomic data and calculates derived metrics.
"""

import os
from datetime import datetime, timedelta
from typing import Optional
from dataclasses import dataclass
import json
from pathlib import Path

# Try importing pandas and requests, provide fallback if not available
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


# FRED API Series IDs
FRED_SERIES = {
    # GDP & Market Cap
    "gdp": "GDP",                          # Gross Domestic Product (Quarterly, Billions)
    "wilshire_5000": "WILL5000PR",         # Wilshire 5000 Total Market Index

    # Money Supply & Liquidity
    "m2": "M2SL",                          # M2 Money Stock (Monthly, Billions)

    # Inflation
    "cpi": "CPIAUCSL",                     # Consumer Price Index (Monthly)
    "cpi_yoy": "CPIAUCNS",                 # CPI Year-over-Year (for easy YoY calc)

    # Interest Rates
    "treasury_10y": "DGS10",               # 10-Year Treasury Constant Maturity
    "treasury_2y": "DGS2",                 # 2-Year Treasury Constant Maturity
    "fed_funds": "FEDFUNDS",               # Federal Funds Effective Rate

    # Credit & Risk
    "credit_spread": "BAMLC0A0CM",         # ICE BofA US Corporate Index OAS
    "high_yield_spread": "BAMLH0A0HYM2",   # ICE BofA US High Yield Index OAS

    # Government Debt
    "debt_to_gdp": "GFDEGDQ188S",          # Federal Debt to GDP Ratio

    # Employment
    "unemployment": "UNRATE",              # Unemployment Rate

    # VIX (from CBOE, not FRED - we'll use fallback)
    "vix": "VIXCLS",                       # CBOE Volatility Index (if available)
}


@dataclass
class MacroMetrics:
    """Container for calculated macro metrics"""
    # Valuation Metrics
    buffett_indicator: Optional[float] = None
    buffett_indicator_signal: Optional[str] = None

    # Interest Rate Metrics
    real_interest_rate: Optional[float] = None
    yield_curve_spread: Optional[float] = None
    yield_curve_signal: Optional[str] = None

    # Liquidity Metrics
    m2_growth_yoy: Optional[float] = None
    m2_growth_signal: Optional[str] = None

    # Risk Metrics
    vix: Optional[float] = None
    vix_signal: Optional[str] = None
    credit_spread: Optional[float] = None
    credit_spread_signal: Optional[str] = None

    # Government Metrics
    debt_to_gdp: Optional[float] = None

    # Inflation Metrics
    cpi_yoy: Optional[float] = None
    inflation_signal: Optional[str] = None

    # Cycle Metrics
    fed_funds_rate: Optional[float] = None
    unemployment_rate: Optional[float] = None

    # Raw data for AI context
    treasury_10y: Optional[float] = None
    treasury_2y: Optional[float] = None
    gdp_billions: Optional[float] = None
    market_cap_billions: Optional[float] = None

    # Metadata
    last_updated: Optional[str] = None
    data_freshness: Optional[str] = None


class MacroFetcher:
    """
    Fetches macroeconomic data from FRED API and calculates derived metrics.
    Falls back to cached/mock data if API is unavailable.
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize MacroFetcher with optional FRED API key.

        Args:
            api_key: FRED API key. If not provided, will try to read from
                    FRED_API_KEY environment variable.
        """
        self.api_key = api_key or os.environ.get("FRED_API_KEY")
        self.base_url = "https://api.stlouisfed.org/fred/series/observations"
        self.cache_dir = Path(__file__).parent / "cache" / "macro"
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _fetch_fred_series(self, series_id: str, limit: int = 10) -> Optional[list]:
        """
        Fetch data series from FRED API.

        Args:
            series_id: FRED series identifier
            limit: Number of most recent observations to fetch

        Returns:
            List of observations or None if failed
        """
        if not self.api_key or not REQUESTS_AVAILABLE:
            return None

        try:
            params = {
                "series_id": series_id,
                "api_key": self.api_key,
                "file_type": "json",
                "sort_order": "desc",
                "limit": limit,
            }

            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()
            observations = data.get("observations", [])

            # Filter out missing values and convert to float
            valid_obs = []
            for obs in observations:
                if obs.get("value") and obs["value"] != ".":
                    try:
                        valid_obs.append({
                            "date": obs["date"],
                            "value": float(obs["value"])
                        })
                    except ValueError:
                        continue

            return valid_obs if valid_obs else None

        except Exception as e:
            print(f"FRED API error for {series_id}: {e}")
            return None

    def _get_latest_value(self, series_id: str) -> Optional[float]:
        """Get the most recent value for a series."""
        data = self._fetch_fred_series(series_id, limit=1)
        if data and len(data) > 0:
            return data[0]["value"]
        return None

    def _calculate_yoy_change(self, series_id: str) -> Optional[float]:
        """Calculate year-over-year percentage change for a series."""
        data = self._fetch_fred_series(series_id, limit=15)  # Get ~15 months of data
        if not data or len(data) < 12:
            return None

        try:
            current = data[0]["value"]
            # Find value from approximately 12 months ago
            year_ago = data[min(12, len(data) - 1)]["value"]

            if year_ago and year_ago != 0:
                return ((current - year_ago) / year_ago) * 100
        except (IndexError, TypeError, ZeroDivisionError):
            pass

        return None

    def _calculate_buffett_indicator(self, gdp: float, market_cap: float) -> tuple[float, str]:
        """
        Calculate Buffett Indicator (Total Market Cap / GDP * 100).

        Returns:
            Tuple of (indicator value, signal string)
        """
        if not gdp or gdp == 0:
            return None, "unknown"

        indicator = (market_cap / gdp) * 100

        # Signal thresholds (based on historical analysis)
        if indicator < 70:
            signal = "significantly_undervalued"
        elif indicator < 85:
            signal = "undervalued"
        elif indicator < 100:
            signal = "fair_value"
        elif indicator < 115:
            signal = "modestly_overvalued"
        elif indicator < 140:
            signal = "overvalued"
        else:
            signal = "significantly_overvalued"

        return round(indicator, 1), signal

    def _calculate_real_rate(self, nominal_rate: float, inflation: float) -> float:
        """Calculate real interest rate = nominal rate - inflation."""
        if nominal_rate is None or inflation is None:
            return None
        return round(nominal_rate - inflation, 2)

    def _get_yield_curve_signal(self, spread: float) -> str:
        """Interpret yield curve spread."""
        if spread is None:
            return "unknown"
        if spread < -0.5:
            return "deeply_inverted"
        elif spread < 0:
            return "inverted"
        elif spread < 0.5:
            signal = "flat"
        elif spread < 1.5:
            signal = "normal"
        else:
            signal = "steep"
        return signal

    def _get_vix_signal(self, vix: float) -> str:
        """Interpret VIX level."""
        if vix is None:
            return "unknown"
        if vix < 12:
            return "extreme_complacency"
        elif vix < 20:
            return "low_fear"
        elif vix < 25:
            return "moderate_fear"
        elif vix < 30:
            return "elevated_fear"
        elif vix < 40:
            return "high_fear"
        else:
            return "extreme_fear"

    def _get_credit_spread_signal(self, spread: float) -> str:
        """Interpret credit spread level."""
        if spread is None:
            return "unknown"
        if spread < 1.0:
            return "tight"
        elif spread < 1.5:
            return "normal"
        elif spread < 2.5:
            return "widening"
        elif spread < 4.0:
            return "stressed"
        else:
            return "crisis"

    def _get_m2_growth_signal(self, growth: float) -> str:
        """Interpret M2 money supply growth."""
        if growth is None:
            return "unknown"
        if growth < -2:
            return "contracting"
        elif growth < 2:
            return "stagnant"
        elif growth < 6:
            return "moderate"
        elif growth < 10:
            return "expanding"
        else:
            return "rapid_expansion"

    def _get_inflation_signal(self, cpi_yoy: float) -> str:
        """Interpret inflation level."""
        if cpi_yoy is None:
            return "unknown"
        if cpi_yoy < 0:
            return "deflation"
        elif cpi_yoy < 1.5:
            return "low"
        elif cpi_yoy < 2.5:
            return "target"
        elif cpi_yoy < 4:
            return "elevated"
        elif cpi_yoy < 6:
            return "high"
        else:
            return "very_high"

    def _load_cache(self) -> Optional[dict]:
        """Load cached macro data if fresh (less than 6 hours old)."""
        cache_file = self.cache_dir / "macro_data.json"
        if not cache_file.exists():
            return None

        try:
            with open(cache_file, "r") as f:
                cached = json.load(f)

            # Check freshness (6 hours)
            cached_time = datetime.fromisoformat(cached.get("timestamp", "2000-01-01"))
            if datetime.now() - cached_time < timedelta(hours=6):
                return cached.get("data")
        except (json.JSONDecodeError, IOError, ValueError):
            pass

        return None

    def _save_cache(self, data: dict) -> None:
        """Save macro data to cache."""
        cache_file = self.cache_dir / "macro_data.json"
        try:
            with open(cache_file, "w") as f:
                json.dump({
                    "timestamp": datetime.now().isoformat(),
                    "data": data
                }, f, indent=2)
        except IOError as e:
            print(f"Failed to save macro cache: {e}")

    def _get_mock_data(self) -> MacroMetrics:
        """Return mock data when FRED API is unavailable."""
        return MacroMetrics(
            # Valuation
            buffett_indicator=185.5,
            buffett_indicator_signal="significantly_overvalued",

            # Interest Rates
            real_interest_rate=1.2,
            yield_curve_spread=-0.35,
            yield_curve_signal="inverted",
            treasury_10y=4.55,
            treasury_2y=4.90,

            # Liquidity
            m2_growth_yoy=-1.8,
            m2_growth_signal="contracting",

            # Risk
            vix=18.5,
            vix_signal="low_fear",
            credit_spread=1.35,
            credit_spread_signal="normal",

            # Government
            debt_to_gdp=123.5,

            # Inflation
            cpi_yoy=3.4,
            inflation_signal="elevated",

            # Cycle
            fed_funds_rate=5.33,
            unemployment_rate=3.9,

            # Raw
            gdp_billions=27360,
            market_cap_billions=50750,

            # Metadata
            last_updated=datetime.now().isoformat(),
            data_freshness="mock_data"
        )

    def fetch_all_metrics(self, use_cache: bool = True) -> MacroMetrics:
        """
        Fetch all macro metrics from FRED API.

        Args:
            use_cache: Whether to use cached data if available

        Returns:
            MacroMetrics object with all available data
        """
        # Check cache first
        if use_cache:
            cached = self._load_cache()
            if cached:
                metrics = MacroMetrics(**cached)
                metrics.data_freshness = "cached"
                return metrics

        # If no API key, return mock data
        if not self.api_key:
            return self._get_mock_data()

        try:
            # Fetch raw data from FRED
            gdp = self._get_latest_value(FRED_SERIES["gdp"])
            wilshire = self._get_latest_value(FRED_SERIES["wilshire_5000"])
            treasury_10y = self._get_latest_value(FRED_SERIES["treasury_10y"])
            treasury_2y = self._get_latest_value(FRED_SERIES["treasury_2y"])
            fed_funds = self._get_latest_value(FRED_SERIES["fed_funds"])
            credit_spread = self._get_latest_value(FRED_SERIES["credit_spread"])
            debt_to_gdp = self._get_latest_value(FRED_SERIES["debt_to_gdp"])
            unemployment = self._get_latest_value(FRED_SERIES["unemployment"])
            vix = self._get_latest_value(FRED_SERIES["vix"])

            # Calculate YoY changes
            cpi_yoy = self._calculate_yoy_change(FRED_SERIES["cpi"])
            m2_yoy = self._calculate_yoy_change(FRED_SERIES["m2"])

            # Calculate derived metrics

            # Buffett Indicator
            # Note: Wilshire 5000 needs to be converted to billions
            # The index value roughly represents total market cap in billions
            market_cap = wilshire * 1.0 if wilshire else None  # Simplified conversion
            buffett_indicator, buffett_signal = (None, "unknown")
            if gdp and market_cap:
                # GDP is quarterly in billions, market cap from Wilshire index
                # Wilshire 5000 Full Cap Price Index, multiply by ~1.2 for full market
                estimated_market_cap = market_cap * 1.2
                buffett_indicator, buffett_signal = self._calculate_buffett_indicator(
                    gdp, estimated_market_cap
                )

            # Yield Curve Spread
            yield_spread = None
            if treasury_10y is not None and treasury_2y is not None:
                yield_spread = round(treasury_10y - treasury_2y, 2)

            # Real Interest Rate
            real_rate = self._calculate_real_rate(treasury_10y, cpi_yoy)

            metrics = MacroMetrics(
                # Valuation
                buffett_indicator=buffett_indicator,
                buffett_indicator_signal=buffett_signal,

                # Interest Rates
                real_interest_rate=real_rate,
                yield_curve_spread=yield_spread,
                yield_curve_signal=self._get_yield_curve_signal(yield_spread),
                treasury_10y=treasury_10y,
                treasury_2y=treasury_2y,

                # Liquidity
                m2_growth_yoy=round(m2_yoy, 1) if m2_yoy else None,
                m2_growth_signal=self._get_m2_growth_signal(m2_yoy),

                # Risk
                vix=vix,
                vix_signal=self._get_vix_signal(vix),
                credit_spread=credit_spread,
                credit_spread_signal=self._get_credit_spread_signal(credit_spread),

                # Government
                debt_to_gdp=round(debt_to_gdp, 1) if debt_to_gdp else None,

                # Inflation
                cpi_yoy=round(cpi_yoy, 1) if cpi_yoy else None,
                inflation_signal=self._get_inflation_signal(cpi_yoy),

                # Cycle
                fed_funds_rate=fed_funds,
                unemployment_rate=unemployment,

                # Raw
                gdp_billions=gdp,
                market_cap_billions=market_cap,

                # Metadata
                last_updated=datetime.now().isoformat(),
                data_freshness="live"
            )

            # Cache the results
            self._save_cache(metrics.__dict__)

            return metrics

        except Exception as e:
            print(f"Error fetching macro metrics: {e}")
            # Return mock data on error
            return self._get_mock_data()

    def get_health_check_data(self) -> dict:
        """
        Get structured data for /api/macro/health-check endpoint.

        Returns:
            Dict with valuation, cycles, liquidity, and inflation sections
        """
        metrics = self.fetch_all_metrics()

        return {
            "timestamp": datetime.now().isoformat(),
            "data_freshness": metrics.data_freshness,

            "valuation": {
                "buffett_indicator": {
                    "value": metrics.buffett_indicator,
                    "signal": metrics.buffett_indicator_signal,
                    "description": "Total Market Cap / GDP ratio",
                    "thresholds": {
                        "undervalued": "<85%",
                        "fair_value": "85-115%",
                        "overvalued": ">115%"
                    }
                },
                "market_cap_billions": metrics.market_cap_billions,
                "gdp_billions": metrics.gdp_billions,
            },

            "cycles": {
                "yield_curve": {
                    "spread_10y_2y": metrics.yield_curve_spread,
                    "signal": metrics.yield_curve_signal,
                    "treasury_10y": metrics.treasury_10y,
                    "treasury_2y": metrics.treasury_2y,
                    "description": "10Y-2Y Treasury spread"
                },
                "fed_funds_rate": metrics.fed_funds_rate,
                "unemployment_rate": metrics.unemployment_rate,
                "debt_to_gdp": metrics.debt_to_gdp,
            },

            "liquidity": {
                "m2_growth": {
                    "yoy_percent": metrics.m2_growth_yoy,
                    "signal": metrics.m2_growth_signal,
                    "description": "M2 Money Supply YoY change"
                },
                "credit_spread": {
                    "value": metrics.credit_spread,
                    "signal": metrics.credit_spread_signal,
                    "description": "Corporate bond spread over Treasuries"
                },
            },

            "risk": {
                "vix": {
                    "value": metrics.vix,
                    "signal": metrics.vix_signal,
                    "description": "CBOE Volatility Index"
                },
            },

            "inflation": {
                "cpi_yoy": {
                    "value": metrics.cpi_yoy,
                    "signal": metrics.inflation_signal,
                    "description": "Consumer Price Index YoY"
                },
                "real_interest_rate": {
                    "value": metrics.real_interest_rate,
                    "description": "10Y Treasury minus CPI YoY"
                },
            },

            "ai_context": self.generate_ai_context(metrics)
        }

    def generate_ai_context(self, metrics: MacroMetrics = None) -> str:
        """
        Generate a structured text summary for AI agent prompts.

        Returns:
            Formatted string with current macro environment summary
        """
        if metrics is None:
            metrics = self.fetch_all_metrics()

        context_parts = [
            "=== CURRENT MACRO ENVIRONMENT ===",
            f"Data Freshness: {metrics.data_freshness}",
            f"Last Updated: {metrics.last_updated}",
            "",
            "📊 VALUATION:",
        ]

        if metrics.buffett_indicator:
            context_parts.append(
                f"  • Buffett Indicator: {metrics.buffett_indicator}% ({metrics.buffett_indicator_signal})"
            )
            context_parts.append(
                f"    - Market Cap: ${metrics.market_cap_billions:,.0f}B | GDP: ${metrics.gdp_billions:,.0f}B"
            )

        context_parts.extend([
            "",
            "📈 INTEREST RATES & YIELD CURVE:",
        ])

        if metrics.treasury_10y:
            context_parts.append(f"  • 10Y Treasury: {metrics.treasury_10y}%")
        if metrics.treasury_2y:
            context_parts.append(f"  • 2Y Treasury: {metrics.treasury_2y}%")
        if metrics.yield_curve_spread is not None:
            context_parts.append(
                f"  • Yield Curve Spread (10Y-2Y): {metrics.yield_curve_spread}% ({metrics.yield_curve_signal})"
            )
        if metrics.real_interest_rate is not None:
            context_parts.append(f"  • Real Interest Rate: {metrics.real_interest_rate}%")
        if metrics.fed_funds_rate:
            context_parts.append(f"  • Fed Funds Rate: {metrics.fed_funds_rate}%")

        context_parts.extend([
            "",
            "💰 LIQUIDITY:",
        ])

        if metrics.m2_growth_yoy is not None:
            context_parts.append(
                f"  • M2 Money Supply Growth (YoY): {metrics.m2_growth_yoy}% ({metrics.m2_growth_signal})"
            )
        if metrics.credit_spread:
            context_parts.append(
                f"  • Credit Spread: {metrics.credit_spread}% ({metrics.credit_spread_signal})"
            )

        context_parts.extend([
            "",
            "⚠️ RISK INDICATORS:",
        ])

        if metrics.vix:
            context_parts.append(f"  • VIX: {metrics.vix} ({metrics.vix_signal})")
        if metrics.debt_to_gdp:
            context_parts.append(f"  • Debt-to-GDP: {metrics.debt_to_gdp}%")

        context_parts.extend([
            "",
            "📉 INFLATION & EMPLOYMENT:",
        ])

        if metrics.cpi_yoy is not None:
            context_parts.append(
                f"  • CPI (YoY): {metrics.cpi_yoy}% ({metrics.inflation_signal})"
            )
        if metrics.unemployment_rate:
            context_parts.append(f"  • Unemployment Rate: {metrics.unemployment_rate}%")

        context_parts.append("")
        context_parts.append("=== END MACRO CONTEXT ===")

        return "\n".join(context_parts)


# Singleton instance for easy import
_macro_fetcher_instance: Optional[MacroFetcher] = None

def get_macro_fetcher() -> MacroFetcher:
    """Get or create the MacroFetcher singleton instance."""
    global _macro_fetcher_instance
    if _macro_fetcher_instance is None:
        _macro_fetcher_instance = MacroFetcher()
    return _macro_fetcher_instance
