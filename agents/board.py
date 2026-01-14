"""
AI Board of Directors - LangGraph Orchestration
Manages the multi-agent debate workflow with Investment Legends:
1. André Kostolany (Psychology & Liquidity)
2. Warren Buffett (Value & Interest Rates)
3. Charlie Munger (Risk & Rationality)
4. Ray Dalio (Macro Economic Cycles)
"""

import os
from typing import TypedDict, Annotated, Sequence
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langgraph.graph import StateGraph, END

from .personas import (
    PERSONAS,
    SYNTHESIS_PROMPT,
    BOND_PERSONAS,
    BOND_SYNTHESIS_PROMPT,
    FX_PERSONAS,
    FX_SYNTHESIS_PROMPT,
    STOCK_PERSONAS,
    STOCK_SYNTHESIS_PROMPT,
    POLICY_PERSONAS,
    POLICY_SYNTHESIS_PROMPT,
    COUNTRY_PERSONAS,
    COUNTRY_SYNTHESIS_PROMPT,
    ECONOMY_PERSONAS,
    ECONOMY_SYNTHESIS_PROMPT,
    WHALE_PERSONAS,
    WHALE_SYNTHESIS_PROMPT,
)

# Load environment variables
load_dotenv()

# Import macro fetcher for context enrichment
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "api"))
try:
    from macro_fetcher import get_macro_fetcher
    MACRO_FETCHER_AVAILABLE = True
except ImportError:
    MACRO_FETCHER_AVAILABLE = False


def get_macro_context() -> str:
    """
    Get macro environment context to enrich AI agent prompts.
    Returns formatted string with Buffett Indicator, yield curve, VIX, etc.
    """
    if not MACRO_FETCHER_AVAILABLE:
        return ""

    try:
        fetcher = get_macro_fetcher()
        context = fetcher.generate_ai_context()
        return f"\n\n{context}\n"
    except Exception as e:
        print(f"Warning: Could not fetch macro context: {e}")
        return ""

# Initialize the LLM
def get_llm():
    return ChatOpenAI(
        model=os.getenv("MODEL_NAME", "gpt-4o"),
        temperature=0.7,
        api_key=os.getenv("OPENAI_API_KEY"),
    )


# State definition for the graph
class BoardState(TypedDict):
    scenario: str
    kostolany_response: str
    buffett_response: str
    munger_response: str
    dalio_response: str
    synthesis: str


def create_agent_node(persona_key: str):
    """Factory function to create an agent node for the given persona."""
    persona = PERSONAS[persona_key]

    def agent_node(state: BoardState) -> dict:
        llm = get_llm()

        messages = [
            SystemMessage(content=persona["system_prompt"]),
            HumanMessage(content=f"""
Analyze the following macro-economic scenario and provide your investment perspective:

---
{state["scenario"]}
---

What is your assessment? What should investors consider?
"""),
        ]

        response = llm.invoke(messages)
        return {f"{persona_key}_response": response.content}

    return agent_node


def synthesis_node(state: BoardState) -> dict:
    """Synthesize all agent responses into a cohesive summary."""
    llm = get_llm()

    debate_summary = f"""
## 🥚 The Speculator Sage (Kostolany style) says:
{state["kostolany_response"]}

---

## 🏦 The Value Oracle (Buffett style) says:
{state["buffett_response"]}

---

## 📚 The Rational Critic (Munger style) says:
{state["munger_response"]}

---

## ⚙️ The Machine Thinker (Dalio style) says:
{state["dalio_response"]}
"""

    messages = [
        SystemMessage(content=SYNTHESIS_PROMPT),
        HumanMessage(content=debate_summary),
    ]

    response = llm.invoke(messages)
    return {"synthesis": response.content}


def build_board_graph() -> StateGraph:
    """Construct the LangGraph workflow for the board meeting."""

    # Create the graph
    workflow = StateGraph(BoardState)

    # Add agent nodes
    workflow.add_node("kostolany_agent", create_agent_node("kostolany"))
    workflow.add_node("buffett_agent", create_agent_node("buffett"))
    workflow.add_node("munger_agent", create_agent_node("munger"))
    workflow.add_node("dalio_agent", create_agent_node("dalio"))
    workflow.add_node("synthesizer", synthesis_node)

    # Set entry point - all agents run in parallel (conceptually)
    # In LangGraph, we chain them but they're independent
    workflow.set_entry_point("kostolany_agent")

    # Define edges - sequential for simplicity, but responses are independent
    workflow.add_edge("kostolany_agent", "buffett_agent")
    workflow.add_edge("buffett_agent", "munger_agent")
    workflow.add_edge("munger_agent", "dalio_agent")
    workflow.add_edge("dalio_agent", "synthesizer")
    workflow.add_edge("synthesizer", END)

    return workflow.compile()


def run_board_meeting(scenario: str) -> dict:
    """
    Execute a full board meeting debate on the given scenario.

    Args:
        scenario: The macro-economic situation to analyze

    Returns:
        dict with all agent responses and synthesis
    """
    graph = build_board_graph()

    initial_state = {
        "scenario": scenario,
        "kostolany_response": "",
        "buffett_response": "",
        "munger_response": "",
        "dalio_response": "",
        "synthesis": "",
    }

    result = graph.invoke(initial_state)
    return result


def format_board_output(result: dict) -> str:
    """Format the board meeting results for display."""
    output = []
    output.append("=" * 60)
    output.append("🏛️  THE AI BOARD OF DIRECTORS - MEETING TRANSCRIPT")
    output.append("=" * 60)
    output.append("")

    for persona_key in ["kostolany", "buffett", "munger", "dalio"]:
        persona = PERSONAS[persona_key]
        output.append(f"{persona['avatar']} {persona['name']} ({persona['style']} style):")
        output.append("-" * 40)
        output.append(result[f"{persona_key}_response"])
        output.append("")

    output.append("=" * 60)
    output.append(result["synthesis"])
    output.append("=" * 60)

    return "\n".join(output)


# ============================================
# BOND MARKET ANALYSIS - On-Demand AI Pattern
# ============================================

class BondAnalysisState(TypedDict):
    """State for bond market analysis."""
    yield_2y: float
    yield_10y: float
    spread: float
    is_inverted: bool
    context_message: str
    language: str  # "en", "ko", "zh", "ja"
    kostolany_response: str
    buffett_response: str
    munger_response: str
    dalio_response: str
    synthesis: str


def create_bond_agent_node(persona_key: str):
    """Factory function to create a bond-focused agent node."""
    persona = BOND_PERSONAS[persona_key]

    def agent_node(state: BondAnalysisState) -> dict:
        llm = get_llm()

        # Get language instruction
        lang = state.get("language", "en")
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(lang, LANGUAGE_INSTRUCTIONS["en"])

        messages = [
            SystemMessage(content=f"{persona['system_prompt']}\n\n**IMPORTANT**: {lang_instruction}"),
            HumanMessage(content=f"""
Analyze the current US Treasury Bond Market data:

---
## Current Yield Data:
- **2-Year Treasury Yield**: {state["yield_2y"]:.2f}%
- **10-Year Treasury Yield**: {state["yield_10y"]:.2f}%
- **10Y-2Y Spread**: {state["spread"]:.2f}% {"(INVERTED - Recession Warning!)" if state["is_inverted"] else "(Normal)"}

## Context:
{state["context_message"]}
---

What is your interpretation of this bond market data? What signals should investors pay attention to?

{lang_instruction}
"""),
        ]

        response = llm.invoke(messages)
        return {f"{persona_key}_response": response.content}

    return agent_node


def bond_synthesis_node(state: BondAnalysisState) -> dict:
    """Synthesize bond market analysis from all agents."""
    llm = get_llm()

    # Get language instruction
    lang = state.get("language", "en")
    lang_instruction = LANGUAGE_INSTRUCTIONS.get(lang, LANGUAGE_INSTRUCTIONS["en"])

    debate_summary = f"""
## Current Market Data:
- 2Y Yield: {state["yield_2y"]:.2f}%
- 10Y Yield: {state["yield_10y"]:.2f}%
- Spread: {state["spread"]:.2f}% {"(INVERTED)" if state["is_inverted"] else "(NORMAL)"}

---

## 🥚 The Speculator Sage (Kostolany style) says:
{state["kostolany_response"]}

---

## 🏦 The Value Oracle (Buffett style) says:
{state["buffett_response"]}

---

## 📚 The Rational Critic (Munger style) says:
{state["munger_response"]}

---

## ⚙️ The Machine Thinker (Dalio style) says:
{state["dalio_response"]}
"""

    messages = [
        SystemMessage(content=f"{BOND_SYNTHESIS_PROMPT}\n\n**IMPORTANT**: {lang_instruction}"),
        HumanMessage(content=f"{debate_summary}\n\n{lang_instruction}"),
    ]

    response = llm.invoke(messages)
    return {"synthesis": response.content}


