"""
Whale Radar - Smart Money Tracker
Tracks insider trading, institutional holdings (13F), and unusual options activity.
"그들은 우리가 모르는 뭔가를 알고 있다." - They know something we don't.
"""

import os
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field, asdict
import json
from pathlib import Path

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


# ============================================================================
# DATA MODELS
# ============================================================================

@dataclass
class InsiderTrade:
    """Individual insider trading transaction with context metrics"""
    symbol: str
    company_name: str
    reporter_name: str  # CEO, CFO, Director, etc.
    reporter_title: str
    transaction_type: str  # P (Purchase), S (Sale), A (Award), etc.
    transaction_date: str
    shares_transacted: int
    price: float
    total_value: float
    shares_owned_after: Optional[int] = None
    # Context metrics for significance assessment
    market_cap: Optional[float] = None
    shares_outstanding: Optional[int] = None
    pct_of_outstanding: Optional[float] = None
    pct_of_market_cap: Optional[float] = None
    significance: Optional[str] = None  # "CRITICAL", "HIGH", "MEDIUM", "LOW"

    @property
    def is_buy(self) -> bool:
        return self.transaction_type in ['P', 'P-Purchase']

    @property
    def is_sell(self) -> bool:
        return self.transaction_type in ['S', 'S-Sale']

    @property
    def signal_strength(self) -> str:
        """Determine signal strength based on transaction size"""
        if self.total_value >= 10_000_000:  # $10M+
            return "massive"
        elif self.total_value >= 1_000_000:  # $1M+
            return "large"
        elif self.total_value >= 100_000:  # $100K+
            return "significant"
        else:
            return "minor"

    def calculate_significance(self) -> str:
        """
        Calculate significance based on % of outstanding shares.
        CRITICAL: >1% of outstanding or >0.5% of market cap
        HIGH: >0.5% of outstanding or >0.2% of market cap
        MEDIUM: >0.1% of outstanding
        LOW: <0.1% of outstanding
        """
        pct_out = self.pct_of_outstanding or 0
        pct_cap = self.pct_of_market_cap or 0

        if pct_out > 1.0 or pct_cap > 0.5:
            return "CRITICAL"
        elif pct_out > 0.5 or pct_cap > 0.2:
            return "HIGH"
        elif pct_out > 0.1:
            return "MEDIUM"
        else:
            return "LOW"


@dataclass
class ClusterActivity:
    """Cluster buy/sell detection - multiple insiders acting together"""
    symbol: str
    company_name: str
    activity_type: str  # "cluster_buy" or "cluster_sell"
    insider_count: int
    total_value: float
    date_range: str  # e.g., "2024-01-15 to 2024-01-20"
    insiders: List[str]
    urgency: str  # "critical", "high", "moderate"


@dataclass
class GuruHolding:
    """13F Filing - Institutional holding"""
    fund_name: str
    fund_manager: str
    symbol: str
    company_name: str
    shares: int
    value: float
    weight_percent: float  # % of portfolio
    change_type: str  # "new", "increased", "decreased", "sold_out", "unchanged"
    change_shares: int
    change_percent: float
    quarter: str  # e.g., "Q4 2024"
    filing_date: str


@dataclass
class UnusualOption:
    """Unusual Options Activity - Dark Flow Detection"""
    symbol: str
    company_name: str
    option_type: str  # "call" or "put"
    strike: float
    expiration: str
    volume: int
    open_interest: int
    volume_oi_ratio: float  # High ratio = unusual
    premium: float
    implied_volatility: float
    sentiment: str  # "bullish", "bearish", "neutral"
    unusual_score: float  # 0-100 score


@dataclass
class WhaleAlert:
    """Aggregated whale alert for UI display"""
    alert_type: str  # "insider", "guru", "options", "cluster"
    symbol: str
    headline: str
    description: str
    signal: str  # "bullish", "bearish", "neutral"
    magnitude: str  # "massive", "large", "moderate"
    timestamp: str
    source: str
    details: Dict[str, Any] = field(default_factory=dict)


# ============================================================================
# WHALE TRACKER - FMP API Integration
# ============================================================================

