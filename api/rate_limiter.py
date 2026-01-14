"""
Rate Limiting and Caching Strategy for Insight Flow API

Features:
- In-memory rate limiting per IP address
- Sliding window algorithm for accurate limiting
- Different limits for different endpoint categories
- Redis-compatible interface for future scaling
"""

import time
import hashlib
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Optional
from functools import wraps
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse


@dataclass
class RateLimitConfig:
    """Configuration for rate limiting."""
    requests_per_minute: int = 60
    requests_per_hour: int = 1000
    burst_limit: int = 10
    block_duration_seconds: int = 60


@dataclass
class CacheConfig:
    """Configuration for API response caching."""
    market_data_ttl: int = 60  # 1 minute for real-time market data
    country_data_ttl: int = 3600  # 1 hour for country scores
    analysis_ttl: int = 1800  # 30 minutes for AI analysis
    static_data_ttl: int = 86400  # 24 hours for static data


class SlidingWindowRateLimiter:
    """
    Sliding window rate limiter with in-memory storage.

    For production, replace with Redis-based implementation.
    """

    def __init__(self, config: Optional[RateLimitConfig] = None):
        self.config = config or RateLimitConfig()
        self._minute_windows: dict[str, list[float]] = defaultdict(list)
        self._hour_windows: dict[str, list[float]] = defaultdict(list)
        self._blocked_until: dict[str, float] = {}

    def _get_client_key(self, request: Request) -> str:
        """Get unique identifier for the client."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else "unknown"

        user_agent = request.headers.get("User-Agent", "")
        key = f"{ip}:{hashlib.md5(user_agent.encode()).hexdigest()[:8]}"
        return key

    def _cleanup_window(self, window: list[float], cutoff: float) -> list[float]:
        """Remove timestamps older than cutoff."""
        return [ts for ts in window if ts > cutoff]

    def is_allowed(self, request: Request) -> tuple[bool, Optional[dict]]:
        """
        Check if request is allowed under rate limits.

        Returns:
            (is_allowed, rate_limit_info)
        """
        client_key = self._get_client_key(request)
        now = time.time()

        # Check if client is blocked
        if client_key in self._blocked_until:
            if now < self._blocked_until[client_key]:
                retry_after = int(self._blocked_until[client_key] - now)
                return False, {
                    "error": "rate_limit_exceeded",
                    "retry_after": retry_after,
                    "message": f"Too many requests. Please retry after {retry_after} seconds."
                }
            else:
                del self._blocked_until[client_key]

        # Cleanup old timestamps
        minute_cutoff = now - 60
        hour_cutoff = now - 3600

        self._minute_windows[client_key] = self._cleanup_window(
            self._minute_windows[client_key], minute_cutoff
        )
        self._hour_windows[client_key] = self._cleanup_window(
            self._hour_windows[client_key], hour_cutoff
        )

        # Check per-minute limit
        minute_count = len(self._minute_windows[client_key])
        if minute_count >= self.config.requests_per_minute:
            self._blocked_until[client_key] = now + self.config.block_duration_seconds
            return False, {
                "error": "rate_limit_exceeded",
                "retry_after": self.config.block_duration_seconds,
                "message": "Per-minute rate limit exceeded."
            }

        # Check per-hour limit
        hour_count = len(self._hour_windows[client_key])
        if hour_count >= self.config.requests_per_hour:
            self._blocked_until[client_key] = now + self.config.block_duration_seconds * 5
            return False, {
                "error": "rate_limit_exceeded",
                "retry_after": self.config.block_duration_seconds * 5,
                "message": "Per-hour rate limit exceeded."
            }

        # Request is allowed, record it
        self._minute_windows[client_key].append(now)
        self._hour_windows[client_key].append(now)

        return True, {
            "remaining_minute": self.config.requests_per_minute - minute_count - 1,
            "remaining_hour": self.config.requests_per_hour - hour_count - 1
        }

    def get_headers(self, rate_info: dict) -> dict:
        """Generate rate limit headers for response."""
        if "error" in rate_info:
            return {
                "X-RateLimit-Limit": str(self.config.requests_per_minute),
                "X-RateLimit-Remaining": "0",
                "Retry-After": str(rate_info.get("retry_after", 60))
            }
        return {
            "X-RateLimit-Limit": str(self.config.requests_per_minute),
            "X-RateLimit-Remaining": str(rate_info.get("remaining_minute", 0)),
            "X-RateLimit-Reset": str(int(time.time()) + 60)
        }


class ResponseCache:
    """
    In-memory response cache with TTL support.

    For production, replace with Redis-based implementation.
    """

    def __init__(self, config: Optional[CacheConfig] = None):
        self.config = config or CacheConfig()
        self._cache: dict[str, tuple[any, float]] = {}
        self._last_cleanup = time.time()
        self._cleanup_interval = 300  # 5 minutes

    def _get_ttl(self, endpoint: str) -> int:
        """Get TTL based on endpoint category."""
        if any(x in endpoint for x in ["/market", "/stocks", "/fx", "/bonds"]):
            return self.config.market_data_ttl
        elif "/country" in endpoint:
            return self.config.country_data_ttl
        elif "/analyze" in endpoint:
            return self.config.analysis_ttl
        else:
            return self.config.static_data_ttl

    def _generate_key(self, request: Request) -> str:
        """Generate cache key from request."""
        method = request.method
        path = request.url.path
        query = str(sorted(request.query_params.items()))
        return f"{method}:{path}:{hashlib.md5(query.encode()).hexdigest()}"

    def _cleanup_expired(self):
        """Remove expired entries from cache."""
        now = time.time()
        if now - self._last_cleanup < self._cleanup_interval:
            return

        expired_keys = [
            key for key, (_, expires_at) in self._cache.items()
            if expires_at < now
        ]
        for key in expired_keys:
            del self._cache[key]

        self._last_cleanup = now

    def get(self, request: Request) -> Optional[any]:
        """Get cached response if available and not expired."""
        self._cleanup_expired()

        key = self._generate_key(request)
        if key in self._cache:
            value, expires_at = self._cache[key]
            if time.time() < expires_at:
                return value
            else:
                del self._cache[key]
        return None

    def set(self, request: Request, value: any, ttl: Optional[int] = None):
        """Cache response with TTL."""
        key = self._generate_key(request)
        if ttl is None:
            ttl = self._get_ttl(request.url.path)
        expires_at = time.time() + ttl
        self._cache[key] = (value, expires_at)

    def invalidate(self, pattern: str):
        """Invalidate cache entries matching pattern."""
        keys_to_delete = [
            key for key in self._cache.keys()
            if pattern in key
        ]
        for key in keys_to_delete:
            del self._cache[key]

    def clear(self):
        """Clear all cache entries."""
        self._cache.clear()

    def stats(self) -> dict:
        """Get cache statistics."""
        now = time.time()
        valid_entries = sum(
            1 for _, (_, expires_at) in self._cache.items()
            if expires_at > now
        )
        return {
            "total_entries": len(self._cache),
            "valid_entries": valid_entries,
            "expired_entries": len(self._cache) - valid_entries
        }


# Global instances
rate_limiter = SlidingWindowRateLimiter(
    RateLimitConfig(
        requests_per_minute=120,  # 2 requests per second average
        requests_per_hour=3000,   # Generous hourly limit
        burst_limit=20,           # Allow bursts
        block_duration_seconds=30
    )
)

response_cache = ResponseCache(
    CacheConfig(
        market_data_ttl=60,       # 1 minute
        country_data_ttl=3600,    # 1 hour
        analysis_ttl=1800,        # 30 minutes
        static_data_ttl=86400     # 24 hours
    )
)


async def rate_limit_middleware(request: Request, call_next):
    """
    FastAPI middleware for rate limiting.

    Usage in main.py:
        from rate_limiter import rate_limit_middleware
        app.middleware("http")(rate_limit_middleware)
    """
    # Skip rate limiting for health checks
    if request.url.path in ["/api/health", "/health", "/docs", "/openapi.json"]:
        return await call_next(request)

    is_allowed, rate_info = rate_limiter.is_allowed(request)

    if not is_allowed:
        return JSONResponse(
            status_code=429,
            content=rate_info,
            headers=rate_limiter.get_headers(rate_info)
        )

    response = await call_next(request)

    # Add rate limit headers to response
    for key, value in rate_limiter.get_headers(rate_info).items():
        response.headers[key] = value

    return response


def cached_endpoint(ttl: Optional[int] = None):
    """
    Decorator for caching endpoint responses.

    Usage:
        @app.get("/api/country/{code}")
        @cached_endpoint(ttl=3600)
        async def get_country(code: str, request: Request):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, request: Request = None, **kwargs):
            # Try to get from cache
            if request:
                cached = response_cache.get(request)
                if cached is not None:
                    return cached

            # Execute function
            result = await func(*args, request=request, **kwargs)

            # Cache the result
            if request:
                response_cache.set(request, result, ttl)

            return result
        return wrapper
    return decorator