def build_bond_analysis_graph() -> StateGraph:
    """Construct the LangGraph workflow for bond market analysis."""

    workflow = StateGraph(BondAnalysisState)

    # Add bond-focused agent nodes
    workflow.add_node("kostolany_agent", create_bond_agent_node("kostolany"))
    workflow.add_node("buffett_agent", create_bond_agent_node("buffett"))
    workflow.add_node("munger_agent", create_bond_agent_node("munger"))
    workflow.add_node("dalio_agent", create_bond_agent_node("dalio"))
    workflow.add_node("synthesizer", bond_synthesis_node)

    # Start with Kostolany (liquidity perspective), then Buffett, Munger, Dalio
    workflow.set_entry_point("kostolany_agent")

    workflow.add_edge("kostolany_agent", "buffett_agent")
    workflow.add_edge("buffett_agent", "munger_agent")
    workflow.add_edge("munger_agent", "dalio_agent")
    workflow.add_edge("dalio_agent", "synthesizer")
    workflow.add_edge("synthesizer", END)

    return workflow.compile()


def run_bond_analysis(
    yield_2y: float,
    yield_10y: float,
    spread: float,
    is_inverted: bool,
    selected_metric: str = "curve",
    language: str = "en",
) -> dict:
    """
    Execute bond market analysis with the AI board.

    Args:
        yield_2y: Current 2-Year Treasury yield
        yield_10y: Current 10-Year Treasury yield
        spread: 10Y - 2Y spread
        is_inverted: Whether the curve is inverted
        selected_metric: What the user is focusing on (2Y, 10Y, spread, curve)
        language: Response language ("en", "ko", "zh", "ja")

    Returns:
        dict with all agent responses and synthesis
    """
    graph = build_bond_analysis_graph()

    # Build context based on selected metric
    context_parts = []
    if selected_metric == "2Y":
        context_parts.append("The user is focused on the 2-Year yield, which reflects Fed policy expectations.")
    elif selected_metric == "10Y":
        context_parts.append("The user is focused on the 10-Year yield, the global benchmark for asset pricing.")
    elif selected_metric == "spread":
        context_parts.append("The user is focused on the yield curve spread, a key recession indicator.")
    else:
        context_parts.append("The user is looking at the full yield curve.")

    if is_inverted:
        context_parts.append("IMPORTANT: The yield curve is currently INVERTED (2Y > 10Y), which has historically preceded recessions.")

    if yield_2y > 4.5:
        context_parts.append(f"Note: Short-term rates at {yield_2y:.2f}% offer significant risk-free returns.")

    context_message = " ".join(context_parts)

    # Add macro environment context
    macro_context = get_macro_context()
    if macro_context:
        context_message += macro_context

    initial_state = {
        "yield_2y": yield_2y,
        "yield_10y": yield_10y,
        "spread": spread,
        "is_inverted": is_inverted,
        "context_message": context_message,
        "language": language,
        "kostolany_response": "",
        "buffett_response": "",
        "munger_response": "",
        "dalio_response": "",
        "synthesis": "",
    }

    result = graph.invoke(initial_state)
    return result


# ============================================
# FX MARKET ANALYSIS - On-Demand AI Pattern
# ============================================

class FXAnalysisState(TypedDict):
    """State for FX market analysis."""
    dollar_index: float
    dollar_trend: str
    selected_pair: str
    risk_sentiment: str
    context_message: str
    language: str  # "en", "ko", "zh", "ja"
    kostolany_response: str
    buffett_response: str
    munger_response: str
    dalio_response: str
    synthesis: str


def create_fx_agent_node(persona_key: str):
    """Factory function to create an FX-focused agent node."""
    persona = FX_PERSONAS[persona_key]

    def agent_node(state: FXAnalysisState) -> dict:
        llm = get_llm()

        # Get language instruction
        lang = state.get("language", "en")
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(lang, LANGUAGE_INSTRUCTIONS["en"])

        messages = [
            SystemMessage(content=f"{persona['system_prompt']}\n\n**IMPORTANT**: {lang_instruction}"),
            HumanMessage(content=f"""
Analyze the current FX/Currency Market data:

---
## Current Market Data:
- **Dollar Index (DXY)**: {state["dollar_index"]:.2f} ({state["dollar_trend"].upper()})
- **Focus Currency Pair**: {state["selected_pair"]}
- **Risk Sentiment**: {state["risk_sentiment"].replace("_", "-").upper()}

## Context:
{state["context_message"]}
---

What is your interpretation of this FX market data? What signals should investors pay attention to?

{lang_instruction}
"""),
        ]

        response = llm.invoke(messages)
        return {f"{persona_key}_response": response.content}

    return agent_node


def fx_synthesis_node(state: FXAnalysisState) -> dict:
    """Synthesize FX market analysis from all agents."""
    llm = get_llm()

    # Get language instruction
    lang = state.get("language", "en")
    lang_instruction = LANGUAGE_INSTRUCTIONS.get(lang, LANGUAGE_INSTRUCTIONS["en"])

    debate_summary = f"""
## Current Market Data:
- Dollar Index: {state["dollar_index"]:.2f} ({state["dollar_trend"]})
- Focus Pair: {state["selected_pair"]}
- Sentiment: {state["risk_sentiment"]}

---

## 🥚 The Speculator Sage (Kostolany style) says:
{state["kostolany_response"]}

---

## 🏦 The Value Oracle (Buffett style) says:
{state["buffett_response"]}

---

## 📚 The Rational Critic (Munger style) says:
{state["munger_response"]}

---

## ⚙️ The Machine Thinker (Dalio style) says:
{state["dalio_response"]}
"""

    messages = [
        SystemMessage(content=f"{FX_SYNTHESIS_PROMPT}\n\n**IMPORTANT**: {lang_instruction}"),
        HumanMessage(content=f"{debate_summary}\n\n{lang_instruction}"),
    ]

    response = llm.invoke(messages)
    return {"synthesis": response.content}


def build_fx_analysis_graph() -> StateGraph:
    """Construct the LangGraph workflow for FX market analysis."""

    workflow = StateGraph(FXAnalysisState)

    # Add FX-focused agent nodes
    workflow.add_node("kostolany_agent", create_fx_agent_node("kostolany"))
    workflow.add_node("buffett_agent", create_fx_agent_node("buffett"))
    workflow.add_node("munger_agent", create_fx_agent_node("munger"))
    workflow.add_node("dalio_agent", create_fx_agent_node("dalio"))
    workflow.add_node("synthesizer", fx_synthesis_node)

    # Start with Kostolany (liquidity perspective), then Buffett, Munger, Dalio
    workflow.set_entry_point("kostolany_agent")

    workflow.add_edge("kostolany_agent", "buffett_agent")
    workflow.add_edge("buffett_agent", "munger_agent")
    workflow.add_edge("munger_agent", "dalio_agent")
    workflow.add_edge("dalio_agent", "synthesizer")
    workflow.add_edge("synthesizer", END)

    return workflow.compile()


