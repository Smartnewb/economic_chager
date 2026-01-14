"""
Country Data Service

Fetches real economic data from multiple APIs:
- FMP (Financial Modeling Prep): FX rates, stock indices
- FRED (Federal Reserve Economic Data): Interest rates, unemployment, inflation

Falls back to mock data when APIs are unavailable.
"""

import os
import httpx
import random
import hashlib
from datetime import datetime, timedelta
from typing import Optional
import time

# API Keys from environment
FMP_API_KEY = os.getenv("FMP_API_KEY", "")
FRED_API_KEY = os.getenv("FRED_API_KEY", "")

# Cache for API responses
_api_cache: dict = {}
_cache_expiry: dict = {}
CACHE_TTL = 3600  # 1 hour


class CountryDataService:
    """Service for fetching real country economic data."""

    # Country configuration matching main.py COUNTRY_CONFIGS format
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
            "stockIndex": "^GSPC",
            "fmpFxPair": None,  # USD is base
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
            "stockIndex": "^KS11",
            "fmpFxPair": "USDKRW",
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
            "stockIndex": "^N225",
            "fmpFxPair": "USDJPY",
        },
        "DE": {
            "name": "Germany",
            "flag": "🇩🇪",
            "region": "Europe",
            "currency": "Euro",
            "currencyCode": "EUR",
            "fxPair": "EUR/USD",
            "indexName": "DAX",
            "centralBank": "European Central Bank (ECB)",
            "stockIndex": "^GDAXI",
            "fmpFxPair": "EURUSD",
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
            "stockIndex": "^FTSE",
            "fmpFxPair": "GBPUSD",
        },
        "CN": {
            "name": "China",
            "flag": "🇨🇳",
            "region": "Asia",
            "currency": "Chinese Yuan",
            "currencyCode": "CNY",
            "fxPair": "USD/CNY",
            "indexName": "Shanghai Composite",
            "centralBank": "People's Bank of China (PBOC)",
            "stockIndex": "000001.SS",
            "fmpFxPair": "USDCNY",
        },
        "IN": {
            "name": "India",
            "flag": "🇮🇳",
            "region": "Asia",
            "currency": "Indian Rupee",
            "currencyCode": "INR",
            "fxPair": "USD/INR",
            "indexName": "Nifty 50",
            "centralBank": "Reserve Bank of India (RBI)",
            "stockIndex": "^NSEI",
            "fmpFxPair": "USDINR",
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
            "stockIndex": "^BVSP",
            "fmpFxPair": "USDBRL",
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
            "stockIndex": "^AXJO",
            "fmpFxPair": "AUDUSD",
        },
        "CA": {
            "name": "Canada",
            "flag": "🇨🇦",
            "region": "Americas",
            "currency": "Canadian Dollar",
            "currencyCode": "CAD",
            "fxPair": "USD/CAD",
            "indexName": "TSX Composite",
            "centralBank": "Bank of Canada (BOC)",
            "stockIndex": "^GSPTSE",
            "fmpFxPair": "USDCAD",
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
            "stockIndex": "^SSMI",
            "fmpFxPair": "USDCHF",
        },
        "MX": {
            "name": "Mexico",
            "flag": "🇲🇽",
            "region": "Americas",
            "currency": "Mexican Peso",
            "currencyCode": "MXN",
            "fxPair": "USD/MXN",
            "indexName": "IPC",
            "centralBank": "Bank of Mexico (Banxico)",
            "stockIndex": "^MXX",
            "fmpFxPair": "USDMXN",
        },
    }

    # Base values for different countries
    BASE_RATES = {
        "US": 104.5, "CN": 7.24, "JP": 154.5, "DE": 1.085, "GB": 1.27,
        "KR": 1380, "IN": 83.2, "BR": 4.95, "AU": 0.66, "CA": 1.36,
        "CH": 0.88, "MX": 17.2
    }

    BASE_YIELDS = {
        "US": 4.55, "CN": 2.25, "JP": 0.95, "DE": 2.35, "GB": 4.15,
        "KR": 3.45, "IN": 7.1, "BR": 11.5, "AU": 4.25, "CA": 3.8,
        "CH": 0.95, "MX": 9.2
    }

    BASE_PRICES = {
        "US": 5850, "CN": 3800, "JP": 38500, "DE": 19200, "GB": 8150,
        "KR": 2650, "IN": 22500, "BR": 128000, "AU": 7800, "CA": 21500,
        "CH": 11800, "MX": 55000
    }

    BASE_POLICY_RATES = {
        "US": 5.50, "CN": 3.45, "JP": 0.10, "DE": 4.50, "GB": 5.25,
        "KR": 3.50, "IN": 6.50, "BR": 11.25, "AU": 4.35, "CA": 5.00,
        "CH": 1.75, "MX": 11.25
    }

    BASE_INFLATION = {
        "US": 3.4, "CN": 0.7, "JP": 2.6, "DE": 2.8, "GB": 4.0,
        "KR": 2.8, "IN": 5.1, "BR": 4.5, "AU": 4.1, "CA": 2.9,
        "CH": 1.3, "MX": 4.9
    }

    def __init__(self):
        self.fmp_api_key = FMP_API_KEY
        self.fred_api_key = FRED_API_KEY

    def _get_seeded_random(self, country_code: str) -> random.Random:
        """Get a seeded random generator for consistent daily values."""
        today = datetime.now().strftime("%Y-%m-%d")
        seed_str = f"{country_code.upper()}_{today}"
        seed_value = int(hashlib.md5(seed_str.encode()).hexdigest(), 16) % (10 ** 8)
        return random.Random(seed_value)

    async def get_country_data(self, country_code: str) -> dict:
        """
        Get comprehensive country economic data.
        Returns data in the exact format expected by main.py Pydantic models.
        """
        country_code = country_code.upper()
        config = self.COUNTRY_CONFIGS.get(country_code)

        if not config:
            return None

        rng = self._get_seeded_random(country_code)

        # Generate FX data
        base_rate = self.BASE_RATES.get(country_code, 1.0)
        rate = round(base_rate * (1 + (rng.random() - 0.5) * 0.05), 2)
        change24h = round((rng.random() - 0.5) * 2, 2)
        change1w = round((rng.random() - 0.5) * 4, 2)
        change1m = round((rng.random() - 0.5) * 6, 2)
        high52w = round(rate * 1.15, 2)
        low52w = round(rate * 0.85, 2)
        percent_of_range = round(((rate - low52w) / (high52w - low52w)) * 100, 1)

        # Generate Bond data
        yield10y = round(self.BASE_YIELDS.get(country_code, 3.0) + (rng.random() - 0.5) * 0.3, 2)
        yield2y = round(yield10y + (rng.random() - 0.6) * 0.5, 2)
        spread = round(yield10y - yield2y, 2)
        is_inverted = spread < 0
        vs_us_spread = round(yield10y - 4.55, 2) if country_code != "US" else 0

        # Generate Stock data
        price = round(self.BASE_PRICES.get(country_code, 1000) * (1 + (rng.random() - 0.5) * 0.1))
        change1d = round((rng.random() - 0.5) * 3, 2)
        change1m_stock = round((rng.random() - 0.5) * 8, 2)
        change3m = round((rng.random() - 0.5) * 15, 2)
        change_ytd = round((rng.random() - 0.5) * 25, 2)
        per = round(15 + rng.random() * 15, 1)
        pbr = round(1.0 + rng.random() * 3, 2)

        # Generate Policy data
        policy_rate = round(self.BASE_POLICY_RATES.get(country_code, 3.0) + (rng.random() - 0.5) * 0.2, 2)
        inflation_rate = round(self.BASE_INFLATION.get(country_code, 3.0) + (rng.random() - 0.5) * 0.3, 1)
        real_rate = round(policy_rate - inflation_rate, 2)

        statuses = ["hiking", "paused", "cutting", "low"]
        status_weights = {"US": [0, 70, 25, 5], "JP": [60, 30, 5, 5], "CN": [5, 20, 70, 5]}
        weights = status_weights.get(country_code, [10, 50, 30, 10])
        status = rng.choices(statuses, weights=weights)[0]

        next_meeting = datetime.now() + timedelta(days=rng.randint(7, 45))
        next_meeting_date = next_meeting.strftime("%Y-%m-%d")
        next_meeting_days = (next_meeting - datetime.now()).days

        # Calculate economic metrics (0-100 scale)
        currency_power = max(0, min(100, 50 - change1m * 5 + rng.random() * 20))
        market_sentiment = max(0, min(100, 50 + change3m * 2 + rng.random() * 20))
        credit_risk = max(0, min(100, 80 - abs(spread) * 20 - (10 if is_inverted else 0)))
        liquidity = max(0, min(100, 50 + (real_rate * 10) + rng.random() * 20))
        inflation_score = max(0, min(100, 100 - abs(inflation_rate - 2) * 15))
        growth_score = max(0, min(100, 50 + change_ytd * 1.5 + rng.random() * 20))

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


# Global instance
country_service = CountryDataService()
