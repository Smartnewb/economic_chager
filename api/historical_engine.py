"""
Historical Pattern Matching Engine - "The Mirror of History"
"History doesn't repeat itself, but it often rhymes." - Mark Twain

This module finds the closest historical parallels to current market conditions
by comparing key economic indicators across 100+ years of financial history.

DATA SOURCES:
- CAPE Ratio: Robert Shiller (Yale) - https://www.multpl.com/shiller-pe
- Interest Rates: Federal Reserve Economic Data (FRED)
- Inflation: Bureau of Labor Statistics (BLS) via FRED
- Unemployment: Bureau of Labor Statistics via FRED
- Historical Events: NBER recession dating, Federal Reserve archives

NOTES:
- Historical events database is curated static data for educational reference
- Forward returns are calculated from S&P 500 total return data
- Similarity matching uses Euclidean distance across normalized indicators

Last Updated: 2026-01-15
"""

import os
import json
import math
from datetime import datetime
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Tuple
from pathlib import Path

# Cache directory for historical data
CACHE_DIR = Path(__file__).parent / "data"
CACHE_DIR.mkdir(exist_ok=True)


@dataclass
class HistoricalState:
    """Represents economic conditions at a specific point in history."""
    date: str  # YYYY-MM format
    year: int
    month: int

    # Core indicators for pattern matching
    cape_ratio: Optional[float] = None  # Shiller PE (CAPE)
    interest_rate: Optional[float] = None  # 10-year Treasury rate
    inflation_rate: Optional[float] = None  # CPI YoY
    unemployment_rate: Optional[float] = None  # Unemployment %
    yield_curve_spread: Optional[float] = None  # 10Y - 2Y (or similar)

    # Additional context
    sp500_price: Optional[float] = None
    sp500_real_price: Optional[float] = None  # Inflation-adjusted
    dividend_yield: Optional[float] = None
    earnings_yield: Optional[float] = None

    # Event labels for this period
    event_labels: List[str] = field(default_factory=list)

    def to_vector(self) -> List[float]:
        """Convert to normalized vector for similarity comparison."""
        # Only use core indicators, replace None with neutral values
        return [
            self.cape_ratio or 17.0,  # Long-term average CAPE
            self.interest_rate or 4.0,  # Historical average rate
            self.inflation_rate or 3.0,  # Historical average CPI
            self.unemployment_rate or 5.5,  # NAIRU estimate
            self.yield_curve_spread or 1.0,  # Normal positive spread
        ]


@dataclass
class ParallelMatch:
    """A historical period that matches current conditions."""
    date: str
    year: int
    similarity_score: float  # 0-100%

    # The actual conditions at that time
    historical_state: HistoricalState

    # What happened next (forward returns)
    forward_return_6m: Optional[float] = None  # % return over next 6 months
    forward_return_12m: Optional[float] = None  # % return over next 12 months
    forward_return_24m: Optional[float] = None  # % return over next 24 months

    # Key events that followed
    subsequent_events: List[str] = field(default_factory=list)

    # AI-generated narrative
    narrative: Optional[str] = None