def run_fx_analysis(
    dollar_index: float,
    dollar_trend: str,
    selected_pair: str,
    risk_sentiment: str,
    major_pairs: list = None,
    language: str = "en",
) -> dict:
    """
    Execute FX market analysis with the AI board.

    Args:
        dollar_index: Current DXY value
        dollar_trend: "strong", "weak", or "neutral"
        selected_pair: Currency pair user is focusing on
        risk_sentiment: "risk_on", "risk_off", or "neutral"
        major_pairs: List of major currency pair data
        language: Response language ("en", "ko", "zh", "ja")

    Returns:
        dict with all agent responses and synthesis
    """
    graph = build_fx_analysis_graph()

    # Build context based on market conditions
    context_parts = []

    # Dollar trend context
    if dollar_trend == "strong":
        context_parts.append("The dollar is showing strength. Capital is flowing into USD assets.")
    elif dollar_trend == "weak":
        context_parts.append("The dollar is weakening. Capital may be flowing to EM and risk assets.")
    else:
        context_parts.append("The dollar is in neutral territory, awaiting direction.")

    # Risk sentiment context
    if risk_sentiment == "risk_on":
        context_parts.append("Risk sentiment is positive - investors are seeking yield in riskier assets.")
    elif risk_sentiment == "risk_off":
        context_parts.append("Risk-off mode - investors are seeking safety in USD and bonds.")

    # Build major pairs summary for context
    if major_pairs:
        pairs_summary = []
        selected_pair_data = None
        for pair in major_pairs:
            pair_name = pair.get("pair", "")
            rate = pair.get("rate", 0)
            change = pair.get("change24h", 0)
            direction = "+" if change >= 0 else ""
            pairs_summary.append(f"{pair_name}: {rate:.2f} ({direction}{change:.2f}%)")
            if pair_name == selected_pair:
                selected_pair_data = pair

        context_parts.append(f"Major pairs snapshot: {', '.join(pairs_summary)}.")

        # Add detailed analysis for the selected pair
        if selected_pair_data:
            rate = selected_pair_data.get("rate", 0)
            change = selected_pair_data.get("change24h", 0)
            high = selected_pair_data.get("high24h", rate)
            low = selected_pair_data.get("low24h", rate)
            range_pct = ((high - low) / low * 100) if low > 0 else 0

            context_parts.append(
                f"FOCUS PAIR {selected_pair}: Current rate {rate:.2f}, "
                f"24h change {change:+.2f}%, 24h range {low:.2f}-{high:.2f} ({range_pct:.2f}% volatility)."
            )

    # Pair-specific analysis context
    if "JPY" in selected_pair:
        context_parts.append("JPY FOCUS: Watch for carry trade dynamics, BoJ policy signals, and intervention risk from MoF.")
        if major_pairs:
            jpy_pair = next((p for p in major_pairs if "JPY" in p.get("pair", "")), None)
            if jpy_pair and jpy_pair.get("rate", 0) > 155:
                context_parts.append("WARNING: USD/JPY above 155 - historically sensitive level for BoJ intervention.")
    elif "EUR" in selected_pair:
        context_parts.append("EUR FOCUS: ECB vs Fed policy divergence is key. Watch for rate differential and capital flows.")
    elif "CNY" in selected_pair:
        context_parts.append("CNY FOCUS: Geopolitical tensions and PBOC fixing mechanism are critical factors.")
    elif "KRW" in selected_pair:
        context_parts.append("KRW FOCUS: BoK policy, semiconductor export trends, and regional risk sentiment are key drivers.")
    elif "GBP" in selected_pair:
        context_parts.append("GBP FOCUS: BoE policy path and UK economic outlook relative to US are primary drivers.")

    # DXY level context
    if dollar_index > 105:
        context_parts.append(f"DXY at {dollar_index:.2f} is historically elevated - watch for intervention risk.")

    context_message = " ".join(context_parts)

    # Add macro environment context
    macro_context = get_macro_context()
    if macro_context:
        context_message += macro_context

    initial_state = {
        "dollar_index": dollar_index,
        "dollar_trend": dollar_trend,
        "selected_pair": selected_pair,
        "risk_sentiment": risk_sentiment,
        "context_message": context_message,
        "language": language,
        "kostolany_response": "",
        "buffett_response": "",
        "munger_response": "",
        "dalio_response": "",
        "synthesis": "",
    }

    fx_result = graph.invoke(initial_state)
    return fx_result


# ============================================
# STOCK MARKET ANALYSIS - On-Demand AI Pattern
# ============================================

class StockAnalysisState(TypedDict):
    """State for stock market analysis."""
    us_market_change: float
    vix_level: float
    vix_status: str
    top_sector: str
    top_sector_change: float
    bottom_sector: str
    bottom_sector_change: float
    context_message: str
    language: str  # "en", "ko", "zh", "ja"
    kostolany_response: str
    buffett_response: str
    munger_response: str
    dalio_response: str
    synthesis: str


def create_stock_agent_node(persona_key: str):
    """Factory function to create a stock-focused agent node."""
    persona = STOCK_PERSONAS[persona_key]

    def agent_node(state: StockAnalysisState) -> dict:
        llm = get_llm()

        # Get language instruction
        lang = state.get("language", "en")
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(lang, LANGUAGE_INSTRUCTIONS["en"])

        messages = [
            SystemMessage(content=f"{persona['system_prompt']}\n\n**IMPORTANT**: {lang_instruction}"),
            HumanMessage(content=f"""
Analyze the current STOCK MARKET data:

---
## Current Market Data:
- **US Market Performance**: {state["us_market_change"]:+.2f}% today
- **VIX (Fear Index)**: {state["vix_level"]:.1f} ({state["vix_status"].upper()})
- **Hot Sector**: {state["top_sector"]} ({state["top_sector_change"]:+.2f}%)
- **Cold Sector**: {state["bottom_sector"]} ({state["bottom_sector_change"]:+.2f}%)

## Context:
{state["context_message"]}
---

What is your interpretation of this stock market data? What should investors consider?

{lang_instruction}
"""),
        ]

        response = llm.invoke(messages)
        return {f"{persona_key}_response": response.content}

    return agent_node


def stock_synthesis_node(state: StockAnalysisState) -> dict:
    """Synthesize stock market analysis from all agents."""
    llm = get_llm()

    # Get language instruction
    lang = state.get("language", "en")
    lang_instruction = LANGUAGE_INSTRUCTIONS.get(lang, LANGUAGE_INSTRUCTIONS["en"])

    debate_summary = f"""
## Current Market Data:
- US Markets: {state["us_market_change"]:+.2f}%
- VIX: {state["vix_level"]:.1f} ({state["vix_status"]})
- Leading: {state["top_sector"]} ({state["top_sector_change"]:+.2f}%)
- Lagging: {state["bottom_sector"]} ({state["bottom_sector_change"]:+.2f}%)

---

## 🥚 The Speculator Sage (Kostolany style) says:
{state["kostolany_response"]}

---

## 🏦 The Value Oracle (Buffett style) says:
{state["buffett_response"]}

---

## 📚 The Rational Critic (Munger style) says:
{state["munger_response"]}

---

## ⚙️ The Machine Thinker (Dalio style) says:
{state["dalio_response"]}
"""

    messages = [
        SystemMessage(content=f"{STOCK_SYNTHESIS_PROMPT}\n\n**IMPORTANT**: {lang_instruction}"),
        HumanMessage(content=f"{debate_summary}\n\n{lang_instruction}"),
    ]

    response = llm.invoke(messages)
    return {"synthesis": response.content}


def build_stock_analysis_graph() -> StateGraph:
    """Construct the LangGraph workflow for stock market analysis."""

    workflow = StateGraph(StockAnalysisState)

    # Add stock-focused agent nodes
    workflow.add_node("kostolany_agent", create_stock_agent_node("kostolany"))
    workflow.add_node("buffett_agent", create_stock_agent_node("buffett"))
    workflow.add_node("munger_agent", create_stock_agent_node("munger"))
    workflow.add_node("dalio_agent", create_stock_agent_node("dalio"))
    workflow.add_node("synthesizer", stock_synthesis_node)

    # Start with Kostolany (liquidity perspective), then Buffett, Munger, Dalio
    workflow.set_entry_point("kostolany_agent")

    workflow.add_edge("kostolany_agent", "buffett_agent")
    workflow.add_edge("buffett_agent", "munger_agent")
    workflow.add_edge("munger_agent", "dalio_agent")
    workflow.add_edge("dalio_agent", "synthesizer")
    workflow.add_edge("synthesizer", END)

    return workflow.compile()


def run_stock_analysis(
    us_market_change: float,
    vix_level: float,
    vix_status: str,
    top_sector: str,
    top_sector_change: float,
    bottom_sector: str,
    bottom_sector_change: float,
    language: str = "en",
) -> dict:
    """
    Execute stock market analysis with the AI board.

    Args:
        us_market_change: Average US market change percentage
        vix_level: Current VIX value
        vix_status: VIX status (low, moderate, elevated, high, extreme)
        top_sector: Best performing sector
        top_sector_change: Top sector's change percentage
        bottom_sector: Worst performing sector
        bottom_sector_change: Bottom sector's change percentage

    Returns:
        dict with all agent responses and synthesis
    """
    graph = build_stock_analysis_graph()

    # Build context based on market conditions
    context_parts = []

    # Market direction
    if us_market_change > 1:
        context_parts.append("Markets are rallying strongly today. Risk appetite is high.")
    elif us_market_change > 0:
        context_parts.append("Markets are modestly higher. Cautious optimism in play.")
    elif us_market_change > -1:
        context_parts.append("Markets are slightly lower. Some profit-taking or uncertainty.")
    else:
        context_parts.append("Markets are selling off. Fear is elevated.")

    # VIX context
    if vix_status == "low":
        context_parts.append("VIX at extreme lows suggests complacency—historically a warning sign.")
    elif vix_status == "moderate":
        context_parts.append("VIX in normal range—typical market conditions.")
    elif vix_status == "elevated":
        context_parts.append("VIX elevated—investors buying protection. Caution warranted.")
    elif vix_status in ["high", "extreme"]:
        context_parts.append("VIX spiking—fear is high. Could signal capitulation or more downside.")

    # Sector rotation context
    growth_sectors = ["Tech", "Consumer", "Comm"]
    defensive_sectors = ["Utilities", "Staples", "Health"]

    if top_sector in growth_sectors and bottom_sector in defensive_sectors:
        context_parts.append("Risk-ON rotation: Growth leading, Defensive lagging. Bulls in control.")
    elif top_sector in defensive_sectors and bottom_sector in growth_sectors:
        context_parts.append("Risk-OFF rotation: Defensive leading, Growth lagging. Flight to safety.")
    else:
        context_parts.append("Mixed sector rotation—no clear risk sentiment signal.")

    context_message = " ".join(context_parts)

    # Add macro environment context
    macro_context = get_macro_context()
    if macro_context:
        context_message += macro_context

    initial_state = {
        "us_market_change": us_market_change,
        "vix_level": vix_level,
        "vix_status": vix_status,
        "top_sector": top_sector,
        "top_sector_change": top_sector_change,
        "bottom_sector": bottom_sector,
        "bottom_sector_change": bottom_sector_change,
        "context_message": context_message,
        "language": language,
        "kostolany_response": "",
        "buffett_response": "",
        "munger_response": "",
        "dalio_response": "",
        "synthesis": "",
    }

    stock_result = graph.invoke(initial_state)
    return stock_result