# Endpoint-specific rate limiters for sensitive operations
analysis_rate_limiter = SlidingWindowRateLimiter(
    RateLimitConfig(
        requests_per_minute=10,   # AI analysis is expensive
        requests_per_hour=100,
        burst_limit=3,
        block_duration_seconds=60
    )
)


def rate_limit_analysis(request: Request):
    """Check rate limit for AI analysis endpoints."""
    is_allowed, rate_info = analysis_rate_limiter.is_allowed(request)
    if not is_allowed:
        raise HTTPException(
            status_code=429,
            detail=rate_info
        )


# Caching strategy documentation
CACHING_STRATEGY = """
## API Caching Strategy

### TTL by Endpoint Category

| Category | TTL | Rationale |
|----------|-----|-----------|
| Market Data (/stocks, /fx, /bonds) | 60s | Real-time updates needed |
| Country Scores | 1 hour | Stable, expensive to compute |
| AI Analysis | 30 min | Expensive, content doesn't change rapidly |
| Static Data (policies, history) | 24 hours | Rarely changes |
| Weather/Dashboard | 5 min | Aggregated, moderate freshness needed |

### Rate Limits

| Tier | Per Minute | Per Hour | Notes |
|------|------------|----------|-------|
| Default | 120 | 3000 | General API access |
| Analysis | 10 | 100 | AI endpoints (expensive) |
| Burst | 20 | - | Maximum burst allowed |

### Cache Invalidation

1. **Time-based**: Automatic expiration via TTL
2. **Manual**: Call `response_cache.invalidate(pattern)` for specific endpoints
3. **Full clear**: Call `response_cache.clear()` for cache reset

### Future Improvements

1. **Redis Backend**: Replace in-memory with Redis for:
   - Persistence across restarts
   - Shared cache across multiple instances
   - Better memory management

2. **Cache Headers**: Add ETag and Last-Modified for client-side caching

3. **Compression**: Add gzip compression for large responses

4. **Analytics**: Track cache hit/miss ratios for optimization
"""