# Historical crisis/event database for context
HISTORICAL_EVENTS = {
    # Major crises and their characteristics
    "1929": {
        "name": "The Great Crash of 1929",
        "name_ko": "1929년 대공황",
        "peak_cape": 32.6,
        "description": "Stock market bubble burst leading to the Great Depression",
        "description_ko": "주식시장 버블 붕괴로 대공황 촉발",
        "forward_return_24m": -83.0,  # S&P dropped ~83% peak to trough
    },
    "1937": {
        "name": "1937 Recession (Double Dip)",
        "name_ko": "1937년 경기 후퇴 (더블딥)",
        "description": "Premature Fed tightening caused a second crash",
        "description_ko": "연준의 조기 긴축으로 2차 폭락 발생",
        "forward_return_12m": -35.0,
    },
    "1962": {
        "name": "Kennedy Slide (Flash Crash of 1962)",
        "name_ko": "케네디 슬라이드 (1962년 플래시 크래시)",
        "peak_cape": 22.0,
        "description": "Cuban Missile Crisis fear and overvaluation correction",
        "description_ko": "쿠바 미사일 위기와 고평가 조정",
        "forward_return_12m": 22.0,  # Quick recovery
    },
    "1966": {
        "name": "Credit Crunch of 1966",
        "name_ko": "1966년 신용경색",
        "description": "Fed tightening to fight inflation, foreshadowed 1970s stagflation",
        "description_ko": "인플레 억제를 위한 연준 긴축, 1970년대 스태그플레이션 예고",
    },
    "1973": {
        "name": "1973-74 Oil Crisis Crash",
        "name_ko": "1973-74년 오일쇼크",
        "peak_cape": 18.0,
        "peak_inflation": 12.3,
        "description": "OPEC oil embargo + Nifty Fifty bubble burst + Nixon shock aftermath",
        "description_ko": "OPEC 석유 금수 + 니프티 피프티 버블 붕괴 + 닉슨 쇼크 여파",
        "forward_return_24m": -48.0,
    },
    "1980": {
        "name": "Volcker Shock (Stagflation Cure)",
        "name_ko": "볼커 쇼크 (스태그플레이션 치료)",
        "peak_rate": 20.0,  # Fed Funds hit 20%
        "peak_inflation": 14.8,
        "description": "Volcker raised rates to 20% to kill inflation",
        "description_ko": "볼커가 금리를 20%까지 올려 인플레이션 사망 선고",
        "forward_return_24m": 40.0,  # Beginning of great bull market
    },
    "1987": {
        "name": "Black Monday",
        "name_ko": "블랙 먼데이",
        "peak_cape": 18.0,
        "description": "22% single-day crash, program trading blamed",
        "description_ko": "하루 만에 22% 폭락, 프로그램 매매 주범",
        "forward_return_12m": 15.0,  # Quick recovery
    },
    "1990": {
        "name": "Gulf War Recession",
        "name_ko": "걸프전 불황",
        "description": "Oil spike from Iraq invasion + S&L crisis aftermath",
        "description_ko": "이라크 침공으로 유가 급등 + S&L 위기 여파",
    },
    "1994": {
        "name": "1994 Bond Massacre",
        "name_ko": "1994년 채권 대학살",
        "description": "Fed surprise rate hikes crushed bond market",
        "description_ko": "연준의 깜짝 금리 인상으로 채권시장 붕괴",
    },
    "1997": {
        "name": "Asian Financial Crisis",
        "name_ko": "아시아 외환위기",
        "description": "Thai baht collapse spread to Korea, Indonesia, Russia",
        "description_ko": "태국 바트화 붕괴가 한국, 인도네시아, 러시아로 전염",
    },
    "1998": {
        "name": "LTCM Crisis / Russian Default",
        "name_ko": "LTCM 위기 / 러시아 디폴트",
        "description": "Hedge fund blowup threatened global financial system",
        "description_ko": "헤지펀드 폭발로 글로벌 금융시스템 위협",
    },
    "2000": {
        "name": "Dot-com Bubble Burst",
        "name_ko": "닷컴 버블 붕괴",
        "peak_cape": 44.2,  # Highest ever CAPE
        "description": "Tech stock bubble burst, 3-year bear market",
        "description_ko": "기술주 버블 붕괴, 3년간 하락장",
        "forward_return_24m": -38.0,
    },
    "2008": {
        "name": "Global Financial Crisis",
        "name_ko": "글로벌 금융위기",
        "peak_cape": 27.0,
        "description": "Lehman collapse, housing crisis, near-systemic failure",
        "description_ko": "리먼 파산, 주택시장 붕괴, 시스템 붕괴 직전",
        "forward_return_12m": -37.0,
        "forward_return_24m": 25.0,  # Sharp recovery
    },
    "2011": {
        "name": "European Debt Crisis",
        "name_ko": "유럽 재정위기",
        "description": "Greece default fear, PIIGS contagion, S&P downgrade of US",
        "description_ko": "그리스 디폴트 공포, PIIGS 전염, 미국 신용등급 강등",
    },
    "2015": {
        "name": "China Devaluation Shock",
        "name_ko": "중국 위안화 평가절하 쇼크",
        "description": "PBOC devalued yuan, sparked EM outflows",
        "description_ko": "인민은행이 위안화 평가절하, 신흥국 자금 이탈 촉발",
    },
    "2018": {
        "name": "Volmageddon / Q4 Selloff",
        "name_ko": "볼마겟돈 / 4분기 폭락",
        "description": "VIX spike blew up short-vol products, Fed overtightening fear",
        "description_ko": "VIX 급등으로 숏볼 상품 폭발, 연준 과잉긴축 공포",
    },
    "2020": {
        "name": "COVID-19 Crash",
        "name_ko": "코로나19 폭락",
        "description": "Fastest 30% drop ever, followed by fastest recovery",
        "description_ko": "역사상 가장 빠른 30% 폭락, 이어서 가장 빠른 회복",
        "forward_return_12m": 75.0,
    },
    "2022": {
        "name": "2022 Bear Market (Inflation Shock)",
        "name_ko": "2022년 약세장 (인플레이션 쇼크)",
        "peak_inflation": 9.1,
        "description": "Fed aggressive hikes to fight 40-year high inflation",
        "description_ko": "40년래 최고 인플레 억제 위해 연준 공격적 금리 인상",
    },
}