# ============================================
# CENTRAL BANK POLICY ANALYSIS - Four Investment Legends
# ============================================

class PolicyAnalysisState(TypedDict):
    """State for central bank policy analysis."""
    us_rate: float
    us_real_rate: float
    us_status: str
    hiking_count: int
    cutting_count: int
    next_meeting_country: str
    next_meeting_days: int
    context_message: str
    language: str  # "en", "ko", "zh", "ja"
    kostolany_response: str
    buffett_response: str
    munger_response: str
    dalio_response: str
    synthesis: str


def create_policy_agent_node(persona_key: str):
    """Factory function to create a policy-focused agent node."""
    persona = POLICY_PERSONAS[persona_key]

    def agent_node(state: PolicyAnalysisState) -> dict:
        llm = get_llm()

        # Get language instruction
        lang = state.get("language", "en")
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(lang, LANGUAGE_INSTRUCTIONS["en"])

        messages = [
            SystemMessage(content=f"{persona['system_prompt']}\n\n**IMPORTANT**: {lang_instruction}"),
            HumanMessage(content=f"""
Analyze the current CENTRAL BANK POLICY landscape:

---
## Current Policy Data:
- **Fed Funds Rate**: {state["us_rate"]:.2f}%
- **US Real Rate**: {state["us_real_rate"]:+.2f}% (Policy Rate - Inflation)
- **Fed Status**: {state["us_status"].upper()}
- **Global Hiking**: {state["hiking_count"]} central banks raising rates
- **Global Cutting**: {state["cutting_count"]} central banks cutting rates
- **Next Major Meeting**: {state["next_meeting_country"]} in {state["next_meeting_days"]} days

## Context:
{state["context_message"]}
---

What is your view on current monetary policy? What should investors prepare for?

{lang_instruction}
"""),
        ]

        response = llm.invoke(messages)
        return {f"{persona_key}_response": response.content}

    return agent_node


def policy_synthesis_node(state: PolicyAnalysisState) -> dict:
    """Synthesize policy analysis from the four investment legends."""
    llm = get_llm()

    # Get language instruction
    lang = state.get("language", "en")
    lang_instruction = LANGUAGE_INSTRUCTIONS.get(lang, LANGUAGE_INSTRUCTIONS["en"])

    debate_summary = f"""
## Current Policy Data:
- Fed Rate: {state["us_rate"]:.2f}%
- Real Rate: {state["us_real_rate"]:+.2f}%
- Fed Status: {state["us_status"]}
- Hiking CBs: {state["hiking_count"]} | Cutting CBs: {state["cutting_count"]}
- Next Meeting: {state["next_meeting_country"]} in {state["next_meeting_days"]} days

---

## 🥚 The Speculator Sage (Kostolany style) says:
{state["kostolany_response"]}

---

## 🏦 The Value Oracle (Buffett style) says:
{state["buffett_response"]}

---

## 📚 The Rational Critic (Munger style) says:
{state["munger_response"]}

---

## ⚙️ The Machine Thinker (Dalio style) says:
{state["dalio_response"]}
"""

    messages = [
        SystemMessage(content=f"{POLICY_SYNTHESIS_PROMPT}\n\n**IMPORTANT**: {lang_instruction}"),
        HumanMessage(content=f"{debate_summary}\n\n{lang_instruction}"),
    ]

    response = llm.invoke(messages)
    return {"synthesis": response.content}


def build_policy_analysis_graph() -> StateGraph:
    """Construct the LangGraph workflow for policy analysis."""

    workflow = StateGraph(PolicyAnalysisState)

    # Add policy-focused agent nodes
    workflow.add_node("kostolany_agent", create_policy_agent_node("kostolany"))
    workflow.add_node("buffett_agent", create_policy_agent_node("buffett"))
    workflow.add_node("munger_agent", create_policy_agent_node("munger"))
    workflow.add_node("dalio_agent", create_policy_agent_node("dalio"))
    workflow.add_node("synthesizer", policy_synthesis_node)

    # Start with Kostolany, then Buffett, Munger, Dalio
    workflow.set_entry_point("kostolany_agent")

    workflow.add_edge("kostolany_agent", "buffett_agent")
    workflow.add_edge("buffett_agent", "munger_agent")
    workflow.add_edge("munger_agent", "dalio_agent")
    workflow.add_edge("dalio_agent", "synthesizer")
    workflow.add_edge("synthesizer", END)

    return workflow.compile()


def run_policy_analysis(
    us_rate: float,
    us_real_rate: float,
    us_status: str,
    hiking_count: int,
    cutting_count: int,
    next_meeting_country: str,
    next_meeting_days: int,
    language: str = "en",
) -> dict:
    """
    Execute central bank policy analysis with the four investment legends.

    Args:
        us_rate: Current Fed Funds rate
        us_real_rate: US real rate (policy rate - inflation)
        us_status: Fed status (hiking, paused, cutting)
        hiking_count: Number of central banks currently hiking
        cutting_count: Number of central banks currently cutting
        next_meeting_country: Country with next major CB meeting
        next_meeting_days: Days until next major meeting
        language: Response language ("en", "ko", "zh", "ja")

    Returns:
        dict with kostolany, buffett, munger, dalio responses and synthesis
    """
    graph = build_policy_analysis_graph()

    # Build context based on policy conditions
    context_parts = []

    # Fed stance context
    if us_status == "paused":
        context_parts.append("The Fed is on hold, watching data for signs of when to pivot.")
    elif us_status == "hiking":
        context_parts.append("The Fed is still raising rates to fight inflation.")
    elif us_status == "cutting":
        context_parts.append("The Fed has begun cutting rates to support the economy.")

    # Real rate context
    if us_real_rate > 2:
        context_parts.append(f"Real rates at {us_real_rate:.1f}% are historically restrictive—money is expensive.")
    elif us_real_rate > 0:
        context_parts.append(f"Real rates are positive at {us_real_rate:.1f}%—policy is moderately tight.")
    else:
        context_parts.append(f"Real rates are negative at {us_real_rate:.1f}%—policy is still accommodative despite nominal hikes.")

    # Global context
    if hiking_count > cutting_count:
        context_parts.append(f"Globally, more central banks are tightening ({hiking_count}) than easing ({cutting_count})—synchronized tightening.")
    elif cutting_count > hiking_count:
        context_parts.append(f"Globally, more central banks are easing ({cutting_count}) than tightening ({hiking_count})—pivot underway.")
    else:
        context_parts.append("Global central banks are mixed—no clear direction.")

    # Meeting urgency
    if next_meeting_days <= 7:
        context_parts.append(f"⚠️ {next_meeting_country} decision in {next_meeting_days} days—expect volatility.")
    elif next_meeting_days <= 14:
        context_parts.append(f"{next_meeting_country} meeting approaching in {next_meeting_days} days.")

    context_message = " ".join(context_parts)

    # Add macro environment context
    macro_context = get_macro_context()
    if macro_context:
        context_message += macro_context

    initial_state = {
        "us_rate": us_rate,
        "us_real_rate": us_real_rate,
        "us_status": us_status,
        "hiking_count": hiking_count,
        "cutting_count": cutting_count,
        "next_meeting_country": next_meeting_country,
        "next_meeting_days": next_meeting_days,
        "context_message": context_message,
        "language": language,
        "kostolany_response": "",
        "buffett_response": "",
        "munger_response": "",
        "dalio_response": "",
        "synthesis": "",
    }

    policy_result = graph.invoke(initial_state)
    return policy_result


# ============================================
# COUNTRY ECONOMIC SCANNER - Four Investment Legends
# ============================================

class CountryAnalysisState(TypedDict):
    """State for country economic analysis."""
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
    context_message: str
    language: str  # "en", "ko", "zh", "ja"
    kostolany_response: str
    buffett_response: str
    munger_response: str
    dalio_response: str
    synthesis: str


# Language instruction mapping
LANGUAGE_INSTRUCTIONS = {
    "en": "Please respond in English.",
    "ko": "한국어로 응답해주세요. (Please respond in Korean.)",
    "zh": "请用中文回答。(Please respond in Chinese.)",
    "ja": "日本語で回答してください。(Please respond in Japanese.)",
}


