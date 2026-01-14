"""
Market Cycle Detection Service for Insight Flow
Determines current market cycle phase based on economic indicators
"""

from typing import Dict, List, Optional
from datetime import datetime
from enum import Enum
import random


class CyclePhase(str, Enum):
    RECOVERY = "recovery"
    EXPANSION = "expansion"
    PEAK = "peak"
    CONTRACTION = "contraction"


CYCLE_PHASES = {
    CyclePhase.RECOVERY: {
        "position": 0,
        "name": "Recovery",
        "color": "#22c55e",
        "icon": "seedling",
        "description": "Economy recovering from recession",
        "characteristics": [
            "GDP growth turning positive",
            "Unemployment starting to decline",
            "Central banks cutting rates",
            "Consumer confidence improving",
            "Early cyclical stocks outperforming"
        ],
        "sectors_favored": ["Consumer Discretionary", "Financials", "Real Estate", "Technology"],
        "sectors_avoided": ["Utilities", "Consumer Staples", "Healthcare"],
        "investment_strategy": "Risk-on: Favor growth stocks, cyclicals, small caps"
    },
    CyclePhase.EXPANSION: {
        "position": 1,
        "name": "Expansion",
        "color": "#3b82f6",
        "icon": "chart-line",
        "description": "Economy in full growth mode",
        "characteristics": [
            "Strong GDP growth",
            "Low and stable unemployment",
            "Rising corporate earnings",
            "Increasing consumer spending",
            "Credit conditions loosening"
        ],
        "sectors_favored": ["Technology", "Industrials", "Materials", "Communication Services"],
        "sectors_avoided": ["Utilities", "Consumer Staples"],
        "investment_strategy": "Maintain equity exposure, watch for overvaluation signs"
    },
    CyclePhase.PEAK: {
        "position": 2,
        "name": "Peak",
        "color": "#f59e0b",
        "icon": "mountain",
        "description": "Economy at maximum output",
        "characteristics": [
            "GDP growth slowing",
            "Inflation pressures building",
            "Central banks raising rates",
            "Labor market tightening",
            "Credit spreads widening"
        ],
        "sectors_favored": ["Energy", "Materials", "Healthcare", "Consumer Staples"],
        "sectors_avoided": ["Technology", "Consumer Discretionary", "Real Estate"],
        "investment_strategy": "Reduce risk: Shift to defensive sectors, increase cash"
    },
    CyclePhase.CONTRACTION: {
        "position": 3,
        "name": "Contraction",
        "color": "#ef4444",
        "icon": "chart-line-down",
        "description": "Economy in recession/slowdown",
        "characteristics": [
            "Negative or slow GDP growth",
            "Rising unemployment",
            "Falling corporate earnings",
            "Consumer confidence declining",
            "Credit conditions tightening"
        ],
        "sectors_favored": ["Utilities", "Consumer Staples", "Healthcare", "Gold"],
        "sectors_avoided": ["Financials", "Consumer Discretionary", "Industrials"],
        "investment_strategy": "Defensive: Bonds, dividend stocks, cash, gold"
    }
}