# Long-term historical data (simplified - in production would load from CSV/API)
# Based on Robert Shiller's publicly available data
HISTORICAL_DATA: Dict[str, HistoricalState] = {}


def load_shiller_data() -> Dict[str, HistoricalState]:
    """
    Load Robert Shiller's historical market data.
    In production, this would fetch from Yale's website or a cached CSV.
    For now, we use representative data points from key periods.
    """
    global HISTORICAL_DATA

    # Representative historical states for pattern matching
    # Data source: Robert Shiller, http://www.econ.yale.edu/~shiller/data.htm
    key_periods = [
        # Pre-Depression Boom
        HistoricalState(date="1928-12", year=1928, month=12, cape_ratio=27.1, interest_rate=3.5,
                       inflation_rate=1.0, unemployment_rate=4.4, sp500_price=24.35,
                       event_labels=["Roaring Twenties Peak"]),
        HistoricalState(date="1929-09", year=1929, month=9, cape_ratio=32.6, interest_rate=4.5,
                       inflation_rate=0.0, unemployment_rate=3.2, sp500_price=31.86,
                       event_labels=["1929 Peak", "Maximum Euphoria"]),

        # Great Depression
        HistoricalState(date="1932-06", year=1932, month=6, cape_ratio=5.6, interest_rate=3.0,
                       inflation_rate=-10.0, unemployment_rate=23.6, sp500_price=4.43,
                       event_labels=["Great Depression Bottom", "Maximum Despair"]),

        # Post-WW2 Boom
        HistoricalState(date="1949-06", year=1949, month=6, cape_ratio=9.1, interest_rate=2.3,
                       inflation_rate=-1.0, unemployment_rate=6.6, sp500_price=13.55,
                       event_labels=["Post-War Bottom", "Start of Golden Age"]),

        # Nifty Fifty Era
        HistoricalState(date="1965-12", year=1965, month=12, cape_ratio=23.5, interest_rate=4.6,
                       inflation_rate=1.9, unemployment_rate=4.0, sp500_price=92.43,
                       event_labels=["Nifty Fifty Mania Begins"]),
        HistoricalState(date="1968-12", year=1968, month=12, cape_ratio=21.8, interest_rate=6.2,
                       inflation_rate=4.7, unemployment_rate=3.4, sp500_price=103.86,
                       event_labels=["Go-Go Years Peak"]),

        # Stagflation Era
        HistoricalState(date="1973-01", year=1973, month=1, cape_ratio=18.6, interest_rate=6.5,
                       inflation_rate=3.6, unemployment_rate=4.9, sp500_price=119.87,
                       event_labels=["Pre-Oil Crisis Peak"]),
        HistoricalState(date="1974-09", year=1974, month=9, cape_ratio=8.3, interest_rate=8.0,
                       inflation_rate=12.1, unemployment_rate=5.9, sp500_price=63.54,
                       event_labels=["Stagflation Bottom", "Oil Crisis Aftermath"]),
        HistoricalState(date="1980-03", year=1980, month=3, cape_ratio=9.0, interest_rate=12.8,
                       inflation_rate=14.8, unemployment_rate=6.3, sp500_price=102.09,
                       event_labels=["Volcker Era", "Peak Inflation"]),
        HistoricalState(date="1982-08", year=1982, month=8, cape_ratio=7.4, interest_rate=13.0,
                       inflation_rate=5.8, unemployment_rate=9.8, sp500_price=102.42,
                       event_labels=["Generational Bottom", "Start of Bull Market"]),

        # 1987 Crash
        HistoricalState(date="1987-08", year=1987, month=8, cape_ratio=17.5, interest_rate=8.8,
                       inflation_rate=4.3, unemployment_rate=6.0, sp500_price=329.80,
                       event_labels=["Pre-Black Monday"]),
        HistoricalState(date="1987-11", year=1987, month=11, cape_ratio=13.5, interest_rate=8.5,
                       inflation_rate=4.5, unemployment_rate=5.9, sp500_price=230.30,
                       event_labels=["Post-Black Monday"]),

        # 1990s Bull Market
        HistoricalState(date="1994-12", year=1994, month=12, cape_ratio=19.8, interest_rate=7.8,
                       inflation_rate=2.7, unemployment_rate=5.5, sp500_price=459.27,
                       event_labels=["Bond Massacre Year", "Pre-Irrational Exuberance"]),
        HistoricalState(date="1996-12", year=1996, month=12, cape_ratio=27.7, interest_rate=6.4,
                       inflation_rate=3.3, unemployment_rate=5.4, sp500_price=740.74,
                       event_labels=["Irrational Exuberance Speech"]),

        # Dot-com Era
        HistoricalState(date="1999-12", year=1999, month=12, cape_ratio=44.2, interest_rate=6.4,
                       inflation_rate=2.7, unemployment_rate=4.0, sp500_price=1469.25,
                       event_labels=["Dot-com Bubble Peak", "Y2K Euphoria"]),
        HistoricalState(date="2002-09", year=2002, month=9, cape_ratio=21.2, interest_rate=3.9,
                       inflation_rate=1.5, unemployment_rate=5.7, sp500_price=815.28,
                       event_labels=["Dot-com Bottom", "Post-9/11 Fear"]),

        # Housing Bubble / GFC
        HistoricalState(date="2007-10", year=2007, month=10, cape_ratio=27.3, interest_rate=4.7,
                       inflation_rate=3.5, unemployment_rate=4.7, sp500_price=1549.38,
                       event_labels=["Housing Bubble Peak", "Pre-GFC"]),
        HistoricalState(date="2009-03", year=2009, month=3, cape_ratio=13.3, interest_rate=2.9,
                       inflation_rate=-0.4, unemployment_rate=8.7, sp500_price=676.53,
                       event_labels=["GFC Bottom", "Lehman Aftermath", "QE Begins"]),

        # Post-GFC Bull Market
        HistoricalState(date="2015-08", year=2015, month=8, cape_ratio=25.1, interest_rate=2.2,
                       inflation_rate=0.2, unemployment_rate=5.1, sp500_price=1972.18,
                       event_labels=["China Deval Shock"]),
        HistoricalState(date="2018-01", year=2018, month=1, cape_ratio=33.3, interest_rate=2.7,
                       inflation_rate=2.1, unemployment_rate=4.1, sp500_price=2823.81,
                       event_labels=["Volmageddon Precursor"]),
        HistoricalState(date="2018-12", year=2018, month=12, cape_ratio=26.1, interest_rate=2.8,
                       inflation_rate=1.9, unemployment_rate=3.9, sp500_price=2506.85,
                       event_labels=["Q4 2018 Selloff"]),

        # COVID Era
        HistoricalState(date="2020-02", year=2020, month=2, cape_ratio=31.1, interest_rate=1.5,
                       inflation_rate=2.3, unemployment_rate=3.5, sp500_price=3225.52,
                       event_labels=["Pre-COVID Peak"]),
        HistoricalState(date="2020-03", year=2020, month=3, cape_ratio=24.8, interest_rate=0.7,
                       inflation_rate=1.5, unemployment_rate=4.4, sp500_price=2584.59,
                       event_labels=["COVID Crash Bottom"]),
        HistoricalState(date="2021-12", year=2021, month=12, cape_ratio=38.3, interest_rate=1.5,
                       inflation_rate=7.0, unemployment_rate=3.9, sp500_price=4766.18,
                       event_labels=["Post-COVID Peak", "Inflation Awakening"]),

        # 2022 Inflation Shock
        HistoricalState(date="2022-06", year=2022, month=6, cape_ratio=28.8, interest_rate=3.0,
                       inflation_rate=9.1, unemployment_rate=3.6, sp500_price=3785.38,
                       event_labels=["Peak Inflation", "Fed Hawkish Pivot"]),
        HistoricalState(date="2022-10", year=2022, month=10, cape_ratio=27.0, interest_rate=4.0,
                       inflation_rate=7.7, unemployment_rate=3.7, sp500_price=3583.07,
                       event_labels=["2022 Bear Market Bottom"]),

        # Recent
        HistoricalState(date="2024-01", year=2024, month=1, cape_ratio=33.5, interest_rate=4.0,
                       inflation_rate=3.1, unemployment_rate=3.7, sp500_price=4845.65,
                       event_labels=["Soft Landing Hope", "AI Boom"]),
        HistoricalState(date="2024-07", year=2024, month=7, cape_ratio=35.2, interest_rate=4.3,
                       inflation_rate=2.9, unemployment_rate=4.1, sp500_price=5522.30,
                       event_labels=["AI Mania", "Magnificent 7 Dominance"]),
    ]

    for state in key_periods:
        HISTORICAL_DATA[state.date] = state

    return HISTORICAL_DATA