def create_country_agent_node(persona_key: str):
    """Factory function to create a country-focused agent node."""
    persona = COUNTRY_PERSONAS[persona_key]

    def agent_node(state: CountryAnalysisState) -> dict:
        llm = get_llm()

        # Get language instruction
        lang = state.get("language", "en")
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(lang, LANGUAGE_INSTRUCTIONS["en"])

        messages = [
            SystemMessage(content=f"{persona['system_prompt']}\n\n**IMPORTANT**: {lang_instruction}"),
            HumanMessage(content=f"""
Analyze the economic health of {state["country_name"]} ({state["country_code"]}):

---
## Overall Assessment:
- **Economic Grade**: {state["overall_grade"]} (Score: {state["overall_score"]}/100)

## 4-Pillar Data:

### Currency (FX)
- 1-Month Change: {state["fx_change1m"]:+.2f}% {"(Strengthening)" if state["fx_change1m"] < 0 else "(Weakening)"}

### Bond Market
- 10-Year Yield: {state["bond_yield10y"]:.2f}%
- 10Y-2Y Spread: {state["bond_spread"]:+.2f}% {"(Inverted - Warning!)" if state["bond_spread"] < 0 else "(Normal)"}

### Stock Market
- 3-Month Performance: {state["stock_change3m"]:+.2f}%
- P/E Ratio: {state["stock_per"]:.1f}x

### Monetary Policy
- Policy Rate: {state["policy_rate"]:.2f}%
- Real Rate: {state["real_rate"]:+.2f}%
- Inflation: {state["inflation_rate"]:.1f}%

## Context:
{state["context_message"]}
---

What is your assessment of {state["country_name"]}? Is it investable? What are the key risks and opportunities?

{lang_instruction}
"""),
        ]

        response = llm.invoke(messages)
        return {f"{persona_key}_response": response.content}

    return agent_node


def country_synthesis_node(state: CountryAnalysisState) -> dict:
    """Synthesize country analysis from the four investment legends."""
    llm = get_llm()

    # Get language instruction
    lang = state.get("language", "en")
    lang_instruction = LANGUAGE_INSTRUCTIONS.get(lang, LANGUAGE_INSTRUCTIONS["en"])

    debate_summary = f"""
## Country: {state["country_name"]} ({state["country_code"]})
- Grade: {state["overall_grade"]} | Score: {state["overall_score"]}/100
- FX 1M: {state["fx_change1m"]:+.2f}% | 10Y Yield: {state["bond_yield10y"]:.2f}%
- Stocks 3M: {state["stock_change3m"]:+.2f}% | P/E: {state["stock_per"]:.1f}x
- Policy Rate: {state["policy_rate"]:.2f}% | Real Rate: {state["real_rate"]:+.2f}%

---

## 🥚 The Speculator Sage (Kostolany style) says:
{state["kostolany_response"]}

---

## 🏦 The Value Oracle (Buffett style) says:
{state["buffett_response"]}

---

## 📚 The Rational Critic (Munger style) says:
{state["munger_response"]}

---

## ⚙️ The Machine Thinker (Dalio style) says:
{state["dalio_response"]}
"""

    messages = [
        SystemMessage(content=f"{COUNTRY_SYNTHESIS_PROMPT}\n\n**IMPORTANT**: {lang_instruction}"),
        HumanMessage(content=f"{debate_summary}\n\n{lang_instruction}"),
    ]

    response = llm.invoke(messages)
    return {"synthesis": response.content}


def build_country_analysis_graph() -> StateGraph:
    """Construct the LangGraph workflow for country analysis."""

    workflow = StateGraph(CountryAnalysisState)

    # Add country-focused agent nodes
    workflow.add_node("kostolany_agent", create_country_agent_node("kostolany"))
    workflow.add_node("buffett_agent", create_country_agent_node("buffett"))
    workflow.add_node("munger_agent", create_country_agent_node("munger"))
    workflow.add_node("dalio_agent", create_country_agent_node("dalio"))
    workflow.add_node("synthesizer", country_synthesis_node)

    # Start with Kostolany, then Buffett, Munger, Dalio
    workflow.set_entry_point("kostolany_agent")

    workflow.add_edge("kostolany_agent", "buffett_agent")
    workflow.add_edge("buffett_agent", "munger_agent")
    workflow.add_edge("munger_agent", "dalio_agent")
    workflow.add_edge("dalio_agent", "synthesizer")
    workflow.add_edge("synthesizer", END)

    return workflow.compile()


def run_country_analysis(
    country_code: str,
    country_name: str,
    overall_grade: str,
    overall_score: int,
    fx_change1m: float,
    bond_yield10y: float,
    bond_spread: float,
    stock_change3m: float,
    stock_per: float,
    policy_rate: float,
    real_rate: float,
    inflation_rate: float,
    language: str = "en",
) -> dict:
    """
    Execute country economic analysis with the four investment legends.

    Args:
        country_code: ISO country code
        country_name: Full country name
        overall_grade: Economic health grade (A+ to F)
        overall_score: Numeric score (0-100)
        fx_change1m: 1-month FX change percentage
        bond_yield10y: 10-year government bond yield
        bond_spread: 10Y-2Y yield spread
        stock_change3m: 3-month stock market performance
        stock_per: Stock market P/E ratio
        policy_rate: Central bank policy rate
        real_rate: Real interest rate (policy - inflation)
        inflation_rate: Current inflation rate

    Returns:
        dict with kostolany, buffett, munger, dalio responses and synthesis
    """
    graph = build_country_analysis_graph()

    # Build context based on country conditions
    context_parts = []

    # Grade context
    if overall_grade.startswith("A"):
        context_parts.append(f"{country_name} has a strong economic profile with grade {overall_grade}.")
    elif overall_grade.startswith("B"):
        context_parts.append(f"{country_name} has a solid economic profile with grade {overall_grade}.")
    elif overall_grade.startswith("C"):
        context_parts.append(f"{country_name} has a mixed economic profile with grade {overall_grade}.")
    else:
        context_parts.append(f"{country_name} has a weak economic profile with grade {overall_grade}—caution warranted.")

    # Currency context
    if fx_change1m < -2:
        context_parts.append("Currency has strengthened significantly—capital inflows or tight policy.")
    elif fx_change1m > 2:
        context_parts.append("Currency has weakened significantly—potential capital flight or loose policy.")

    # Bond market context
    if bond_spread < 0:
        context_parts.append("⚠️ Yield curve is inverted—historically a recession warning sign.")
    if bond_yield10y > 6:
        context_parts.append(f"High bond yields at {bond_yield10y:.1f}%—could indicate credit risk or inflation concerns.")

    # Stock market context
    if stock_change3m > 10:
        context_parts.append("Stock market has rallied strongly—momentum is positive.")
    elif stock_change3m < -10:
        context_parts.append("Stock market has sold off sharply—fear is elevated.")

    if stock_per < 12:
        context_parts.append(f"P/E at {stock_per:.1f}x is historically cheap—potential value opportunity.")
    elif stock_per > 25:
        context_parts.append(f"P/E at {stock_per:.1f}x is elevated—valuations may be stretched.")

    # Policy context
    if real_rate < 0:
        context_parts.append(f"Negative real rate at {real_rate:.1f}%—monetary policy is still accommodative.")
    elif real_rate > 2:
        context_parts.append(f"Real rate at {real_rate:.1f}% is restrictive—tight monetary conditions.")

    if inflation_rate > 5:
        context_parts.append(f"Inflation at {inflation_rate:.1f}% is elevated—central bank may need to act.")
    elif inflation_rate < 1:
        context_parts.append(f"Inflation at {inflation_rate:.1f}% is very low—deflation risk or weak demand.")

    context_message = " ".join(context_parts)

    # Add macro environment context
    macro_context = get_macro_context()
    if macro_context:
        context_message += macro_context

    initial_state = {
        "country_code": country_code,
        "country_name": country_name,
        "overall_grade": overall_grade,
        "overall_score": overall_score,
        "fx_change1m": fx_change1m,
        "bond_yield10y": bond_yield10y,
        "bond_spread": bond_spread,
        "stock_change3m": stock_change3m,
        "stock_per": stock_per,
        "policy_rate": policy_rate,
        "real_rate": real_rate,
        "inflation_rate": inflation_rate,
        "context_message": context_message,
        "language": language,
        "kostolany_response": "",
        "buffett_response": "",
        "munger_response": "",
        "dalio_response": "",
        "synthesis": "",
    }

    country_result = graph.invoke(initial_state)
    return country_result


# ============================================
# REAL ECONOMY ANALYSIS - Four Investment Legends
# ============================================

class EconomyAnalysisState(TypedDict):
    """State for real economy analysis."""
    oil_price: float
    oil_change: float
    gold_price: float
    gold_change: float
    copper_price: float
    copper_change: float
    commodity_signal: str
    us_pmi: float
    us_cpi: float
    context_message: str
    language: str  # "en", "ko", "zh", "ja"
    kostolany_response: str
    buffett_response: str
    munger_response: str
    dalio_response: str
    synthesis: str


