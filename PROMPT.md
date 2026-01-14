# IMMEDIATE ACTION REQUIRED

## YOUR TASK RIGHT NOW:
1. **READ** the file `@fix_plan.md` to find the FIRST unchecked task (marked `- [ ]`)
2. **IMPLEMENT** that task by writing/editing actual code files
3. **UPDATE** `@fix_plan.md` by changing `- [ ]` to `- [x]` for the completed task
4. **REPEAT** for the next unchecked task

**DO NOT** just summarize or report status. **WRITE CODE** to complete the tasks.

---

# Insight Flow - Global Economic Intelligence Platform

## Task Management Instructions

**CRITICAL:** When completing tasks from `@fix_plan.md`:
1. Read the `@fix_plan.md` file to see pending tasks (marked with `- [ ]`)
2. Work on ONE task at a time from the unchecked items
3. After completing each task, **UPDATE the `@fix_plan.md` file** by changing `- [ ]` to `- [x]` for that specific task
4. Commit your changes if appropriate
5. Move to the next unchecked task

**Example:** If you complete "Add loading states", change:
```
- [ ] Add loading states and error handling for AI analysis requests
```
to:
```
- [x] Add loading states and error handling for AI analysis requests
```

---

## Vision
"See the Flow, Hear the Giants." - The Visual Bloomberg for Everyone
"Don't read numbers, Watch the flow." - Transform complex global capital flows into visual narratives and expert insights.

## Project Overview
A web platform that visualizes global capital flows and provides actionable insights through a Multi-Agent System modeling the mental models of legendary investment masters.

**Core Purpose:** Show where money is flowing - from country to country, sector to sector, asset to asset.

## Current Tech Stack
- Frontend: Next.js 14, TypeScript, Tailwind CSS, Recharts, Deck.gl, Zustand
- Backend: Python FastAPI
- Database: Supabase (PostgreSQL)
- AI: LangChain/LangGraph with OpenAI/Claude API

---

## KEY UX PRINCIPLE: On-Demand AI Analysis

**CRITICAL:** AI analysis should NOT auto-load on page visit.

### The Pattern:
1. **Default View:** User sees data visualization (charts, maps, gauges) - NO AI text
2. **The Trigger:** A prominent glowing button: "Summon the Board" or "Analyze Market"
3. **Loading State:** "The Board is reviewing the data..."
4. **Result:** Side panel/modal slides out with AI Board discussion

### Benefits:
- Prevents information overload
- Reduces API costs significantly
- User controls when they want insights

---

## AI BOARD OF DIRECTORS (Investment Masters)

Replace tech personas (Musk, Thiel) with legendary investment masters:

### 1. André Kostolany (The Speculator)
**Focus:** Liquidity + Psychology
**Philosophy:** "Trend = Money + Psychology"
**Analyzes:** Interest rates, VIX, market sentiment, crowd behavior
**Tone:** Witty, cynical, sophisticated, contrarian

```
SYSTEM PROMPT:
You are André Kostolany, the legendary speculator. You view markets as art based on Liquidity and Psychology.

CORE PRINCIPLES:
1. The Equation: Trend = Liquidity + Psychology
2. The Egg of Kostolany: Identify if market is in Correction (buy), Accumulation (wait), or Exaggeration (sell)
3. Interest rates are gravity - when they drop, stocks must rise
4. Be a "firm hand" - buy when weak hands panic, sell when they're euphoric

ANALYZE: Look at rates/yields for liquidity, VIX/sentiment for psychology. Advise whether to buy or sell.
TONE: Witty, cynical, use metaphors like "the dog and the master"
```

### 2. Warren Buffett (The Oracle)
**Focus:** Intrinsic Value, Safety Margins, Risk-Free Rate
**Philosophy:** "Interest rates act on asset prices like gravity acts on matter"
**Analyzes:** Bond yields vs earnings yield, currency strength, fear/greed
**Tone:** Folksy, polite, grandfatherly, extremely sharp

```
SYSTEM PROMPT:
You are Warren Buffett, CEO of Berkshire Hathaway. Focus on Intrinsic Value, Safety Margins, and Risk-Free Rate.

CORE PRINCIPLES:
1. Gravity of Rates: If bond yields are high, stocks must be cheaper to be attractive
2. Prefer productive assets (stocks) over non-productive (gold/crypto)
3. Be fearful when others are greedy, greedy when others are fearful
4. Circle of Competence: Stick to what we understand

ANALYZE: Compare 10Y Treasury Yield vs Market Earnings Yield (1/PER). Which pays more?
TONE: Folksy, plain English, patient but sharp
```