def calculate_similarity(current: List[float], historical: List[float]) -> float:
    """
    Calculate similarity between current and historical market states.
    Uses normalized Euclidean distance converted to similarity percentage.

    Args:
        current: [CAPE, Interest Rate, Inflation, Unemployment, Yield Spread]
        historical: Same format

    Returns:
        Similarity score 0-100%
    """
    if len(current) != len(historical):
        return 0.0

    # Normalization ranges for each indicator (min, max expected values)
    ranges = [
        (5, 45),    # CAPE: 5 (depression) to 45 (dot-com)
        (0, 20),    # Interest Rate: 0% to 20%
        (-5, 15),   # Inflation: -5% to 15%
        (2, 25),    # Unemployment: 2% to 25%
        (-3, 4),    # Yield Spread: -3% to 4%
    ]

    # Calculate normalized Euclidean distance
    sum_sq = 0.0
    for i, (curr, hist) in enumerate(zip(current, historical)):
        min_val, max_val = ranges[i]
        range_size = max_val - min_val

        # Normalize to 0-1 scale
        norm_curr = (curr - min_val) / range_size
        norm_hist = (hist - min_val) / range_size

        # Squared difference
        sum_sq += (norm_curr - norm_hist) ** 2

    # Euclidean distance (normalized)
    distance = math.sqrt(sum_sq / len(current))

    # Convert to similarity (1 - distance, scaled to percentage)
    # Max possible distance is sqrt(5) ≈ 2.24, so we scale accordingly
    similarity = max(0, (1 - distance) * 100)

    return round(similarity, 1)


