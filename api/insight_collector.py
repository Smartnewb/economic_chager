"""
Insight Library - RSS Feed Collector & Behavioral Bias Engine
Aggregates reports from IMF, Fed, BIS and other global economic institutions.
"""

import feedparser
import requests
from bs4 import BeautifulSoup
from dataclasses import dataclass
from datetime import datetime
from typing import Optional
import re
import hashlib


@dataclass
class InsightArticle:
    """Represents a collected article from an institutional source."""
    id: str
    source: str
    source_icon: str
    title: str
    link: str
    published: datetime
    summary_raw: str
    full_text: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "source": self.source,
            "source_icon": self.source_icon,
            "title": self.title,
            "link": self.link,
            "published": self.published.isoformat() if self.published else None,
            "summary_raw": self.summary_raw,
            "full_text": self.full_text,
        }


# RSS Feed Configuration
RSS_FEEDS = {
    "IMF Blog": {
        "url": "https://www.imf.org/en/News/RSS/IMF-Blog",
        "icon": "🌐",
        "category": "Macro Economy",
        "description": "Global economic analysis and policy insights",
    },
    "Fed St. Louis": {
        "url": "https://www.stlouisfed.org/rss/publications/on-the-economy",
        "icon": "🏛️",
        "category": "Monetary Policy",
        "description": "US economic data and Fed policy analysis",
    },
    "BIS": {
        "url": "https://www.bis.org/doclist/bis_fsi.rss",
        "icon": "🏦",
        "category": "Financial Stability",
        "description": "International banking and financial stability",
    },
    "ECB Blog": {
        "url": "https://www.ecb.europa.eu/press/blog/rss/blog.xml",
        "icon": "🇪🇺",
        "category": "European Economy",
        "description": "European Central Bank insights",
    },
    "World Bank": {
        "url": "https://blogs.worldbank.org/feed",
        "icon": "🌍",
        "category": "Development",
        "description": "Global development and emerging markets",
    },
}