class MarketCycleService:
    def __init__(self):
        self._last_calculation = None
        self._cached_result = None

    def _calculate_cycle_score(self, indicators: Dict) -> Dict[CyclePhase, float]:
        """Calculate probability score for each cycle phase based on indicators."""
        scores = {phase: 0.0 for phase in CyclePhase}

        gdp_growth = indicators.get("gdp_growth", 2.0)
        unemployment = indicators.get("unemployment", 4.0)
        inflation = indicators.get("inflation", 2.5)
        yield_curve_spread = indicators.get("yield_curve_spread", 0.5)
        vix = indicators.get("vix", 18)
        credit_spread = indicators.get("credit_spread", 1.5)
        pmi = indicators.get("pmi", 52)

        # Recovery signals
        if gdp_growth > 0 and gdp_growth < 2.5:
            scores[CyclePhase.RECOVERY] += 0.3
        if unemployment > 5 and unemployment < 7:
            scores[CyclePhase.RECOVERY] += 0.2
        if yield_curve_spread > 0.5:
            scores[CyclePhase.RECOVERY] += 0.2
        if pmi > 48 and pmi < 52:
            scores[CyclePhase.RECOVERY] += 0.15

        # Expansion signals
        if gdp_growth >= 2.5 and gdp_growth < 4:
            scores[CyclePhase.EXPANSION] += 0.35
        if unemployment < 5:
            scores[CyclePhase.EXPANSION] += 0.25
        if vix < 18:
            scores[CyclePhase.EXPANSION] += 0.15
        if pmi > 52 and pmi < 58:
            scores[CyclePhase.EXPANSION] += 0.2

        # Peak signals
        if gdp_growth >= 3.5:
            scores[CyclePhase.PEAK] += 0.2
        if unemployment < 4:
            scores[CyclePhase.PEAK] += 0.2
        if inflation > 3:
            scores[CyclePhase.PEAK] += 0.25
        if yield_curve_spread < 0.3 and yield_curve_spread > 0:
            scores[CyclePhase.PEAK] += 0.2
        if pmi > 58:
            scores[CyclePhase.PEAK] += 0.15

        # Contraction signals
        if gdp_growth < 1:
            scores[CyclePhase.CONTRACTION] += 0.3
        if yield_curve_spread < 0:
            scores[CyclePhase.CONTRACTION] += 0.25
        if vix > 25:
            scores[CyclePhase.CONTRACTION] += 0.2
        if credit_spread > 2.5:
            scores[CyclePhase.CONTRACTION] += 0.15
        if pmi < 48:
            scores[CyclePhase.CONTRACTION] += 0.2

        # Normalize scores
        total = sum(scores.values()) or 1
        return {phase: score / total for phase, score in scores.items()}

    def determine_cycle_phase(self, indicators: Optional[Dict] = None) -> Dict:
        """Determine current market cycle phase based on economic indicators."""

        if indicators is None:
            indicators = self._get_current_indicators()

        scores = self._calculate_cycle_score(indicators)

        # Find dominant phase
        dominant_phase = max(scores, key=scores.get)
        confidence = scores[dominant_phase]

        phase_info = CYCLE_PHASES[dominant_phase]

        # Calculate position on cycle (0-360 degrees for visualization)
        base_position = phase_info["position"] * 90
        # Add variation within the phase based on scores
        position_offset = (1 - confidence) * 45
        cycle_position = base_position + position_offset

        return {
            "current_phase": dominant_phase.value,
            "phase_name": phase_info["name"],
            "phase_color": phase_info["color"],
            "description": phase_info["description"],
            "confidence": round(confidence * 100, 1),
            "cycle_position": round(cycle_position, 1),
            "characteristics": phase_info["characteristics"],
            "sectors_favored": phase_info["sectors_favored"],
            "sectors_avoided": phase_info["sectors_avoided"],
            "investment_strategy": phase_info["investment_strategy"],
            "all_scores": {phase.value: round(score * 100, 1) for phase, score in scores.items()},
            "indicators_used": indicators,
            "timestamp": datetime.now().isoformat()
        }

    def _get_current_indicators(self) -> Dict:
        """Get current economic indicators (simulated for now)."""
        return {
            "gdp_growth": round(2.5 + random.uniform(-0.5, 0.5), 1),
            "unemployment": round(3.8 + random.uniform(-0.3, 0.3), 1),
            "inflation": round(3.2 + random.uniform(-0.3, 0.3), 1),
            "yield_curve_spread": round(0.35 + random.uniform(-0.2, 0.2), 2),
            "vix": round(16 + random.uniform(-3, 5), 1),
            "credit_spread": round(1.4 + random.uniform(-0.2, 0.3), 2),
            "pmi": round(51 + random.uniform(-2, 3), 1)
        }

    def get_cycle_history(self, months: int = 12) -> List[Dict]:
        """Get historical cycle phases for the past N months."""
        history = []
        phases = list(CyclePhase)

        for i in range(months):
            # Simulate historical progression
            month_offset = months - i
            phase_index = (4 - (month_offset // 4)) % 4
            phase = phases[phase_index]

            history.append({
                "month": month_offset,
                "phase": phase.value,
                "phase_name": CYCLE_PHASES[phase]["name"],
                "color": CYCLE_PHASES[phase]["color"]
            })

        return list(reversed(history))

    def get_all_phases(self) -> Dict:
        """Get information about all cycle phases."""
        return {
            "phases": [
                {
                    "phase": phase.value,
                    **CYCLE_PHASES[phase]
                }
                for phase in CyclePhase
            ]
        }

    def get_cycle_transitions(self) -> Dict:
        """Get typical transition patterns between cycle phases."""
        return {
            "transitions": [
                {
                    "from": "recovery",
                    "to": "expansion",
                    "typical_duration_months": "12-18",
                    "trigger_signals": ["Sustained GDP growth > 2%", "Unemployment < 5%", "PMI > 52"]
                },
                {
                    "from": "expansion",
                    "to": "peak",
                    "typical_duration_months": "24-48",
                    "trigger_signals": ["Inflation rising", "Fed tightening", "Yield curve flattening"]
                },
                {
                    "from": "peak",
                    "to": "contraction",
                    "typical_duration_months": "6-12",
                    "trigger_signals": ["GDP slowdown", "Yield curve inversion", "Credit spread widening"]
                },
                {
                    "from": "contraction",
                    "to": "recovery",
                    "typical_duration_months": "6-18",
                    "trigger_signals": ["Fed cutting rates", "PMI bottoming", "Credit easing"]
                }
            ],
            "average_full_cycle_years": "7-10"
        }


# Singleton instance
market_cycle_service = MarketCycleService()
