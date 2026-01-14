"""
Global Bonds Service for Insight Flow
Provides global yield data, spreads, and sovereign risk indicators
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
from functools import lru_cache
import time
import random

COUNTRY_DATA = {
    "US": {
        "name": "United States",
        "flag": "🇺🇸",
        "currency": "USD",
        "central_bank": "Federal Reserve",
        "base_yield": 4.45,
        "base_yields": {"2Y": 4.85, "5Y": 4.35, "10Y": 4.45, "30Y": 4.60},
        "cds_spread": 15,
        "rating": "AA+",
        "region": "americas"
    },
    "DE": {
        "name": "Germany",
        "flag": "🇩🇪",
        "currency": "EUR",
        "central_bank": "ECB",
        "base_yield": 2.35,
        "base_yields": {"2Y": 2.65, "5Y": 2.30, "10Y": 2.35, "30Y": 2.55},
        "cds_spread": 12,
        "rating": "AAA",
        "region": "europe"
    },
    "GB": {
        "name": "United Kingdom",
        "flag": "🇬🇧",
        "currency": "GBP",
        "central_bank": "Bank of England",
        "base_yield": 4.15,
        "base_yields": {"2Y": 4.45, "5Y": 4.10, "10Y": 4.15, "30Y": 4.45},
        "cds_spread": 22,
        "rating": "AA",
        "region": "europe"
    },
    "JP": {
        "name": "Japan",
        "flag": "🇯🇵",
        "currency": "JPY",
        "central_bank": "Bank of Japan",
        "base_yield": 0.95,
        "base_yields": {"2Y": 0.35, "5Y": 0.55, "10Y": 0.95, "30Y": 1.85},
        "cds_spread": 18,
        "rating": "A+",
        "region": "asia"
    },
    "CH": {
        "name": "Switzerland",
        "flag": "🇨🇭",
        "currency": "CHF",
        "central_bank": "Swiss National Bank",
        "base_yield": 0.45,
        "base_yields": {"2Y": 0.85, "5Y": 0.55, "10Y": 0.45, "30Y": 0.65},
        "cds_spread": 8,
        "rating": "AAA",
        "region": "europe"
    },
    "AU": {
        "name": "Australia",
        "flag": "🇦🇺",
        "currency": "AUD",
        "central_bank": "Reserve Bank of Australia",
        "base_yield": 4.35,
        "base_yields": {"2Y": 4.15, "5Y": 4.05, "10Y": 4.35, "30Y": 4.55},
        "cds_spread": 20,
        "rating": "AAA",
        "region": "asia"
    },
    "CA": {
        "name": "Canada",
        "flag": "🇨🇦",
        "currency": "CAD",
        "central_bank": "Bank of Canada",
        "base_yield": 3.25,
        "base_yields": {"2Y": 3.65, "5Y": 3.15, "10Y": 3.25, "30Y": 3.45},
        "cds_spread": 18,
        "rating": "AAA",
        "region": "americas"
    },
    "KR": {
        "name": "South Korea",
        "flag": "🇰🇷",
        "currency": "KRW",
        "central_bank": "Bank of Korea",
        "base_yield": 3.15,
        "base_yields": {"2Y": 3.05, "5Y": 3.00, "10Y": 3.15, "30Y": 3.25},
        "cds_spread": 32,
        "rating": "AA",
        "region": "asia"
    },
    "FR": {
        "name": "France",
        "flag": "🇫🇷",
        "currency": "EUR",
        "central_bank": "ECB",
        "base_yield": 2.95,
        "base_yields": {"2Y": 2.85, "5Y": 2.75, "10Y": 2.95, "30Y": 3.35},
        "cds_spread": 28,
        "rating": "AA-",
        "region": "europe"
    },
    "IT": {
        "name": "Italy",
        "flag": "🇮🇹",
        "currency": "EUR",
        "central_bank": "ECB",
        "base_yield": 3.65,
        "base_yields": {"2Y": 3.25, "5Y": 3.35, "10Y": 3.65, "30Y": 4.05},
        "cds_spread": 85,
        "rating": "BBB",
        "region": "europe"
    },
    "CN": {
        "name": "China",
        "flag": "🇨🇳",
        "currency": "CNY",
        "central_bank": "People's Bank of China",
        "base_yield": 2.25,
        "base_yields": {"2Y": 1.75, "5Y": 2.05, "10Y": 2.25, "30Y": 2.55},
        "cds_spread": 58,
        "rating": "A+",
        "region": "asia"
    },
    "ES": {
        "name": "Spain",
        "flag": "🇪🇸",
        "currency": "EUR",
        "central_bank": "ECB",
        "base_yield": 3.15,
        "base_yields": {"2Y": 2.85, "5Y": 2.95, "10Y": 3.15, "30Y": 3.65},
        "cds_spread": 42,
        "rating": "A",
        "region": "europe"
    },
    "IN": {
        "name": "India",
        "flag": "🇮🇳",
        "currency": "INR",
        "central_bank": "Reserve Bank of India",
        "base_yield": 7.05,
        "base_yields": {"2Y": 6.85, "5Y": 6.95, "10Y": 7.05, "30Y": 7.25},
        "cds_spread": 95,
        "rating": "BBB-",
        "region": "asia"
    },
    "BR": {
        "name": "Brazil",
        "flag": "🇧🇷",
        "currency": "BRL",
        "central_bank": "Central Bank of Brazil",
        "base_yield": 12.85,
        "base_yields": {"2Y": 13.15, "5Y": 12.55, "10Y": 12.85, "30Y": 12.45},
        "cds_spread": 145,
        "rating": "BB",
        "region": "americas"
    },
    "MX": {
        "name": "Mexico",
        "flag": "🇲🇽",
        "currency": "MXN",
        "central_bank": "Banxico",
        "base_yield": 9.45,
        "base_yields": {"2Y": 10.25, "5Y": 9.65, "10Y": 9.45, "30Y": 9.25},
        "cds_spread": 92,
        "rating": "BBB",
        "region": "americas"
    }
}

MATURITIES = ["2Y", "5Y", "10Y", "30Y"]


class GlobalBondsService:
    CACHE_DURATION = 300  # 5 minutes

    def __init__(self):
        self._cache = {}
        self._last_update = {}

    def _add_volatility(self, base_value: float, volatility: float = 0.05) -> float:
        """Add some realistic volatility to yields."""
        return round(base_value + random.uniform(-volatility, volatility), 2)

    def _get_trend(self, change: float) -> str:
        """Determine trend direction based on change."""
        if change > 0.03:
            return "up"
        elif change < -0.03:
            return "down"
        return "flat"

    def get_global_yields(self, countries: Optional[List[str]] = None) -> Dict:
        """Get yields for all maturities across specified countries."""
        if countries is None:
            countries = list(COUNTRY_DATA.keys())

        results = []
        timestamp = datetime.now().isoformat()

        for country_code in countries:
            if country_code not in COUNTRY_DATA:
                continue

            data = COUNTRY_DATA[country_code]
            yields = {}
            changes = {}

            for maturity in MATURITIES:
                base = data["base_yields"].get(maturity, data["base_yield"])
                current = self._add_volatility(base, 0.08)
                change = round(random.uniform(-0.10, 0.10), 2)
                yields[maturity] = current
                changes[maturity] = change

            yield_10y = yields.get("10Y", data["base_yield"])
            change_10y = changes.get("10Y", 0)

            results.append({
                "country_code": country_code,
                "country_name": data["name"],
                "flag": data["flag"],
                "currency": data["currency"],
                "central_bank": data["central_bank"],
                "rating": data["rating"],
                "region": data["region"],
                "yields": yields,
                "changes": changes,
                "yield_10y": yield_10y,
                "change_24h": change_10y,
                "trend": self._get_trend(change_10y),
                "timestamp": timestamp
            })

        # Sort by 10Y yield descending
        results.sort(key=lambda x: x["yield_10y"], reverse=True)

        return {
            "countries": results,
            "timestamp": timestamp,
            "maturities": MATURITIES
        }

    def get_yield_spreads(self, base_country: str = "US") -> Dict:
        """Calculate yield spreads vs a base country (default: US)."""
        global_yields = self.get_global_yields()
        countries = global_yields["countries"]

        base_data = next((c for c in countries if c["country_code"] == base_country), None)
        if not base_data:
            return {"error": f"Base country {base_country} not found"}

        spreads = []
        for country in countries:
            if country["country_code"] == base_country:
                continue

            country_spreads = {}
            for maturity in MATURITIES:
                base_yield = base_data["yields"].get(maturity, 0)
                country_yield = country["yields"].get(maturity, 0)
                spread_bps = round((country_yield - base_yield) * 100, 0)
                country_spreads[maturity] = spread_bps

            spreads.append({
                "country_code": country["country_code"],
                "country_name": country["country_name"],
                "flag": country["flag"],
                "spreads": country_spreads,
                "spread_10y": country_spreads.get("10Y", 0),
                "trend": "widening" if random.random() > 0.5 else "narrowing"
            })

        # Sort by 10Y spread
        spreads.sort(key=lambda x: x["spread_10y"])

        return {
            "base_country": base_country,
            "base_yields": base_data["yields"],
            "spreads": spreads,
            "timestamp": datetime.now().isoformat()
        }

    def get_yield_spread_matrix(self) -> Dict:
        """Create NxN matrix of 10Y yield spreads between all countries."""
        global_yields = self.get_global_yields()
        countries = global_yields["countries"]

        matrix = {}
        country_codes = [c["country_code"] for c in countries]

        for base in countries:
            row = {}
            for target in countries:
                if base["country_code"] == target["country_code"]:
                    row[target["country_code"]] = 0
                else:
                    spread = round((target["yield_10y"] - base["yield_10y"]) * 100, 0)
                    row[target["country_code"]] = spread
            matrix[base["country_code"]] = row

        return {
            "matrix": matrix,
            "country_codes": country_codes,
            "countries": {c["country_code"]: {"name": c["country_name"], "flag": c["flag"]} for c in countries},
            "timestamp": datetime.now().isoformat()
        }

    def get_sovereign_cds(self) -> Dict:
        """Get sovereign CDS spreads for risk assessment."""
        results = []
        timestamp = datetime.now().isoformat()

        for country_code, data in COUNTRY_DATA.items():
            base_cds = data["cds_spread"]
            current_cds = base_cds + random.randint(-5, 10)
            change = random.randint(-3, 5)

            # Risk level based on CDS spread
            if current_cds < 30:
                risk_level = "low"
            elif current_cds < 60:
                risk_level = "moderate"
            elif current_cds < 100:
                risk_level = "elevated"
            else:
                risk_level = "high"

            results.append({
                "country_code": country_code,
                "country_name": data["name"],
                "flag": data["flag"],
                "rating": data["rating"],
                "cds_spread": current_cds,
                "change_24h": change,
                "risk_level": risk_level,
                "timestamp": timestamp
            })

        # Sort by CDS spread (risk)
        results.sort(key=lambda x: x["cds_spread"])

        return {
            "sovereign_cds": results,
            "timestamp": timestamp
        }

    def get_yield_curves_comparison(self, countries: Optional[List[str]] = None) -> Dict:
        """Get full yield curve data for comparing multiple countries."""
        if countries is None:
            countries = ["US", "DE", "JP", "GB", "CN"]

        curves = []
        for country_code in countries:
            if country_code not in COUNTRY_DATA:
                continue

            data = COUNTRY_DATA[country_code]
            base_yields = data["base_yields"]

            # Generate full curve with interpolation
            curve_points = []
            maturities_full = ["3M", "6M", "1Y", "2Y", "3Y", "5Y", "7Y", "10Y", "20Y", "30Y"]

            # Interpolate values
            y2 = base_yields.get("2Y", base_yields.get("10Y", 3.0))
            y5 = base_yields.get("5Y", (y2 + base_yields.get("10Y", 3.0)) / 2)
            y10 = base_yields.get("10Y", 3.0)
            y30 = base_yields.get("30Y", y10 + 0.15)

            interpolated = {
                "3M": round(y2 + 0.25 + random.uniform(-0.1, 0.1), 2),
                "6M": round(y2 + 0.15 + random.uniform(-0.1, 0.1), 2),
                "1Y": round(y2 + 0.05 + random.uniform(-0.1, 0.1), 2),
                "2Y": self._add_volatility(y2, 0.05),
                "3Y": round((y2 + y5) / 2 + random.uniform(-0.05, 0.05), 2),
                "5Y": self._add_volatility(y5, 0.05),
                "7Y": round((y5 + y10) / 2 + random.uniform(-0.05, 0.05), 2),
                "10Y": self._add_volatility(y10, 0.05),
                "20Y": round((y10 + y30) / 2 + random.uniform(-0.05, 0.05), 2),
                "30Y": self._add_volatility(y30, 0.05)
            }

            for mat in maturities_full:
                curve_points.append({
                    "maturity": mat,
                    "yield_value": interpolated[mat]
                })

            # Calculate curve shape metrics
            spread_2_10 = round((interpolated["10Y"] - interpolated["2Y"]) * 100, 0)
            spread_10_30 = round((interpolated["30Y"] - interpolated["10Y"]) * 100, 0)

            if spread_2_10 < 0:
                curve_shape = "inverted"
            elif spread_2_10 < 30:
                curve_shape = "flat"
            else:
                curve_shape = "normal"

            curves.append({
                "country_code": country_code,
                "country_name": data["name"],
                "flag": data["flag"],
                "currency": data["currency"],
                "curve": curve_points,
                "spread_2_10": spread_2_10,
                "spread_10_30": spread_10_30,
                "curve_shape": curve_shape
            })

        return {
            "curves": curves,
            "maturities": ["3M", "6M", "1Y", "2Y", "3Y", "5Y", "7Y", "10Y", "20Y", "30Y"],
            "timestamp": datetime.now().isoformat()
        }

    def get_regional_summary(self) -> Dict:
        """Get bond market summary by region."""
        global_yields = self.get_global_yields()
        countries = global_yields["countries"]

        regions = {}
        for country in countries:
            region = country["region"]
            if region not in regions:
                regions[region] = {
                    "countries": [],
                    "avg_yield": 0,
                    "total_change": 0
                }
            regions[region]["countries"].append(country)

        # Calculate regional averages
        summary = []
        for region, data in regions.items():
            countries_in_region = data["countries"]
            avg_yield = sum(c["yield_10y"] for c in countries_in_region) / len(countries_in_region)
            avg_change = sum(c["change_24h"] for c in countries_in_region) / len(countries_in_region)

            summary.append({
                "region": region,
                "region_name": region.title(),
                "avg_yield_10y": round(avg_yield, 2),
                "avg_change_24h": round(avg_change, 2),
                "country_count": len(countries_in_region),
                "countries": [
                    {"code": c["country_code"], "flag": c["flag"], "yield": c["yield_10y"]}
                    for c in countries_in_region
                ]
            })

        return {
            "regions": summary,
            "timestamp": datetime.now().isoformat()
        }

    def get_bond_summary(self) -> Dict:
        """Get comprehensive bond market summary."""
        global_yields = self.get_global_yields()
        spreads = self.get_yield_spreads("US")
        cds = self.get_sovereign_cds()

        # Find extremes
        countries = global_yields["countries"]
        highest_yield = max(countries, key=lambda x: x["yield_10y"])
        lowest_yield = min(countries, key=lambda x: x["yield_10y"])
        highest_cds = max(cds["sovereign_cds"], key=lambda x: x["cds_spread"])
        lowest_cds = min(cds["sovereign_cds"], key=lambda x: x["cds_spread"])

        return {
            "summary": {
                "highest_yield": {
                    "country": highest_yield["country_name"],
                    "flag": highest_yield["flag"],
                    "yield": highest_yield["yield_10y"]
                },
                "lowest_yield": {
                    "country": lowest_yield["country_name"],
                    "flag": lowest_yield["flag"],
                    "yield": lowest_yield["yield_10y"]
                },
                "highest_risk": {
                    "country": highest_cds["country_name"],
                    "flag": highest_cds["flag"],
                    "cds": highest_cds["cds_spread"]
                },
                "lowest_risk": {
                    "country": lowest_cds["country_name"],
                    "flag": lowest_cds["flag"],
                    "cds": lowest_cds["cds_spread"]
                }
            },
            "global_yields": global_yields,
            "us_spreads": spreads,
            "sovereign_cds": cds,
            "timestamp": datetime.now().isoformat()
        }


# Singleton instance
global_bonds_service = GlobalBondsService()