### 3. Charlie Munger (The Rationalist)
**Focus:** Risk Assessment, Inversion Thinking, Mental Models
**Philosophy:** "Invert, always invert" - Ask how to avoid losing money
**Analyzes:** Yield curve, debt levels, market froth, hidden risks
**Tone:** Blunt, sarcastic, no sugar-coating

```
SYSTEM PROMPT:
You are Charlie Munger. Famous for Mental Models, Lollapalooza Effects, and "Inversion."

CORE PRINCIPLES:
1. Inversion: Don't ask how to make money, ask how to avoid losing it
2. Be extremely skeptical of "fake assets" like crypto or unprofitable tech
3. Inflation is the submarine that sinks purchasing power - watch Real Rates
4. Multidisciplinary: Combine history, psychology, economics

ANALYZE: Look at yield curve and debt for recession risk. Is market a casino?
TONE: Blunt, sarcastic, intellectually rigorous. Call out stupidity.
```

### 4. Ray Dalio (The Macro Mechanic)
**Focus:** Debt Cycles, Economic Machine, Paradigm Shifts
**Philosophy:** "The economy is a machine driven by debt cycles"
**Analyzes:** Credit conditions, cycle position, historical parallels
**Tone:** Systematic, educational, data-driven

```
SYSTEM PROMPT:
You are Ray Dalio, founder of Bridgewater. View economy as machine driven by Productivity, Short-term Debt Cycles, and Long-term Debt Cycles.

CORE PRINCIPLES:
1. Economic Machine: Economy is sum of transactions. Look at Credit, not just Money.
2. Identify cycle position: Beautiful Deleveraging or Inflationary Bubble?
3. Paradigm Shifts: History repeats - compare to 1930s, 1970s, 2008
4. All Weather: Diversify across environments (growth/inflation rising/falling)

ANALYZE: Where are we in the debt cycle? What does history say about this moment?
TONE: Systematic, educational, principle-based
```

---

## 6 CORE MODULES TO BUILD/ENHANCE

### Module 1: Currency/FX Flow (Phase 1 - EXISTS)
**Page:** `/currency` or main dashboard
**Visual:** Globe with particle flows between countries
**Data:** USD/KRW, USD/JPY, EUR/USD, DXY (Dollar Index)
**Key Insight:** "Money flows to higher rates and safer havens"

### Module 2: Bond Market (Phase 2 - ENHANCE)
**Page:** `/bonds`
**Visual:**
- Yield Curve Chart (1M to 30Y maturities)
- 10Y-2Y Spread Gauge (Recession Warning if < 0)
- Historical curve comparison toggle
**Data:** US 2Y, 5Y, 10Y, 30Y Treasury Yields
**Key Insight:** "The yield curve predicts recessions"

### Module 3: Global Stocks (Phase 3 - ENHANCE)
**Page:** `/stocks`
**Visual:**
- Treemap Heatmap (size = market cap, color = change%)
- Global indices: S&P500, Nasdaq, KOSPI, Nikkei, DAX, FTSE
- Sector rotation view (11 GICS sectors)
- VIX Fear Gauge in corner
**Data:** Major indices, sector ETFs
**Key Insight:** "Where is money rotating to?"

### Module 4: Central Bank Policy (Phase 4 - ENHANCE)
**Page:** `/policy`
**Visual:**
- Rate Cycle Clock (Hiking → Peak → Cutting → Low)
- Country flags positioned on cycle
- Real Rate calculation (Nominal - Inflation)
- Meeting countdown calendar
**Data:** Fed, ECB, BOJ, BOK, PBOC rates
**Key Insight:** "Who controls the money faucet?"

### Module 5: Country Scanner (Phase 5 - BUILD)
**Page:** `/country/[code]`
**Visual:**
- Radar Chart with 5 axes (Currency, Market, Credit, Liquidity, Inflation)
- 4-Pillar Summary Cards
- AI Diagnosis with Grade (A-F)
**Data:** Aggregated from all other modules
**Key Insight:** "Is this country's economy healthy?"

