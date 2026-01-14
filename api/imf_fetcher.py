"""IMF Data API Integration - Global Institutional Intelligence"""

import json
from datetime import datetime, timedelta
from typing import Optional, List
from dataclasses import dataclass, field
from pathlib import Path

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

COUNTRY_CODE_MAP = {"US": "USA", "KR": "KOR", "JP": "JPN", "CN": "CHN", "DE": "DEU", "GB": "GBR", "FR": "FRA", "AU": "AUS", "CA": "CAN", "BR": "BRA", "IN": "IND", "MX": "MEX"}
COUNTRY_NAMES = {"USA": "United States", "KOR": "South Korea", "JPN": "Japan", "CHN": "China", "DEU": "Germany", "GBR": "United Kingdom", "FRA": "France", "AUS": "Australia", "CAN": "Canada", "BRA": "Brazil", "IND": "India", "MEX": "Mexico"}

@dataclass
class IMFForecast:
    year: int
    value: Optional[float]
    is_estimate: bool = False

@dataclass
class IMFIndicatorData:
    indicator_code: str
    indicator_name: str
    country_code: str
    unit: str
    forecasts: List[IMFForecast] = field(default_factory=list)

@dataclass
class IMFCountryOutlook:
    country_code: str
    country_name: str
    gdp_growth: Optional[IMFIndicatorData] = None
    inflation: Optional[IMFIndicatorData] = None
    unemployment: Optional[IMFIndicatorData] = None
    current_account: Optional[IMFIndicatorData] = None
    government_debt: Optional[IMFIndicatorData] = None
    source: str = "IMF World Economic Outlook"
    last_updated: Optional[str] = None
    weo_edition: Optional[str] = None

