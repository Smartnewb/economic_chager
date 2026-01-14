"""
Centralized Logging System for Insight Flow API

Provides structured logging with different levels:
- DEBUG: Detailed information for debugging
- INFO: General operational messages
- WARNING: Potential issues that don't stop operation
- ERROR: Errors that affect specific operations
- CRITICAL: System-wide failures

Features:
- Colored console output for development
- JSON file output for production
- Request/response logging middleware
- Performance timing decorators
"""

import logging
import sys
import os
import json
import time
import functools
from datetime import datetime
from pathlib import Path
from typing import Optional, Callable, Any
from logging.handlers import RotatingFileHandler

# Create logs directory
LOGS_DIR = Path(__file__).parent.parent / "logs"
LOGS_DIR.mkdir(exist_ok=True)


class ColoredFormatter(logging.Formatter):
    """Colored output for console logging."""

    COLORS = {
        "DEBUG": "\033[36m",  # Cyan
        "INFO": "\033[32m",  # Green
        "WARNING": "\033[33m",  # Yellow
        "ERROR": "\033[31m",  # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        record.levelname = f"{color}{record.levelname}{self.RESET}"
        record.msg = f"{color}{record.msg}{self.RESET}"
        return super().format(record)


class JSONFormatter(logging.Formatter):
    """JSON output for file logging and log aggregation."""

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        if hasattr(record, "duration_ms"):
            log_data["duration_ms"] = record.duration_ms
        if hasattr(record, "endpoint"):
            log_data["endpoint"] = record.endpoint
        if hasattr(record, "status_code"):
            log_data["status_code"] = record.status_code
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)


def setup_logger(
    name: str = "insight_flow",
    level: int = logging.INFO,
    console: bool = True,
    file: bool = True,
) -> logging.Logger:
    """
    Create and configure a logger.

    Args:
        name: Logger name (usually module name)
        level: Logging level
        console: Enable console output
        file: Enable file output

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)

    if logger.hasHandlers():
        return logger

    logger.setLevel(level)

    # Console handler with colors
    if console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(level)
        console_format = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
        console_handler.setFormatter(ColoredFormatter(console_format, datefmt="%H:%M:%S"))
        logger.addHandler(console_handler)

    # File handler with JSON
    if file:
        log_file = LOGS_DIR / f"{name}.log"
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
            encoding="utf-8",
        )
        file_handler.setLevel(level)
        file_handler.setFormatter(JSONFormatter())
        logger.addHandler(file_handler)

    return logger


def log_execution_time(logger: Optional[logging.Logger] = None):
    """
    Decorator to log function execution time.

    Usage:
        @log_execution_time()
        async def my_endpoint():
            ...
    """

    def decorator(func: Callable) -> Callable:
        nonlocal logger
        if logger is None:
            logger = setup_logger(func.__module__)

        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs) -> Any:
            start_time = time.perf_counter()
            try:
                result = await func(*args, **kwargs)
                duration_ms = (time.perf_counter() - start_time) * 1000
                logger.info(f"{func.__name__} completed in {duration_ms:.2f}ms")
                return result
            except Exception as e:
                duration_ms = (time.perf_counter() - start_time) * 1000
                logger.error(f"{func.__name__} failed after {duration_ms:.2f}ms: {e}")
                raise

        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs) -> Any:
            start_time = time.perf_counter()
            try:
                result = func(*args, **kwargs)
                duration_ms = (time.perf_counter() - start_time) * 1000
                logger.info(f"{func.__name__} completed in {duration_ms:.2f}ms")
                return result
            except Exception as e:
                duration_ms = (time.perf_counter() - start_time) * 1000
                logger.error(f"{func.__name__} failed after {duration_ms:.2f}ms: {e}")
                raise

        import asyncio

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator


def log_api_call(endpoint: str, method: str = "GET"):
    """
    Decorator to log API endpoint calls.

    Usage:
        @log_api_call("/api/bonds/yields")
        async def get_bond_yields():
            ...
    """

    def decorator(func: Callable) -> Callable:
        logger = setup_logger("api.endpoints")

        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs) -> Any:
            start_time = time.perf_counter()
            logger.info(f"{method} {endpoint} - Request started")

            try:
                result = await func(*args, **kwargs)
                duration_ms = (time.perf_counter() - start_time) * 1000
                logger.info(f"{method} {endpoint} - 200 OK ({duration_ms:.2f}ms)")
                return result
            except Exception as e:
                duration_ms = (time.perf_counter() - start_time) * 1000
                logger.error(f"{method} {endpoint} - Error: {e} ({duration_ms:.2f}ms)")
                raise

        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs) -> Any:
            start_time = time.perf_counter()
            logger.info(f"{method} {endpoint} - Request started")

            try:
                result = func(*args, **kwargs)
                duration_ms = (time.perf_counter() - start_time) * 1000
                logger.info(f"{method} {endpoint} - 200 OK ({duration_ms:.2f}ms)")
                return result
            except Exception as e:
                duration_ms = (time.perf_counter() - start_time) * 1000
                logger.error(f"{method} {endpoint} - Error: {e} ({duration_ms:.2f}ms)")
                raise

        import asyncio

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator


class APILogger:
    """
    Centralized API logger with convenience methods.

    Usage:
        from logger import api_logger
        api_logger.info("Server started")
        api_logger.error("Database connection failed", exc_info=True)
    """

    def __init__(self):
        self.logger = setup_logger("insight_flow.api")

    def debug(self, msg: str, **kwargs):
        self.logger.debug(msg, **kwargs)

    def info(self, msg: str, **kwargs):
        self.logger.info(msg, **kwargs)

    def warning(self, msg: str, **kwargs):
        self.logger.warning(msg, **kwargs)

    def error(self, msg: str, **kwargs):
        self.logger.error(msg, **kwargs)

    def critical(self, msg: str, **kwargs):
        self.logger.critical(msg, **kwargs)

    def api_request(self, method: str, path: str, status: int, duration_ms: float):
        """Log an API request with structured data."""
        level = logging.INFO if status < 400 else logging.WARNING if status < 500 else logging.ERROR
        self.logger.log(level, f"{method} {path} -> {status} ({duration_ms:.2f}ms)")

    def external_api(self, service: str, success: bool, duration_ms: float, error: str = None):
        """Log external API calls (FMP, FRED, etc.)."""
        if success:
            self.logger.info(f"External API [{service}] succeeded ({duration_ms:.2f}ms)")
        else:
            self.logger.warning(f"External API [{service}] failed ({duration_ms:.2f}ms): {error}")

    def cache_hit(self, key: str):
        """Log cache hit."""
        self.logger.debug(f"Cache HIT: {key}")

    def cache_miss(self, key: str):
        """Log cache miss."""
        self.logger.debug(f"Cache MISS: {key}")

    def analysis_request(self, topic: str, language: str, cached: bool):
        """Log AI analysis request."""
        cache_status = "cached" if cached else "new"
        self.logger.info(f"Analysis [{topic}] ({language}) - {cache_status}")


# Singleton instance
api_logger = APILogger()


# Module-level loggers for different components
market_logger = setup_logger("insight_flow.market")
whale_logger = setup_logger("insight_flow.whale")
analysis_logger = setup_logger("insight_flow.analysis")
country_logger = setup_logger("insight_flow.country")
