"""
FastAPI Backend for Insight Flow
Serves the LangGraph multi-agent debate system via REST API.
"""

import sys
import os
import json
from datetime import datetime, date
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from agents import run_board_meeting, run_bond_analysis, run_fx_analysis, run_stock_analysis, run_policy_analysis, run_economy_analysis, run_insight_analysis
from insight_collector import fetch_rss_feeds, get_mock_insights, get_behavioral_bias, get_all_sources, extract_full_text
from market_service import get_market_service

# ============================================
# ANALYSIS CACHE SYSTEM
# ============================================

# Cache directory
CACHE_DIR = Path(__file__).parent / "cache"
CACHE_DIR.mkdir(exist_ok=True)


def get_cache_key(analysis_type: str, language: str, extra_key: str = "") -> str:
    """Generate a cache key based on analysis type, language, and optional extra key."""
    today = date.today().isoformat()
    if extra_key:
        return f"{analysis_type}_{language}_{extra_key}_{today}"
    return f"{analysis_type}_{language}_{today}"


def get_cached_analysis(cache_key: str) -> Optional[dict]:
    """Get cached analysis result if it exists and is from today."""
    cache_file = CACHE_DIR / f"{cache_key}.json"
    if cache_file.exists():
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                cached = json.load(f)
                # Verify the cache is from today
                if cached.get("date") == date.today().isoformat():
                    return cached.get("result")
        except (json.JSONDecodeError, IOError):
            pass
    return None


def save_cached_analysis(cache_key: str, result: dict) -> None:
    """Save analysis result to cache."""
    cache_file = CACHE_DIR / f"{cache_key}.json"
    try:
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump({
                "date": date.today().isoformat(),
                "timestamp": datetime.now().isoformat(),
                "result": result
            }, f, ensure_ascii=False, indent=2)
    except IOError as e:
        print(f"Failed to save cache: {e}")


def list_cached_analyses(analysis_type: str = None) -> List[dict]:
    """List all cached analyses, optionally filtered by type."""
    caches = []
    for cache_file in CACHE_DIR.glob("*.json"):
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                cached = json.load(f)
                cache_info = {
                    "key": cache_file.stem,
                    "date": cached.get("date"),
                    "timestamp": cached.get("timestamp"),
                }
                if analysis_type is None or cache_file.stem.startswith(analysis_type):
                    caches.append(cache_info)
        except (json.JSONDecodeError, IOError):
            pass
    return sorted(caches, key=lambda x: x.get("timestamp", ""), reverse=True)