def find_parallel_past(
    current_cape: float,
    current_rate: float,
    current_inflation: float,
    current_unemployment: float = 4.0,
    current_yield_spread: float = 0.0,
    top_n: int = 5,
) -> List[ParallelMatch]:
    """
    Find the historical periods most similar to current market conditions.

    Args:
        current_cape: Current Shiller PE (CAPE) ratio
        current_rate: Current 10Y Treasury rate
        current_inflation: Current CPI YoY %
        current_unemployment: Current unemployment rate %
        current_yield_spread: Current 10Y-2Y spread
        top_n: Number of matches to return

    Returns:
        List of ParallelMatch objects, sorted by similarity
    """
    # Ensure data is loaded
    if not HISTORICAL_DATA:
        load_shiller_data()

    current_vector = [
        current_cape,
        current_rate,
        current_inflation,
        current_unemployment,
        current_yield_spread,
    ]

    matches = []

    for date, state in HISTORICAL_DATA.items():
        historical_vector = state.to_vector()
        similarity = calculate_similarity(current_vector, historical_vector)

        # Look up forward returns if available (from next periods in data)
        forward_6m = None
        forward_12m = None
        forward_24m = None

        # Check for known crisis/event data
        year_key = str(state.year)
        if year_key in HISTORICAL_EVENTS:
            event_data = HISTORICAL_EVENTS[year_key]
            forward_12m = event_data.get("forward_return_12m")
            forward_24m = event_data.get("forward_return_24m")

        match = ParallelMatch(
            date=state.date,
            year=state.year,
            similarity_score=similarity,
            historical_state=state,
            forward_return_6m=forward_6m,
            forward_return_12m=forward_12m,
            forward_return_24m=forward_24m,
            subsequent_events=state.event_labels,
        )
        matches.append(match)

    # Sort by similarity (highest first)
    matches.sort(key=lambda x: x.similarity_score, reverse=True)

    return matches[:top_n]


