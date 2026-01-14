"""
Market Data Service - Real-time Stock, FX, Commodity Data
Uses Yahoo Finance (yfinance) for live market data with intelligent caching.
"""

import os
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict
import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    import yfinance as yf
    YFINANCE_AVAILABLE = True
except ImportError:
    YFINANCE_AVAILABLE = False
    print("Warning: yfinance not installed. Run: pip install yfinance")


# ============================================================================
# DATA MODELS
# ============================================================================

@dataclass
class StockIndex:
    """Global stock market index data"""
    symbol: str
    name: str
    country: str
    region: str  # US, Asia, EU
    flag: str
    price: float
    change: float  # percent change
    change_value: float  # absolute change
    market_cap: float  # in billions
    high_52w: Optional[float] = None
    low_52w: Optional[float] = None
    volume: Optional[float] = None


@dataclass
class FXPair:
    """Currency pair data"""
    pair: str
    rate: float
    change_24h: float
    high_24h: float
    low_24h: float
    high_52w: Optional[float] = None
    low_52w: Optional[float] = None
    timestamp: str = ""


@dataclass
class Commodity:
    """Commodity futures data"""
    symbol: str
    name: str
    short_name: str
    price: float
    change_24h: float
    change_1w: float
    change_1m: float
    high_52w: float
    low_52w: float
    percent_of_range: float
    unit: str
    signal: str
    interpretation: str


@dataclass
class BondYield:
    """Treasury bond yield data"""
    maturity: str
    yield_value: float
    change: float
    date: str


# ============================================================================
# MARKET SERVICE CLASS
# ============================================================================