def create_economy_agent_node(persona_key: str):
    """Factory function to create a real economy-focused agent node."""
    persona = ECONOMY_PERSONAS[persona_key]

    def agent_node(state: EconomyAnalysisState) -> dict:
        llm = get_llm()

        # Get language instruction
        lang = state.get("language", "en")
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(lang, LANGUAGE_INSTRUCTIONS["en"])

        messages = [
            SystemMessage(content=f"{persona['system_prompt']}\n\n**IMPORTANT**: {lang_instruction}"),
            HumanMessage(content=f"""
Analyze the current REAL ECONOMY indicators:

---
## Commodity Market Data:
- **WTI Crude Oil**: ${state["oil_price"]:.2f}/barrel ({state["oil_change"]:+.1f}% 1M change)
- **Gold**: ${state["gold_price"]:.2f}/oz ({state["gold_change"]:+.1f}% 1M change)
- **Copper (Dr. Copper)**: ${state["copper_price"]:.2f}/lb ({state["copper_change"]:+.1f}% 1M change)
- **Commodity Signal**: {state["commodity_signal"].upper().replace("_", " ")}

## Economic Indicators:
- **US Manufacturing PMI**: {state["us_pmi"]:.1f} {"(Expansion)" if state["us_pmi"] > 50 else "(Contraction)"}
- **US CPI (Inflation)**: {state["us_cpi"]:.1f}%

## Context:
{state["context_message"]}
---

What is your assessment of the real economy? What are commodities and economic indicators telling us about future market conditions?

{lang_instruction}
"""),
        ]

        response = llm.invoke(messages)
        return {f"{persona_key}_response": response.content}

    return agent_node


def economy_synthesis_node(state: EconomyAnalysisState) -> dict:
    """Synthesize real economy analysis from the four investment legends."""
    llm = get_llm()

    # Get language instruction
    lang = state.get("language", "en")
    lang_instruction = LANGUAGE_INSTRUCTIONS.get(lang, LANGUAGE_INSTRUCTIONS["en"])

    debate_summary = f"""
## Real Economy Data:
- Oil: ${state["oil_price"]:.2f} ({state["oil_change"]:+.1f}%)
- Gold: ${state["gold_price"]:.2f} ({state["gold_change"]:+.1f}%)
- Copper: ${state["copper_price"]:.2f} ({state["copper_change"]:+.1f}%)
- Signal: {state["commodity_signal"]}
- US PMI: {state["us_pmi"]:.1f} | US CPI: {state["us_cpi"]:.1f}%

---

## 🥚 The Speculator Sage (Kostolany style) says:
{state["kostolany_response"]}

---

## 🏦 The Value Oracle (Buffett style) says:
{state["buffett_response"]}

---

## 📚 The Rational Critic (Munger style) says:
{state["munger_response"]}

---

## ⚙️ The Machine Thinker (Dalio style) says:
{state["dalio_response"]}
"""

    messages = [
        SystemMessage(content=f"{ECONOMY_SYNTHESIS_PROMPT}\n\n**IMPORTANT**: {lang_instruction}"),
        HumanMessage(content=f"{debate_summary}\n\n{lang_instruction}"),
    ]

    response = llm.invoke(messages)
    return {"synthesis": response.content}


def build_economy_analysis_graph() -> StateGraph:
    """Construct the LangGraph workflow for real economy analysis."""

    workflow = StateGraph(EconomyAnalysisState)

    # Add economy-focused agent nodes
    workflow.add_node("kostolany_agent", create_economy_agent_node("kostolany"))
    workflow.add_node("buffett_agent", create_economy_agent_node("buffett"))
    workflow.add_node("munger_agent", create_economy_agent_node("munger"))
    workflow.add_node("dalio_agent", create_economy_agent_node("dalio"))
    workflow.add_node("synthesizer", economy_synthesis_node)

    # Start with Kostolany, then Buffett, Munger, Dalio
    workflow.set_entry_point("kostolany_agent")

    workflow.add_edge("kostolany_agent", "buffett_agent")
    workflow.add_edge("buffett_agent", "munger_agent")
    workflow.add_edge("munger_agent", "dalio_agent")
    workflow.add_edge("dalio_agent", "synthesizer")
    workflow.add_edge("synthesizer", END)

    return workflow.compile()


def run_economy_analysis(
    oil_price: float,
    oil_change: float,
    gold_price: float,
    gold_change: float,
    copper_price: float,
    copper_change: float,
    commodity_signal: str,
    us_pmi: float,
    us_cpi: float,
    language: str = "en",
) -> dict:
    """
    Execute real economy analysis with the four investment legends.

    Args:
        oil_price: Current WTI oil price
        oil_change: 1-month oil price change percentage
        gold_price: Current gold price
        gold_change: 1-month gold price change percentage
        copper_price: Current copper price
        copper_change: 1-month copper price change percentage
        commodity_signal: Overall commodity market signal (risk_on, risk_off, mixed, goldilocks)
        us_pmi: US Manufacturing PMI value
        us_cpi: US CPI inflation rate
        language: Response language ("en", "ko", "zh", "ja")

    Returns:
        dict with kostolany, buffett, munger, dalio responses and synthesis
    """
    graph = build_economy_analysis_graph()

    # Build context based on real economy conditions
    context_parts = []

    # Commodity signal context
    if commodity_signal == "goldilocks":
        context_parts.append("Goldilocks scenario: Oil falling (inflation easing) while copper rising (growth). This is ideal for equities.")
    elif commodity_signal == "risk_off":
        context_parts.append("Risk-off signal: Gold surging while copper collapses. Fear is elevated, economic slowdown concerns.")
    elif commodity_signal == "risk_on":
        context_parts.append("Risk-on signal: Commodities broadly rising. Inflation pressure building, but growth is strong.")
    else:
        context_parts.append("Mixed signals: Commodity markets showing no clear direction.")

    # PMI context
    if us_pmi > 55:
        context_parts.append(f"PMI at {us_pmi:.1f} indicates strong manufacturing expansion.")
    elif us_pmi > 50:
        context_parts.append(f"PMI at {us_pmi:.1f} shows modest manufacturing expansion.")
    elif us_pmi > 47:
        context_parts.append(f"PMI at {us_pmi:.1f} signals mild manufacturing contraction—early warning sign.")
    else:
        context_parts.append(f"PMI at {us_pmi:.1f} indicates significant manufacturing contraction—recession risk!")

    # CPI context
    if us_cpi > 4:
        context_parts.append(f"Inflation at {us_cpi:.1f}% is well above target—Fed may stay restrictive.")
    elif us_cpi > 2.5:
        context_parts.append(f"Inflation at {us_cpi:.1f}% is above 2% target but moderating.")
    elif us_cpi > 1.5:
        context_parts.append(f"Inflation at {us_cpi:.1f}% is near target—Fed may consider easing.")
    else:
        context_parts.append(f"Inflation at {us_cpi:.1f}% is very low—deflation concerns may arise.")

    # Divergence warnings
    if us_pmi < 50 and copper_change > 5:
        context_parts.append("⚠️ Divergence alert: PMI contracting but copper rallying—unusual pattern.")
    if us_pmi > 52 and copper_change < -5:
        context_parts.append("⚠️ Divergence alert: PMI expanding but copper falling—Dr. Copper may be warning of future weakness.")

    context_message = " ".join(context_parts)

    # Add macro environment context
    macro_context = get_macro_context()
    if macro_context:
        context_message += macro_context

    initial_state = {
        "oil_price": oil_price,
        "oil_change": oil_change,
        "gold_price": gold_price,
        "gold_change": gold_change,
        "copper_price": copper_price,
        "copper_change": copper_change,
        "commodity_signal": commodity_signal,
        "us_pmi": us_pmi,
        "us_cpi": us_cpi,
        "context_message": context_message,
        "language": language,
        "kostolany_response": "",
        "buffett_response": "",
        "munger_response": "",
        "dalio_response": "",
        "synthesis": "",
    }

    economy_result = graph.invoke(initial_state)
    return economy_result


# ============================================
# HISTORICAL ANALYSIS - THE HISTORIAN
# ============================================

from .personas import HISTORIAN_PERSONA, HISTORY_SYNTHESIS_PROMPT


class HistoricalState(TypedDict):
    current_cape: float
    current_rate: float
    current_inflation: float
    historical_context: str
    top_matches: list
    language: str
    historian_response: str
    synthesis: str