app = FastAPI(
    title="Insight Flow API",
    description="AI Board of Directors - Multi-Agent Macro Analysis",
    version="1.0.0",
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DebateRequest(BaseModel):
    scenario: str


class DebateResponse(BaseModel):
    scenario: str
    kostolany_response: str
    buffett_response: str
    munger_response: str
    dalio_response: str
    synthesis: str


@app.get("/")
async def root():
    return {"message": "Insight Flow API - AI Board of Directors"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/api/debate", response_model=DebateResponse)
async def run_debate(request: DebateRequest):
    """
    Run a board meeting debate on the given scenario.
    Returns perspectives from Kostolany, Buffett, Munger, and Dalio style agents,
    plus a synthesis of their viewpoints.
    """
    if not request.scenario.strip():
        raise HTTPException(status_code=400, detail="Scenario cannot be empty")

    try:
        result = run_board_meeting(request.scenario)
        return DebateResponse(
            scenario=request.scenario,
            kostolany_response=result["kostolany_response"],
            buffett_response=result["buffett_response"],
            munger_response=result["munger_response"],
            dalio_response=result["dalio_response"],
            synthesis=result["synthesis"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# BOND MARKET ENDPOINTS
# ============================================

class YieldDataPoint(BaseModel):
    maturity: str
    yield_value: float
    date: str


class YieldCurve(BaseModel):
    date: str
    data: List[YieldDataPoint]


class BondYieldsResponse(BaseModel):
    current_curve: YieldCurve
    previous_curve: YieldCurve


class BondAnalysisRequest(BaseModel):
    yield_2y: float
    yield_10y: float
    spread: float
    is_inverted: bool
    selected_metric: Optional[str] = "curve"
    curve_data: Optional[List[dict]] = None
    language: str = "en"  # "en", "ko", "zh", "ja"


class BondAnalysisResponse(BaseModel):
    kostolany_response: str
    buffett_response: str
    munger_response: str
    dalio_response: str
    synthesis: str


class GlobalBondYield(BaseModel):
    country: str
    country_code: str
    flag: str
    yield_10y: float
    change_24h: float
    spread_vs_us: float
    trend: str


class BondFlow(BaseModel):
    from_country: str
    to_country: str
    volume: float
    flow_type: str


class GlobalBondDataResponse(BaseModel):
    global_bonds: List[GlobalBondYield]
    bond_flows: List[BondFlow]
    us_yield_10y: float


def generate_mock_yield_curve(date: str, shift: float = 0) -> dict:
    """Generate mock yield curve data for development."""
    import random
    maturities = ["1M", "3M", "6M", "1Y", "2Y", "3Y", "5Y", "7Y", "10Y", "20Y", "30Y"]
    # Simulated inverted curve (short-term higher than long-term)
    base_yields = [5.45, 5.40, 5.35, 5.10, 4.85, 4.60, 4.45, 4.50, 4.55, 4.80, 4.70]

    return {
        "date": date,
        "data": [
            {
                "maturity": mat,
                "yield_value": round(base_yields[idx] + shift + (random.random() * 0.1 - 0.05), 2),
                "date": date,
            }
            for idx, mat in enumerate(maturities)
        ],
    }


@app.get("/api/bonds/yields", response_model=BondYieldsResponse)
async def get_bond_yields():
    """
    Get current and historical yield curve data.
    Uses FRED API for real Treasury yields with fallback to Yahoo Finance and mock data.
    """
    from datetime import datetime, timedelta

    today = datetime.now().strftime("%Y-%m-%d")
    last_month = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

    # Try to get real Treasury yields from market_service (Yahoo Finance)
    market_service = get_market_service()
    real_yields = market_service.get_treasury_yields()

    if real_yields and len(real_yields) >= 3:
        # We have some real yield data - build partial curve
        yield_map = {y["maturity"]: y["yield_value"] for y in real_yields}

        # Interpolate missing maturities
        maturities = ["1M", "3M", "6M", "1Y", "2Y", "3Y", "5Y", "7Y", "10Y", "20Y", "30Y"]
        current_data = []

        # Use real data where available, interpolate rest
        y3m = yield_map.get("3M", 5.40)
        y5y = yield_map.get("5Y", 4.45)
        y10y = yield_map.get("10Y", 4.55)
        y30y = yield_map.get("30Y", 4.70)

        # Build curve with interpolation
        base_yields = {
            "1M": y3m + 0.05, "3M": y3m, "6M": (y3m + y5y) / 2 + 0.1,
            "1Y": (y3m + y5y) / 2, "2Y": y5y + 0.4, "3Y": y5y + 0.15,
            "5Y": y5y, "7Y": (y5y + y10y) / 2, "10Y": y10y,
            "20Y": (y10y + y30y) / 2 + 0.1, "30Y": y30y
        }

        for mat in maturities:
            current_data.append({
                "maturity": mat,
                "yield_value": round(base_yields.get(mat, 4.5), 2),
                "date": today,
            })

        current_curve = {"date": today, "data": current_data}

        # Previous curve - shift down slightly
        prev_data = [
            {"maturity": d["maturity"], "yield_value": round(d["yield_value"] - 0.15, 2), "date": last_month}
            for d in current_data
        ]
        previous_curve = {"date": last_month, "data": prev_data}
    else:
        # Fallback to mock data
        current_curve = generate_mock_yield_curve(today, 0)
        previous_curve = generate_mock_yield_curve(last_month, -0.15)

    return BondYieldsResponse(
        current_curve=YieldCurve(
            date=current_curve["date"],
            data=[YieldDataPoint(maturity=d["maturity"], yield_value=d["yield_value"], date=d["date"]) for d in current_curve["data"]]
        ),
        previous_curve=YieldCurve(
            date=previous_curve["date"],
            data=[YieldDataPoint(maturity=d["maturity"], yield_value=d["yield_value"], date=d["date"]) for d in previous_curve["data"]]
        ),
    )


def generate_mock_global_bonds(us_yield_10y: float) -> list:
    """Generate mock global bond data for development."""
    import random

    def get_trend() -> str:
        r = random.random()
        if r > 0.6:
            return "up"
        if r > 0.3:
            return "down"
        return "flat"

    bonds = [
        {
            "country": "United States",
            "country_code": "US",
            "flag": "🇺🇸",
            "yield_10y": us_yield_10y,
            "change_24h": round(random.random() * 0.1 - 0.05, 2),
            "spread_vs_us": 0,
            "trend": get_trend(),
        },
        {
            "country": "Germany",
            "country_code": "DE",
            "flag": "🇩🇪",
            "yield_10y": round(2.35 + random.random() * 0.2 - 0.1, 2),
            "change_24h": round(random.random() * 0.08 - 0.04, 2),
            "spread_vs_us": 0,
            "trend": get_trend(),
        },
        {
            "country": "Japan",
            "country_code": "JP",
            "flag": "🇯🇵",
            "yield_10y": round(0.95 + random.random() * 0.1 - 0.05, 2),
            "change_24h": round(random.random() * 0.05 - 0.025, 2),
            "spread_vs_us": 0,
            "trend": get_trend(),
        },
        {
            "country": "United Kingdom",
            "country_code": "GB",
            "flag": "🇬🇧",
            "yield_10y": round(4.15 + random.random() * 0.2 - 0.1, 2),
            "change_24h": round(random.random() * 0.08 - 0.04, 2),
            "spread_vs_us": 0,
            "trend": get_trend(),
        },
        {
            "country": "China",
            "country_code": "CN",
            "flag": "🇨🇳",
            "yield_10y": round(2.25 + random.random() * 0.1 - 0.05, 2),
            "change_24h": round(random.random() * 0.04 - 0.02, 2),
            "spread_vs_us": 0,
            "trend": get_trend(),
        },
        {
            "country": "France",
            "country_code": "FR",
            "flag": "🇫🇷",
            "yield_10y": round(2.95 + random.random() * 0.15 - 0.075, 2),
            "change_24h": round(random.random() * 0.06 - 0.03, 2),
            "spread_vs_us": 0,
            "trend": get_trend(),
        },
        {
            "country": "Italy",
            "country_code": "IT",
            "flag": "🇮🇹",
            "yield_10y": round(3.65 + random.random() * 0.2 - 0.1, 2),
            "change_24h": round(random.random() * 0.1 - 0.05, 2),
            "spread_vs_us": 0,
            "trend": get_trend(),
        },
        {
            "country": "Australia",
            "country_code": "AU",
            "flag": "🇦🇺",
            "yield_10y": round(4.25 + random.random() * 0.15 - 0.075, 2),
            "change_24h": round(random.random() * 0.08 - 0.04, 2),
            "spread_vs_us": 0,
            "trend": get_trend(),
        },
    ]

    # Calculate spread vs US
    for bond in bonds:
        bond["spread_vs_us"] = round(bond["yield_10y"] - us_yield_10y, 2)

    return bonds


def generate_mock_bond_flows() -> list:
    """Generate mock bond flow data for development."""
    return [
        {"from_country": "JP", "to_country": "US", "volume": 0.8, "flow_type": "flight_to_safety"},
        {"from_country": "EU", "to_country": "US", "volume": 0.6, "flow_type": "yield_seeking"},
        {"from_country": "CN", "to_country": "US", "volume": 0.5, "flow_type": "diversification"},
        {"from_country": "US", "to_country": "DE", "volume": 0.3, "flow_type": "diversification"},
        {"from_country": "GB", "to_country": "US", "volume": 0.4, "flow_type": "yield_seeking"},
        {"from_country": "AU", "to_country": "US", "volume": 0.35, "flow_type": "yield_seeking"},
    ]


@app.get("/api/bonds/global", response_model=GlobalBondDataResponse)
async def get_global_bond_data():
    """
    Get global bond market data including 10Y yields for major economies
    and capital flow patterns between countries.
    Uses Yahoo Finance for US 10Y yield with fallback to mock data.
    """
    # Try to get real US 10Y yield
    market_service = get_market_service()
    real_yields = market_service.get_treasury_yields()

    us_yield_10y = 4.55  # Default
    if real_yields:
        for y in real_yields:
            if y.get("maturity") == "10Y":
                us_yield_10y = y["yield_value"]
                break

    global_bonds = generate_mock_global_bonds(us_yield_10y)
    bond_flows = generate_mock_bond_flows()

    return GlobalBondDataResponse(
        global_bonds=[
            GlobalBondYield(
                country=b["country"],
                country_code=b["country_code"],
                flag=b["flag"],
                yield_10y=b["yield_10y"],
                change_24h=b["change_24h"],
                spread_vs_us=b["spread_vs_us"],
                trend=b["trend"],
            )
            for b in global_bonds
        ],
        bond_flows=[
            BondFlow(
                from_country=f["from_country"],
                to_country=f["to_country"],
                volume=f["volume"],
                flow_type=f["flow_type"],
            )
            for f in bond_flows
        ],
        us_yield_10y=us_yield_10y,
    )


@app.get("/api/analyze/bonds/cached")
async def get_cached_bond_analysis(language: str = "en"):
    """Get cached bond analysis if available."""
    cache_key = get_cache_key("bonds", language)
    cached = get_cached_analysis(cache_key)
    if cached:
        return {"cached": True, "result": cached}
    return {"cached": False, "result": None}


@app.post("/api/analyze/bonds", response_model=BondAnalysisResponse)
async def analyze_bonds(request: BondAnalysisRequest):
    """
    On-Demand AI Analysis for Bond Market.
    Triggers the multi-agent debate focused on Treasury yields.
    Uses daily cache to avoid redundant AI calls.
    """
    # Check cache first
    cache_key = get_cache_key("bonds", request.language)
    cached = get_cached_analysis(cache_key)
    if cached:
        return BondAnalysisResponse(**cached)

    try:
        result = run_bond_analysis(
            yield_2y=request.yield_2y,
            yield_10y=request.yield_10y,
            spread=request.spread,
            is_inverted=request.is_inverted,
            selected_metric=request.selected_metric or "curve",
            language=request.language,
        )

        response_data = {
            "kostolany_response": result["kostolany_response"],
            "buffett_response": result["buffett_response"],
            "munger_response": result["munger_response"],
            "dalio_response": result["dalio_response"],
            "synthesis": result["synthesis"],
        }

        # Save to cache
        save_cached_analysis(cache_key, response_data)

        return BondAnalysisResponse(**response_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# FX MARKET ENDPOINTS
# ============================================

class FXAnalysisRequest(BaseModel):
    dollar_index: float
    dollar_trend: str
    selected_pair: str
    risk_sentiment: str
    major_pairs: Optional[List[dict]] = None
    language: str = "en"  # "en", "ko", "zh", "ja"


class FXAnalysisResponse(BaseModel):
    kostolany_response: str
    buffett_response: str
    munger_response: str
    dalio_response: str
    synthesis: str


@app.get("/api/fx/data")
async def get_fx_data():
    """
    Get current FX market data.
    Uses Yahoo Finance for real-time data with fallback to mock.
    """
    market_service = get_market_service()
    fx_data = market_service.get_fx_data()
    return fx_data


@app.get("/api/analyze/fx/cached")
async def get_cached_fx_analysis(language: str = "en", selected_pair: str = "USD/JPY"):
    """Get cached FX analysis if available. Cache is pair-specific."""
    # Normalize pair name for cache key (e.g., "USD/JPY" -> "USDJPY")
    pair_key = selected_pair.replace("/", "")
    cache_key = get_cache_key("fx", language, pair_key)
    cached = get_cached_analysis(cache_key)
    if cached:
        return {"cached": True, "result": cached}
    return {"cached": False, "result": None}


@app.post("/api/analyze/fx", response_model=FXAnalysisResponse)
async def analyze_fx(request: FXAnalysisRequest):
    """
    On-Demand AI Analysis for FX Market.
    Triggers the multi-agent debate focused on currency flows.
    Uses daily cache to avoid redundant AI calls (pair-specific).
    """
    # Check cache first (pair-specific cache)
    pair_key = request.selected_pair.replace("/", "")
    cache_key = get_cache_key("fx", request.language, pair_key)
    cached = get_cached_analysis(cache_key)
    if cached:
        return FXAnalysisResponse(**cached)

    try:
        result = run_fx_analysis(
            dollar_index=request.dollar_index,
            dollar_trend=request.dollar_trend,
            selected_pair=request.selected_pair,
            risk_sentiment=request.risk_sentiment,
            major_pairs=request.major_pairs,
            language=request.language,
        )

        response_data = {
            "kostolany_response": result["kostolany_response"],
            "buffett_response": result["buffett_response"],
            "munger_response": result["munger_response"],
            "dalio_response": result["dalio_response"],
            "synthesis": result["synthesis"],
        }

        # Save to cache
        save_cached_analysis(cache_key, response_data)

        return FXAnalysisResponse(**response_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# STOCK MARKET ENDPOINTS
# ============================================

class MarketIndexData(BaseModel):
    symbol: str
    name: str
    country: str
    region: str
    flag: str
    price: float
    change: float
    change_value: float
    market_cap: float


class SectorData(BaseModel):
    sector: str
    short_name: str
    change: float
    market_cap: float
    top_stock: str
    top_stock_change: float


class VIXData(BaseModel):
    value: float
    change: float
    level: str
    description: str


class EquityFlowData(BaseModel):
    from_region: str
    to_region: str
    volume: float
    flow_type: str


class GlobalStockDataResponse(BaseModel):
    global_indices: List[MarketIndexData]
    sectors: List[SectorData]
    vix: VIXData
    equity_flows: List[EquityFlowData]


class StockAnalysisRequest(BaseModel):
    us_market_change: float
    vix_level: float
    vix_status: str
    top_sector: str
    top_sector_change: float
    bottom_sector: str
    bottom_sector_change: float
    global_indices: Optional[List[dict]] = None
    language: str = "en"  # "en", "ko", "zh", "ja"


class StockAnalysisResponse(BaseModel):
    kostolany_response: str
    buffett_response: str
    munger_response: str
    dalio_response: str
    synthesis: str


def generate_mock_global_indices() -> list:
    """Generate mock global stock indices data."""
    import random

    def random_change(base: float, range_val: float) -> float:
        return round(base + (random.random() * range_val - range_val / 2), 2)

    return [
        {
            "symbol": "^GSPC",
            "name": "S&P 500",
            "country": "United States",
            "region": "US",
            "flag": "🇺🇸",
            "price": round(5850 + random.random() * 100, 2),
            "change": random_change(0.5, 3),
            "change_value": random_change(25, 100),
            "market_cap": 45000,
        },
        {
            "symbol": "^IXIC",
            "name": "NASDAQ",
            "country": "United States",
            "region": "US",
            "flag": "🇺🇸",
            "price": round(18500 + random.random() * 300, 2),
            "change": random_change(0.7, 4),
            "change_value": random_change(100, 300),
            "market_cap": 25000,
        },
        {
            "symbol": "^DJI",
            "name": "Dow Jones",
            "country": "United States",
            "region": "US",
            "flag": "🇺🇸",
            "price": round(42500 + random.random() * 500, 2),
            "change": random_change(0.3, 2),
            "change_value": random_change(100, 400),
            "market_cap": 15000,
        },
        {
            "symbol": "^N225",
            "name": "Nikkei 225",
            "country": "Japan",
            "region": "Asia",
            "flag": "🇯🇵",
            "price": round(38500 + random.random() * 500, 2),
            "change": random_change(-0.2, 3),
            "change_value": random_change(-50, 300),
            "market_cap": 6000,
        },
        {
            "symbol": "^KS11",
            "name": "KOSPI",
            "country": "South Korea",
            "region": "Asia",
            "flag": "🇰🇷",
            "price": round(2650 + random.random() * 50, 2),
            "change": random_change(-0.5, 3),
            "change_value": random_change(-10, 40),
            "market_cap": 1800,
        },
        {
            "symbol": "^HSI",
            "name": "Hang Seng",
            "country": "Hong Kong",
            "region": "Asia",
            "flag": "🇭🇰",
            "price": round(19500 + random.random() * 300, 2),
            "change": random_change(-0.8, 4),
            "change_value": random_change(-100, 300),
            "market_cap": 4500,
        },
        {
            "symbol": "^GDAXI",
            "name": "DAX",
            "country": "Germany",
            "region": "EU",
            "flag": "🇩🇪",
            "price": round(19200 + random.random() * 200, 2),
            "change": random_change(0.2, 2.5),
            "change_value": random_change(30, 150),
            "market_cap": 2200,
        },
        {
            "symbol": "^FTSE",
            "name": "FTSE 100",
            "country": "United Kingdom",
            "region": "EU",
            "flag": "🇬🇧",
            "price": round(8150 + random.random() * 100, 2),
            "change": random_change(0.1, 2),
            "change_value": random_change(10, 80),
            "market_cap": 2800,
        },
    ]


def generate_mock_sectors() -> list:
    """Generate mock sector data."""
    import random

    def random_change(base: float, range_val: float) -> float:
        return round(base + (random.random() * range_val - range_val / 2), 2)

    return [
        {"sector": "Information Technology", "short_name": "Tech", "change": random_change(1.2, 4), "market_cap": 14000, "top_stock": "NVDA", "top_stock_change": random_change(2.5, 6)},
        {"sector": "Health Care", "short_name": "Health", "change": random_change(0.3, 2.5), "market_cap": 7500, "top_stock": "UNH", "top_stock_change": random_change(0.5, 3)},
        {"sector": "Financials", "short_name": "Finance", "change": random_change(0.4, 2.5), "market_cap": 6800, "top_stock": "JPM", "top_stock_change": random_change(0.6, 2.5)},
        {"sector": "Consumer Discretionary", "short_name": "Consumer", "change": random_change(0.6, 3), "market_cap": 5500, "top_stock": "AMZN", "top_stock_change": random_change(1.0, 4)},
        {"sector": "Communication Services", "short_name": "Comm", "change": random_change(0.8, 3.5), "market_cap": 4800, "top_stock": "META", "top_stock_change": random_change(1.5, 5)},
        {"sector": "Industrials", "short_name": "Industrial", "change": random_change(0.2, 2), "market_cap": 4500, "top_stock": "CAT", "top_stock_change": random_change(0.3, 2)},
        {"sector": "Consumer Staples", "short_name": "Staples", "change": random_change(-0.1, 1.5), "market_cap": 4000, "top_stock": "PG", "top_stock_change": random_change(0.1, 1.5)},
        {"sector": "Energy", "short_name": "Energy", "change": random_change(-0.5, 3), "market_cap": 2200, "top_stock": "XOM", "top_stock_change": random_change(-0.3, 2.5)},
        {"sector": "Utilities", "short_name": "Utilities", "change": random_change(-0.2, 1.5), "market_cap": 1600, "top_stock": "NEE", "top_stock_change": random_change(0.1, 1.5)},
        {"sector": "Real Estate", "short_name": "Real Est", "change": random_change(-0.4, 2), "market_cap": 1400, "top_stock": "PLD", "top_stock_change": random_change(-0.2, 2)},
        {"sector": "Materials", "short_name": "Materials", "change": random_change(0.1, 2), "market_cap": 1200, "top_stock": "LIN", "top_stock_change": random_change(0.2, 1.8)},
    ]


def generate_mock_vix() -> dict:
    """Generate mock VIX data."""
    import random

    value = round(15 + random.random() * 20, 2)
    change = round(random.random() * 4 - 2, 2)

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


@app.get("/api/stocks/global", response_model=GlobalStockDataResponse)
async def get_global_stock_data():
    """
    Get global stock market data including indices, sectors, and VIX.
    Uses Yahoo Finance for real-time data with fallback to mock.
    """
    market_service = get_market_service()

    # Fetch real data from Yahoo Finance
    global_indices = market_service.get_global_indices()
    sectors = market_service.get_sector_performance()
    vix = market_service.get_vix()

    # Calculate equity flows based on market performance
    us_indices = [i for i in global_indices if i.get("region") == "US"]
    us_avg = sum(i.get("change", 0) for i in us_indices) / len(us_indices) if us_indices else 0
    is_risk_on = us_avg > 0

    equity_flows = [
        {"from_region": "Bonds" if is_risk_on else "US", "to_region": "US" if is_risk_on else "Bonds", "volume": abs(us_avg) / 5, "flow_type": "risk_on" if is_risk_on else "risk_off"},
        {"from_region": "EU" if is_risk_on else "US", "to_region": "US" if is_risk_on else "EU", "volume": 0.4, "flow_type": "rotation"},
        {"from_region": "Asia" if is_risk_on else "US", "to_region": "US" if is_risk_on else "Asia", "volume": 0.35, "flow_type": "rotation"},
    ]

    return GlobalStockDataResponse(
        global_indices=[MarketIndexData(**i) for i in global_indices],
        sectors=[SectorData(**s) for s in sectors],
        vix=VIXData(**vix),
        equity_flows=[EquityFlowData(**f) for f in equity_flows],
    )


@app.get("/api/analyze/stocks/cached")
async def get_cached_stock_analysis(language: str = "en"):
    """Get cached stock analysis if available."""
    cache_key = get_cache_key("stocks", language)
    cached = get_cached_analysis(cache_key)
    if cached:
        return {"cached": True, "result": cached}
    return {"cached": False, "result": None}


@app.post("/api/analyze/stocks", response_model=StockAnalysisResponse)
async def analyze_stocks(request: StockAnalysisRequest):
    """
    On-Demand AI Analysis for Stock Market.
    Triggers the multi-agent debate focused on equity markets.
    Uses daily cache to avoid redundant AI calls.
    """
    # Check cache first
    cache_key = get_cache_key("stocks", request.language)
    cached = get_cached_analysis(cache_key)
    if cached:
        return StockAnalysisResponse(**cached)

    try:
        from agents import run_stock_analysis

        result = run_stock_analysis(
            us_market_change=request.us_market_change,
            vix_level=request.vix_level,
            vix_status=request.vix_status,
            top_sector=request.top_sector,
            top_sector_change=request.top_sector_change,
            bottom_sector=request.bottom_sector,
            bottom_sector_change=request.bottom_sector_change,
            language=request.language,
        )

        response_data = {
            "kostolany_response": result["kostolany_response"],
            "buffett_response": result["buffett_response"],
            "munger_response": result["munger_response"],
            "dalio_response": result["dalio_response"],
            "synthesis": result["synthesis"],
        }

        # Save to cache
        save_cached_analysis(cache_key, response_data)

        return StockAnalysisResponse(**response_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# CENTRAL BANK POLICY ENDPOINTS
# ============================================

class CentralBankData(BaseModel):
    country: str
    code: str
    flag: str
    bank: str
    current_rate: float
    previous_rate: float
    inflation_rate: float
    real_rate: float
    status: str  # hiking, paused, cutting, low
    cycle_position: int
    last_change: str
    last_meeting_date: str
    next_meeting_date: str


class UpcomingMeetingData(BaseModel):
    country: str
    flag: str
    bank: str
    date: str
    days_until: int
    expected_action: str
    market_probability: int


class GlobalPolicyDataResponse(BaseModel):
    central_banks: List[CentralBankData]
    upcoming_meetings: List[UpcomingMeetingData]


class PolicyAnalysisRequest(BaseModel):
    us_rate: float
    us_real_rate: float
    us_status: str
    hiking_count: int
    cutting_count: int
    next_meeting_country: str
    next_meeting_days: int
    language: str = "en"  # "en", "ko", "zh", "ja"


class PolicyAnalysisResponse(BaseModel):
    kostolany_response: str
    buffett_response: str
    munger_response: str
    dalio_response: str
    synthesis: str


def generate_mock_central_banks() -> list:
    """Generate mock central bank policy data."""
    import random
    from datetime import datetime, timedelta

    def next_meeting(days_ahead: int) -> str:
        return (datetime.now() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")

    banks = [
        {
            "country": "United States",
            "code": "US",
            "flag": "🇺🇸",
            "bank": "Federal Reserve (Fed)",
            "current_rate": 5.50,
            "previous_rate": 5.50,
            "inflation_rate": 3.4,
            "real_rate": 2.1,
            "status": "paused",
            "cycle_position": 75,
            "last_change": "0.00%",
            "last_meeting_date": "2024-01-31",
            "next_meeting_date": next_meeting(random.randint(15, 45)),
        },
        {
            "country": "European Union",
            "code": "EU",
            "flag": "🇪🇺",
            "bank": "European Central Bank (ECB)",
            "current_rate": 4.50,
            "previous_rate": 4.50,
            "inflation_rate": 2.8,
            "real_rate": 1.7,
            "status": "paused",
            "cycle_position": 70,
            "last_change": "0.00%",
            "last_meeting_date": "2024-01-25",
            "next_meeting_date": next_meeting(random.randint(10, 35)),
        },
        {
            "country": "Japan",
            "code": "JP",
            "flag": "🇯🇵",
            "bank": "Bank of Japan (BOJ)",
            "current_rate": 0.10,
            "previous_rate": -0.10,
            "inflation_rate": 2.6,
            "real_rate": -2.5,
            "status": "hiking",
            "cycle_position": 15,
            "last_change": "+0.20%",
            "last_meeting_date": "2024-01-23",
            "next_meeting_date": next_meeting(random.randint(20, 50)),
        },
        {
            "country": "United Kingdom",
            "code": "GB",
            "flag": "🇬🇧",
            "bank": "Bank of England (BOE)",
            "current_rate": 5.25,
            "previous_rate": 5.25,
            "inflation_rate": 4.0,
            "real_rate": 1.25,
            "status": "paused",
            "cycle_position": 72,
            "last_change": "0.00%",
            "last_meeting_date": "2024-02-01",
            "next_meeting_date": next_meeting(random.randint(12, 40)),
        },
        {
            "country": "China",
            "code": "CN",
            "flag": "🇨🇳",
            "bank": "People's Bank of China (PBOC)",
            "current_rate": 3.45,
            "previous_rate": 3.55,
            "inflation_rate": 0.7,
            "real_rate": 2.75,
            "status": "cutting",
            "cycle_position": 55,
            "last_change": "-0.10%",
            "last_meeting_date": "2024-02-20",
            "next_meeting_date": next_meeting(random.randint(18, 48)),
        },
        {
            "country": "South Korea",
            "code": "KR",
            "flag": "🇰🇷",
            "bank": "Bank of Korea (BOK)",
            "current_rate": 3.50,
            "previous_rate": 3.50,
            "inflation_rate": 2.8,
            "real_rate": 0.7,
            "status": "paused",
            "cycle_position": 68,
            "last_change": "0.00%",
            "last_meeting_date": "2024-02-22",
            "next_meeting_date": next_meeting(random.randint(25, 55)),
        },
        {
            "country": "Australia",
            "code": "AU",
            "flag": "🇦🇺",
            "bank": "Reserve Bank of Australia (RBA)",
            "current_rate": 4.35,
            "previous_rate": 4.35,
            "inflation_rate": 4.1,
            "real_rate": 0.25,
            "status": "paused",
            "cycle_position": 70,
            "last_change": "0.00%",
            "last_meeting_date": "2024-02-06",
            "next_meeting_date": next_meeting(random.randint(15, 42)),
        },
        {
            "country": "Canada",
            "code": "CA",
            "flag": "🇨🇦",
            "bank": "Bank of Canada (BOC)",
            "current_rate": 5.00,
            "previous_rate": 5.00,
            "inflation_rate": 2.9,
            "real_rate": 2.1,
            "status": "paused",
            "cycle_position": 73,
            "last_change": "0.00%",
            "last_meeting_date": "2024-01-24",
            "next_meeting_date": next_meeting(random.randint(8, 30)),
        },
        {
            "country": "Switzerland",
            "code": "CH",
            "flag": "🇨🇭",
            "bank": "Swiss National Bank (SNB)",
            "current_rate": 1.75,
            "previous_rate": 1.75,
            "inflation_rate": 1.3,
            "real_rate": 0.45,
            "status": "paused",
            "cycle_position": 65,
            "last_change": "0.00%",
            "last_meeting_date": "2023-12-14",
            "next_meeting_date": next_meeting(random.randint(20, 50)),
        },
        {
            "country": "Brazil",
            "code": "BR",
            "flag": "🇧🇷",
            "bank": "Central Bank of Brazil (BCB)",
            "current_rate": 11.25,
            "previous_rate": 11.75,
            "inflation_rate": 4.5,
            "real_rate": 6.75,
            "status": "cutting",
            "cycle_position": 50,
            "last_change": "-0.50%",
            "last_meeting_date": "2024-01-31",
            "next_meeting_date": next_meeting(random.randint(12, 38)),
        },
        {
            "country": "India",
            "code": "IN",
            "flag": "🇮🇳",
            "bank": "Reserve Bank of India (RBI)",
            "current_rate": 6.50,
            "previous_rate": 6.50,
            "inflation_rate": 5.1,
            "real_rate": 1.4,
            "status": "paused",
            "cycle_position": 68,
            "last_change": "0.00%",
            "last_meeting_date": "2024-02-08",
            "next_meeting_date": next_meeting(random.randint(30, 60)),
        },
        {
            "country": "Mexico",
            "code": "MX",
            "flag": "🇲🇽",
            "bank": "Bank of Mexico (Banxico)",
            "current_rate": 11.25,
            "previous_rate": 11.25,
            "inflation_rate": 4.9,
            "real_rate": 6.35,
            "status": "paused",
            "cycle_position": 72,
            "last_change": "0.00%",
            "last_meeting_date": "2024-02-08",
            "next_meeting_date": next_meeting(random.randint(18, 45)),
        },
    ]

    # Add small random variations
    for bank in banks:
        bank["current_rate"] = round(bank["current_rate"] + (random.random() - 0.5) * 0.1, 2)
        bank["inflation_rate"] = round(bank["inflation_rate"] + (random.random() - 0.5) * 0.2, 2)
        bank["real_rate"] = round(bank["current_rate"] - bank["inflation_rate"], 2)

    return banks


def generate_upcoming_meetings(banks: list) -> list:
    """Generate upcoming meetings list sorted by date."""
    from datetime import datetime

    today = datetime.now()
    meetings = []

    for bank in banks:
        meeting_date = datetime.strptime(bank["next_meeting_date"], "%Y-%m-%d")
        days_until = (meeting_date - today).days

        if days_until > 0:
            expected_action = "hold"
            probability = 85

            if bank["status"] == "cutting":
                expected_action = "cut"
                probability = 70
            elif bank["status"] == "hiking":
                expected_action = "hike"
                probability = 60
            elif bank["real_rate"] < 0:
                expected_action = "hike"
                probability = 55
            elif bank["real_rate"] > 2:
                expected_action = "uncertain"
                probability = 45

            meetings.append({
                "country": bank["country"],
                "flag": bank["flag"],
                "bank": bank["bank"],
                "date": bank["next_meeting_date"],
                "days_until": days_until,
                "expected_action": expected_action,
                "market_probability": probability,
            })

    return sorted(meetings, key=lambda x: x["days_until"])


@app.get("/api/policy/global", response_model=GlobalPolicyDataResponse)
async def get_global_policy_data():
    """
    Get global central bank policy data including rates, status, and upcoming meetings.
    Returns mock data for development.
    """
    central_banks = generate_mock_central_banks()
    upcoming_meetings = generate_upcoming_meetings(central_banks)

    return GlobalPolicyDataResponse(
        central_banks=[CentralBankData(**b) for b in central_banks],
        upcoming_meetings=[UpcomingMeetingData(**m) for m in upcoming_meetings],
    )


@app.get("/api/analyze/policy/cached")
async def get_cached_policy_analysis(language: str = "en"):
    """Get cached policy analysis if available."""
    cache_key = get_cache_key("policy", language)
    cached = get_cached_analysis(cache_key)
    if cached:
        return {"cached": True, "result": cached}
    return {"cached": False, "result": None}


@app.post("/api/analyze/policy", response_model=PolicyAnalysisResponse)
async def analyze_policy(request: PolicyAnalysisRequest):
    """
    On-Demand AI Analysis for Central Bank Policy.
    Triggers the four investment legends debate.
    Uses daily cache to avoid redundant AI calls.
    """
    # Check cache first
    cache_key = get_cache_key("policy", request.language)
    cached = get_cached_analysis(cache_key)
    if cached:
        return PolicyAnalysisResponse(**cached)

    try:
        result = run_policy_analysis(
            us_rate=request.us_rate,
            us_real_rate=request.us_real_rate,
            us_status=request.us_status,
            hiking_count=request.hiking_count,
            cutting_count=request.cutting_count,
            next_meeting_country=request.next_meeting_country,
            next_meeting_days=request.next_meeting_days,
            language=request.language,
        )

        response_data = {
            "kostolany_response": result["kostolany_response"],
            "buffett_response": result["buffett_response"],
            "munger_response": result["munger_response"],
            "dalio_response": result["dalio_response"],
            "synthesis": result["synthesis"],
        }

        # Save to cache
        save_cached_analysis(cache_key, response_data)

        return PolicyAnalysisResponse(**response_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# COUNTRY SCANNER ENDPOINTS
# ============================================

class CountryFXData(BaseModel):
    pair: str
    rate: float
    change24h: float
    change1w: float
    change1m: float
    high52w: float
    low52w: float
    percentOfRange: float


class CountryBondData(BaseModel):
    yield10y: float
    yield2y: float
    spread: float
    isInverted: bool
    vsUSSpread: float


class CountryStockData(BaseModel):
    indexName: str
    price: float
    change1d: float
    change1m: float
    change3m: float
    changeYTD: float
    per: float
    pbr: float


class CountryPolicyData(BaseModel):
    centralBank: str
    policyRate: float
    realRate: float
    inflationRate: float
    status: str
    nextMeetingDate: str
    nextMeetingDays: int


class EconomicMetrics(BaseModel):
    currencyPower: float
    marketSentiment: float
    creditRisk: float
    liquidity: float
    inflation: float
    growth: float


class CountryProfile(BaseModel):
    code: str
    name: str
    flag: str
    region: str
    currency: str
    currencyCode: str


class CountryDataResponse(BaseModel):
    profile: CountryProfile
    metrics: EconomicMetrics
    fx: CountryFXData
    bond: CountryBondData
    stock: CountryStockData
    policy: CountryPolicyData
    overallGrade: str
    overallScore: int


class CountryAnalysisRequest(BaseModel):
    country_code: str
    country_name: str
    overall_grade: str
    overall_score: int
    fx_change1m: float
    bond_yield10y: float
    bond_spread: float
    stock_change3m: float
    stock_per: float
    policy_rate: float
    real_rate: float
    inflation_rate: float
    language: str = "en"  # "en", "ko", "zh", "ja"


class CountryAnalysisResponse(BaseModel):
    kostolany_response: str
    buffett_response: str
    munger_response: str
    dalio_response: str
    synthesis: str


# Country data configurations
COUNTRY_CONFIGS = {
    "US": {
        "name": "United States",
        "flag": "🇺🇸",
        "region": "Americas",
        "currency": "US Dollar",
        "currencyCode": "USD",
        "fxPair": "DXY",
        "indexName": "S&P 500",
        "centralBank": "Federal Reserve (Fed)",
    },
    "CN": {
        "name": "China",
        "flag": "🇨🇳",
        "region": "Asia",
        "currency": "Chinese Yuan",
        "currencyCode": "CNY",
        "fxPair": "USD/CNY",
        "indexName": "CSI 300",
        "centralBank": "PBOC",
    },
    "JP": {
        "name": "Japan",
        "flag": "🇯🇵",
        "region": "Asia",
        "currency": "Japanese Yen",
        "currencyCode": "JPY",
        "fxPair": "USD/JPY",
        "indexName": "Nikkei 225",
        "centralBank": "Bank of Japan (BOJ)",
    },
    "DE": {
        "name": "Germany",
        "flag": "🇩🇪",
        "region": "Europe",
        "currency": "Euro",
        "currencyCode": "EUR",
        "fxPair": "EUR/USD",
        "indexName": "DAX",
        "centralBank": "ECB",
    },
    "GB": {
        "name": "United Kingdom",
        "flag": "🇬🇧",
        "region": "Europe",
        "currency": "British Pound",
        "currencyCode": "GBP",
        "fxPair": "GBP/USD",
        "indexName": "FTSE 100",
        "centralBank": "Bank of England (BOE)",
    },
    "KR": {
        "name": "South Korea",
        "flag": "🇰🇷",
        "region": "Asia",
        "currency": "Korean Won",
        "currencyCode": "KRW",
        "fxPair": "USD/KRW",
        "indexName": "KOSPI",
        "centralBank": "Bank of Korea (BOK)",
    },
    "IN": {
        "name": "India",
        "flag": "🇮🇳",
        "region": "Asia",
        "currency": "Indian Rupee",
        "currencyCode": "INR",
        "fxPair": "USD/INR",
        "indexName": "NIFTY 50",
        "centralBank": "Reserve Bank of India (RBI)",
    },
    "BR": {
        "name": "Brazil",
        "flag": "🇧🇷",
        "region": "Americas",
        "currency": "Brazilian Real",
        "currencyCode": "BRL",
        "fxPair": "USD/BRL",
        "indexName": "Bovespa",
        "centralBank": "Central Bank of Brazil (BCB)",
    },
    "AU": {
        "name": "Australia",
        "flag": "🇦🇺",
        "region": "Oceania",
        "currency": "Australian Dollar",
        "currencyCode": "AUD",
        "fxPair": "AUD/USD",
        "indexName": "ASX 200",
        "centralBank": "Reserve Bank of Australia (RBA)",
    },
    "CA": {
        "name": "Canada",
        "flag": "🇨🇦",
        "region": "Americas",
        "currency": "Canadian Dollar",
        "currencyCode": "CAD",
        "fxPair": "USD/CAD",
        "indexName": "TSX",
        "centralBank": "Bank of Canada (BOC)",
    },
    "CH": {
        "name": "Switzerland",
        "flag": "🇨🇭",
        "region": "Europe",
        "currency": "Swiss Franc",
        "currencyCode": "CHF",
        "fxPair": "USD/CHF",
        "indexName": "SMI",
        "centralBank": "Swiss National Bank (SNB)",
    },
    "MX": {
        "name": "Mexico",
        "flag": "🇲🇽",
        "region": "Americas",
        "currency": "Mexican Peso",
        "currencyCode": "MXN",
        "fxPair": "USD/MXN",
        "indexName": "IPC Mexico",
        "centralBank": "Bank of Mexico (Banxico)",
    },
}


def generate_country_data(country_code: str) -> dict:
    """Generate comprehensive country economic data."""
    import random
    from datetime import datetime, timedelta

    config = COUNTRY_CONFIGS.get(country_code.upper())
    if not config:
        return None

    # Generate FX data
    base_rates = {
        "US": 104.5, "CN": 7.24, "JP": 154.5, "DE": 1.085, "GB": 1.27,
        "KR": 1380, "IN": 83.2, "BR": 4.95, "AU": 0.66, "CA": 1.36,
        "CH": 0.88, "MX": 17.2
    }
    base_rate = base_rates.get(country_code, 1.0)
    rate = round(base_rate * (1 + (random.random() - 0.5) * 0.05), 2)

    change24h = round((random.random() - 0.5) * 2, 2)
    change1w = round((random.random() - 0.5) * 4, 2)
    change1m = round((random.random() - 0.5) * 6, 2)

    high52w = round(rate * 1.15, 2)
    low52w = round(rate * 0.85, 2)
    percent_of_range = round(((rate - low52w) / (high52w - low52w)) * 100, 1)

    # Generate Bond data
    base_yields = {
        "US": 4.55, "CN": 2.25, "JP": 0.95, "DE": 2.35, "GB": 4.15,
        "KR": 3.45, "IN": 7.1, "BR": 11.5, "AU": 4.25, "CA": 3.8,
        "CH": 0.95, "MX": 9.2
    }
    yield10y = round(base_yields.get(country_code, 3.0) + (random.random() - 0.5) * 0.3, 2)
    yield2y = round(yield10y + (random.random() - 0.6) * 0.5, 2)
    spread = round(yield10y - yield2y, 2)
    is_inverted = spread < 0
    vs_us_spread = round(yield10y - 4.55, 2) if country_code != "US" else 0

    # Generate Stock data
    base_prices = {
        "US": 5850, "CN": 3800, "JP": 38500, "DE": 19200, "GB": 8150,
        "KR": 2650, "IN": 22500, "BR": 128000, "AU": 7800, "CA": 21500,
        "CH": 11800, "MX": 55000
    }
    price = round(base_prices.get(country_code, 1000) * (1 + (random.random() - 0.5) * 0.1))
    change1d = round((random.random() - 0.5) * 3, 2)
    change1m_stock = round((random.random() - 0.5) * 8, 2)
    change3m = round((random.random() - 0.5) * 15, 2)
    change_ytd = round((random.random() - 0.5) * 25, 2)
    per = round(15 + random.random() * 15, 1)
    pbr = round(1.0 + random.random() * 3, 2)

    # Generate Policy data
    base_policy_rates = {
        "US": 5.50, "CN": 3.45, "JP": 0.10, "DE": 4.50, "GB": 5.25,
        "KR": 3.50, "IN": 6.50, "BR": 11.25, "AU": 4.35, "CA": 5.00,
        "CH": 1.75, "MX": 11.25
    }
    base_inflation = {
        "US": 3.4, "CN": 0.7, "JP": 2.6, "DE": 2.8, "GB": 4.0,
        "KR": 2.8, "IN": 5.1, "BR": 4.5, "AU": 4.1, "CA": 2.9,
        "CH": 1.3, "MX": 4.9
    }
    policy_rate = round(base_policy_rates.get(country_code, 3.0) + (random.random() - 0.5) * 0.2, 2)
    inflation_rate = round(base_inflation.get(country_code, 3.0) + (random.random() - 0.5) * 0.3, 1)
    real_rate = round(policy_rate - inflation_rate, 2)

    statuses = ["hiking", "paused", "cutting", "low"]
    status_weights = {"US": [0, 70, 25, 5], "JP": [60, 30, 5, 5], "CN": [5, 20, 70, 5]}
    weights = status_weights.get(country_code, [10, 50, 30, 10])
    status = random.choices(statuses, weights=weights)[0]

    next_meeting = datetime.now() + timedelta(days=random.randint(7, 45))
    next_meeting_date = next_meeting.strftime("%Y-%m-%d")
    next_meeting_days = (next_meeting - datetime.now()).days

    # Calculate economic metrics (0-100 scale)
    currency_power = max(0, min(100, 50 - change1m * 5 + random.random() * 20))
    market_sentiment = max(0, min(100, 50 + change3m * 2 + random.random() * 20))
    credit_risk = max(0, min(100, 80 - abs(spread) * 20 - (10 if is_inverted else 0)))
    liquidity = max(0, min(100, 50 + (real_rate * 10) + random.random() * 20))
    inflation_score = max(0, min(100, 100 - abs(inflation_rate - 2) * 15))
    growth_score = max(0, min(100, 50 + change_ytd * 1.5 + random.random() * 20))

    # Calculate overall score and grade
    overall_score = int(round((
        currency_power * 0.15 +
        market_sentiment * 0.20 +
        credit_risk * 0.20 +
        liquidity * 0.15 +
        inflation_score * 0.15 +
        growth_score * 0.15
    )))

    if overall_score >= 85:
        grade = "A+"
    elif overall_score >= 80:
        grade = "A"
    elif overall_score >= 75:
        grade = "A-"
    elif overall_score >= 70:
        grade = "B+"
    elif overall_score >= 65:
        grade = "B"
    elif overall_score >= 60:
        grade = "B-"
    elif overall_score >= 55:
        grade = "C+"
    elif overall_score >= 50:
        grade = "C"
    elif overall_score >= 45:
        grade = "C-"
    elif overall_score >= 40:
        grade = "D+"
    elif overall_score >= 35:
        grade = "D"
    else:
        grade = "F"

    return {
        "profile": {
            "code": country_code,
            "name": config["name"],
            "flag": config["flag"],
            "region": config["region"],
            "currency": config["currency"],
            "currencyCode": config["currencyCode"],
        },
        "metrics": {
            "currencyPower": round(currency_power, 1),
            "marketSentiment": round(market_sentiment, 1),
            "creditRisk": round(credit_risk, 1),
            "liquidity": round(liquidity, 1),
            "inflation": round(inflation_score, 1),
            "growth": round(growth_score, 1),
        },
        "fx": {
            "pair": config["fxPair"],
            "rate": rate,
            "change24h": change24h,
            "change1w": change1w,
            "change1m": change1m,
            "high52w": high52w,
            "low52w": low52w,
            "percentOfRange": percent_of_range,
        },
        "bond": {
            "yield10y": yield10y,
            "yield2y": yield2y,
            "spread": spread,
            "isInverted": is_inverted,
            "vsUSSpread": vs_us_spread,
        },
        "stock": {
            "indexName": config["indexName"],
            "price": price,
            "change1d": change1d,
            "change1m": change1m_stock,
            "change3m": change3m,
            "changeYTD": change_ytd,
            "per": per,
            "pbr": pbr,
        },
        "policy": {
            "centralBank": config["centralBank"],
            "policyRate": policy_rate,
            "realRate": real_rate,
            "inflationRate": inflation_rate,
            "status": status,
            "nextMeetingDate": next_meeting_date,
            "nextMeetingDays": next_meeting_days,
        },
        "overallGrade": grade,
        "overallScore": overall_score,
    }


@app.get("/api/country/{country_code}", response_model=CountryDataResponse)
async def get_country_data(country_code: str):
    """
    Get comprehensive economic data for a specific country.
    Returns aggregated FX, Bond, Stock, and Policy data with overall health score.
    """
    data = generate_country_data(country_code.upper())

    if not data:
        raise HTTPException(status_code=404, detail=f"Country code '{country_code}' not found")

    return CountryDataResponse(
        profile=CountryProfile(**data["profile"]),
        metrics=EconomicMetrics(**data["metrics"]),
        fx=CountryFXData(**data["fx"]),
        bond=CountryBondData(**data["bond"]),
        stock=CountryStockData(**data["stock"]),
        policy=CountryPolicyData(**data["policy"]),
        overallGrade=data["overallGrade"],
        overallScore=data["overallScore"],
    )


@app.get("/api/analyze/country/cached")
async def get_cached_country_analysis(country_code: str, language: str = "en"):
    """Get cached country analysis if available."""
    cache_key = get_cache_key("country", language, country_code.upper())
    cached = get_cached_analysis(cache_key)
    if cached:
        return {"cached": True, "result": cached}
    return {"cached": False, "result": None}


@app.post("/api/analyze/country", response_model=CountryAnalysisResponse)
async def analyze_country(request: CountryAnalysisRequest):
    """
    On-Demand AI Analysis for Country Economic Health.
    Triggers the four investment legends debate.
    Uses daily cache to avoid redundant AI calls.
    """
    # Check cache first (country-specific cache)
    cache_key = get_cache_key("country", request.language, request.country_code.upper())
    cached = get_cached_analysis(cache_key)
    if cached:
        return CountryAnalysisResponse(**cached)

    try:
        from agents import run_country_analysis

        result = run_country_analysis(
            country_code=request.country_code,
            country_name=request.country_name,
            overall_grade=request.overall_grade,
            overall_score=request.overall_score,
            fx_change1m=request.fx_change1m,
            bond_yield10y=request.bond_yield10y,
            bond_spread=request.bond_spread,
            stock_change3m=request.stock_change3m,
            stock_per=request.stock_per,
            policy_rate=request.policy_rate,
            real_rate=request.real_rate,
            inflation_rate=request.inflation_rate,
            language=request.language,
        )

        response_data = {
            "kostolany_response": result["kostolany_response"],
            "buffett_response": result["buffett_response"],
            "munger_response": result["munger_response"],
            "dalio_response": result["dalio_response"],
            "synthesis": result["synthesis"],
        }

        # Save to cache
        save_cached_analysis(cache_key, response_data)

        return CountryAnalysisResponse(**response_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# REAL ECONOMY ENDPOINTS
# ============================================

class CommodityData(BaseModel):
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


class CommoditySignals(BaseModel):
    oil: CommodityData
    gold: CommodityData
    copper: CommodityData
    overall_signal: str
    interpretation: str


class PMIData(BaseModel):
    country: str
    country_code: str
    flag: str
    value: float
    previous_value: float
    consensus: float
    change: float
    surprise: float
    is_expansion: bool
    trend: str


class CPIData(BaseModel):
    country: str
    country_code: str
    flag: str
    value: float
    previous_value: float
    target_rate: float
    change: float
    surprise: float
    is_above_target: bool


class EconomicEvent(BaseModel):
    id: str
    name: str
    country: str
    country_code: str
    flag: str
    date: str
    time: str
    impact: str
    actual: Optional[float] = None
    forecast: Optional[float] = None
    previous: Optional[float] = None
    unit: str
    category: str


class EconomyDataResponse(BaseModel):
    commodities: CommoditySignals
    pmi_data: List[PMIData]
    cpi_data: List[CPIData]
    upcoming_events: List[EconomicEvent]


class EconomyAnalysisRequest(BaseModel):
    oil_price: float
    oil_change: float
    gold_price: float
    gold_change: float
    copper_price: float
    copper_change: float
    commodity_signal: str
    us_pmi: float
    us_cpi: float
    language: str = "en"  # "en", "ko", "zh", "ja"


class EconomyAnalysisResponse(BaseModel):
    kostolany_response: str
    buffett_response: str
    munger_response: str
    dalio_response: str
    synthesis: str


def generate_mock_commodities() -> dict:
    """Generate mock commodity data for development."""
    import random

    def random_change(base: float, range_val: float) -> float:
        return round(base + (random.random() - 0.5) * range_val, 2)

    # Oil (WTI)
    oil_price = random_change(75, 10)
    oil_change_1m = random_change(-2, 10)
    oil_signal = "bullish" if oil_change_1m > 5 else "bearish" if oil_change_1m < -5 else "neutral"

    # Gold
    gold_price = random_change(2350, 100)
    gold_change_1m = random_change(2, 8)
    gold_signal = "bullish" if gold_change_1m > 3 else "bearish" if gold_change_1m < -3 else "neutral"

    # Copper
    copper_price = random_change(4.2, 0.5)
    copper_change_1m = random_change(0, 12)
    copper_signal = "bullish" if copper_change_1m > 5 else "bearish" if copper_change_1m < -5 else "neutral"

    # Determine overall signal
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

    return {
        "oil": {
            "symbol": "CL=F",
            "name": "WTI Crude Oil",
            "short_name": "WTI",
            "price": oil_price,
            "change_24h": random_change(0, 4),
            "change_1w": random_change(-1, 6),
            "change_1m": oil_change_1m,
            "high_52w": 95,
            "low_52w": 65,
            "percent_of_range": round(((oil_price - 65) / (95 - 65)) * 100),
            "unit": "$/barrel",
            "signal": oil_signal,
            "interpretation": "Oil up = inflation pressure" if oil_signal == "bullish" else "Oil down = inflation easing" if oil_signal == "bearish" else "Oil stable",
        },
        "gold": {
            "symbol": "GC=F",
            "name": "Gold Futures",
            "short_name": "Gold",
            "price": gold_price,
            "change_24h": random_change(0, 2),
            "change_1w": random_change(0.5, 4),
            "change_1m": gold_change_1m,
            "high_52w": 2500,
            "low_52w": 1900,
            "percent_of_range": round(((gold_price - 1900) / (2500 - 1900)) * 100),
            "unit": "$/oz",
            "signal": gold_signal,
            "interpretation": "Gold up = fear/inflation hedge" if gold_signal == "bullish" else "Gold down = risk-on" if gold_signal == "bearish" else "Gold stable",
        },
        "copper": {
            "symbol": "HG=F",
            "name": "Copper Futures",
            "short_name": "Copper",
            "price": copper_price,
            "change_24h": random_change(0, 3),
            "change_1w": random_change(0, 5),
            "change_1m": copper_change_1m,
            "high_52w": 5.0,
            "low_52w": 3.5,
            "percent_of_range": round(((copper_price - 3.5) / (5.0 - 3.5)) * 100),
            "unit": "$/lb",
            "signal": copper_signal,
            "interpretation": "Dr. Copper up = manufacturing growth" if copper_signal == "bullish" else "Dr. Copper down = slowdown warning" if copper_signal == "bearish" else "Copper stable",
        },
        "overall_signal": overall_signal,
        "interpretation": interpretation,
    }


def generate_mock_pmi() -> list:
    """Generate mock PMI data for development."""
    import random

    countries = [
        {"code": "US", "name": "United States", "flag": "🇺🇸", "base": 52.5},
        {"code": "CN", "name": "China", "flag": "🇨🇳", "base": 49.5},
        {"code": "DE", "name": "Germany", "flag": "🇩🇪", "base": 47.8},
        {"code": "JP", "name": "Japan", "flag": "🇯🇵", "base": 50.2},
        {"code": "KR", "name": "South Korea", "flag": "🇰🇷", "base": 51.0},
        {"code": "GB", "name": "United Kingdom", "flag": "🇬🇧", "base": 48.5},
    ]

    pmi_data = []
    for country in countries:
        value = round(country["base"] + (random.random() - 0.5) * 4, 1)
        previous = round(country["base"] + (random.random() - 0.5) * 3, 1)
        consensus = round(country["base"] + (random.random() - 0.5) * 2, 1)

        pmi_data.append({
            "country": country["name"],
            "country_code": country["code"],
            "flag": country["flag"],
            "value": value,
            "previous_value": previous,
            "consensus": consensus,
            "change": round(value - previous, 1),
            "surprise": round(value - consensus, 1),
            "is_expansion": value > 50,
            "trend": "improving" if value > previous else "worsening" if value < previous else "stable",
        })

    return pmi_data


def generate_mock_cpi() -> list:
    """Generate mock CPI data for development."""
    import random

    countries = [
        {"code": "US", "name": "United States", "flag": "🇺🇸", "base": 3.4, "target": 2.0},
        {"code": "EU", "name": "Eurozone", "flag": "🇪🇺", "base": 2.8, "target": 2.0},
        {"code": "JP", "name": "Japan", "flag": "🇯🇵", "base": 2.6, "target": 2.0},
        {"code": "GB", "name": "United Kingdom", "flag": "🇬🇧", "base": 4.0, "target": 2.0},
        {"code": "KR", "name": "South Korea", "flag": "🇰🇷", "base": 2.8, "target": 2.0},
        {"code": "CN", "name": "China", "flag": "🇨🇳", "base": 0.7, "target": 3.0},
    ]

    cpi_data = []
    for country in countries:
        value = round(country["base"] + (random.random() - 0.5) * 0.6, 1)
        previous = round(country["base"] + (random.random() - 0.5) * 0.4, 1)

        cpi_data.append({
            "country": country["name"],
            "country_code": country["code"],
            "flag": country["flag"],
            "value": value,
            "previous_value": previous,
            "target_rate": country["target"],
            "change": round(value - previous, 1),
            "surprise": round((random.random() - 0.5) * 0.4, 1),
            "is_above_target": value > country["target"],
        })

    return cpi_data


def generate_mock_events() -> list:
    """Generate mock economic calendar events for development."""
    from datetime import datetime, timedelta

    events = [
        {"name": "US CPI (YoY)", "country": "United States", "code": "US", "flag": "🇺🇸", "impact": "high", "forecast": 3.2, "previous": 3.4, "unit": "%", "category": "inflation"},
        {"name": "Fed Interest Rate Decision", "country": "United States", "code": "US", "flag": "🇺🇸", "impact": "high", "forecast": 5.5, "previous": 5.5, "unit": "%", "category": "policy"},
        {"name": "US Non-Farm Payrolls", "country": "United States", "code": "US", "flag": "🇺🇸", "impact": "high", "forecast": 180, "previous": 275, "unit": "K", "category": "employment"},
        {"name": "China Manufacturing PMI", "country": "China", "code": "CN", "flag": "🇨🇳", "impact": "high", "forecast": 50.2, "previous": 49.5, "unit": "index", "category": "manufacturing"},
        {"name": "ECB Interest Rate Decision", "country": "Eurozone", "code": "EU", "flag": "🇪🇺", "impact": "high", "forecast": 4.5, "previous": 4.5, "unit": "%", "category": "policy"},
        {"name": "Japan GDP (QoQ)", "country": "Japan", "code": "JP", "flag": "🇯🇵", "impact": "medium", "forecast": 0.3, "previous": -0.1, "unit": "%", "category": "growth"},
    ]

    result = []
    for i, event in enumerate(events):
        event_date = datetime.now() + timedelta(days=(i + 1) * 2)
        result.append({
            "id": f"event-{i}",
            "name": event["name"],
            "country": event["country"],
            "country_code": event["code"],
            "flag": event["flag"],
            "date": event_date.strftime("%Y-%m-%d"),
            "time": f"{8 + i}:30",
            "impact": event["impact"],
            "forecast": event["forecast"],
            "previous": event["previous"],
            "unit": event["unit"],
            "category": event["category"],
        })

    return result


@app.get("/api/economy/data")
async def get_economy_data():
    """
    Get real economy data including commodities, PMI, CPI, and economic calendar.
    Uses Yahoo Finance for real-time commodity data, with mock data for PMI/CPI/events.
    """
    market_service = get_market_service()

    # Real commodity data from Yahoo Finance
    commodities = market_service.get_commodities()

    # PMI, CPI, and events still use mock (would need specific data subscriptions)
    pmi_data = generate_mock_pmi()
    cpi_data = generate_mock_cpi()
    events = generate_mock_events()

    return {
        "commodities": commodities,
        "pmi_data": pmi_data,
        "cpi_data": cpi_data,
        "upcoming_events": events,
    }


@app.get("/api/analyze/economy/cached")
async def get_cached_economy_analysis(language: str = "en"):
    """Get cached economy analysis if available."""
    cache_key = get_cache_key("economy", language)
    cached = get_cached_analysis(cache_key)
    if cached:
        return {"cached": True, "result": cached}
    return {"cached": False, "result": None}


@app.post("/api/analyze/economy", response_model=EconomyAnalysisResponse)
async def analyze_economy(request: EconomyAnalysisRequest):
    """
    On-Demand AI Analysis for Real Economy.
    Triggers the four investment legends debate.
    Uses daily cache to avoid redundant AI calls.
    """
    # Check cache first
    cache_key = get_cache_key("economy", request.language)
    cached = get_cached_analysis(cache_key)
    if cached:
        return EconomyAnalysisResponse(**cached)

    try:
        result = run_economy_analysis(
            oil_price=request.oil_price,
            oil_change=request.oil_change,
            gold_price=request.gold_price,
            gold_change=request.gold_change,
            copper_price=request.copper_price,
            copper_change=request.copper_change,
            commodity_signal=request.commodity_signal,
            us_pmi=request.us_pmi,
            us_cpi=request.us_cpi,
            language=request.language,
        )

        response_data = {
            "kostolany_response": result["kostolany_response"],
            "buffett_response": result["buffett_response"],
            "munger_response": result["munger_response"],
            "dalio_response": result["dalio_response"],
            "synthesis": result["synthesis"],
        }

        # Save to cache
        save_cached_analysis(cache_key, response_data)

        return EconomyAnalysisResponse(**response_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# MACRO INTELLIGENCE ENGINE ENDPOINTS
# ============================================

# Import macro fetcher (same directory as main.py)
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from macro_fetcher import get_macro_fetcher


class MacroHealthCheckResponse(BaseModel):
    timestamp: str
    data_freshness: str
    valuation: dict
    cycles: dict
    liquidity: dict
    risk: dict
    inflation: dict
    ai_context: str


@app.get("/api/macro/health-check")
async def get_macro_health_check():
    """
    Get comprehensive macro health check data.
    Returns valuation metrics (Buffett Indicator), cycle indicators,
    liquidity conditions, and inflation data.

    Data is sourced from FRED API with fallback to cached/mock data.
    Includes AI-friendly context string for agent prompts.
    """
    try:
        fetcher = get_macro_fetcher()
        data = fetcher.get_health_check_data()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/macro/ai-context")
async def get_macro_ai_context():
    """
    Get AI-friendly context string for macro environment.
    This endpoint returns a formatted text summary suitable for
    injecting into AI agent prompts.
    """
    try:
        fetcher = get_macro_fetcher()
        context = fetcher.generate_ai_context()
        return {"context": context}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/macro/buffett-indicator")
async def get_buffett_indicator():
    """
    Get just the Buffett Indicator (Total Market Cap / GDP).
    A focused endpoint for valuation analysis.
    """
    try:
        fetcher = get_macro_fetcher()
        metrics = fetcher.fetch_all_metrics()
        return {
            "buffett_indicator": metrics.buffett_indicator,
            "signal": metrics.buffett_indicator_signal,
            "market_cap_billions": metrics.market_cap_billions,
            "gdp_billions": metrics.gdp_billions,
            "thresholds": {
                "significantly_undervalued": "<70%",
                "undervalued": "70-85%",
                "fair_value": "85-115%",
                "modestly_overvalued": "115-140%",
                "overvalued": "140-180%",
                "significantly_overvalued": ">180%"
            },
            "last_updated": metrics.last_updated,
            "data_freshness": metrics.data_freshness,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# HISTORICAL PATTERN MATCHING ENDPOINTS
# ============================================

from historical_engine import (
    find_parallel_past,
    generate_historical_context,
    get_crisis_scenarios,
    HISTORICAL_EVENTS,
)


class HistoricalParallelRequest(BaseModel):
    current_cape: float
    current_rate: float
    current_inflation: float
    current_unemployment: float = 4.0
    current_yield_spread: float = 0.0
    language: str = "en"


class HistoricalMatch(BaseModel):
    year: int
    period_name: str
    similarity: float
    cape: float
    interest_rate: float
    inflation: float
    forward_return_1y: float
    forward_return_3y: float
    forward_return_5y: float
    description: str


class HistoricalParallelResponse(BaseModel):
    matches: List[HistoricalMatch]
    historical_context: str
    current_conditions: dict


class CrisisScenario(BaseModel):
    name: str
    year: int
    severity: str
    description: str
    peak_drawdown: float
    recovery_months: int
    trigger: str
    warning_signs: List[str]


class CrisisScenariosResponse(BaseModel):
    scenarios: List[CrisisScenario]


class HistoricalAnalysisRequest(BaseModel):
    current_cape: float
    current_rate: float
    current_inflation: float
    current_unemployment: float = 4.0
    current_yield_spread: float = 0.0
    top_matches: Optional[List[dict]] = None
    language: str = "en"


class HistoricalAnalysisResponse(BaseModel):
    historian_response: str
    synthesis: str


@app.get("/api/history/parallel")
async def get_historical_parallels(
    cape: float = 30.0,
    rate: float = 4.5,
    inflation: float = 3.0,
    unemployment: float = 4.0,
    yield_spread: float = 0.0,
    top_n: int = 5,
    language: str = "en"
):
    """
    Find historical periods most similar to current market conditions.
    Uses vector similarity to compare CAPE, interest rates, inflation, and other metrics.
    """
    try:
        matches = find_parallel_past(
            current_cape=cape,
            current_rate=rate,
            current_inflation=inflation,
            current_unemployment=unemployment,
            current_yield_spread=yield_spread,
            top_n=top_n,
        )

        historical_context = generate_historical_context(matches, language)

        return {
            "matches": [
                {
                    "year": m.year,
                    "date": m.date,
                    "period_name": ", ".join(m.historical_state.event_labels) if m.historical_state.event_labels else f"{m.year} Period",
                    "similarity": round(m.similarity_score, 1),
                    "cape": m.historical_state.cape_ratio,
                    "interest_rate": m.historical_state.interest_rate,
                    "inflation": m.historical_state.inflation_rate,
                    "forward_return_1y": m.forward_return_12m,
                    "forward_return_3y": m.forward_return_24m,  # Using 24m as proxy for 3y
                    "forward_return_5y": None,  # Not available in current data
                    "description": ", ".join(m.subsequent_events) if m.subsequent_events else "",
                }
                for m in matches
            ],
            "historical_context": historical_context,
            "current_conditions": {
                "cape": cape,
                "interest_rate": rate,
                "inflation": inflation,
                "unemployment": unemployment,
                "yield_spread": yield_spread,
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/history/crises")
async def get_crisis_list(language: str = "en"):
    """
    Get list of major financial crises with their characteristics.
    Useful for crisis simulation and historical education.
    """
    try:
        scenarios = get_crisis_scenarios(language)
        return {"scenarios": scenarios}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/history/events")
async def get_historical_events():
    """
    Get dictionary of all major historical financial events.
    """
    return {"events": HISTORICAL_EVENTS}


@app.get("/api/analyze/history/cached")
async def get_cached_history_analysis(language: str = "en"):
    """Get cached historical analysis if available."""
    cache_key = get_cache_key("history", language)
    cached = get_cached_analysis(cache_key)
    if cached:
        return {"cached": True, "result": cached}
    return {"cached": False, "result": None}


@app.post("/api/analyze/history")
async def analyze_historical_parallels(request: HistoricalAnalysisRequest):
    """
    On-Demand AI Analysis for Historical Parallels.
    Triggers The Historian persona to provide evolutionary psychology
    insights on current market conditions vs. historical parallels.
    Uses daily cache to avoid redundant AI calls.
    """
    # Check cache first
    cache_key = get_cache_key("history", request.language)
    cached = get_cached_analysis(cache_key)
    if cached:
        return cached

    try:
        # Find historical parallels
        matches = find_parallel_past(
            current_cape=request.current_cape,
            current_rate=request.current_rate,
            current_inflation=request.current_inflation,
            current_unemployment=request.current_unemployment,
            current_yield_spread=request.current_yield_spread,
            top_n=5,
        )

        historical_context = generate_historical_context(matches, request.language)

        # Import historian analysis function
        from agents import run_historical_analysis

        result = run_historical_analysis(
            current_cape=request.current_cape,
            current_rate=request.current_rate,
            current_inflation=request.current_inflation,
            historical_context=historical_context,
            top_matches=[
                {
                    "year": m.year,
                    "period_name": ", ".join(m.historical_state.event_labels) if m.historical_state.event_labels else f"{m.year} Period",
                    "similarity": m.similarity_score / 100.0,  # Convert to 0-1 scale
                    "forward_return_1y": m.forward_return_12m or 0,
                    "forward_return_5y": m.forward_return_24m or 0,  # Using 24m as proxy
                }
                for m in matches
            ],
            language=request.language,
        )

        response_data = {
            "historian_response": result["historian_response"],
            "synthesis": result["synthesis"],
            "matches": [
                {
                    "year": m.year,
                    "date": m.date,
                    "period_name": ", ".join(m.historical_state.event_labels) if m.historical_state.event_labels else f"{m.year} Period",
                    "similarity": round(m.similarity_score, 1),
                    "cape": m.historical_state.cape_ratio,
                    "interest_rate": m.historical_state.interest_rate,
                    "inflation": m.historical_state.inflation_rate,
                    "forward_return_1y": m.forward_return_12m,
                    "forward_return_3y": m.forward_return_24m,
                    "forward_return_5y": None,
                    "description": ", ".join(m.subsequent_events) if m.subsequent_events else "",
                }
                for m in matches
            ],
            "historical_context": historical_context,
        }

        # Save to cache
        save_cached_analysis(cache_key, response_data)

        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# INSTITUTIONAL INTELLIGENCE ENDPOINTS (Phase 9)
# ============================================

from api.imf_fetcher import get_imf_fetcher


class IMFOutlookResponse(BaseModel):
    country_code: str
    country_name: str
    weo_edition: Optional[str]
    gdp_growth: Optional[List[dict]]
    inflation: Optional[List[dict]]
    government_debt: Optional[List[dict]]
    current_account: Optional[List[dict]]
    sentiment: str
    key_risks: List[str]


class InstitutionalReportCard(BaseModel):
    institution: str
    last_report_date: str
    key_keywords: List[str]
    sentiment: str
    sentiment_icon: str


class GlobalReportCardResponse(BaseModel):
    country_code: str
    country_name: str
    report_cards: List[InstitutionalReportCard]
    consensus_view: str


@app.get("/api/institutional/imf/{country_code}")
async def get_imf_outlook(country_code: str):
    """Get IMF World Economic Outlook data for a country."""
    try:
        fetcher = get_imf_fetcher()
        outlook = fetcher.fetch_country_outlook(country_code)
        sentiment = fetcher.get_sentiment(country_code)
        risks = fetcher.get_key_risks(country_code)

        def fmt(ind):
            return [{"year": f.year, "value": f.value, "is_forecast": f.is_estimate} for f in ind.forecasts] if ind else None

        return {
            "country_code": outlook.country_code,
            "country_name": outlook.country_name,
            "weo_edition": outlook.weo_edition,
            "gdp_growth": fmt(outlook.gdp_growth),
            "inflation": fmt(outlook.inflation),
            "government_debt": fmt(outlook.government_debt),
            "current_account": fmt(outlook.current_account),
            "sentiment": sentiment,
            "key_risks": risks,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/institutional/report-card/{country_code}")
async def get_global_report_card(country_code: str):
    """Get the 'Global Report Card' aggregating IMF, OECD, rating agencies."""
    try:
        fetcher = get_imf_fetcher()
        outlook = fetcher.fetch_country_outlook(country_code)
        sentiment = fetcher.get_sentiment(country_code)
        risks = fetcher.get_key_risks(country_code)
        cy = datetime.now().year

        imf_keywords = []
        if outlook.gdp_growth and outlook.gdp_growth.forecasts:
            g = outlook.gdp_growth.forecasts[-1].value
            imf_keywords.append("#SlowGrowth" if g < 1.5 else "#StrongGrowth" if g > 3 else "#ModerateGrowth")
        imf_keywords.extend([f"#{r.split()[0]}" for r in risks[:2]])

        cards = [
            {"institution": "IMF", "last_report_date": f"{cy}.10", "key_keywords": imf_keywords[:3] or ["#Stable"], "sentiment": sentiment, "sentiment_icon": "🐻" if sentiment == "bearish" else "🐂" if sentiment == "bullish" else "➖"},
            {"institution": "OECD", "last_report_date": f"{cy}.11", "key_keywords": ["#Recovery", "#Reform"], "sentiment": "neutral", "sentiment_icon": "➖"},
            {"institution": "Moody's", "last_report_date": f"{cy}.12", "key_keywords": ["#CreditStable"], "sentiment": "neutral", "sentiment_icon": "➖"},
        ]

        sents = [c["sentiment"] for c in cards]
        consensus = "bullish" if sents.count("bullish") > sents.count("bearish") else "bearish" if sents.count("bearish") > sents.count("bullish") else "mixed"

        return {"country_code": outlook.country_code, "country_name": outlook.country_name, "report_cards": cards, "consensus_view": consensus}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/institutional/ai-context/{country_code}")
async def get_institutional_ai_context(country_code: str):
    """Get AI context for institutional views, injected into persona prompts."""
    try:
        return {"context": get_imf_fetcher().get_ai_context(country_code)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class InstitutionalAnalysisRequest(BaseModel):
    country_code: str
    country_name: str
    imf_sentiment: str = "neutral"
    key_risks: List[str] = []
    language: str = "en"


@app.post("/api/analyze/institutional")
async def analyze_institutional_view(request: InstitutionalAnalysisRequest):
    """AI Analysis: Soros (contrarian) and Dalio (structural) views on IMF data."""
    cache_key = get_cache_key("institutional", request.language, request.country_code)
    cached = get_cached_analysis(cache_key)
    if cached:
        return cached

    try:
        imf_context = get_imf_fetcher().get_ai_context(request.country_code)
        from agents import run_institutional_analysis
        result = run_institutional_analysis(
            country_code=request.country_code,
            country_name=request.country_name,
            imf_context=imf_context,
            imf_sentiment=request.imf_sentiment,
            key_risks=request.key_risks,
            language=request.language,
        )
        response_data = {
            "country_code": request.country_code,
            "soros_response": result.get("soros_response", ""),
            "dalio_response": result.get("dalio_response", ""),
            "synthesis": result.get("synthesis", ""),
        }
        save_cached_analysis(cache_key, response_data)
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


# ============================================
# INSIGHT LIBRARY ENDPOINTS (Phase 8)
# ============================================

class InsightAnalysisRequest(BaseModel):
    article_id: str
    source: str
    title: str
    original_text: str
    language: str = "en"


class InsightAnalysisResponse(BaseModel):
    article_id: str
    translator_response: str
    synthesis: str


@app.get("/api/insights/sources")
async def get_insight_sources():
    """Get list of all available RSS sources."""
    return {"sources": get_all_sources()}


@app.get("/api/insights/list")
async def list_insights(use_mock: bool = False, max_per_source: int = 3):
    """Fetch latest articles from institutional sources."""
    try:
        articles = get_mock_insights() if use_mock else fetch_rss_feeds(max_per_source=max_per_source)
        return {"articles": [a.to_dict() for a in articles], "count": len(articles), "fetched_at": datetime.now().isoformat()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/insights/behavioral-bias")
async def get_behavioral_bias_warning(vix: Optional[float] = None, rsi: Optional[float] = None, market_change_1m: Optional[float] = None, language: str = "en"):
    """Get behavioral bias warning based on market conditions."""
    bias = get_behavioral_bias(vix=vix, rsi=rsi, market_change_1m=market_change_1m, language=language)
    return {"has_warning": True, "bias": bias} if bias else {"has_warning": False, "bias": None}


@app.get("/api/analyze/insights/cached")
async def get_cached_insight_analysis(article_id: str, language: str = "en"):
    """Get cached insight analysis if available."""
    cache_key = get_cache_key("insight", language, article_id)
    cached = get_cached_analysis(cache_key)
    return {"cached": True, "result": cached} if cached else {"cached": False, "result": None}


@app.post("/api/analyze/insights", response_model=InsightAnalysisResponse)
async def analyze_insight_article(request: InsightAnalysisRequest):
    """AI-powered translation of institutional reports to retail investor language."""
    cache_key = get_cache_key("insight", request.language, request.article_id)
    cached = get_cached_analysis(cache_key)
    if cached:
        return InsightAnalysisResponse(**cached)
    try:
        result = run_insight_analysis(article_id=request.article_id, source=request.source, title=request.title, original_text=request.original_text, language=request.language)
        response_data = {"article_id": request.article_id, "translator_response": result["translator_response"], "synthesis": result["synthesis"]}
        save_cached_analysis(cache_key, response_data)
        return InsightAnalysisResponse(**response_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/insights/extract-text")
async def extract_article_text(url: str):
    """Extract full text from an article URL."""
    try:
        text = extract_full_text(url, timeout=15)
        return {"success": True, "text": text, "length": len(text)} if text else {"success": False, "text": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# WHALE RADAR ENDPOINTS (Phase 10)
# Smart Money Tracker - Insider Trading, 13F, Options Flow
# ============================================

from whale_tracker import get_whale_tracker


class InsiderTradeResponse(BaseModel):
    symbol: str
    company_name: str
    reporter_name: str
    reporter_title: str
    transaction_type: str
    transaction_date: str
    shares_transacted: int
    price: float
    total_value: float
    is_buy: bool
    signal_strength: str


class GuruHoldingResponse(BaseModel):
    fund_name: str
    fund_manager: str
    symbol: str
    company_name: str
    shares: int
    value: float
    weight_percent: float
    change_type: str
    change_shares: int
    change_percent: float
    quarter: str
    filing_date: str


class WhaleAlertResponse(BaseModel):
    alert_type: str
    symbol: str
    headline: str
    description: str
    signal: str
    magnitude: str
    timestamp: str
    source: str


class WhaleRadarRequest(BaseModel):
    symbols: Optional[List[str]] = None
    language: str = "en"


class WhaleAnalysisRequest(BaseModel):
    symbols: List[str]
    insider_summary: str
    guru_activity: str
    cluster_detected: bool
    overall_signal: str
    language: str = "en"


class WhaleAnalysisResponse(BaseModel):
    spy_response: str
    soros_response: str
    buffett_response: str
    burry_response: str
    synthesis: str


@app.get("/api/whale/insider/{symbol}")
async def get_insider_trades(symbol: str, limit: int = 20):
    """
    Get insider trading activity for a specific stock.
    Tracks CEO, CFO, and director buying/selling patterns.
    """
    try:
        tracker = get_whale_tracker()
        trades = tracker.get_insider_trades(symbol.upper(), limit=limit)

        return {
            "symbol": symbol.upper(),
            "trades": [
                {
                    "symbol": t.symbol,
                    "company_name": t.company_name,
                    "reporter_name": t.reporter_name,
                    "reporter_title": t.reporter_title,
                    "transaction_type": t.transaction_type,
                    "transaction_date": t.transaction_date,
                    "shares_transacted": t.shares_transacted,
                    "price": t.price,
                    "total_value": t.total_value,
                    "is_buy": t.is_buy,
                    "signal_strength": t.signal_strength,
                }
                for t in trades
            ],
            "count": len(trades),
            "buy_count": len([t for t in trades if t.is_buy]),
            "sell_count": len([t for t in trades if t.is_sell]),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/whale/insider")
async def get_all_insider_trades(limit: int = 50):
    """
    Get recent insider trading activity across all stocks.
    Returns the most significant recent insider transactions.
    """
    try:
        tracker = get_whale_tracker()
        trades = tracker.get_insider_trades(limit=limit)

        return {
            "trades": [
                {
                    "symbol": t.symbol,
                    "company_name": t.company_name,
                    "reporter_name": t.reporter_name,
                    "reporter_title": t.reporter_title,
                    "transaction_type": t.transaction_type,
                    "transaction_date": t.transaction_date,
                    "shares_transacted": t.shares_transacted,
                    "price": t.price,
                    "total_value": t.total_value,
                    "is_buy": t.is_buy,
                    "signal_strength": t.signal_strength,
                }
                for t in trades
            ],
            "count": len(trades),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/whale/cluster/{symbol}")
async def detect_cluster_activity(symbol: str, days: int = 30, min_insiders: int = 2):
    """
    Detect cluster buying/selling activity for a stock.
    Cluster activity (multiple insiders acting together) is a stronger signal.
    """
    try:
        tracker = get_whale_tracker()
        cluster = tracker.detect_cluster_activity(
            symbol.upper(),
            days=days,
            min_insiders=min_insiders
        )

        if cluster:
            return {
                "detected": True,
                "cluster": {
                    "symbol": cluster.symbol,
                    "company_name": cluster.company_name,
                    "activity_type": cluster.activity_type,
                    "insider_count": cluster.insider_count,
                    "total_value": cluster.total_value,
                    "date_range": cluster.date_range,
                    "insiders": cluster.insiders,
                    "urgency": cluster.urgency,
                }
            }
        else:
            return {
                "detected": False,
                "cluster": None,
                "message": f"No cluster activity detected for {symbol.upper()} in the last {days} days"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/whale/guru/{guru_id}")
async def get_guru_holdings(guru_id: str, limit: int = 20):
    """
    Get 13F holdings for a famous investor.
    Available gurus: berkshire, bridgewater, scion, pershing, appaloosa, greenlight, icahn, druckenmiller
    """
    try:
        tracker = get_whale_tracker()

        if guru_id not in tracker.GURU_FUNDS:
            available = list(tracker.GURU_FUNDS.keys())
            raise HTTPException(
                status_code=404,
                detail=f"Guru '{guru_id}' not found. Available: {available}"
            )

        holdings = tracker.get_guru_holdings(guru_id, limit=limit)
        guru_info = tracker.GURU_FUNDS[guru_id]

        return {
            "guru": {
                "id": guru_id,
                "name": guru_info["name"],
                "manager": guru_info["manager"],
                "avatar": guru_info["avatar"],
            },
            "holdings": [
                {
                    "symbol": h.symbol,
                    "company_name": h.company_name,
                    "shares": h.shares,
                    "value": h.value,
                    "weight_percent": h.weight_percent,
                    "change_type": h.change_type,
                    "change_shares": h.change_shares,
                    "change_percent": h.change_percent,
                    "quarter": h.quarter,
                    "filing_date": h.filing_date,
                }
                for h in holdings
            ],
            "count": len(holdings),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/whale/guru")
async def list_available_gurus():
    """
    List all available guru investors for 13F tracking.
    """
    tracker = get_whale_tracker()
    return {
        "gurus": [
            {
                "id": guru_id,
                "name": info["name"],
                "manager": info["manager"],
                "avatar": info["avatar"],
            }
            for guru_id, info in tracker.GURU_FUNDS.items()
        ]
    }


@app.get("/api/whale/consensus")
async def get_guru_consensus(top_n: int = 10):
    """
    Find stocks that multiple gurus are buying (consensus picks).
    These represent high-conviction ideas across multiple legendary investors.
    """
    try:
        tracker = get_whale_tracker()
        consensus = tracker.get_guru_consensus(top_n=top_n)

        return {
            "consensus_picks": [
                {
                    "symbol": symbol,
                    "guru_count": data["guru_count"],
                    "gurus": data["gurus"],
                    "total_value": data["total_value"],
                }
                for symbol, data in consensus.items()
            ],
            "count": len(consensus),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/whale/put-call-ratio")
async def get_put_call_ratio(symbol: str = "SPY"):
    """
    Get Put/Call ratio as a market sentiment indicator.
    Note: Full options flow requires premium data subscription.
    """
    try:
        tracker = get_whale_tracker()
        ratio_data = tracker.get_put_call_ratio(symbol)
        return ratio_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/whale/alerts")
async def get_whale_alerts(symbols: Optional[str] = None, limit: int = 20):
    """
    Get aggregated whale alerts combining insider trades and guru moves.
    Formatted for the Whale Radar UI visualization.

    Args:
        symbols: Comma-separated list of symbols to track (e.g., "AAPL,TSLA,NVDA")
        limit: Maximum number of alerts to return
    """
    try:
        tracker = get_whale_tracker()

        symbol_list = None
        if symbols:
            symbol_list = [s.strip().upper() for s in symbols.split(",")]

        alerts = tracker.get_whale_alerts(symbols=symbol_list, limit=limit)

        return {
            "alerts": [
                {
                    "alert_type": a.alert_type,
                    "symbol": a.symbol,
                    "headline": a.headline,
                    "description": a.description,
                    "signal": a.signal,
                    "magnitude": a.magnitude,
                    "timestamp": a.timestamp,
                    "source": a.source,
                }
                for a in alerts
            ],
            "count": len(alerts),
            "bullish_count": len([a for a in alerts if a.signal == "bullish"]),
            "bearish_count": len([a for a in alerts if a.signal == "bearish"]),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/whale/radar")
async def get_whale_radar_data(symbols: Optional[str] = None):
    """
    Get complete radar data for the Whale Radar UI.
    Returns data formatted for the "sonar" visualization with radar blips.
    """
    try:
        tracker = get_whale_tracker()

        symbol_list = None
        if symbols:
            symbol_list = [s.strip().upper() for s in symbols.split(",")]

        radar_data = tracker.get_radar_data(symbols=symbol_list)
        return radar_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analyze/whale/cached")
async def get_cached_whale_analysis(language: str = "en"):
    """Get cached whale analysis if available."""
    cache_key = get_cache_key("whale", language)
    cached = get_cached_analysis(cache_key)
    if cached:
        return {"cached": True, "result": cached}
    return {"cached": False, "result": None}


@app.post("/api/analyze/whale", response_model=WhaleAnalysisResponse)
async def analyze_whale_activity(request: WhaleAnalysisRequest):
    """
    On-Demand AI Analysis for Smart Money Activity.
    Triggers the Whale Radar personas (The Spy, Soros, Buffett 13F, Burry)
    to analyze insider trading and institutional flows.
    Uses daily cache to avoid redundant AI calls.
    """
    cache_key = get_cache_key("whale", request.language)
    cached = get_cached_analysis(cache_key)
    if cached:
        return WhaleAnalysisResponse(**cached)

    try:
        from agents import run_whale_analysis

        result = run_whale_analysis(
            symbols=request.symbols,
            insider_summary=request.insider_summary,
            guru_activity=request.guru_activity,
            cluster_detected=request.cluster_detected,
            overall_signal=request.overall_signal,
            language=request.language,
        )

        response_data = {
            "spy_response": result["spy_response"],
            "soros_response": result["soros_response"],
            "buffett_response": result["buffett_response"],
            "burry_response": result["burry_response"],
            "synthesis": result["synthesis"],
        }

        save_cached_analysis(cache_key, response_data)

        return WhaleAnalysisResponse(**response_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