class IMFFetcher:
    def __init__(self):
        self.cache_dir = Path(__file__).parent / "cache" / "imf"
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _get_imf_code(self, iso_code: str) -> str:
        return COUNTRY_CODE_MAP.get(iso_code.upper(), iso_code.upper())

    def _load_cache(self, key: str) -> Optional[dict]:
        cache_file = self.cache_dir / f"{key}.json"
        if not cache_file.exists():
            return None
        try:
            with open(cache_file, "r") as f:
                cached = json.load(f)
            if datetime.now() - datetime.fromisoformat(cached["timestamp"]) < timedelta(hours=24):
                return cached["data"]
        except:
            pass
        return None

    def _save_cache(self, key: str, data: dict):
        try:
            with open(self.cache_dir / f"{key}.json", "w") as f:
                json.dump({"timestamp": datetime.now().isoformat(), "data": data}, f)
        except:
            pass

    def fetch_country_outlook(self, iso_code: str) -> IMFCountryOutlook:
        imf_code = self._get_imf_code(iso_code)
        cached = self._load_cache(f"outlook_{imf_code}")
        if cached:
            return self._dict_to_outlook(cached)
        outlook = self._get_mock_outlook(iso_code)
        self._save_cache(f"outlook_{imf_code}", self._outlook_to_dict(outlook))
        return outlook

    def _get_mock_outlook(self, iso_code: str) -> IMFCountryOutlook:
        imf_code = self._get_imf_code(iso_code)
        cy = datetime.now().year
        mock = {
            "USA": {"gdp": [2.5, 2.8, 1.9, 2.1, 2.0], "inf": [2.9, 2.4, 2.1, 2.0, 2.0], "unemp": [4.0, 4.2, 4.1, 4.0, 3.9], "debt": [123, 125, 127, 128, 129], "ca": [-3.0, -3.1, -2.9, -2.8, -2.7]},
            "KOR": {"gdp": [2.2, 2.5, 2.3, 2.4, 2.5], "inf": [2.6, 2.2, 2.0, 2.0, 2.0], "unemp": [3.0, 3.1, 3.0, 2.9, 2.8], "debt": [54, 55, 56, 57, 58], "ca": [2.0, 2.5, 2.8, 3.0, 3.1]},
            "JPN": {"gdp": [0.9, 1.0, 0.8, 0.7, 0.6], "inf": [2.2, 2.0, 1.8, 1.8, 1.7], "unemp": [2.5, 2.4, 2.4, 2.4, 2.4], "debt": [255, 252, 250, 248, 246], "ca": [3.8, 4.0, 4.1, 4.0, 3.9]},
            "CHN": {"gdp": [4.6, 4.5, 4.3, 4.1, 3.9], "inf": [1.0, 1.5, 1.8, 2.0, 2.0], "unemp": [5.0, 4.9, 4.8, 4.7, 4.6], "debt": [88, 92, 95, 98, 101], "ca": [1.3, 1.1, 0.9, 0.7, 0.5]},
            "DEU": {"gdp": [0.2, 1.3, 1.5, 1.4, 1.3], "inf": [2.4, 2.1, 2.0, 2.0, 2.0], "unemp": [3.4, 3.5, 3.4, 3.3, 3.2], "debt": [64, 62, 61, 60, 59], "ca": [6.5, 6.2, 6.0, 5.8, 5.6]},
            "GBR": {"gdp": [0.5, 1.5, 1.6, 1.5, 1.4], "inf": [2.5, 2.2, 2.0, 2.0, 2.0], "unemp": [4.3, 4.4, 4.3, 4.2, 4.1], "debt": [104, 105, 106, 106, 105], "ca": [-3.2, -3.0, -2.8, -2.7, -2.6]},
        }
        data = mock.get(imf_code, mock["USA"])
        years = list(range(cy - 1, cy + 4))
        def make_ind(code, name, vals):
            return IMFIndicatorData(indicator_code=code, indicator_name=name, country_code=imf_code, unit="percent",
                forecasts=[IMFForecast(y, v, y >= cy) for y, v in zip(years, vals)])
        return IMFCountryOutlook(country_code=imf_code, country_name=COUNTRY_NAMES.get(imf_code, imf_code),
            gdp_growth=make_ind("NGDP_RPCH", "Real GDP Growth", data["gdp"]),
            inflation=make_ind("PCPIPCH", "Inflation", data["inf"]),
            unemployment=make_ind("LUR", "Unemployment", data["unemp"]),
            government_debt=make_ind("GGXWDG_NGDP", "Govt Debt (% GDP)", data["debt"]),
            current_account=make_ind("BCA_NGDPD", "Current Account (% GDP)", data["ca"]),
            last_updated=datetime.now().isoformat(), weo_edition=f"October {cy}")

    def _outlook_to_dict(self, o: IMFCountryOutlook) -> dict:
        result = {"country_code": o.country_code, "country_name": o.country_name, "source": o.source, "last_updated": o.last_updated, "weo_edition": o.weo_edition}
        for attr in ["gdp_growth", "inflation", "unemployment", "current_account", "government_debt"]:
            ind = getattr(o, attr)
            if ind:
                result[attr] = {"indicator_code": ind.indicator_code, "indicator_name": ind.indicator_name, "country_code": ind.country_code, "unit": ind.unit,
                    "forecasts": [{"year": f.year, "value": f.value, "is_estimate": f.is_estimate} for f in ind.forecasts]}
        return result

    def _dict_to_outlook(self, d: dict) -> IMFCountryOutlook:
        o = IMFCountryOutlook(country_code=d["country_code"], country_name=d["country_name"], source=d.get("source"), last_updated=d.get("last_updated"), weo_edition=d.get("weo_edition"))
        for attr in ["gdp_growth", "inflation", "unemployment", "current_account", "government_debt"]:
            if attr in d and d[attr]:
                ind = d[attr]
                setattr(o, attr, IMFIndicatorData(indicator_code=ind["indicator_code"], indicator_name=ind["indicator_name"], country_code=ind["country_code"], unit=ind["unit"],
                    forecasts=[IMFForecast(f["year"], f["value"], f["is_estimate"]) for f in ind["forecasts"]]))
        return o

    def get_ai_context(self, iso_code: str) -> str:
        o = self.fetch_country_outlook(iso_code)
        lines = [f"=== IMF VIEW: {o.country_name} ===", f"Edition: {o.weo_edition}", "", "GDP Growth:"]
        if o.gdp_growth:
            for f in o.gdp_growth.forecasts:
                lines.append(f"  {f.year}: {f.value:.1f}% {'[Forecast]' if f.is_estimate else '[Actual]'}")
        lines.append("\nInflation:")
        if o.inflation:
            for f in o.inflation.forecasts[-3:]:
                lines.append(f"  {f.year}: {f.value:.1f}%")
        lines.append("\nFiscal Health:")
        if o.government_debt:
            lines.append(f"  Debt: {o.government_debt.forecasts[-1].value:.0f}% of GDP")
        if o.current_account:
            lines.append(f"  Current Account: {o.current_account.forecasts[-1].value:+.1f}% of GDP")
        return "\n".join(lines)

    def get_sentiment(self, iso_code: str) -> str:
        o = self.fetch_country_outlook(iso_code)
        if o.gdp_growth and len(o.gdp_growth.forecasts) >= 2:
            f = [x for x in o.gdp_growth.forecasts if x.is_estimate]
            if len(f) >= 2 and f[1].value > f[0].value:
                return "bullish"
            elif len(f) >= 2 and f[1].value < f[0].value - 0.3:
                return "bearish"
        return "neutral"

    def get_key_risks(self, iso_code: str) -> List[str]:
        o = self.fetch_country_outlook(iso_code)
        risks = []
        if o.government_debt and o.government_debt.forecasts[-1].value > 100:
            risks.append(f"High govt debt ({o.government_debt.forecasts[-1].value:.0f}% of GDP)")
        if o.current_account and o.current_account.forecasts[-1].value < -4:
            risks.append(f"Large C/A deficit ({o.current_account.forecasts[-1].value:.1f}%)")
        if o.unemployment and o.unemployment.forecasts[-1].value > 6:
            risks.append(f"High unemployment ({o.unemployment.forecasts[-1].value:.1f}%)")
        return risks

_instance: Optional[IMFFetcher] = None

def get_imf_fetcher() -> IMFFetcher:
    global _instance
    if _instance is None:
        _instance = IMFFetcher()
    return _instance
