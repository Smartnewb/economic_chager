"""
Investment Cycle Theories Service for Insight Flow
Implements Howard Marks, Ray Dalio, and Kostolany cycle models
"""

from typing import Dict, List, Optional
from datetime import datetime
import random
import math


class CycleTheoriesService:
    def __init__(self):
        pass

    def get_howard_marks_pendulum(self) -> Dict:
        """
        Howard Marks' Market Pendulum Theory
        Markets swing between fear and greed, never stopping at the center
        """
        # Calculate pendulum position based on market indicators
        # Ranges from -100 (extreme fear) to +100 (extreme greed)
        # Simulating based on VIX-like sentiment

        vix_level = 16 + random.uniform(-4, 8)

        # Map VIX to pendulum position
        # Low VIX (10-15) = greed side (+)
        # Normal VIX (15-20) = near center
        # High VIX (25+) = fear side (-)
        if vix_level < 12:
            position = 80 + random.uniform(0, 15)  # Extreme greed
        elif vix_level < 15:
            position = 50 + random.uniform(0, 25)  # Greed
        elif vix_level < 20:
            position = random.uniform(-20, 20)  # Near center
        elif vix_level < 25:
            position = -30 + random.uniform(-20, 10)  # Fear
        else:
            position = -70 + random.uniform(-20, 10)  # Extreme fear

        position = max(-100, min(100, position))

        # Determine zone
        if position > 60:
            zone = "extreme_greed"
            zone_name = "Extreme Greed"
            zone_description = "Time to be very cautious - sell into strength"
            action = "REDUCE RISK"
            action_color = "#ef4444"
        elif position > 30:
            zone = "greed"
            zone_name = "Greed"
            zone_description = "Market is optimistic - be selective, don't chase"
            action = "BE SELECTIVE"
            action_color = "#f59e0b"
        elif position > -30:
            zone = "neutral"
            zone_name = "Neutral"
            zone_description = "Market is balanced - stick to your investment plan"
            action = "STAY DISCIPLINED"
            action_color = "#3b82f6"
        elif position > -60:
            zone = "fear"
            zone_name = "Fear"
            zone_description = "Market is pessimistic - opportunities emerging"
            action = "ACCUMULATE"
            action_color = "#22c55e"
        else:
            zone = "extreme_fear"
            zone_name = "Extreme Fear"
            zone_description = "Time to be greedy when others are fearful"
            action = "BUY AGGRESSIVELY"
            action_color = "#10b981"

        return {
            "theory": "Howard Marks Pendulum",
            "position": round(position, 1),
            "zone": zone,
            "zone_name": zone_name,
            "zone_description": zone_description,
            "action": action,
            "action_color": action_color,
            "key_insight": "Be fearful when others are greedy, and greedy when others are fearful.",
            "indicators": {
                "vix_proxy": round(vix_level, 1),
                "sentiment_score": round(50 + position / 2, 1)
            },
            "timestamp": datetime.now().isoformat()
        }

    def get_ray_dalio_cycles(self) -> Dict:
        """
        Ray Dalio's Debt Cycles Theory
        Short-term debt cycle (5-8 years) and Long-term debt cycle (75-100 years)
        """
        # Short-term cycle position (0-100)
        # Simulating based on credit conditions and economic growth
        short_cycle_year = random.uniform(5, 7)  # Where we are in the 5-8 year cycle
        short_position = (short_cycle_year / 8) * 100

        # Long-term cycle position
        # We're roughly 14 years into the cycle from 2008
        long_cycle_year = 14 + random.uniform(-1, 2)
        long_position = (long_cycle_year / 80) * 100  # Assuming 80 year cycle

        # Determine short-term phase
        if short_position < 25:
            short_phase = "early_expansion"
            short_phase_name = "Early Expansion"
            short_description = "Credit is growing, economy accelerating"
        elif short_position < 50:
            short_phase = "late_expansion"
            short_phase_name = "Late Expansion"
            short_description = "Credit peaking, growth still positive but slowing"
        elif short_position < 75:
            short_phase = "early_contraction"
            short_phase_name = "Early Contraction"
            short_description = "Credit tightening, deleveraging beginning"
        else:
            short_phase = "late_contraction"
            short_phase_name = "Late Contraction"
            short_description = "Debt restructuring, preparing for new cycle"

        # Determine long-term phase
        if long_position < 20:
            long_phase = "accumulation"
            long_phase_name = "Debt Accumulation"
            long_description = "Debt levels rising from low base"
        elif long_position < 50:
            long_phase = "bubble"
            long_phase_name = "Bubble Formation"
            long_description = "Debt growing faster than income, asset bubbles forming"
        elif long_position < 70:
            long_phase = "deleveraging"
            long_phase_name = "Deleveraging"
            long_description = "Painful debt reduction, deflationary pressures"
        else:
            long_phase = "recovery"
            long_phase_name = "Beautiful Deleveraging"
            long_description = "Balanced debt reduction with growth"

        return {
            "theory": "Ray Dalio Debt Cycles",
            "short_term_cycle": {
                "position": round(short_position, 1),
                "phase": short_phase,
                "phase_name": short_phase_name,
                "description": short_description,
                "typical_duration": "5-8 years"
            },
            "long_term_cycle": {
                "position": round(long_position, 1),
                "phase": long_phase,
                "phase_name": long_phase_name,
                "description": long_description,
                "typical_duration": "75-100 years"
            },
            "key_insight": "The economy works like a machine driven by credit/debt cycles.",
            "all_weather_allocation": {
                "stocks": 30,
                "long_term_bonds": 40,
                "intermediate_bonds": 15,
                "gold": 7.5,
                "commodities": 7.5
            },
            "timestamp": datetime.now().isoformat()
        }

    def get_kostolany_egg(self) -> Dict:
        """
        André Kostolany's Egg Model
        Market moves through accumulation, markup, distribution, markdown
        """
        # Calculate position on the egg (0-360 degrees)
        # Use market indicators to determine position

        # Simulating based on sentiment and volume patterns
        base_position = random.uniform(0, 360)

        # Determine phase based on position
        if base_position < 90:
            phase = "accumulation"
            phase_name = "Accumulation (A)"
            phase_angle = base_position
            description = "Smart money buying quietly. Low volume, boring market."
            investor_type = "Firm Hands (Smart Money)"
            action = "BUY"
            action_color = "#22c55e"
        elif base_position < 180:
            phase = "markup"
            phase_name = "Markup (B)"
            phase_angle = base_position
            description = "Price rising on increasing volume. Public attention growing."
            investor_type = "Transition Phase"
            action = "HOLD"
            action_color = "#3b82f6"
        elif base_position < 270:
            phase = "distribution"
            phase_name = "Distribution (C)"
            phase_angle = base_position
            description = "Smart money selling to weak hands. High volume, euphoria."
            investor_type = "Weak Hands (Retail)"
            action = "SELL"
            action_color = "#ef4444"
        else:
            phase = "markdown"
            phase_name = "Markdown (D)"
            phase_angle = base_position
            description = "Price falling, panic selling. Prepare for next accumulation."
            investor_type = "Transition to Firm Hands"
            action = "WAIT"
            action_color = "#f59e0b"

        return {
            "theory": "Kostolany Egg Model",
            "position": round(base_position, 1),
            "phase": phase,
            "phase_name": phase_name,
            "description": description,
            "investor_type": investor_type,
            "action": action,
            "action_color": action_color,
            "key_insight": "Trend = Money + Psychology. Buy from weak hands, sell to weak hands.",
            "phases": [
                {"name": "Accumulation (A)", "angle_start": 0, "angle_end": 90, "color": "#22c55e"},
                {"name": "Markup (B)", "angle_start": 90, "angle_end": 180, "color": "#3b82f6"},
                {"name": "Distribution (C)", "angle_start": 180, "angle_end": 270, "color": "#ef4444"},
                {"name": "Markdown (D)", "angle_start": 270, "angle_end": 360, "color": "#f59e0b"}
            ],
            "liquidity_score": round(random.uniform(40, 70), 1),
            "psychology_score": round(random.uniform(30, 80), 1),
            "timestamp": datetime.now().isoformat()
        }

    def get_all_theories(self) -> Dict:
        """Get analysis from all three cycle theories."""
        return {
            "howard_marks": self.get_howard_marks_pendulum(),
            "ray_dalio": self.get_ray_dalio_cycles(),
            "kostolany": self.get_kostolany_egg(),
            "combined_signal": self._calculate_combined_signal(),
            "timestamp": datetime.now().isoformat()
        }

    def _calculate_combined_signal(self) -> Dict:
        """Combine all theories into a single signal."""
        marks = self.get_howard_marks_pendulum()
        dalio = self.get_ray_dalio_cycles()
        kostolany = self.get_kostolany_egg()

        # Score each theory's signal
        marks_score = -marks["position"] / 100  # Inverted: fear = buy signal
        dalio_score = 1 - (dalio["short_term_cycle"]["position"] / 100)  # Late cycle = caution
        kostolany_score = 1 if kostolany["phase"] == "accumulation" else (
            0.5 if kostolany["phase"] in ["markup", "markdown"] else 0
        )

        combined = (marks_score + dalio_score + kostolany_score) / 3

        if combined > 0.6:
            signal = "BULLISH"
            signal_color = "#22c55e"
            recommendation = "Increase equity exposure"
        elif combined > 0.3:
            signal = "NEUTRAL-BULLISH"
            signal_color = "#4ade80"
            recommendation = "Maintain positions, selective buying"
        elif combined > -0.3:
            signal = "NEUTRAL"
            signal_color = "#3b82f6"
            recommendation = "Stay balanced, rebalance as needed"
        elif combined > -0.6:
            signal = "NEUTRAL-BEARISH"
            signal_color = "#f59e0b"
            recommendation = "Reduce risk, increase cash"
        else:
            signal = "BEARISH"
            signal_color = "#ef4444"
            recommendation = "Defensive positioning"

        return {
            "score": round(combined * 100, 1),
            "signal": signal,
            "signal_color": signal_color,
            "recommendation": recommendation
        }


# Singleton instance
cycle_theories_service = CycleTheoriesService()