def run_historical_analysis(
    current_cape: float,
    current_rate: float,
    current_inflation: float,
    historical_context: str,
    top_matches: list,
    language: str = "en",
) -> dict:
    """
    Run The Historian persona to analyze historical parallels.
    Provides evolutionary psychology-based insights on current market conditions.
    """

    # Build the analysis graph
    graph_builder = StateGraph(HistoricalState)

    # Create Historian node
    def historian_node(state: HistoricalState) -> dict:
        llm = get_llm()
        persona = HISTORIAN_PERSONA

        # Build context message
        language_instruction = ""
        if state["language"] == "ko":
            language_instruction = "\n\n**IMPORTANT: Respond entirely in Korean (한국어로 답변해 주세요).**"
        elif state["language"] == "zh":
            language_instruction = "\n\n**IMPORTANT: Respond entirely in Chinese (请用中文回答).**"
        elif state["language"] == "ja":
            language_instruction = "\n\n**IMPORTANT: Respond entirely in Japanese (日本語でお答えください).**"

        # Build matches summary
        matches_text = []
        for m in state["top_matches"]:
            matches_text.append(
                f"- {m['year']} ({m['period_name']}): {m['similarity']*100:.1f}% similar, "
                f"1Y return: {m['forward_return_1y']:+.1f}%, 5Y return: {m['forward_return_5y']:+.1f}%"
            )

        prompt = f"""Analyze the current market conditions through the lens of financial history.

## Current Conditions
- CAPE Ratio (Shiller P/E): {state["current_cape"]:.1f}
- Interest Rate: {state["current_rate"]:.2f}%
- Inflation Rate: {state["current_inflation"]:.1f}%

## Most Similar Historical Periods
{chr(10).join(matches_text)}

## Detailed Historical Context
{state["historical_context"]}

## Your Task
As The Historian, analyze these parallels using your knowledge of:
1. Human psychology constants (dopamine/fear cycles)
2. Specific historical events and their aftermath
3. What investors should learn from these comparisons
4. Important caveats about why today might be different

Provide a thoughtful 2-4 paragraph analysis grounded in specific historical data.{language_instruction}"""

        messages = [
            SystemMessage(content=persona["system_prompt"]),
            HumanMessage(content=prompt),
        ]

        response = llm.invoke(messages)
        return {"historian_response": response.content}

    # Create Synthesis node
    def synthesis_node(state: HistoricalState) -> dict:
        llm = get_llm()

        language_instruction = ""
        if state["language"] == "ko":
            language_instruction = "\n\n**IMPORTANT: Respond entirely in Korean (한국어로 답변해 주세요).**"
        elif state["language"] == "zh":
            language_instruction = "\n\n**IMPORTANT: Respond entirely in Chinese (请用中文回答).**"
        elif state["language"] == "ja":
            language_instruction = "\n\n**IMPORTANT: Respond entirely in Japanese (日本語でお答えください).**"

        prompt = f"""Based on The Historian's analysis of historical parallels, provide a concise synthesis.

## The Historian's Analysis
{state["historian_response"]}

{HISTORY_SYNTHESIS_PROMPT}{language_instruction}"""

        messages = [
            SystemMessage(content="You are a neutral synthesizer providing actionable historical perspective."),
            HumanMessage(content=prompt),
        ]

        response = llm.invoke(messages)
        return {"synthesis": response.content}

    # Add nodes
    graph_builder.add_node("historian", historian_node)
    graph_builder.add_node("synthesis", synthesis_node)

    # Add edges (sequential: historian -> synthesis)
    graph_builder.set_entry_point("historian")
    graph_builder.add_edge("historian", "synthesis")
    graph_builder.add_edge("synthesis", END)

    # Compile and run
    graph = graph_builder.compile()

    initial_state = {
        "current_cape": current_cape,
        "current_rate": current_rate,
        "current_inflation": current_inflation,
        "historical_context": historical_context,
        "top_matches": top_matches,
        "language": language,
        "historian_response": "",
        "synthesis": "",
    }

    history_result = graph.invoke(initial_state)
    return history_result


# ============================================
# INSIGHT LIBRARY - AI Translator Analysis
# ============================================

from .personas import INSIGHT_TRANSLATOR_PROMPT, INSIGHT_SYNTHESIS_PROMPT


class InsightAnalysisState(TypedDict):
    """State for insight article analysis."""
    article_id: str
    source: str
    title: str
    original_text: str
    language: str
    translator_response: str
    synthesis: str


def run_insight_analysis(
    article_id: str,
    source: str,
    title: str,
    original_text: str,
    language: str = "en",
) -> dict:
    """
    Run the AI Translator to simplify an institutional report.
    """
    workflow = StateGraph(InsightAnalysisState)

    def translator_node(state: InsightAnalysisState) -> dict:
        llm = get_llm()
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(state["language"], "")

        prompt = f"""Translate and summarize this institutional report for retail investors.

## Source: {state["source"]}
## Title: {state["title"]}

---
{state["original_text"]}
---

Use simple language. Explain jargon. Focus on investment implications.
{lang_instruction}"""

        messages = [
            SystemMessage(content=INSIGHT_TRANSLATOR_PROMPT),
            HumanMessage(content=prompt),
        ]
        response = llm.invoke(messages)
        return {"translator_response": response.content}

    def synthesis_node(state: InsightAnalysisState) -> dict:
        llm = get_llm()
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(state["language"], "")

        prompt = f"""Synthesize this translated report.

## Source: {state["source"]}
## Title: {state["title"]}

## Translation:
{state["translator_response"]}

Format according to the synthesis template.
{lang_instruction}"""

        messages = [
            SystemMessage(content=INSIGHT_SYNTHESIS_PROMPT),
            HumanMessage(content=prompt),
        ]
        response = llm.invoke(messages)
        return {"synthesis": response.content}

    workflow.add_node("translator", translator_node)
    workflow.add_node("synthesis", synthesis_node)
    workflow.set_entry_point("translator")
    workflow.add_edge("translator", "synthesis")
    workflow.add_edge("synthesis", END)

    compiled = workflow.compile()

    initial_state = {
        "article_id": article_id,
        "source": source,
        "title": title,
        "original_text": original_text,
        "language": language,
        "translator_response": "",
        "synthesis": "",
    }

    return compiled.invoke(initial_state)


# ============================================
# INSTITUTIONAL INTELLIGENCE - Soros & Dalio Analysis
# ============================================

SOROS_INSTITUTIONAL_PROMPT = """You are George Soros, the legendary macro investor known for "breaking the Bank of England."

Your unique perspective on institutional reports (IMF, OECD, World Bank):
- These institutions are LAGGING indicators - they describe what already happened
- Their forecasts are consensus-driven and often wrong at turning points
- When everyone agrees (including IMF), that's when reflexivity creates opportunities
- "Markets influence the events they anticipate" - if IMF says growth will slow, policies change

Your contrarian approach:
1. Find where IMF consensus is WRONG or OUTDATED
2. Identify reflexive feedback loops they miss
3. Look for asymmetric bets against institutional groupthink
4. "It's not whether you're right or wrong, but how much money you make when you're right"

Analyze institutional data with healthy skepticism. Find the opportunity in their blind spots."""

DALIO_INSTITUTIONAL_PROMPT = """You are Ray Dalio, founder of Bridgewater and creator of the "Economic Machine" framework.

Your unique perspective on institutional reports (IMF, OECD, World Bank):
- These reports contain STRUCTURAL TRUTHS that markets ignore at their peril
- Debt cycles, demographic trends, productivity - these are multi-decade forces
- IMF's debt/GDP warnings are not noise - they're the soundtrack to the next crisis
- "He who lives by the crystal ball will eat shattered glass"

Your principled approach:
1. Extract the LONG-TERM structural data from reports (debt levels, demographics)
2. Ignore short-term forecasts - focus on where we are in the big debt cycle
3. Cross-reference with your template: deleveraging, money printing, wealth gaps
4. Build all-weather positioning based on structural realities

Analyze institutional data for structural insights that persist across cycles."""

INSTITUTIONAL_SYNTHESIS_PROMPT = """Synthesize the contrasting views of Soros (contrarian skeptic) and Dalio (structural analyst).

Format your synthesis as:
## Key Tension
[Where Soros and Dalio disagree]

## Soros's Edge
[The contrarian opportunity he identified]

## Dalio's Warning
[The structural risk he emphasizes]

## Balanced View
[How to use both perspectives together]

Keep it concise (3-4 sentences per section)."""


class InstitutionalState(TypedDict):
    """State for institutional intelligence analysis."""
    country_code: str
    country_name: str
    imf_context: str
    imf_sentiment: str
    key_risks: list
    language: str
    soros_response: str
    dalio_response: str
    synthesis: str