class WhaleTracker:
    """
    Tracks smart money movements using Financial Modeling Prep (FMP) API.

    Features:
    - Insider Trading (CEO, CFO, Directors buying/selling)
    - 13F Filings (Warren Buffett, Ray Dalio, Michael Burry portfolios)
    - Unusual Options Activity (when available)
    """

    # Famous investors and their funds for 13F tracking
    GURU_FUNDS = {
        "berkshire": {
            "name": "Berkshire Hathaway",
            "manager": "Warren Buffett",
            "cik": "0001067983",
            "avatar": "🏦"
        },
        "bridgewater": {
            "name": "Bridgewater Associates",
            "manager": "Ray Dalio",
            "cik": "0001350694",
            "avatar": "⚙️"
        },
        "scion": {
            "name": "Scion Asset Management",
            "manager": "Michael Burry",
            "cik": "0001649339",
            "avatar": "🔮"
        },
        "pershing": {
            "name": "Pershing Square",
            "manager": "Bill Ackman",
            "cik": "0001336528",
            "avatar": "🎯"
        },
        "appaloosa": {
            "name": "Appaloosa Management",
            "manager": "David Tepper",
            "cik": "0001006438",
            "avatar": "🦅"
        },
        "greenlight": {
            "name": "Greenlight Capital",
            "manager": "David Einhorn",
            "cik": "0001079114",
            "avatar": "💡"
        },
        "icahn": {
            "name": "Icahn Enterprises",
            "manager": "Carl Icahn",
            "cik": "0000810958",
            "avatar": "🦈"
        },
        "druckenmiller": {
            "name": "Duquesne Family Office",
            "manager": "Stanley Druckenmiller",
            "cik": "0001536411",
            "avatar": "🎩"
        },
    }

    # Cache duration in seconds (5 minutes)
    CACHE_DURATION = 300

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize WhaleTracker with FMP API key.

        Args:
            api_key: FMP API key. Falls back to FMP_API_KEY env variable.
        """
        self.api_key = api_key or os.environ.get("FMP_API_KEY")
        self.base_url = "https://financialmodelingprep.com/api"
        self.cache_dir = Path(__file__).parent / "cache" / "whale"
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        # In-memory cache for fast access
        self._memory_cache: Dict[str, tuple] = {}  # key -> (data, timestamp)

    def _get_cache_key(self, name: str, **kwargs) -> str:
        """Generate a cache key from function name and arguments."""
        key_parts = [name] + [f"{k}={v}" for k, v in sorted(kwargs.items()) if v is not None]
        return "_".join(key_parts)

    def _get_cached(self, cache_key: str) -> Optional[Any]:
        """Get data from cache if still valid (within CACHE_DURATION)."""
        # Check memory cache first
        if cache_key in self._memory_cache:
            data, cached_time = self._memory_cache[cache_key]
            if (datetime.now() - cached_time).total_seconds() < self.CACHE_DURATION:
                return data

        # Check file cache
        cache_file = self.cache_dir / f"{cache_key}.json"
        if cache_file.exists():
            try:
                mtime = datetime.fromtimestamp(cache_file.stat().st_mtime)
                if (datetime.now() - mtime).total_seconds() < self.CACHE_DURATION:
                    with open(cache_file, 'r') as f:
                        data = json.load(f)
                        self._memory_cache[cache_key] = (data, mtime)
                        return data
            except (json.JSONDecodeError, OSError):
                pass

        return None

    def _set_cached(self, cache_key: str, data: Any) -> None:
        """Store data in both memory and file cache."""
        now = datetime.now()
        self._memory_cache[cache_key] = (data, now)

        # Also save to file cache
        cache_file = self.cache_dir / f"{cache_key}.json"
        try:
            with open(cache_file, 'w') as f:
                json.dump(data, f)
        except (OSError, TypeError):
            pass

    def _make_request(self, endpoint: str, params: Dict = None) -> Optional[Any]:
        """Make authenticated request to FMP API."""
        if not self.api_key or not REQUESTS_AVAILABLE:
            return None

        try:
            params = params or {}
            params["apikey"] = self.api_key

            url = f"{self.base_url}{endpoint}"
            response = requests.get(url, params=params, timeout=15)
            response.raise_for_status()

            return response.json()
        except Exception as e:
            print(f"FMP API error for {endpoint}: {e}")
            return None

    # ========================================================================
    # INSIDER TRADING
    # ========================================================================

    def get_insider_trades(
        self,
        symbol: Optional[str] = None,
        limit: int = 50
    ) -> List[InsiderTrade]:
        """
        Get recent insider trading activity with 5-minute caching.

        Args:
            symbol: Stock symbol (e.g., "AAPL"). If None, gets all recent trades.
            limit: Maximum number of trades to return.

        Returns:
            List of InsiderTrade objects
        """
        # Check cache first
        cache_key = self._get_cache_key("insider_trades", symbol=symbol, limit=limit)
        cached_data = self._get_cached(cache_key)
        if cached_data is not None:
            # Reconstruct InsiderTrade objects from cached data
            return [InsiderTrade(**item) for item in cached_data]

        if symbol:
            endpoint = f"/v4/insider-trading"
            params = {"symbol": symbol, "limit": limit}
        else:
            # Get latest insider trades across all stocks
            endpoint = f"/v4/insider-trading"
            params = {"limit": limit}

        data = self._make_request(endpoint, params)

        if not data:
            return self._get_mock_insider_trades(symbol)

        trades = []
        for item in data[:limit]:
            try:
                shares = int(item.get("securitiesTransacted", 0) or 0)
                price = float(item.get("price", 0) or 0)

                trade = InsiderTrade(
                    symbol=item.get("symbol", ""),
                    company_name=item.get("companyName", item.get("symbol", "")),
                    reporter_name=item.get("reportingName", "Unknown"),
                    reporter_title=item.get("typeOfOwner", "Insider"),
                    transaction_type=item.get("transactionType", ""),
                    transaction_date=item.get("transactionDate", ""),
                    shares_transacted=abs(shares),
                    price=price,
                    total_value=abs(shares * price),
                    shares_owned_after=item.get("securitiesOwned")
                )
                trades.append(trade)
            except (ValueError, TypeError) as e:
                continue

        # Enrich trades with market context
        trades = self._enrich_insider_trades(trades)

        # Cache the result (convert to dicts for JSON serialization)
        if trades:
            self._set_cached(cache_key, [asdict(t) for t in trades])

        return trades

    def _enrich_insider_trades(self, trades: List[InsiderTrade]) -> List[InsiderTrade]:
        """
        Enrich insider trades with market cap and % of outstanding shares.
        This helps assess the significance of each trade.
        """
        # Get unique symbols
        symbols = list(set(t.symbol for t in trades if t.symbol))

        # Batch fetch market data (use cache to avoid repeated API calls)
        market_data = {}
        for symbol in symbols[:20]:  # Limit to avoid rate limiting
            cache_key = f"quote_{symbol}"
            cached = self._get_cached(cache_key)
            if cached:
                market_data[symbol] = cached
            else:
                quote = self._make_request(f"/v3/quote/{symbol}")
                if quote and len(quote) > 0:
                    market_data[symbol] = {
                        "market_cap": quote[0].get("marketCap", 0),
                        "shares_outstanding": quote[0].get("sharesOutstanding", 0)
                    }
                    self._set_cached(cache_key, market_data[symbol])

        # Enrich each trade
        for trade in trades:
            data = market_data.get(trade.symbol, {})
            market_cap = data.get("market_cap", 0)
            shares_outstanding = data.get("shares_outstanding", 0)

            if market_cap:
                trade.market_cap = market_cap
            if shares_outstanding:
                trade.shares_outstanding = shares_outstanding
                trade.pct_of_outstanding = round(
                    (trade.shares_transacted / shares_outstanding) * 100, 6
                ) if shares_outstanding > 0 else 0
            if market_cap > 0:
                trade.pct_of_market_cap = round(
                    (trade.total_value / market_cap) * 100, 6
                )

            trade.significance = trade.calculate_significance()

        return trades

    def detect_cluster_activity(
        self,
        symbol: str,
        days: int = 30,
        min_insiders: int = 2
    ) -> Optional[ClusterActivity]:
        """
        Detect cluster buying/selling - when multiple insiders act together.
        This is often a stronger signal than individual trades.

        Args:
            symbol: Stock symbol
            days: Look back period in days
            min_insiders: Minimum number of insiders for cluster detection

        Returns:
            ClusterActivity if cluster detected, None otherwise
        """
        trades = self.get_insider_trades(symbol, limit=100)

        if not trades:
            return None

        # Filter to recent trades
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_trades = []

        for trade in trades:
            try:
                trade_date = datetime.strptime(trade.transaction_date, "%Y-%m-%d")
                if trade_date >= cutoff_date:
                    recent_trades.append(trade)
            except ValueError:
                continue

        # Separate buys and sells
        buys = [t for t in recent_trades if t.is_buy]
        sells = [t for t in recent_trades if t.is_sell]

        # Check for cluster activity
        cluster = None

        # Unique buyers
        unique_buyers = list(set(t.reporter_name for t in buys))
        if len(unique_buyers) >= min_insiders:
            total_value = sum(t.total_value for t in buys)
            dates = sorted([t.transaction_date for t in buys])

            urgency = "critical" if len(unique_buyers) >= 4 else (
                "high" if len(unique_buyers) >= 3 else "moderate"
            )

            cluster = ClusterActivity(
                symbol=symbol,
                company_name=trades[0].company_name if trades else symbol,
                activity_type="cluster_buy",
                insider_count=len(unique_buyers),
                total_value=total_value,
                date_range=f"{dates[0]} to {dates[-1]}" if len(dates) > 1 else dates[0],
                insiders=unique_buyers,
                urgency=urgency
            )

        # Check for cluster selling (often more ominous)
        unique_sellers = list(set(t.reporter_name for t in sells))
        if len(unique_sellers) >= min_insiders:
            sell_total = sum(t.total_value for t in sells)

            # If cluster sell is larger or no cluster buy, report sell
            if not cluster or sell_total > cluster.total_value:
                dates = sorted([t.transaction_date for t in sells])
                urgency = "critical" if len(unique_sellers) >= 4 else (
                    "high" if len(unique_sellers) >= 3 else "moderate"
                )

                cluster = ClusterActivity(
                    symbol=symbol,
                    company_name=trades[0].company_name if trades else symbol,
                    activity_type="cluster_sell",
                    insider_count=len(unique_sellers),
                    total_value=sell_total,
                    date_range=f"{dates[0]} to {dates[-1]}" if len(dates) > 1 else dates[0],
                    insiders=unique_sellers,
                    urgency=urgency
                )

        return cluster

    # ========================================================================
    # 13F FILINGS - GURU PORTFOLIOS
    # ========================================================================

    def get_guru_holdings(
        self,
        guru_id: str = "berkshire",
        limit: int = 20
    ) -> List[GuruHolding]:
        """
        Get holdings from a famous investor's 13F filing with 5-minute caching.

        Args:
            guru_id: Key from GURU_FUNDS dict (e.g., "berkshire", "bridgewater")
            limit: Number of top holdings to return

        Returns:
            List of GuruHolding objects
        """
        # Check cache first
        cache_key = self._get_cache_key("guru_holdings", guru_id=guru_id, limit=limit)
        cached_data = self._get_cached(cache_key)
        if cached_data is not None:
            return [GuruHolding(**item) for item in cached_data]

        guru = self.GURU_FUNDS.get(guru_id)
        if not guru:
            return []

        # FMP endpoint for institutional holder's portfolio
        endpoint = f"/v3/institutional-holder/{guru['cik']}"
        data = self._make_request(endpoint)

        if not data:
            return self._get_mock_guru_holdings(guru_id)

        holdings = []
        for item in data[:limit]:
            try:
                holding = GuruHolding(
                    fund_name=guru["name"],
                    fund_manager=guru["manager"],
                    symbol=item.get("symbol", ""),
                    company_name=item.get("securityName", ""),
                    shares=int(item.get("shares", 0)),
                    value=float(item.get("value", 0)),
                    weight_percent=float(item.get("weightPercent", 0) or 0),
                    change_type=self._determine_change_type(item),
                    change_shares=int(item.get("changeInShares", 0) or 0),
                    change_percent=float(item.get("changeInSharesPercent", 0) or 0),
                    quarter=item.get("filingDate", "")[:7],
                    filing_date=item.get("filingDate", "")
                )
                holdings.append(holding)
            except (ValueError, TypeError):
                continue

        # Cache the result
        if holdings:
            self._set_cached(cache_key, [asdict(h) for h in holdings])

        return holdings

    def _determine_change_type(self, item: Dict) -> str:
        """Determine the type of position change."""
        change = item.get("changeInShares", 0) or 0
        prev_shares = item.get("previousShares", 0) or 0
        curr_shares = item.get("shares", 0) or 0

        if prev_shares == 0 and curr_shares > 0:
            return "new"
        elif curr_shares == 0 and prev_shares > 0:
            return "sold_out"
        elif change > 0:
            return "increased"
        elif change < 0:
            return "decreased"
        else:
            return "unchanged"

    def get_guru_consensus(self, top_n: int = 10) -> Dict[str, Dict]:
        """
        Find stocks that multiple gurus are buying (consensus picks).

        Args:
            top_n: Number of top consensus picks to return

        Returns:
            Dict with symbol as key, containing guru names and total position
        """
        all_holdings = []

        for guru_id in self.GURU_FUNDS.keys():
            holdings = self.get_guru_holdings(guru_id, limit=50)
            for h in holdings:
                if h.change_type in ["new", "increased"]:
                    all_holdings.append({
                        "symbol": h.symbol,
                        "guru": h.fund_manager,
                        "value": h.value,
                        "change_type": h.change_type
                    })

        # Aggregate by symbol
        consensus = {}
        for h in all_holdings:
            symbol = h["symbol"]
            if symbol not in consensus:
                consensus[symbol] = {
                    "gurus": [],
                    "total_value": 0,
                    "guru_count": 0
                }
            consensus[symbol]["gurus"].append(h["guru"])
            consensus[symbol]["total_value"] += h["value"]
            consensus[symbol]["guru_count"] += 1

        # Sort by number of gurus, then by total value
        sorted_consensus = sorted(
            consensus.items(),
            key=lambda x: (x[1]["guru_count"], x[1]["total_value"]),
            reverse=True
        )

        return dict(sorted_consensus[:top_n])

    # ========================================================================
    # OPTIONS FLOW (Simplified - Full features require paid data)
    # ========================================================================

    def get_put_call_ratio(self, symbol: str = "SPY") -> Dict[str, Any]:
        """
        Get Put/Call ratio as a market sentiment indicator.
        High ratio (>1) = bearish sentiment
        Low ratio (<0.7) = bullish sentiment

        Note: Full unusual options activity requires paid data (Unusual Whales, CBOE).
        This provides a simplified version using available free data.
        """
        # FMP doesn't provide options data in free tier
        # Return mock data for now
        return {
            "symbol": symbol,
            "put_call_ratio": 0.85,
            "signal": "neutral",
            "description": "Put/Call ratio near historical average",
            "data_source": "mock",
            "note": "Full options flow analysis requires premium data subscription"
        }

    # ========================================================================
    # WHALE ALERTS - Aggregated View
    # ========================================================================

    def get_whale_alerts(self, symbols: List[str] = None, limit: int = 20) -> List[WhaleAlert]:
        """
        Get aggregated whale alerts combining insider trades and guru moves with 5-minute caching.

        Args:
            symbols: List of symbols to track. If None, gets market-wide alerts.
            limit: Maximum number of alerts

        Returns:
            List of WhaleAlert objects sorted by timestamp
        """
        # Check cache first
        symbols_key = "_".join(sorted(symbols)) if symbols else "all"
        cache_key = self._get_cache_key("whale_alerts", symbols=symbols_key, limit=limit)
        cached_data = self._get_cached(cache_key)
        if cached_data is not None:
            return [WhaleAlert(**item) for item in cached_data]

        alerts = []

        # Get recent insider trades
        if symbols:
            for symbol in symbols[:5]:  # Limit to avoid rate limiting
                trades = self.get_insider_trades(symbol, limit=10)
                for trade in trades:
                    if trade.total_value >= 100_000:  # Only significant trades
                        alert = WhaleAlert(
                            alert_type="insider",
                            symbol=trade.symbol,
                            headline=f"{'🟢' if trade.is_buy else '🔴'} {trade.reporter_name} {'bought' if trade.is_buy else 'sold'} ${trade.total_value:,.0f} of {trade.symbol}",
                            description=f"{trade.reporter_title} {trade.reporter_name} executed a {trade.signal_strength} {'purchase' if trade.is_buy else 'sale'}",
                            signal="bullish" if trade.is_buy else "bearish",
                            magnitude=trade.signal_strength,
                            timestamp=trade.transaction_date,
                            source="SEC Form 4",
                            details=asdict(trade)
                        )
                        alerts.append(alert)

                # Check for cluster activity
                cluster = self.detect_cluster_activity(symbol)
                if cluster:
                    is_buy = cluster.activity_type == "cluster_buy"
                    alert = WhaleAlert(
                        alert_type="cluster",
                        symbol=cluster.symbol,
                        headline=f"🚨 CLUSTER {'BUY' if is_buy else 'SELL'}: {cluster.insider_count} insiders acted on {cluster.symbol}",
                        description=f"{', '.join(cluster.insiders[:3])}{'...' if len(cluster.insiders) > 3 else ''} collectively {'bought' if is_buy else 'sold'} ${cluster.total_value:,.0f}",
                        signal="bullish" if is_buy else "bearish",
                        magnitude="massive" if cluster.urgency == "critical" else "large",
                        timestamp=cluster.date_range.split(" to ")[-1],
                        source="SEC Form 4 Analysis",
                        details=asdict(cluster)
                    )
                    alerts.append(alert)
        else:
            # Market-wide alerts
            trades = self.get_insider_trades(limit=50)
            for trade in trades:
                if trade.total_value >= 500_000:  # Higher threshold for market-wide
                    alert = WhaleAlert(
                        alert_type="insider",
                        symbol=trade.symbol,
                        headline=f"{'🟢' if trade.is_buy else '🔴'} {trade.reporter_name} {'bought' if trade.is_buy else 'sold'} ${trade.total_value:,.0f} of {trade.symbol}",
                        description=f"{trade.reporter_title} at {trade.company_name}",
                        signal="bullish" if trade.is_buy else "bearish",
                        magnitude=trade.signal_strength,
                        timestamp=trade.transaction_date,
                        source="SEC Form 4",
                        details=asdict(trade)
                    )
                    alerts.append(alert)

        # Sort by timestamp (most recent first) and limit
        alerts.sort(key=lambda x: x.timestamp, reverse=True)
        result = alerts[:limit]

        # Cache the result
        if result:
            self._set_cached(cache_key, [asdict(a) for a in result])

        return result

    # ========================================================================
    # API RESPONSE FORMATTERS
    # ========================================================================

    def get_radar_data(self, symbols: List[str] = None) -> Dict[str, Any]:
        """
        Get complete radar data for the Whale Radar UI with 5-minute caching.

        Returns structured data for the "sonar" visualization.
        """
        # Check cache first
        symbols_key = "_".join(sorted(symbols)) if symbols else "all"
        cache_key = self._get_cache_key("radar_data", symbols=symbols_key)
        cached_data = self._get_cached(cache_key)
        if cached_data is not None:
            return cached_data

        alerts = self.get_whale_alerts(symbols, limit=20)

        # Group alerts by type
        insider_alerts = [a for a in alerts if a.alert_type == "insider"]
        cluster_alerts = [a for a in alerts if a.alert_type == "cluster"]

        # Count signals
        bullish_count = len([a for a in alerts if a.signal == "bullish"])
        bearish_count = len([a for a in alerts if a.signal == "bearish"])

        result = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_signals": len(alerts),
                "bullish": bullish_count,
                "bearish": bearish_count,
                "sentiment": "bullish" if bullish_count > bearish_count else (
                    "bearish" if bearish_count > bullish_count else "neutral"
                )
            },
            "alerts": [asdict(a) for a in alerts],
            "clusters": [asdict(a) for a in cluster_alerts],
            "blips": self._format_radar_blips(alerts),
            "ai_context": self._generate_ai_context(alerts)
        }

        # Cache the result
        self._set_cached(cache_key, result)

        return result

    def _format_radar_blips(self, alerts: List[WhaleAlert]) -> List[Dict]:
        """Format alerts as radar blips for visualization.

        Returns blips with:
        - angle: 0-360 degrees, evenly distributed
        - distance: 0-1, based on magnitude (closer = larger magnitude)
        - strength: 0-1, based on magnitude
        - symbol, label, color for display
        """
        blips = []
        num_alerts = min(len(alerts), 20)  # Limit to 20 blips for visualization

        for i, alert in enumerate(alerts[:20]):
            # Calculate angle (evenly distribute around the circle)
            angle = (i * 360 / max(num_alerts, 1)) % 360

            # Calculate magnitude-based values
            magnitude_map = {"massive": 1.0, "large": 0.8, "significant": 0.6, "moderate": 0.4}
            magnitude_value = magnitude_map.get(alert.magnitude, 0.5)

            # Distance: inverse of magnitude (larger moves closer to center)
            distance = 1.0 - (magnitude_value * 0.6)  # Range: 0.4 - 1.0

            # Strength: same as magnitude
            strength = magnitude_value

            # Color based on signal
            if alert.signal == "bullish":
                color = "#10b981"  # Emerald green
            elif alert.signal == "bearish":
                color = "#ef4444"  # Red
            else:
                color = "#f59e0b"  # Amber for neutral

            blips.append({
                "symbol": alert.symbol,
                "angle": angle,
                "distance": distance,
                "strength": strength,
                "label": alert.headline,
                "color": color,
                "type": alert.alert_type,
                "signal": alert.signal,
                "timestamp": alert.timestamp
            })
        return blips

    def _generate_ai_context(self, alerts: List[WhaleAlert]) -> str:
        """Generate context string for AI personas."""
        if not alerts:
            return "No significant whale activity detected recently."

        lines = [
            "=== WHALE RADAR - SMART MONEY ACTIVITY ===",
            f"Scan Time: {datetime.now().isoformat()}",
            ""
        ]

        # Summarize
        bullish = [a for a in alerts if a.signal == "bullish"]
        bearish = [a for a in alerts if a.signal == "bearish"]

        lines.append(f"📊 Signal Summary: {len(bullish)} bullish, {len(bearish)} bearish")
        lines.append("")

        # Top alerts
        lines.append("🔔 Key Alerts:")
        for alert in alerts[:5]:
            emoji = "🟢" if alert.signal == "bullish" else "🔴"
            lines.append(f"  {emoji} [{alert.symbol}] {alert.headline}")

        # Clusters (high importance)
        clusters = [a for a in alerts if a.alert_type == "cluster"]
        if clusters:
            lines.append("")
            lines.append("🚨 CLUSTER ACTIVITY (Multiple Insiders):")
            for c in clusters:
                lines.append(f"  • {c.headline}")

        lines.append("")
        lines.append("=== END WHALE RADAR ===")

        return "\n".join(lines)

    # ========================================================================
    # MOCK DATA (When API is unavailable)
    # ========================================================================

    def _get_mock_insider_trades(self, symbol: Optional[str] = None) -> List[InsiderTrade]:
        """Return mock insider trades for demo/testing."""
        from datetime import datetime, timedelta
        today = datetime.now()

        mock_trades = [
            InsiderTrade(
                symbol="AAPL",
                company_name="Apple Inc.",
                reporter_name="Tim Cook",
                reporter_title="CEO",
                transaction_type="S-Sale",
                transaction_date=(today - timedelta(days=1)).strftime("%Y-%m-%d"),
                shares_transacted=50000,
                price=185.50,
                total_value=9275000.0,
                shares_owned_after=1500000
            ),
            InsiderTrade(
                symbol="NVDA",
                company_name="NVIDIA Corporation",
                reporter_name="Jensen Huang",
                reporter_title="CEO",
                transaction_type="S-Sale",
                transaction_date=(today - timedelta(days=2)).strftime("%Y-%m-%d"),
                shares_transacted=100000,
                price=545.00,
                total_value=54500000.0,
                shares_owned_after=25000000
            ),
            InsiderTrade(
                symbol="META",
                company_name="Meta Platforms Inc.",
                reporter_name="Mark Zuckerberg",
                reporter_title="CEO",
                transaction_type="P-Purchase",
                transaction_date=(today - timedelta(days=3)).strftime("%Y-%m-%d"),
                shares_transacted=25000,
                price=575.00,
                total_value=14375000.0,
                shares_owned_after=350000000
            ),
            InsiderTrade(
                symbol="TSLA",
                company_name="Tesla Inc.",
                reporter_name="Robyn Denholm",
                reporter_title="Chairman",
                transaction_type="P-Purchase",
                transaction_date=(today - timedelta(days=4)).strftime("%Y-%m-%d"),
                shares_transacted=5000,
                price=425.00,
                total_value=2125000.0,
                shares_owned_after=50000
            ),
            InsiderTrade(
                symbol="JPM",
                company_name="JPMorgan Chase & Co.",
                reporter_name="Jamie Dimon",
                reporter_title="CEO",
                transaction_type="P-Purchase",
                transaction_date=(today - timedelta(days=5)).strftime("%Y-%m-%d"),
                shares_transacted=10000,
                price=245.00,
                total_value=2450000.0,
                shares_owned_after=8500000
            ),
            InsiderTrade(
                symbol="MSFT",
                company_name="Microsoft Corporation",
                reporter_name="Satya Nadella",
                reporter_title="CEO",
                transaction_type="S-Sale",
                transaction_date=(today - timedelta(days=2)).strftime("%Y-%m-%d"),
                shares_transacted=35000,
                price=420.00,
                total_value=14700000.0,
                shares_owned_after=850000
            ),
            InsiderTrade(
                symbol="GOOGL",
                company_name="Alphabet Inc.",
                reporter_name="Sundar Pichai",
                reporter_title="CEO",
                transaction_type="S-Sale",
                transaction_date=(today - timedelta(days=3)).strftime("%Y-%m-%d"),
                shares_transacted=20000,
                price=185.00,
                total_value=3700000.0,
                shares_owned_after=420000
            ),
            InsiderTrade(
                symbol="AMZN",
                company_name="Amazon.com Inc.",
                reporter_name="Andy Jassy",
                reporter_title="CEO",
                transaction_type="S-Sale",
                transaction_date=(today - timedelta(days=4)).strftime("%Y-%m-%d"),
                shares_transacted=15000,
                price=225.00,
                total_value=3375000.0,
                shares_owned_after=95000
            ),
            InsiderTrade(
                symbol="BRK.B",
                company_name="Berkshire Hathaway Inc.",
                reporter_name="Warren Buffett",
                reporter_title="CEO",
                transaction_type="P-Purchase",
                transaction_date=(today - timedelta(days=6)).strftime("%Y-%m-%d"),
                shares_transacted=5000,
                price=460.00,
                total_value=2300000.0,
                shares_owned_after=250000
            ),
            InsiderTrade(
                symbol="V",
                company_name="Visa Inc.",
                reporter_name="Ryan McInerney",
                reporter_title="CEO",
                transaction_type="P-Purchase",
                transaction_date=(today - timedelta(days=7)).strftime("%Y-%m-%d"),
                shares_transacted=8000,
                price=310.00,
                total_value=2480000.0,
                shares_owned_after=125000
            ),
            # Healthcare sector
            InsiderTrade(
                symbol="UNH",
                company_name="UnitedHealth Group",
                reporter_name="Andrew Witty",
                reporter_title="CEO",
                transaction_type="P-Purchase",
                transaction_date=(today - timedelta(days=2)).strftime("%Y-%m-%d"),
                shares_transacted=3000,
                price=520.00,
                total_value=1560000.0,
                shares_owned_after=45000
            ),
            InsiderTrade(
                symbol="JNJ",
                company_name="Johnson & Johnson",
                reporter_name="Joaquin Duato",
                reporter_title="CEO",
                transaction_type="P-Purchase",
                transaction_date=(today - timedelta(days=3)).strftime("%Y-%m-%d"),
                shares_transacted=5000,
                price=155.00,
                total_value=775000.0,
                shares_owned_after=120000
            ),
            # Energy sector
            InsiderTrade(
                symbol="XOM",
                company_name="Exxon Mobil Corporation",
                reporter_name="Darren Woods",
                reporter_title="CEO",
                transaction_type="P-Purchase",
                transaction_date=(today - timedelta(days=4)).strftime("%Y-%m-%d"),
                shares_transacted=10000,
                price=105.00,
                total_value=1050000.0,
                shares_owned_after=85000
            ),
            InsiderTrade(
                symbol="CVX",
                company_name="Chevron Corporation",
                reporter_name="Mike Wirth",
                reporter_title="CEO",
                transaction_type="S-Sale",
                transaction_date=(today - timedelta(days=5)).strftime("%Y-%m-%d"),
                shares_transacted=8000,
                price=145.00,
                total_value=1160000.0,
                shares_owned_after=95000
            ),
            # Retail sector
            InsiderTrade(
                symbol="WMT",
                company_name="Walmart Inc.",
                reporter_name="Doug McMillon",
                reporter_title="CEO",
                transaction_type="P-Purchase",
                transaction_date=(today - timedelta(days=1)).strftime("%Y-%m-%d"),
                shares_transacted=6000,
                price=175.00,
                total_value=1050000.0,
                shares_owned_after=220000
            ),
            InsiderTrade(
                symbol="COST",
                company_name="Costco Wholesale",
                reporter_name="Ron Vachris",
                reporter_title="CEO",
                transaction_type="P-Purchase",
                transaction_date=(today - timedelta(days=2)).strftime("%Y-%m-%d"),
                shares_transacted=2000,
                price=925.00,
                total_value=1850000.0,
                shares_owned_after=18000
            ),
            # Industrial sector
            InsiderTrade(
                symbol="CAT",
                company_name="Caterpillar Inc.",
                reporter_name="Jim Umpleby",
                reporter_title="CEO",
                transaction_type="P-Purchase",
                transaction_date=(today - timedelta(days=3)).strftime("%Y-%m-%d"),
                shares_transacted=4000,
                price=380.00,
                total_value=1520000.0,
                shares_owned_after=35000
            ),
            InsiderTrade(
                symbol="UPS",
                company_name="United Parcel Service",
                reporter_name="Carol Tome",
                reporter_title="CEO",
                transaction_type="S-Sale",
                transaction_date=(today - timedelta(days=4)).strftime("%Y-%m-%d"),
                shares_transacted=7000,
                price=135.00,
                total_value=945000.0,
                shares_owned_after=28000
            ),
            # Semiconductor sector
            InsiderTrade(
                symbol="AMD",
                company_name="Advanced Micro Devices",
                reporter_name="Lisa Su",
                reporter_title="CEO",
                transaction_type="S-Sale",
                transaction_date=(today - timedelta(days=1)).strftime("%Y-%m-%d"),
                shares_transacted=25000,
                price=125.00,
                total_value=3125000.0,
                shares_owned_after=850000
            ),
            InsiderTrade(
                symbol="AVGO",
                company_name="Broadcom Inc.",
                reporter_name="Hock Tan",
                reporter_title="CEO",
                transaction_type="S-Sale",
                transaction_date=(today - timedelta(days=2)).strftime("%Y-%m-%d"),
                shares_transacted=5000,
                price=185.00,
                total_value=925000.0,
                shares_owned_after=120000
            ),
            # Small/Mid cap examples
            InsiderTrade(
                symbol="CRWD",
                company_name="CrowdStrike Holdings",
                reporter_name="George Kurtz",
                reporter_title="CEO",
                transaction_type="P-Purchase",
                transaction_date=(today - timedelta(days=5)).strftime("%Y-%m-%d"),
                shares_transacted=8000,
                price=365.00,
                total_value=2920000.0,
                shares_owned_after=145000
            ),
            InsiderTrade(
                symbol="SNOW",
                company_name="Snowflake Inc.",
                reporter_name="Sridhar Ramaswamy",
                reporter_title="CEO",
                transaction_type="P-Purchase",
                transaction_date=(today - timedelta(days=6)).strftime("%Y-%m-%d"),
                shares_transacted=10000,
                price=165.00,
                total_value=1650000.0,
                shares_owned_after=85000
            ),
        ]

        # Add mock market context data
        mock_market_caps = {
            "AAPL": (2_900_000_000_000, 15_500_000_000),  # market_cap, shares_outstanding
            "NVDA": (3_200_000_000_000, 24_600_000_000),
            "META": (1_500_000_000_000, 2_600_000_000),
            "TSLA": (1_300_000_000_000, 3_200_000_000),
            "JPM": (600_000_000_000, 2_900_000_000),
            "MSFT": (3_100_000_000_000, 7_400_000_000),
            "GOOGL": (2_000_000_000_000, 12_300_000_000),
            "AMZN": (1_900_000_000_000, 10_500_000_000),
            "BRK.B": (900_000_000_000, 1_300_000_000),
            "V": (580_000_000_000, 1_900_000_000),
            "UNH": (480_000_000_000, 920_000_000),
            "JNJ": (360_000_000_000, 2_400_000_000),
            "XOM": (460_000_000_000, 4_200_000_000),
            "CVX": (280_000_000_000, 1_800_000_000),
            "WMT": (680_000_000_000, 2_700_000_000),
            "COST": (400_000_000_000, 443_000_000),
            "CAT": (175_000_000_000, 500_000_000),
            "UPS": (115_000_000_000, 850_000_000),
            "AMD": (200_000_000_000, 1_600_000_000),
            "AVGO": (750_000_000_000, 465_000_000),
            "CRWD": (80_000_000_000, 240_000_000),
            "SNOW": (55_000_000_000, 330_000_000),
        }

        for trade in mock_trades:
            if trade.symbol in mock_market_caps:
                market_cap, shares_outstanding = mock_market_caps[trade.symbol]
                trade.market_cap = market_cap
                trade.shares_outstanding = shares_outstanding
                trade.pct_of_outstanding = round(
                    (trade.shares_transacted / shares_outstanding) * 100, 6
                )
                trade.pct_of_market_cap = round(
                    (trade.total_value / market_cap) * 100, 6
                )
                trade.significance = trade.calculate_significance()

        if symbol:
            return [t for t in mock_trades if t.symbol == symbol.upper()]
        return mock_trades

    def _get_mock_guru_holdings(self, guru_id: str) -> List[GuruHolding]:
        """Return mock guru holdings for demo/testing."""
        guru = self.GURU_FUNDS.get(guru_id, self.GURU_FUNDS["berkshire"])

        mock_holdings = {
            "berkshire": [
                GuruHolding(
                    fund_name="Berkshire Hathaway",
                    fund_manager="Warren Buffett",
                    symbol="AAPL",
                    company_name="Apple Inc.",
                    shares=915_000_000,
                    value=169_500_000_000,
                    weight_percent=49.0,
                    change_type="unchanged",
                    change_shares=0,
                    change_percent=0,
                    quarter="Q4 2024",
                    filing_date="2024-11-14"
                ),
                GuruHolding(
                    fund_name="Berkshire Hathaway",
                    fund_manager="Warren Buffett",
                    symbol="BAC",
                    company_name="Bank of America",
                    shares=1_032_000_000,
                    value=35_000_000_000,
                    weight_percent=10.1,
                    change_type="decreased",
                    change_shares=-50_000_000,
                    change_percent=-4.6,
                    quarter="Q4 2024",
                    filing_date="2024-11-14"
                ),
                GuruHolding(
                    fund_name="Berkshire Hathaway",
                    fund_manager="Warren Buffett",
                    symbol="OXY",
                    company_name="Occidental Petroleum",
                    shares=248_000_000,
                    value=14_000_000_000,
                    weight_percent=4.0,
                    change_type="increased",
                    change_shares=5_000_000,
                    change_percent=2.1,
                    quarter="Q4 2024",
                    filing_date="2024-11-14"
                ),
            ],
            "scion": [
                GuruHolding(
                    fund_name="Scion Asset Management",
                    fund_manager="Michael Burry",
                    symbol="BABA",
                    company_name="Alibaba Group",
                    shares=50_000,
                    value=4_000_000,
                    weight_percent=8.0,
                    change_type="new",
                    change_shares=50_000,
                    change_percent=100.0,
                    quarter="Q4 2024",
                    filing_date="2024-11-14"
                ),
                GuruHolding(
                    fund_name="Scion Asset Management",
                    fund_manager="Michael Burry",
                    symbol="JD",
                    company_name="JD.com",
                    shares=75_000,
                    value=2_500_000,
                    weight_percent=5.0,
                    change_type="new",
                    change_shares=75_000,
                    change_percent=100.0,
                    quarter="Q4 2024",
                    filing_date="2024-11-14"
                ),
            ],
            "bridgewater": [
                GuruHolding(
                    fund_name="Bridgewater Associates",
                    fund_manager="Ray Dalio",
                    symbol="SPY",
                    company_name="SPDR S&P 500 ETF",
                    shares=12_500_000,
                    value=7_500_000_000,
                    weight_percent=15.0,
                    change_type="increased",
                    change_shares=1_500_000,
                    change_percent=13.6,
                    quarter="Q4 2024",
                    filing_date="2024-11-14"
                ),
                GuruHolding(
                    fund_name="Bridgewater Associates",
                    fund_manager="Ray Dalio",
                    symbol="GLD",
                    company_name="SPDR Gold Trust",
                    shares=8_000_000,
                    value=1_800_000_000,
                    weight_percent=3.6,
                    change_type="increased",
                    change_shares=500_000,
                    change_percent=6.7,
                    quarter="Q4 2024",
                    filing_date="2024-11-14"
                ),
                GuruHolding(
                    fund_name="Bridgewater Associates",
                    fund_manager="Ray Dalio",
                    symbol="TLT",
                    company_name="iShares 20+ Year Treasury Bond ETF",
                    shares=15_000_000,
                    value=1_350_000_000,
                    weight_percent=2.7,
                    change_type="new",
                    change_shares=15_000_000,
                    change_percent=100.0,
                    quarter="Q4 2024",
                    filing_date="2024-11-14"
                ),
                GuruHolding(
                    fund_name="Bridgewater Associates",
                    fund_manager="Ray Dalio",
                    symbol="PG",
                    company_name="Procter & Gamble Co",
                    shares=4_200_000,
                    value=700_000_000,
                    weight_percent=1.4,
                    change_type="unchanged",
                    change_shares=0,
                    change_percent=0,
                    quarter="Q4 2024",
                    filing_date="2024-11-14"
                ),
            ],
            "renaissance": [
                GuruHolding(
                    fund_name="Renaissance Technologies",
                    fund_manager="Jim Simons",
                    symbol="NVDA",
                    company_name="NVIDIA Corporation",
                    shares=2_500_000,
                    value=1_375_000_000,
                    weight_percent=2.0,
                    change_type="increased",
                    change_shares=800_000,
                    change_percent=47.0,
                    quarter="Q4 2024",
                    filing_date="2024-11-14"
                ),
                GuruHolding(
                    fund_name="Renaissance Technologies",
                    fund_manager="Jim Simons",
                    symbol="META",
                    company_name="Meta Platforms Inc",
                    shares=1_800_000,
                    value=1_035_000_000,
                    weight_percent=1.5,
                    change_type="increased",
                    change_shares=400_000,
                    change_percent=28.6,
                    quarter="Q4 2024",
                    filing_date="2024-11-14"
                ),
                GuruHolding(
                    fund_name="Renaissance Technologies",
                    fund_manager="Jim Simons",
                    symbol="GOOGL",
                    company_name="Alphabet Inc",
                    shares=3_200_000,
                    value=592_000_000,
                    weight_percent=0.9,
                    change_type="decreased",
                    change_shares=-500_000,
                    change_percent=-13.5,
                    quarter="Q4 2024",
                    filing_date="2024-11-14"
                ),
            ],
            "pershing": [
                GuruHolding(
                    fund_name="Pershing Square Capital",
                    fund_manager="Bill Ackman",
                    symbol="CMG",
                    company_name="Chipotle Mexican Grill",
                    shares=850_000,
                    value=2_550_000_000,
                    weight_percent=18.0,
                    change_type="unchanged",
                    change_shares=0,
                    change_percent=0,
                    quarter="Q4 2024",
                    filing_date="2024-11-14"
                ),
                GuruHolding(
                    fund_name="Pershing Square Capital",
                    fund_manager="Bill Ackman",
                    symbol="HLT",
                    company_name="Hilton Worldwide",
                    shares=5_500_000,
                    value=1_375_000_000,
                    weight_percent=10.0,
                    change_type="increased",
                    change_shares=500_000,
                    change_percent=10.0,
                    quarter="Q4 2024",
                    filing_date="2024-11-14"
                ),
                GuruHolding(
                    fund_name="Pershing Square Capital",
                    fund_manager="Bill Ackman",
                    symbol="GOOG",
                    company_name="Alphabet Inc Class C",
                    shares=3_200_000,
                    value=592_000_000,
                    weight_percent=4.2,
                    change_type="new",
                    change_shares=3_200_000,
                    change_percent=100.0,
                    quarter="Q4 2024",
                    filing_date="2024-11-14"
                ),
            ],
        }

        return mock_holdings.get(guru_id, mock_holdings["berkshire"])


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_whale_tracker_instance: Optional[WhaleTracker] = None

def get_whale_tracker() -> WhaleTracker:
    """Get or create the WhaleTracker singleton instance."""
    global _whale_tracker_instance
    if _whale_tracker_instance is None:
        _whale_tracker_instance = WhaleTracker()
    return _whale_tracker_instance