# Behavioral Bias Rules
BEHAVIORAL_BIASES = {
    "confirmation_bias": {
        "name": "Confirmation Bias",
        "name_ko": "확증 편향",
        "name_zh": "确认偏见",
        "name_ja": "確証バイアス",
        "condition": "market_overheated",
        "warning": "You may be seeking only bullish news while ignoring warning signs.",
        "warning_ko": "좋은 뉴스만 믿고 경고 신호를 무시하고 있지 않나요?",
        "warning_zh": "你是否只关注利好消息而忽视警告信号?",
        "warning_ja": "強気のニュースだけを信じて警告サインを無視していませんか?",
        "icon": "🔍",
    },
    "loss_aversion": {
        "name": "Loss Aversion",
        "name_ko": "손실 회피",
        "name_zh": "损失厌恶",
        "name_ja": "損失回避",
        "condition": "high_fear",
        "warning": "Fear is natural, but panic selling locks in losses. Check the data objectively.",
        "warning_ko": "지금의 공포는 뇌가 만들어낸 환상일 수 있습니다. 이성적으로 데이터를 보세요.",
        "warning_zh": "恐惧是自然的,但恐慌性抛售会锁定损失。请客观看待数据。",
        "warning_ja": "恐怖は自然ですが、パニック売りは損失を確定させます。データを客観的に見てください。",
        "icon": "😰",
    },
    "disposition_effect": {
        "name": "Disposition Effect",
        "name_ko": "처분 효과",
        "name_zh": "处置效应",
        "name_ja": "ディスポジション効果",
        "condition": "moderate_gains",
        "warning": "Are you tempted to sell winners too early while holding losers too long?",
        "warning_ko": "이익은 빨리 실현하고, 손실은 계속 보유하고 있진 않나요?",
        "warning_zh": "你是否急于卖出盈利股票,却长期持有亏损股票?",
        "warning_ja": "利益が出た株を早く売り、損失を出した株を持ち続けていませんか?",
        "icon": "⚖️",
    },
    "recency_bias": {
        "name": "Recency Bias",
        "name_ko": "최신 편향",
        "name_zh": "近因偏见",
        "name_ja": "直近バイアス",
        "condition": "trending_market",
        "warning": "Recent trends feel permanent, but markets are cyclical. Consider the longer history.",
        "warning_ko": "최근 추세가 영원할 것 같지만, 시장은 순환합니다. 더 긴 역사를 보세요.",
        "warning_zh": "最近的趋势感觉是永久的,但市场是周期性的。考虑更长的历史。",
        "warning_ja": "最近のトレンドは永続的に感じますが、市場は循環的です。長期の歴史を見てください。",
        "icon": "📈",
    },
    "herding": {
        "name": "Herding Behavior",
        "name_ko": "군중 심리",
        "name_zh": "羊群效应",
        "name_ja": "群衆行動",
        "condition": "extreme_sentiment",
        "warning": "Everyone is thinking the same thing. Historically, this is when contrarians profit.",
        "warning_ko": "모두가 같은 생각을 하고 있습니다. 역사적으로 이런 때 역발상 투자자가 이깁니다.",
        "warning_zh": "每个人都在想同样的事情。历史上,这是逆向投资者获利的时候。",
        "warning_ja": "みんなが同じことを考えています。歴史的に、これは逆張り投資家が利益を得る時です。",
        "icon": "🐑",
    },
    "overconfidence": {
        "name": "Overconfidence",
        "name_ko": "과신",
        "name_zh": "过度自信",
        "name_ja": "過信",
        "condition": "low_volatility",
        "warning": "Low volatility breeds complacency. The market feels safe, but risks may be building.",
        "warning_ko": "낮은 변동성은 안일함을 낳습니다. 시장이 안전해 보이지만, 리스크가 쌓이고 있을 수 있습니다.",
        "warning_zh": "低波动性滋生自满情绪。市场感觉安全,但风险可能正在积累。",
        "warning_ja": "低いボラティリティは油断を生みます。市場は安全に見えますが、リスクが蓄積している可能性があります。",
        "icon": "😎",
    },
}


def generate_article_id(source: str, title: str, link: str) -> str:
    """Generate a unique ID for an article."""
    content = f"{source}:{title}:{link}"
    return hashlib.md5(content.encode()).hexdigest()[:12]