### Module 6: Real Economy (Phase 6 - BUILD)
**Page:** `/economy`
**Visual:**
- Commodity Ticker (Oil, Gold, Copper)
- PMI Gauge (50 = threshold)
- Economic Calendar (CPI, PMI, GDP releases)
- Dr. Copper indicator
**Data:** WTI, Gold, Copper prices; PMI, CPI data
**Key Insight:** "What does the real economy say?"

---

## ADDITIONAL FEATURES (Already Built - Enhance)

### Whale Tracker (`/whale`)
- Smart money movements
- 13F filings visualization
- Insider trading signals
- Guru portfolio tracking (Buffett, Dalio, etc.)

### Historical Patterns (`/history`)
- Crisis database (1929, 1987, 2008, 2020)
- Pattern matching with current conditions
- "History rhymes" comparisons

### Macro Health Check (`/macro`)
- Buffett Indicator (Market Cap / GDP)
- Yield Curve status
- Credit Spreads
- M2 Money Supply growth

---

## DESIGN SYSTEM

### Theme: Dark Mode (Terminal Aesthetic)
- Background: Deep Black (#0a0a0f) or Dark Navy (#0a0f1c)
- Borders: #27272a
- Text: Gray scale (#e4e4e7, #a1a1aa, #71717a)

### Accent Colors:
- Bullish/Up: Emerald (#10b981) or Gold (#FFD700)
- Bearish/Down: Red (#ef4444) or Blue (#3b82f6)
- Warning: Amber (#f59e0b)
- Highlight: Cyan (#00F0FF)

### Typography:
- Font: Inter or Roboto Mono
- Numbers: Monospace for data readability

---

## DEVELOPMENT PRIORITIES

### HIGH PRIORITY:
1. Create shared `AnalysisTriggerButton` component
2. Create shared `AnalysisPanel` component (AI Board modal/drawer)
3. Implement 4 investment master personas in backend
4. Update all pages to use On-Demand AI pattern

### MEDIUM PRIORITY:
5. Enhance Bonds page with yield curve visualization
6. Enhance Stocks page with proper heatmap
7. Enhance Policy page with rate cycle clock
8. Add Commodities section to Economy page

### LOWER PRIORITY:
9. Build Country Scanner with radar chart
10. Add Economic Calendar widget
11. Enhance Whale tracker visualizations

---

## API ENDPOINTS (Backend - FastAPI)

### Existing:
- GET /api/fx/* - Currency data
- GET /api/bonds/* - Bond yields
- GET /api/stocks/* - Stock indices and sectors
- GET /api/policy/* - Central bank rates
- GET /api/economy/* - Economic indicators
- GET /api/whale/* - Whale tracking data
- GET /api/macro/* - Macro health indicators
- GET /api/history/* - Historical crisis data

### To Add:
- POST /api/analyze/bonds - AI analysis for bonds
- POST /api/analyze/stocks - AI analysis for stocks
- POST /api/analyze/policy - AI analysis for policy
- POST /api/analyze/country/{code} - Country diagnosis
- GET /api/commodities - Oil, Gold, Copper prices
- GET /api/calendar - Economic event calendar

---

## FILE STRUCTURE

```
/frontend
  /app
    /bonds/page.tsx - Bond market dashboard
    /stocks/page.tsx - Global equity heatmap
    /policy/page.tsx - Central bank tracker
    /economy/page.tsx - Real economy indicators
    /country/[code]/page.tsx - Country scanner
    /whale/page.tsx - Smart money tracker
    /macro/page.tsx - Macro health check
    /history/page.tsx - Historical patterns
  /components
    /ui
      AnalysisTriggerButton.tsx - Shared "Summon the Board" button
      AnalysisPanel.tsx - Shared AI discussion panel
    /bonds - Bond-specific components
    /equity - Stock-specific components
    /policy - Rate-specific components
  /lib
    designSystem.ts - Design tokens
  /store
    analysisStore.ts - AI analysis state

/api
  /main.py - FastAPI endpoints
  /agents - AI persona implementations
    /kostolany.py
    /buffett.py
    /munger.py
    /dalio.py
```

---

## NEXT ACTIONS FOR RALPH

1. **First:** Create the shared AnalysisTriggerButton component
2. **Second:** Create the AnalysisPanel component with persona avatars
3. **Third:** Update persona prompts in backend to use investment masters
4. **Fourth:** Connect "Analyze" button to AI backend on each page
5. **Fifth:** Enhance visualizations on each module page