class MarketService:
    """
    Fetches real-time market data from Yahoo Finance.
    Implements intelligent caching to reduce API calls.
    """

    # Global Stock Indices - Yahoo Finance symbols
    GLOBAL_INDICES = {
        "^GSPC": {"name": "S&P 500", "country": "United States", "region": "US", "flag": "🇺🇸", "market_cap": 45000},
        "^IXIC": {"name": "NASDAQ", "country": "United States", "region": "US", "flag": "🇺🇸", "market_cap": 25000},
        "^DJI": {"name": "Dow Jones", "country": "United States", "region": "US", "flag": "🇺🇸", "market_cap": 15000},
        "^N225": {"name": "Nikkei 225", "country": "Japan", "region": "Asia", "flag": "🇯🇵", "market_cap": 6000},
        "^KS11": {"name": "KOSPI", "country": "South Korea", "region": "Asia", "flag": "🇰🇷", "market_cap": 1800},
        "^HSI": {"name": "Hang Seng", "country": "Hong Kong", "region": "Asia", "flag": "🇭🇰", "market_cap": 4500},
        "000001.SS": {"name": "Shanghai", "country": "China", "region": "Asia", "flag": "🇨🇳", "market_cap": 7000},
        "^GDAXI": {"name": "DAX", "country": "Germany", "region": "EU", "flag": "🇩🇪", "market_cap": 2200},
        "^FTSE": {"name": "FTSE 100", "country": "United Kingdom", "region": "EU", "flag": "🇬🇧", "market_cap": 2800},
        "^FCHI": {"name": "CAC 40", "country": "France", "region": "EU", "flag": "🇫🇷", "market_cap": 2500},
        "^STOXX50E": {"name": "Euro Stoxx 50", "country": "Eurozone", "region": "EU", "flag": "🇪🇺", "market_cap": 3500},
        "^BVSP": {"name": "Bovespa", "country": "Brazil", "region": "Americas", "flag": "🇧🇷", "market_cap": 800},
    }

    # FX Pairs - Yahoo Finance symbols (XXXYYY=X format)
    FX_PAIRS = {
        "USDJPY=X": {"pair": "USD/JPY", "base": "USD", "quote": "JPY"},
        "EURUSD=X": {"pair": "EUR/USD", "base": "EUR", "quote": "USD"},
        "GBPUSD=X": {"pair": "GBP/USD", "base": "GBP", "quote": "USD"},
        "USDCNY=X": {"pair": "USD/CNY", "base": "USD", "quote": "CNY"},
        "USDKRW=X": {"pair": "USD/KRW", "base": "USD", "quote": "KRW"},
        "AUDUSD=X": {"pair": "AUD/USD", "base": "AUD", "quote": "USD"},
        "USDCHF=X": {"pair": "USD/CHF", "base": "USD", "quote": "CHF"},
        "USDCAD=X": {"pair": "USD/CAD", "base": "USD", "quote": "CAD"},
        "USDINR=X": {"pair": "USD/INR", "base": "USD", "quote": "INR"},
        "USDBRL=X": {"pair": "USD/BRL", "base": "USD", "quote": "BRL"},
        "USDMXN=X": {"pair": "USD/MXN", "base": "USD", "quote": "MXN"},
        "DX-Y.NYB": {"pair": "DXY", "base": "USD", "quote": "Index"},  # Dollar Index
    }

    # Commodities - Yahoo Finance symbols
    COMMODITIES = {
        "CL=F": {"name": "WTI Crude Oil", "short_name": "WTI", "unit": "$/barrel"},
        "GC=F": {"name": "Gold Futures", "short_name": "Gold", "unit": "$/oz"},
        "HG=F": {"name": "Copper Futures", "short_name": "Copper", "unit": "$/lb"},
        "SI=F": {"name": "Silver Futures", "short_name": "Silver", "unit": "$/oz"},
        "NG=F": {"name": "Natural Gas", "short_name": "NatGas", "unit": "$/MMBtu"},
        "ZC=F": {"name": "Corn Futures", "short_name": "Corn", "unit": "cents/bushel"},
    }

    # US Treasury Yields - Yahoo Finance symbols
    TREASURY_YIELDS = {
        "^IRX": {"maturity": "3M", "name": "3-Month Treasury"},
        "^FVX": {"maturity": "5Y", "name": "5-Year Treasury"},
        "^TNX": {"maturity": "10Y", "name": "10-Year Treasury"},
        "^TYX": {"maturity": "30Y", "name": "30-Year Treasury"},
    }

    # VIX Symbol
    VIX_SYMBOL = "^VIX"

    def __init__(self):
        """Initialize MarketService with caching."""
        self.cache_dir = Path(__file__).parent / "cache" / "market"
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.cache_ttl = timedelta(minutes=5)  # 5 minute cache for real-time data

    def _get_cache_key(self, data_type: str) -> str:
        """Generate cache key."""
        return f"market_{data_type}"

    def _load_cache(self, data_type: str) -> Optional[Dict]:
        """Load cached data if fresh."""
        cache_file = self.cache_dir / f"{self._get_cache_key(data_type)}.json"
        if not cache_file.exists():
            return None

        try:
            with open(cache_file, "r") as f:
                cached = json.load(f)

            cached_time = datetime.fromisoformat(cached.get("timestamp", "2000-01-01"))
            if datetime.now() - cached_time < self.cache_ttl:
                return cached.get("data")
        except (json.JSONDecodeError, IOError, ValueError):
            pass

        return None

    def _save_cache(self, data_type: str, data: Any) -> None:
        """Save data to cache."""
        cache_file = self.cache_dir / f"{self._get_cache_key(data_type)}.json"
        try:
            with open(cache_file, "w") as f:
                json.dump({
                    "timestamp": datetime.now().isoformat(),
                    "data": data
                }, f, indent=2, default=str)
        except IOError as e:
            print(f"Failed to save market cache: {e}")

    # ========================================================================
    # STOCK INDICES
    # ========================================================================

    def _fetch_single_index(self, symbol: str) -> Optional[Dict]:
        """Fetch data for a single index - used for parallel processing."""
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="5d")

            if hist.empty:
                return None

            current_price = hist['Close'].iloc[-1]
            prev_close = hist['Close'].iloc[-2] if len(hist) > 1 else current_price

            change_value = current_price - prev_close
            change_pct = (change_value / prev_close * 100) if prev_close else 0

            meta = self.GLOBAL_INDICES[symbol]

            return {
                "symbol": symbol,
                "name": meta["name"],
                "country": meta["country"],
                "region": meta["region"],
                "flag": meta["flag"],
                "price": round(current_price, 2),
                "change": round(change_pct, 2),
                "change_value": round(change_value, 2),
                "market_cap": meta["market_cap"],
            }
        except Exception as e:
            print(f"Error fetching {symbol}: {e}")
            return None

    def get_global_indices(self, use_cache: bool = True) -> List[Dict]:
        """
        Fetch real-time global stock index data.
        Returns list of index data with price, change, etc.
        Uses parallel processing for faster fetching.
        """
        if use_cache:
            cached = self._load_cache("indices")
            if cached:
                return cached

        if not YFINANCE_AVAILABLE:
            return self._get_mock_indices()

        try:
            symbols = list(self.GLOBAL_INDICES.keys())
            indices = []

            # Use ThreadPoolExecutor for parallel fetching
            with ThreadPoolExecutor(max_workers=6) as executor:
                future_to_symbol = {
                    executor.submit(self._fetch_single_index, symbol): symbol
                    for symbol in symbols
                }

                for future in as_completed(future_to_symbol):
                    result = future.result()
                    if result:
                        indices.append(result)

            if indices:
                # Sort by region for consistent ordering
                region_order = {"US": 0, "Asia": 1, "EU": 2, "Americas": 3}
                indices.sort(key=lambda x: (region_order.get(x["region"], 99), x["name"]))
                self._save_cache("indices", indices)
                return indices

        except Exception as e:
            print(f"Error fetching indices: {e}")

        return self._get_mock_indices()

    def _get_mock_indices(self) -> List[Dict]:
        """Return mock indices data when API is unavailable."""
        import random
        indices = []
        for symbol, meta in self.GLOBAL_INDICES.items():
            base_prices = {
                "^GSPC": 5850, "^IXIC": 18500, "^DJI": 42500, "^N225": 38500,
                "^KS11": 2650, "^HSI": 19500, "000001.SS": 3150, "^GDAXI": 19200,
                "^FTSE": 8150, "^FCHI": 7450, "^STOXX50E": 4900, "^BVSP": 128000,
            }
            base = base_prices.get(symbol, 1000)
            price = round(base * (1 + (random.random() - 0.5) * 0.02), 2)
            change = round((random.random() - 0.5) * 3, 2)

            indices.append({
                "symbol": symbol,
                "name": meta["name"],
                "country": meta["country"],
                "region": meta["region"],
                "flag": meta["flag"],
                "price": price,
                "change": change,
                "change_value": round(price * change / 100, 2),
                "market_cap": meta["market_cap"],
            })
        return indices

    # ========================================================================
    # FX / CURRENCY DATA
    # ========================================================================

    def get_fx_data(self, use_cache: bool = True) -> Dict:
        """
        Fetch real-time FX data including major pairs and dollar index.
        """
        if use_cache:
            cached = self._load_cache("fx")
            if cached:
                return cached

        if not YFINANCE_AVAILABLE:
            return self._get_mock_fx_data()

        try:
            symbols = list(self.FX_PAIRS.keys())
            tickers = yf.Tickers(" ".join(symbols))

            major_pairs = []
            dollar_index = None

            for symbol in symbols:
                try:
                    ticker = tickers.tickers.get(symbol)
                    if not ticker:
                        continue

                    hist = ticker.history(period="5d")
                    if hist.empty:
                        continue

                    current = hist['Close'].iloc[-1]
                    prev = hist['Close'].iloc[-2] if len(hist) > 1 else current
                    high_day = hist['High'].iloc[-1]
                    low_day = hist['Low'].iloc[-1]

                    change_pct = ((current - prev) / prev * 100) if prev else 0

                    meta = self.FX_PAIRS[symbol]

                    if symbol == "DX-Y.NYB":
                        dollar_index = {
                            "value": round(current, 2),
                            "change24h": round(change_pct, 2),
                            "trend": "strong" if current > 105 else "weak" if current < 103 else "neutral",
                        }
                    else:
                        pair_data = {
                            "pair": meta["pair"],
                            "rate": round(current, 4) if current < 10 else round(current, 2),
                            "change24h": round(change_pct, 2),
                            "high24h": round(high_day, 4) if high_day < 10 else round(high_day, 2),
                            "low24h": round(low_day, 4) if low_day < 10 else round(low_day, 2),
                            "timestamp": datetime.now().isoformat(),
                        }
                        major_pairs.append(pair_data)

                except Exception as e:
                    print(f"Error fetching {symbol}: {e}")
                    continue

            # Determine risk sentiment based on USD strength
            is_strong_dollar = dollar_index and dollar_index["value"] > 104
            risk_sentiment = "risk_off" if is_strong_dollar else "risk_on"

            # Generate capital flows based on dollar strength
            capital_flows = self._generate_capital_flows(is_strong_dollar)

            fx_data = {
                "dollarIndex": dollar_index or {"value": 104.5, "change24h": 0, "trend": "neutral"},
                "majorPairs": major_pairs,
                "capitalFlows": capital_flows,
                "riskSentiment": risk_sentiment,
                "lastUpdated": datetime.now().isoformat(),
            }

            if major_pairs:
                self._save_cache("fx", fx_data)
                return fx_data

        except Exception as e:
            print(f"Error fetching FX data: {e}")

        return self._get_mock_fx_data()

    def _generate_capital_flows(self, is_strong_dollar: bool) -> List[Dict]:
        """Generate capital flow visualization data based on dollar strength."""
        return [
            {"from": "USA", "to": "Japan", "volume": 0.3 if is_strong_dollar else 0.6, "type": "risk_off" if is_strong_dollar else "risk_on"},
            {"from": "EU", "to": "USA", "volume": 0.7 if is_strong_dollar else 0.4, "type": "risk_off" if is_strong_dollar else "risk_on"},
            {"from": "USA", "to": "China", "volume": 0.4, "type": "risk_on"},
            {"from": "Japan", "to": "USA", "volume": 0.5 if is_strong_dollar else 0.3, "type": "risk_off"},
            {"from": "USA", "to": "Korea", "volume": 0.35, "type": "risk_on"},
        ]

    def _get_mock_fx_data(self) -> Dict:
        """Return mock FX data when API is unavailable."""
        import random
        dollar_strength = 104.5 + (random.random() * 2 - 1)
        is_strong = dollar_strength > 104

        return {
            "dollarIndex": {
                "value": round(dollar_strength, 2),
                "change24h": round((random.random() - 0.5) * 1.5, 2),
                "trend": "strong" if dollar_strength > 105 else "weak" if dollar_strength < 103 else "neutral",
            },
            "majorPairs": [
                {"pair": "USD/JPY", "rate": round(154.5 + (random.random() * 2 - 1), 2), "change24h": round((random.random() - 0.5) * 1.5, 2), "high24h": 155.2, "low24h": 153.8, "timestamp": datetime.now().isoformat()},
                {"pair": "EUR/USD", "rate": round(1.085 + (random.random() * 0.01 - 0.005), 4), "change24h": round((random.random() - 0.5), 2), "high24h": 1.092, "low24h": 1.082, "timestamp": datetime.now().isoformat()},
                {"pair": "GBP/USD", "rate": round(1.27 + (random.random() * 0.01 - 0.005), 4), "change24h": round((random.random() - 0.5), 2), "high24h": 1.278, "low24h": 1.265, "timestamp": datetime.now().isoformat()},
                {"pair": "USD/CNY", "rate": round(7.24 + (random.random() * 0.02 - 0.01), 2), "change24h": round((random.random() - 0.5) * 0.5, 2), "high24h": 7.26, "low24h": 7.22, "timestamp": datetime.now().isoformat()},
                {"pair": "USD/KRW", "rate": round(1380 + (random.random() * 20 - 10), 2), "change24h": round((random.random() - 0.5), 2), "high24h": 1395, "low24h": 1370, "timestamp": datetime.now().isoformat()},
            ],
            "capitalFlows": self._generate_capital_flows(is_strong),
            "riskSentiment": "risk_off" if is_strong else "risk_on",
            "lastUpdated": datetime.now().isoformat(),
        }

    # ========================================================================
    # COMMODITIES
    # ========================================================================

    def get_commodities(self, use_cache: bool = True) -> Dict:
        """
        Fetch real-time commodity prices (Oil, Gold, Copper, etc.)
        """
        if use_cache:
            cached = self._load_cache("commodities")
            if cached:
                return cached

        if not YFINANCE_AVAILABLE:
            return self._get_mock_commodities()

        try:
            # Focus on key commodities: Oil, Gold, Copper
            key_commodities = ["CL=F", "GC=F", "HG=F"]
            tickers = yf.Tickers(" ".join(key_commodities))

            commodities_data = {}

            for symbol in key_commodities:
                try:
                    ticker = tickers.tickers.get(symbol)
                    if not ticker:
                        continue

                    # Get different time periods for analysis
                    hist_1m = ticker.history(period="1mo")
                    hist_1w = ticker.history(period="5d")
                    hist_1y = ticker.history(period="1y")

                    if hist_1m.empty:
                        continue

                    current = hist_1m['Close'].iloc[-1]
                    prev_day = hist_1m['Close'].iloc[-2] if len(hist_1m) > 1 else current
                    prev_week = hist_1w['Close'].iloc[0] if len(hist_1w) > 0 else current
                    prev_month = hist_1m['Close'].iloc[0] if len(hist_1m) > 0 else current

                    high_52w = hist_1y['High'].max() if not hist_1y.empty else current * 1.2
                    low_52w = hist_1y['Low'].min() if not hist_1y.empty else current * 0.8

                    change_24h = ((current - prev_day) / prev_day * 100) if prev_day else 0
                    change_1w = ((current - prev_week) / prev_week * 100) if prev_week else 0
                    change_1m = ((current - prev_month) / prev_month * 100) if prev_month else 0

                    percent_range = ((current - low_52w) / (high_52w - low_52w) * 100) if (high_52w - low_52w) else 50

                    meta = self.COMMODITIES[symbol]

                    # Determine signal
                    if change_1m > 5:
                        signal = "bullish"
                    elif change_1m < -5:
                        signal = "bearish"
                    else:
                        signal = "neutral"

                    # Interpretation based on commodity type
                    if symbol == "CL=F":  # Oil
                        interpretation = "Oil up = inflation pressure" if signal == "bullish" else "Oil down = inflation easing" if signal == "bearish" else "Oil stable"
                        key = "oil"
                    elif symbol == "GC=F":  # Gold
                        interpretation = "Gold up = fear/inflation hedge" if signal == "bullish" else "Gold down = risk-on" if signal == "bearish" else "Gold stable"
                        key = "gold"
                    else:  # Copper
                        interpretation = "Dr. Copper up = manufacturing growth" if signal == "bullish" else "Dr. Copper down = slowdown warning" if signal == "bearish" else "Copper stable"
                        key = "copper"

                    commodities_data[key] = {
                        "symbol": symbol,
                        "name": meta["name"],
                        "short_name": meta["short_name"],
                        "price": round(current, 2),
                        "change_24h": round(change_24h, 2),
                        "change_1w": round(change_1w, 2),
                        "change_1m": round(change_1m, 2),
                        "high_52w": round(high_52w, 2),
                        "low_52w": round(low_52w, 2),
                        "percent_of_range": round(percent_range),
                        "unit": meta["unit"],
                        "signal": signal,
                        "interpretation": interpretation,
                    }

                except Exception as e:
                    print(f"Error fetching {symbol}: {e}")
                    continue

            # Determine overall signal
            if commodities_data:
                oil_signal = commodities_data.get("oil", {}).get("signal", "neutral")
                gold_signal = commodities_data.get("gold", {}).get("signal", "neutral")
                copper_signal = commodities_data.get("copper", {}).get("signal", "neutral")

                if oil_signal == "bearish" and copper_signal == "bullish" and gold_signal == "neutral":
                    overall_signal = "goldilocks"
                    interpretation = "Goldilocks scenario: Inflation easing + manufacturing recovery. Ideal for equities."
                elif gold_signal == "bullish" and copper_signal == "bearish":
                    overall_signal = "risk_off"
                    interpretation = "Risk-off: Safe haven (gold) up, industrial (copper) down. Recession fears."
                elif oil_signal == "bullish" and copper_signal == "bullish":
                    overall_signal = "risk_on"
                    interpretation = "Risk-on: Commodities broadly rising. Inflation pressure but growth is strong."
                else:
                    overall_signal = "mixed"
                    interpretation = "Mixed signals: Commodity markets showing no clear direction."

                commodities_data["overall_signal"] = overall_signal
                commodities_data["interpretation"] = interpretation

                self._save_cache("commodities", commodities_data)
                return commodities_data

        except Exception as e:
            print(f"Error fetching commodities: {e}")

        return self._get_mock_commodities()

    def _get_mock_commodities(self) -> Dict:
        """Return mock commodities data when API is unavailable."""
        import random

        oil_change_1m = round((random.random() - 0.5) * 10, 2)
        gold_change_1m = round((random.random() - 0.3) * 8, 2)  # Gold tends up
        copper_change_1m = round((random.random() - 0.5) * 12, 2)

        oil_signal = "bullish" if oil_change_1m > 5 else "bearish" if oil_change_1m < -5 else "neutral"
        gold_signal = "bullish" if gold_change_1m > 3 else "bearish" if gold_change_1m < -3 else "neutral"
        copper_signal = "bullish" if copper_change_1m > 5 else "bearish" if copper_change_1m < -5 else "neutral"

        if oil_signal == "bearish" and copper_signal == "bullish" and gold_signal == "neutral":
            overall_signal = "goldilocks"
            interpretation = "Goldilocks scenario: Inflation easing + manufacturing recovery."
        elif gold_signal == "bullish" and copper_signal == "bearish":
            overall_signal = "risk_off"
            interpretation = "Risk-off: Safe haven up, industrial down."
        elif oil_signal == "bullish" and copper_signal == "bullish":
            overall_signal = "risk_on"
            interpretation = "Risk-on: Commodities broadly rising."
        else:
            overall_signal = "mixed"
            interpretation = "Mixed signals in commodity markets."

        return {
            "oil": {
                "symbol": "CL=F", "name": "WTI Crude Oil", "short_name": "WTI",
                "price": round(75 + (random.random() - 0.5) * 10, 2),
                "change_24h": round((random.random() - 0.5) * 4, 2),
                "change_1w": round((random.random() - 0.5) * 6, 2),
                "change_1m": oil_change_1m,
                "high_52w": 95, "low_52w": 65, "percent_of_range": 50,
                "unit": "$/barrel", "signal": oil_signal,
                "interpretation": "Oil up = inflation pressure" if oil_signal == "bullish" else "Oil down = inflation easing" if oil_signal == "bearish" else "Oil stable",
            },
            "gold": {
                "symbol": "GC=F", "name": "Gold Futures", "short_name": "Gold",
                "price": round(2350 + (random.random() - 0.5) * 100, 2),
                "change_24h": round((random.random() - 0.5) * 2, 2),
                "change_1w": round((random.random() - 0.5) * 4, 2),
                "change_1m": gold_change_1m,
                "high_52w": 2500, "low_52w": 1900, "percent_of_range": 75,
                "unit": "$/oz", "signal": gold_signal,
                "interpretation": "Gold up = fear/inflation hedge" if gold_signal == "bullish" else "Gold down = risk-on" if gold_signal == "bearish" else "Gold stable",
            },
            "copper": {
                "symbol": "HG=F", "name": "Copper Futures", "short_name": "Copper",
                "price": round(4.2 + (random.random() - 0.5) * 0.5, 2),
                "change_24h": round((random.random() - 0.5) * 3, 2),
                "change_1w": round((random.random() - 0.5) * 5, 2),
                "change_1m": copper_change_1m,
                "high_52w": 5.0, "low_52w": 3.5, "percent_of_range": 50,
                "unit": "$/lb", "signal": copper_signal,
                "interpretation": "Dr. Copper up = manufacturing growth" if copper_signal == "bullish" else "Dr. Copper down = slowdown warning" if copper_signal == "bearish" else "Copper stable",
            },
            "overall_signal": overall_signal,
            "interpretation": interpretation,
        }

    # ========================================================================
    # VIX (VOLATILITY INDEX)
    # ========================================================================

    def get_vix(self, use_cache: bool = True) -> Dict:
        """
        Fetch real-time VIX (Fear Index) data.
        """
        if use_cache:
            cached = self._load_cache("vix")
            if cached:
                return cached

        if not YFINANCE_AVAILABLE:
            return self._get_mock_vix()

        try:
            ticker = yf.Ticker(self.VIX_SYMBOL)
            hist = ticker.history(period="5d")

            if hist.empty:
                return self._get_mock_vix()

            current = hist['Close'].iloc[-1]
            prev = hist['Close'].iloc[-2] if len(hist) > 1 else current
            change = ((current - prev) / prev * 100) if prev else 0

            # Determine VIX level
            if current < 12:
                level = "low"
                description = "Extreme complacency - markets are calm"
            elif current < 20:
                level = "moderate"
                description = "Normal volatility - typical market conditions"
            elif current < 25:
                level = "elevated"
                description = "Elevated fear - investors are cautious"
            elif current < 35:
                level = "high"
                description = "High fear - significant market stress"
            else:
                level = "extreme"
                description = "Extreme fear - panic mode"

            vix_data = {
                "value": round(current, 2),
                "change": round(change, 2),
                "level": level,
                "description": description,
            }

            self._save_cache("vix", vix_data)
            return vix_data

        except Exception as e:
            print(f"Error fetching VIX: {e}")

        return self._get_mock_vix()

    def _get_mock_vix(self) -> Dict:
        """Return mock VIX data when API is unavailable."""
        import random
        value = round(15 + random.random() * 20, 2)
        change = round((random.random() - 0.5) * 4, 2)

        if value < 12:
            level = "low"
            description = "Extreme complacency - markets are calm"
        elif value < 20:
            level = "moderate"
            description = "Normal volatility - typical market conditions"
        elif value < 25:
            level = "elevated"
            description = "Elevated fear - investors are cautious"
        elif value < 35:
            level = "high"
            description = "High fear - significant market stress"
        else:
            level = "extreme"
            description = "Extreme fear - panic mode"

        return {"value": value, "change": change, "level": level, "description": description}

    # ========================================================================
    # TREASURY YIELDS (Basic - For full data use macro_fetcher.py)
    # ========================================================================

    def get_treasury_yields(self, use_cache: bool = True) -> List[Dict]:
        """
        Fetch real-time US Treasury yields.
        Note: For full yield curve, use macro_fetcher.py with FRED API.
        """
        if use_cache:
            cached = self._load_cache("yields")
            if cached:
                return cached

        if not YFINANCE_AVAILABLE:
            return self._get_mock_yields()

        try:
            symbols = list(self.TREASURY_YIELDS.keys())
            tickers = yf.Tickers(" ".join(symbols))

            yields = []
            for symbol in symbols:
                try:
                    ticker = tickers.tickers.get(symbol)
                    if not ticker:
                        continue

                    hist = ticker.history(period="5d")
                    if hist.empty:
                        continue

                    current = hist['Close'].iloc[-1]
                    prev = hist['Close'].iloc[-2] if len(hist) > 1 else current
                    change = current - prev

                    meta = self.TREASURY_YIELDS[symbol]

                    yields.append({
                        "maturity": meta["maturity"],
                        "yield_value": round(current, 2),
                        "change": round(change, 2),
                        "date": datetime.now().strftime("%Y-%m-%d"),
                    })

                except Exception as e:
                    print(f"Error fetching {symbol}: {e}")
                    continue

            if yields:
                self._save_cache("yields", yields)
                return yields

        except Exception as e:
            print(f"Error fetching yields: {e}")

        return self._get_mock_yields()

    def _get_mock_yields(self) -> List[Dict]:
        """Return mock yield data when API is unavailable."""
        import random
        return [
            {"maturity": "3M", "yield_value": round(5.40 + (random.random() - 0.5) * 0.1, 2), "change": round((random.random() - 0.5) * 0.05, 2), "date": datetime.now().strftime("%Y-%m-%d")},
            {"maturity": "5Y", "yield_value": round(4.45 + (random.random() - 0.5) * 0.1, 2), "change": round((random.random() - 0.5) * 0.05, 2), "date": datetime.now().strftime("%Y-%m-%d")},
            {"maturity": "10Y", "yield_value": round(4.55 + (random.random() - 0.5) * 0.1, 2), "change": round((random.random() - 0.5) * 0.05, 2), "date": datetime.now().strftime("%Y-%m-%d")},
            {"maturity": "30Y", "yield_value": round(4.70 + (random.random() - 0.5) * 0.1, 2), "change": round((random.random() - 0.5) * 0.05, 2), "date": datetime.now().strftime("%Y-%m-%d")},
        ]

    # ========================================================================
    # SECTOR PERFORMANCE
    # ========================================================================

    # Sector ETF mappings - class level for reuse
    SECTOR_ETFS = {
        "XLK": {"sector": "Information Technology", "short_name": "Tech", "market_cap": 9248},
        "XLV": {"sector": "Health Care", "short_name": "Health", "market_cap": 3971},
        "XLF": {"sector": "Financials", "short_name": "Finance", "market_cap": 5311},
        "XLY": {"sector": "Consumer Discretionary", "short_name": "Consumer", "market_cap": 2434},
        "XLC": {"sector": "Communication Services", "short_name": "Comm", "market_cap": 2715},
        "XLI": {"sector": "Industrials", "short_name": "Industrial", "market_cap": 2555},
        "XLP": {"sector": "Consumer Staples", "short_name": "Staples", "market_cap": 1470},
        "XLE": {"sector": "Energy", "short_name": "Energy", "market_cap": 2648},
        "XLU": {"sector": "Utilities", "short_name": "Utilities", "market_cap": 2177},
        "XLRE": {"sector": "Real Estate", "short_name": "Real Est", "market_cap": 738},
        "XLB": {"sector": "Materials", "short_name": "Materials", "market_cap": 536},
    }

    def _fetch_single_sector(self, symbol: str) -> Optional[Dict]:
        """Fetch data for a single sector ETF - used for parallel processing."""
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="5d")

            if hist.empty:
                return None

            current = hist['Close'].iloc[-1]
            prev = hist['Close'].iloc[-2] if len(hist) > 1 else current
            change = ((current - prev) / prev * 100) if prev else 0

            meta = self.SECTOR_ETFS[symbol]

            return {
                "sector": meta["sector"],
                "short_name": meta["short_name"],
                "change": round(change, 2),
                "market_cap": meta["market_cap"],
                "top_stock": symbol,
                "top_stock_change": round(change * 1.2, 2),
            }
        except Exception as e:
            print(f"Error fetching sector {symbol}: {e}")
            return None

    def get_sector_performance(self, use_cache: bool = True) -> List[Dict]:
        """
        Fetch S&P 500 sector ETF performance.
        Uses sector SPDR ETFs as proxies with parallel processing.
        """
        if use_cache:
            cached = self._load_cache("sectors")
            if cached:
                return cached

        if not YFINANCE_AVAILABLE:
            return self._get_mock_sectors()

        try:
            symbols = list(self.SECTOR_ETFS.keys())
            sectors = []

            # Use ThreadPoolExecutor for parallel fetching
            with ThreadPoolExecutor(max_workers=6) as executor:
                future_to_symbol = {
                    executor.submit(self._fetch_single_sector, symbol): symbol
                    for symbol in symbols
                }

                for future in as_completed(future_to_symbol):
                    result = future.result()
                    if result:
                        sectors.append(result)

            if sectors:
                self._save_cache("sectors", sectors)
                return sectors

        except Exception as e:
            print(f"Error fetching sectors: {e}")

        return self._get_mock_sectors()

    def _get_mock_sectors(self) -> List[Dict]:
        """Return mock sector data when API is unavailable."""
        import random
        return [
            {"sector": "Information Technology", "short_name": "Tech", "change": round((random.random() - 0.3) * 4, 2), "market_cap": 14000, "top_stock": "NVDA", "top_stock_change": round((random.random() - 0.2) * 6, 2)},
            {"sector": "Health Care", "short_name": "Health", "change": round((random.random() - 0.5) * 2.5, 2), "market_cap": 7500, "top_stock": "UNH", "top_stock_change": round((random.random() - 0.5) * 3, 2)},
            {"sector": "Financials", "short_name": "Finance", "change": round((random.random() - 0.5) * 2.5, 2), "market_cap": 6800, "top_stock": "JPM", "top_stock_change": round((random.random() - 0.5) * 2.5, 2)},
            {"sector": "Consumer Discretionary", "short_name": "Consumer", "change": round((random.random() - 0.5) * 3, 2), "market_cap": 5500, "top_stock": "AMZN", "top_stock_change": round((random.random() - 0.5) * 4, 2)},
            {"sector": "Communication Services", "short_name": "Comm", "change": round((random.random() - 0.5) * 3.5, 2), "market_cap": 4800, "top_stock": "META", "top_stock_change": round((random.random() - 0.5) * 5, 2)},
            {"sector": "Industrials", "short_name": "Industrial", "change": round((random.random() - 0.5) * 2, 2), "market_cap": 4500, "top_stock": "CAT", "top_stock_change": round((random.random() - 0.5) * 2, 2)},
            {"sector": "Consumer Staples", "short_name": "Staples", "change": round((random.random() - 0.5) * 1.5, 2), "market_cap": 4000, "top_stock": "PG", "top_stock_change": round((random.random() - 0.5) * 1.5, 2)},
            {"sector": "Energy", "short_name": "Energy", "change": round((random.random() - 0.5) * 3, 2), "market_cap": 2200, "top_stock": "XOM", "top_stock_change": round((random.random() - 0.5) * 2.5, 2)},
            {"sector": "Utilities", "short_name": "Utilities", "change": round((random.random() - 0.5) * 1.5, 2), "market_cap": 1600, "top_stock": "NEE", "top_stock_change": round((random.random() - 0.5) * 1.5, 2)},
            {"sector": "Real Estate", "short_name": "Real Est", "change": round((random.random() - 0.5) * 2, 2), "market_cap": 1400, "top_stock": "PLD", "top_stock_change": round((random.random() - 0.5) * 2, 2)},
            {"sector": "Materials", "short_name": "Materials", "change": round((random.random() - 0.5) * 2, 2), "market_cap": 1200, "top_stock": "LIN", "top_stock_change": round((random.random() - 0.5) * 1.8, 2)},
        ]


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_market_service_instance: Optional[MarketService] = None

def get_market_service() -> MarketService:
    """Get or create the MarketService singleton instance."""
    global _market_service_instance
    if _market_service_instance is None:
        _market_service_instance = MarketService()
    return _market_service_instance