def parse_date(date_str: str) -> Optional[datetime]:
    """Parse various date formats from RSS feeds."""
    if not date_str:
        return None

    formats = [
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M:%S %Z",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue

    return datetime.now()


def clean_html(html_text: str) -> str:
    """Remove HTML tags and clean up text."""
    if not html_text:
        return ""
    soup = BeautifulSoup(html_text, "html.parser")
    text = soup.get_text(separator=" ", strip=True)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def extract_full_text(url: str, timeout: int = 10) -> Optional[str]:
    """Extract full article text from a URL."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        }
        response = requests.get(url, headers=headers, timeout=timeout)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        for element in soup(["script", "style", "nav", "header", "footer", "aside"]):
            element.decompose()

        article = None
        for selector in ["article", ".article-content", ".post-content", ".entry-content", "main"]:
            article = soup.select_one(selector)
            if article:
                break

        if article:
            text = article.get_text(separator="\n", strip=True)
        else:
            body = soup.find("body")
            text = body.get_text(separator="\n", strip=True) if body else ""

        text = re.sub(r'\n\s*\n', '\n\n', text)
        text = text[:10000]

        return text if len(text) > 200 else None

    except Exception as e:
        print(f"Failed to extract text from {url}: {e}")
        return None


def fetch_rss_feeds(sources: list[str] = None, max_per_source: int = 3, use_mock: bool = False) -> list[InsightArticle]:
    """Fetch articles from configured RSS feeds.

    Args:
        sources: List of source names to fetch from. If None, fetch from all.
        max_per_source: Maximum articles per source.
        use_mock: If True, return mock data instead of fetching.

    Returns:
        List of InsightArticle objects.
    """
    if use_mock:
        print("📋 Using mock insights data")
        return get_mock_insights()

    articles = []
    failed_sources = []
    target_feeds = {k: v for k, v in RSS_FEEDS.items() if sources is None or k in sources}

    for source_name, config in target_feeds.items():
        print(f"📡 Fetching from {source_name}...")

        try:
            feed = feedparser.parse(config["url"], request_headers={
                "User-Agent": "Mozilla/5.0 (compatible; InsightFlow/1.0)"
            })

            if feed.bozo and not feed.entries:
                print(f"  ⚠️ Failed to parse feed for {source_name}: {feed.get('bozo_exception', 'Unknown error')}")
                failed_sources.append(source_name)
                continue

            for entry in feed.entries[:max_per_source]:
                date_str = entry.get("published") or entry.get("updated") or ""
                published = parse_date(date_str)

                summary = entry.get("summary") or entry.get("description") or ""
                summary = clean_html(summary)

                article = InsightArticle(
                    id=generate_article_id(source_name, entry.title, entry.link),
                    source=source_name,
                    source_icon=config["icon"],
                    title=entry.title,
                    link=entry.link,
                    published=published or datetime.now(),
                    summary_raw=summary[:500],
                )

                articles.append(article)
                print(f"  ✓ {entry.title[:50]}...")

        except Exception as e:
            print(f"  ❌ Error fetching {source_name}: {e}")
            failed_sources.append(source_name)
            continue

    if failed_sources:
        print(f"⚠️ Failed sources: {', '.join(failed_sources)}")

    if not articles:
        print("⚠️ All RSS feeds failed, returning mock data as fallback")
        return get_mock_insights()

    articles.sort(key=lambda x: x.published, reverse=True)
    return articles


def get_behavioral_bias(
    vix: float = None,
    rsi: float = None,
    market_change_1m: float = None,
    language: str = "en"
) -> Optional[dict]:
    """Determine which behavioral bias warning to show based on market indicators."""
    lang_suffix = f"_{language}" if language != "en" else ""

    if vix and vix > 30:
        bias = BEHAVIORAL_BIASES["loss_aversion"]
        return {
            "name": bias.get(f"name{lang_suffix}", bias["name"]),
            "warning": bias.get(f"warning{lang_suffix}", bias["warning"]),
            "icon": bias["icon"],
            "condition": "high_fear",
            "indicator": f"VIX: {vix:.1f}",
        }

    if rsi and rsi > 70:
        bias = BEHAVIORAL_BIASES["confirmation_bias"]
        return {
            "name": bias.get(f"name{lang_suffix}", bias["name"]),
            "warning": bias.get(f"warning{lang_suffix}", bias["warning"]),
            "icon": bias["icon"],
            "condition": "market_overheated",
            "indicator": f"RSI: {rsi:.1f}",
        }

    if vix and vix < 15:
        bias = BEHAVIORAL_BIASES["overconfidence"]
        return {
            "name": bias.get(f"name{lang_suffix}", bias["name"]),
            "warning": bias.get(f"warning{lang_suffix}", bias["warning"]),
            "icon": bias["icon"],
            "condition": "low_volatility",
            "indicator": f"VIX: {vix:.1f}",
        }

    if market_change_1m and 5 <= market_change_1m <= 15:
        bias = BEHAVIORAL_BIASES["disposition_effect"]
        return {
            "name": bias.get(f"name{lang_suffix}", bias["name"]),
            "warning": bias.get(f"warning{lang_suffix}", bias["warning"]),
            "icon": bias["icon"],
            "condition": "moderate_gains",
            "indicator": f"1M Change: +{market_change_1m:.1f}%",
        }

    if market_change_1m and abs(market_change_1m) > 8:
        bias = BEHAVIORAL_BIASES["recency_bias"]
        return {
            "name": bias.get(f"name{lang_suffix}", bias["name"]),
            "warning": bias.get(f"warning{lang_suffix}", bias["warning"]),
            "icon": bias["icon"],
            "condition": "trending_market",
            "indicator": f"1M Change: {market_change_1m:+.1f}%",
        }

    return None


def get_all_sources() -> list[dict]:
    """Return list of all configured RSS sources."""
    return [
        {
            "name": name,
            "icon": config["icon"],
            "category": config["category"],
            "description": config["description"],
        }
        for name, config in RSS_FEEDS.items()
    ]


def get_mock_insights() -> list[InsightArticle]:
    """Return mock insights for development/testing."""
    from datetime import timedelta
    now = datetime.now()

    return [
        InsightArticle(
            id="mock001",
            source="IMF Blog",
            source_icon="🌐",
            title="Global Economic Outlook: Navigating Uncertainty",
            link="https://www.imf.org/en/Blogs/example",
            published=now - timedelta(hours=2),
            summary_raw="The global economy faces a complex mix of challenges including persistent inflation in some regions, shifting monetary policies, and geopolitical tensions. Growth projections remain cautious amid evolving risks.",
        ),
        InsightArticle(
            id="mock002",
            source="Fed St. Louis",
            source_icon="🏛️",
            title="Understanding the Current Yield Curve Dynamics",
            link="https://www.stlouisfed.org/on-the-economy/example",
            published=now - timedelta(hours=5),
            summary_raw="The yield curve has been sending mixed signals about the economic outlook. This article examines what the current spread tells us about investor expectations and potential recession indicators.",
        ),
        InsightArticle(
            id="mock003",
            source="BIS",
            source_icon="🏦",
            title="Central Bank Digital Currencies: Progress and Challenges",
            link="https://www.bis.org/publ/example",
            published=now - timedelta(hours=8),
            summary_raw="Central banks worldwide are actively exploring CBDCs. This bulletin examines the latest developments and potential implications for the global financial system, payments infrastructure, and monetary policy.",
        ),
        InsightArticle(
            id="mock004",
            source="ECB Blog",
            source_icon="🇪🇺",
            title="Inflation Persistence in the Euro Area: A Deep Dive",
            link="https://www.ecb.europa.eu/press/blog/example",
            published=now - timedelta(hours=12),
            summary_raw="While headline inflation has moderated, core inflation remains sticky in the euro area. This analysis explores the drivers of inflation persistence and implications for monetary policy normalization.",
        ),
        InsightArticle(
            id="mock005",
            source="World Bank",
            source_icon="🌍",
            title="Emerging Markets: Resilience Amid Global Headwinds",
            link="https://blogs.worldbank.org/example",
            published=now - timedelta(hours=18),
            summary_raw="Despite challenging global conditions, many emerging markets have shown remarkable resilience. This post examines the factors contributing to their performance and risks that remain on the horizon.",
        ),
        InsightArticle(
            id="mock006",
            source="IMF Blog",
            source_icon="🌐",
            title="The Great Fiscal Challenge: Managing Public Debt",
            link="https://www.imf.org/en/Blogs/example2",
            published=now - timedelta(days=1),
            summary_raw="Government debt levels have surged globally following pandemic-era fiscal support. This article discusses strategies for fiscal consolidation while maintaining growth and social protection.",
        ),
        InsightArticle(
            id="mock007",
            source="Fed St. Louis",
            source_icon="🏛️",
            title="Labor Market Dynamics: What the Data Tells Us",
            link="https://www.stlouisfed.org/on-the-economy/example2",
            published=now - timedelta(days=1, hours=6),
            summary_raw="The US labor market continues to show strength despite rate hikes. This analysis examines job openings, wage growth, and participation trends to assess labor market tightness.",
        ),
        InsightArticle(
            id="mock008",
            source="BIS",
            source_icon="🏦",
            title="Global Banking Sector: Stress Tests and Resilience",
            link="https://www.bis.org/publ/example2",
            published=now - timedelta(days=2),
            summary_raw="Following recent banking sector turbulence, this report assesses the health of global banks through stress test results and capital adequacy metrics. Overall, the system remains resilient.",
        ),
    ]