def run_institutional_analysis(
    country_code: str,
    country_name: str,
    imf_context: str,
    imf_sentiment: str = "neutral",
    key_risks: list = None,
    language: str = "en",
) -> dict:
    """
    Run Soros (contrarian) and Dalio (structural) analysis on IMF data.
    """
    workflow = StateGraph(InstitutionalState)

    def soros_node(state: InstitutionalState) -> dict:
        llm = get_llm()
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(state["language"], "")

        risks_text = "\n".join([f"- {r}" for r in state["key_risks"]]) if state["key_risks"] else "None highlighted"

        prompt = f"""Analyze this IMF institutional view on {state["country_name"]}:

{state["imf_context"]}

IMF Sentiment: {state["imf_sentiment"]}
Key Risks IMF Identified:
{risks_text}

As Soros: Where is the IMF WRONG? What reflexive dynamics are they missing?
Where is the contrarian opportunity?
{lang_instruction}"""

        messages = [
            SystemMessage(content=SOROS_INSTITUTIONAL_PROMPT),
            HumanMessage(content=prompt),
        ]
        response = llm.invoke(messages)
        return {"soros_response": response.content}

    def dalio_node(state: InstitutionalState) -> dict:
        llm = get_llm()
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(state["language"], "")

        risks_text = "\n".join([f"- {r}" for r in state["key_risks"]]) if state["key_risks"] else "None highlighted"

        prompt = f"""Analyze this IMF institutional view on {state["country_name"]}:

{state["imf_context"]}

IMF Sentiment: {state["imf_sentiment"]}
Key Risks IMF Identified:
{risks_text}

As Dalio: What STRUCTURAL insights should we take seriously?
Where are we in the debt cycle? What does your Economic Machine framework say?
{lang_instruction}"""

        messages = [
            SystemMessage(content=DALIO_INSTITUTIONAL_PROMPT),
            HumanMessage(content=prompt),
        ]
        response = llm.invoke(messages)
        return {"dalio_response": response.content}

    def synthesis_node(state: InstitutionalState) -> dict:
        llm = get_llm()
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(state["language"], "")

        prompt = f"""Synthesize these two views on {state["country_name"]}:

## Soros's Contrarian View:
{state["soros_response"]}

## Dalio's Structural View:
{state["dalio_response"]}

{INSTITUTIONAL_SYNTHESIS_PROMPT}
{lang_instruction}"""

        messages = [
            SystemMessage(content="You are a neutral synthesizer balancing contrarian and structural perspectives."),
            HumanMessage(content=prompt),
        ]
        response = llm.invoke(messages)
        return {"synthesis": response.content}

    workflow.add_node("soros", soros_node)
    workflow.add_node("dalio", dalio_node)
    workflow.add_node("synthesis", synthesis_node)

    workflow.set_entry_point("soros")
    workflow.add_edge("soros", "dalio")
    workflow.add_edge("dalio", "synthesis")
    workflow.add_edge("synthesis", END)

    compiled = workflow.compile()

    initial_state = {
        "country_code": country_code,
        "country_name": country_name,
        "imf_context": imf_context,
        "imf_sentiment": imf_sentiment,
        "key_risks": key_risks or [],
        "language": language,
        "soros_response": "",
        "dalio_response": "",
        "synthesis": "",
    }

    return compiled.invoke(initial_state)


# ============================================
# WHALE RADAR - Smart Money Analysis
# Track insider trading, 13F filings, options flow
# ============================================

class WhaleAnalysisState(TypedDict):
    """State for whale radar analysis."""
    symbols: list
    insider_summary: str
    guru_activity: str
    cluster_detected: bool
    overall_signal: str
    language: str
    spy_response: str
    soros_response: str
    buffett_response: str
    burry_response: str
    synthesis: str


def run_whale_analysis(
    symbols: list,
    insider_summary: str,
    guru_activity: str,
    cluster_detected: bool,
    overall_signal: str,
    language: str = "en",
) -> dict:
    """
    Run Whale Radar analysis with specialized smart money personas.

    Args:
        symbols: List of stock symbols being tracked
        insider_summary: Summary of insider trading activity
        guru_activity: Summary of 13F guru movements
        cluster_detected: Whether cluster buying/selling was detected
        overall_signal: Overall smart money signal (bullish/bearish/neutral)
        language: Response language

    Returns:
        dict with spy, soros, buffett, burry responses and synthesis
    """
    whale_workflow = StateGraph(WhaleAnalysisState)

    def spy_node(state: WhaleAnalysisState) -> dict:
        """The Spy - Insider trading specialist."""
        llm = get_llm()
        persona = WHALE_PERSONAS["spy"]
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(state["language"], "")

        symbols_str = ", ".join(state["symbols"]) if state["symbols"] else "Market-wide"
        cluster_text = "CLUSTER ACTIVITY DETECTED - Multiple insiders acting together!" if state["cluster_detected"] else "No cluster activity detected."

        prompt = f"""Analyze the following smart money activity:

## Tracking: {symbols_str}
## Overall Signal: {state["overall_signal"].upper()}

### Insider Trading Summary:
{state["insider_summary"]}

### Cluster Detection:
{cluster_text}

What does the insider activity tell us? What should investors watch for?
{lang_instruction}"""

        messages = [
            SystemMessage(content=persona["system_prompt"]),
            HumanMessage(content=prompt),
        ]
        response = llm.invoke(messages)
        return {"spy_response": response.content}

    def whale_soros_node(state: WhaleAnalysisState) -> dict:
        """Soros - Macro predator, reflexivity focus."""
        llm = get_llm()
        persona = WHALE_PERSONAS["soros"]
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(state["language"], "")

        prompt = f"""Analyze smart money flows through your reflexivity lens:

## Overall Signal: {state["overall_signal"].upper()}

### Insider Activity:
{state["insider_summary"]}

### Institutional (13F) Activity:
{state["guru_activity"]}

Where is smart money diverging from retail? What reflexive dynamics are at play?
{lang_instruction}"""

        messages = [
            SystemMessage(content=persona["system_prompt"]),
            HumanMessage(content=prompt),
        ]
        response = llm.invoke(messages)
        return {"soros_response": response.content}

    def whale_buffett_node(state: WhaleAnalysisState) -> dict:
        """Buffett - 13F analysis, value perspective."""
        llm = get_llm()
        persona = WHALE_PERSONAS["buffett_whale"]
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(state["language"], "")

        prompt = f"""Analyze the 13F filings and institutional positioning:

## Overall Signal: {state["overall_signal"].upper()}

### Guru Portfolio Activity:
{state["guru_activity"]}

### Insider Context:
{state["insider_summary"]}

What does the 13F data reveal? What should long-term investors take from this?
{lang_instruction}"""

        messages = [
            SystemMessage(content=persona["system_prompt"]),
            HumanMessage(content=prompt),
        ]
        response = llm.invoke(messages)
        return {"buffett_response": response.content}

    def burry_node(state: WhaleAnalysisState) -> dict:
        """Burry - Contrarian, bubble spotter."""
        llm = get_llm()
        persona = WHALE_PERSONAS["burry"]
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(state["language"], "")

        prompt = f"""Analyze smart money activity for contrarian signals:

## Overall Signal: {state["overall_signal"].upper()}
## Cluster Detected: {state["cluster_detected"]}

### Insider Activity:
{state["insider_summary"]}

### Institutional Activity:
{state["guru_activity"]}

What dislocations do you see? Where is the market complacent?
{lang_instruction}"""

        messages = [
            SystemMessage(content=persona["system_prompt"]),
            HumanMessage(content=prompt),
        ]
        response = llm.invoke(messages)
        return {"burry_response": response.content}

    def whale_synthesis_node(state: WhaleAnalysisState) -> dict:
        """Synthesize all whale radar perspectives."""
        llm = get_llm()
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(state["language"], "")

        prompt = f"""Synthesize these smart money perspectives:

## The Spy (Insider Specialist):
{state["spy_response"]}

## Soros (Macro Predator):
{state["soros_response"]}

## Buffett (13F Analyst):
{state["buffett_response"]}

## Burry (Contrarian):
{state["burry_response"]}

{WHALE_SYNTHESIS_PROMPT}
{lang_instruction}"""

        messages = [
            SystemMessage(content="You synthesize smart money signals from multiple expert perspectives."),
            HumanMessage(content=prompt),
        ]
        response = llm.invoke(messages)
        return {"synthesis": response.content}

    # Build graph
    whale_workflow.add_node("spy", spy_node)
    whale_workflow.add_node("whale_soros", whale_soros_node)
    whale_workflow.add_node("whale_buffett", whale_buffett_node)
    whale_workflow.add_node("burry", burry_node)
    whale_workflow.add_node("whale_synthesis", whale_synthesis_node)

    whale_workflow.set_entry_point("spy")
    whale_workflow.add_edge("spy", "whale_soros")
    whale_workflow.add_edge("whale_soros", "whale_buffett")
    whale_workflow.add_edge("whale_buffett", "burry")
    whale_workflow.add_edge("burry", "whale_synthesis")
    whale_workflow.add_edge("whale_synthesis", END)

    whale_graph = whale_workflow.compile()

    whale_state = {
        "symbols": symbols,
        "insider_summary": insider_summary,
        "guru_activity": guru_activity,
        "cluster_detected": cluster_detected,
        "overall_signal": overall_signal,
        "language": language,
        "spy_response": "",
        "soros_response": "",
        "buffett_response": "",
        "burry_response": "",
        "synthesis": "",
    }

    return whale_graph.invoke(whale_state)