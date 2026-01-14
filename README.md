# Insight Flow

**"See the Flow, Hear the Giants."** - The Visual Bloomberg for Everyone

A web platform that visualizes global capital flows and provides actionable insights through a Multi-Agent System modeling the mental models of legendary investment masters.

## Features

- **Global Currency Flows** - Interactive 3D globe with capital flow visualization
- **Bond Market Dashboard** - Yield curve analysis, spread gauges, recession indicators
- **Stock Market Heatmap** - Treemap visualization with sector rotation
- **Central Bank Policy Tracker** - Rate cycle clock, meeting countdowns
- **Country Scanner** - 6-axis radar charts with economic health grades
- **Real Economy Indicators** - Dr. Copper, PMI gauges, economic calendar
- **Whale Tracker** - Smart money radar, 13F filings, guru portfolios
- **Historical Patterns** - Crisis database with pattern matching
- **AI Board of Directors** - Investment masters analyze market conditions

## AI Board of Directors

Get insights from legendary investment masters:

| Master | Focus | Philosophy |
|--------|-------|------------|
| **Andre Kostolany** | Liquidity + Psychology | "Trend = Money + Psychology" |
| **Warren Buffett** | Intrinsic Value | "Interest rates act on asset prices like gravity" |
| **Charlie Munger** | Risk Assessment | "Invert, always invert" |
| **Ray Dalio** | Debt Cycles | "The economy is a machine" |

## Tech Stack

**Frontend:**
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Recharts / Deck.gl
- Zustand (State Management)

**Backend:**
- FastAPI (Python 3.11)
- LangChain / LangGraph
- OpenAI GPT-4

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- OpenAI API Key

### Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/insight-flow.git
   cd insight-flow
   ```

2. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start Backend**
   ```bash
   cd api
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```

4. **Start Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Open browser**
   ```
   http://localhost:3000
   ```

### Docker

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Project Structure

```
insight-flow/
├── api/                    # FastAPI Backend
│   ├── main.py            # API endpoints
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile
├── agents/                 # AI Agent System
│   ├── board.py           # LangGraph orchestration
│   └── personas.py        # Investment master prompts
├── frontend/               # Next.js Frontend
│   ├── app/               # Pages (App Router)
│   ├── components/        # React components
│   ├── store/             # Zustand stores
│   └── Dockerfile
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Pages

| Route | Description |
|-------|-------------|
| `/dashboard` | Main dashboard with overview |
| `/bonds` | Bond market & yield curves |
| `/stocks` | Global equity heatmap |
| `/currency` | FX flows & globe visualization |
| `/policy` | Central bank rate tracker |
| `/country/[code]` | Country economic scanner |
| `/economy` | Real economy indicators |
| `/whale` | Smart money tracker |
| `/history` | Historical crisis patterns |
| `/macro` | Macro health check |
| `/insights` | News & analysis |

## Environment Variables

See `.env.example` for all available options:

```env
# Required
OPENAI_API_KEY=sk-...

# Optional
MODEL_NAME=gpt-4o
FMP_API_KEY=...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API Documentation

When running the backend, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## License

MIT License - See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

Built with love by the Insight Flow team.