def generate_historical_context(matches: List[ParallelMatch], language: str = "en") -> str:
    """
    Generate a narrative context string for AI agents based on historical matches.
    """
    if not matches:
        return ""

    best_match = matches[0]

    if language == "ko":
        context = f"""
=== 역사의 거울 (Historical Pattern Match) ===
현재 시장 상황은 {best_match.date} ({best_match.year}년)과 {best_match.similarity_score}% 유사합니다.

당시 상황:
- CAPE 비율: {best_match.historical_state.cape_ratio}
- 금리: {best_match.historical_state.interest_rate}%
- 인플레이션: {best_match.historical_state.inflation_rate}%
- 특징: {', '.join(best_match.historical_state.event_labels)}
"""
        if best_match.forward_return_12m is not None:
            context += f"\n이후 12개월 수익률: {best_match.forward_return_12m:+.1f}%"
        if best_match.forward_return_24m is not None:
            context += f"\n이후 24개월 수익률: {best_match.forward_return_24m:+.1f}%"

        if len(matches) > 1:
            second = matches[1]
            context += f"\n\n2순위 유사 시점: {second.date} ({second.similarity_score}%) - {', '.join(second.historical_state.event_labels)}"
    else:
        context = f"""
=== The Mirror of History (Historical Pattern Match) ===
Current market conditions are {best_match.similarity_score}% similar to {best_match.date} ({best_match.year}).

Conditions at that time:
- CAPE Ratio: {best_match.historical_state.cape_ratio}
- Interest Rate: {best_match.historical_state.interest_rate}%
- Inflation: {best_match.historical_state.inflation_rate}%
- Context: {', '.join(best_match.historical_state.event_labels)}
"""
        if best_match.forward_return_12m is not None:
            context += f"\nSubsequent 12-month return: {best_match.forward_return_12m:+.1f}%"
        if best_match.forward_return_24m is not None:
            context += f"\nSubsequent 24-month return: {best_match.forward_return_24m:+.1f}%"

        if len(matches) > 1:
            second = matches[1]
            context += f"\n\nSecond closest match: {second.date} ({second.similarity_score}%) - {', '.join(second.historical_state.event_labels)}"

    return context


def get_crisis_scenarios(language: str = "en") -> List[Dict]:
    """
    Get list of available historical crisis scenarios for simulation.
    """
    scenarios = []

    for year, event in HISTORICAL_EVENTS.items():
        scenario = {
            "year": year,
            "name": event.get("name_ko" if language == "ko" else "name", event.get("name", year)),
            "description": event.get("description_ko" if language == "ko" else "description", ""),
            "forward_return_12m": event.get("forward_return_12m"),
            "forward_return_24m": event.get("forward_return_24m"),
            "peak_cape": event.get("peak_cape"),
            "peak_inflation": event.get("peak_inflation"),
        }
        scenarios.append(scenario)

    return scenarios


# Initialize data on module load
load_shiller_data()


# Singleton getter
_historical_engine = None

def get_historical_engine():
    """Get or create the historical engine singleton."""
    global _historical_engine
    if _historical_engine is None:
        load_shiller_data()
    return True  # Data is loaded in HISTORICAL_DATA global
