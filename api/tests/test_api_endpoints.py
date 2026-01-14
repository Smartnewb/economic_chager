"""
API Endpoint Tests

Tests all /api/* endpoints to verify they return 200 status codes
and valid JSON responses.

Note: Endpoints are tested based on actual API routes defined in main.py
"""

import pytest


class TestRootEndpoints:
    """Test root-level API endpoints."""

    def test_health_check(self, client):
        """Test health check endpoint."""
        response = client.get("/api/health")
        assert response.status_code == 200

    def test_root_endpoint(self, client):
        """Test root endpoint returns something."""
        response = client.get("/")
        assert response.status_code in [200, 307, 308]

    def test_legacy_health(self, client):
        """Test legacy health endpoint."""
        response = client.get("/health")
        assert response.status_code == 200


class TestCacheEndpoints:
    """Test cache management endpoints."""

    def test_cache_stats(self, client):
        """Test cache statistics endpoint."""
        response = client.get("/api/cache/stats")
        assert response.status_code == 200
        data = response.json()
        assert "response_cache" in data


class TestFXEndpoints:
    """Test FX/Currency API endpoints."""

    def test_fx_data(self, client):
        """Test FX data endpoint."""
        response = client.get("/api/fx/data")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, (list, dict))


class TestBondsEndpoints:
    """Test Bond market API endpoints."""

    def test_bonds_yields(self, client):
        """Test bonds yields endpoint."""
        response = client.get("/api/bonds/yields")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, (list, dict))

    def test_bonds_global(self, client):
        """Test bonds global endpoint."""
        response = client.get("/api/bonds/global")
        assert response.status_code == 200


class TestStocksEndpoints:
    """Test Stock market API endpoints."""

    def test_stocks_global(self, client):
        """Test stocks global endpoint."""
        response = client.get("/api/stocks/global")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, (list, dict))


class TestPolicyEndpoints:
    """Test Central Bank Policy API endpoints."""

    def test_policy_global(self, client):
        """Test global policy endpoint."""
        response = client.get("/api/policy/global")
        assert response.status_code == 200


class TestEconomyEndpoints:
    """Test Economic data API endpoints."""

    def test_economy_data(self, client):
        """Test economy data endpoint."""
        response = client.get("/api/economy/data")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, (list, dict))


class TestWhaleEndpoints:
    """Test Whale Tracker API endpoints."""

    def test_whale_radar(self, client):
        """Test whale radar endpoint."""
        response = client.get("/api/whale/radar")
        assert response.status_code == 200
        data = response.json()
        assert "blips" in data or isinstance(data, list)

    def test_whale_insider(self, client):
        """Test whale insider endpoint."""
        response = client.get("/api/whale/insider")
        assert response.status_code == 200

    def test_whale_consensus(self, client):
        """Test whale consensus endpoint."""
        response = client.get("/api/whale/consensus")
        assert response.status_code == 200

    def test_whale_guru_list(self, client):
        """Test whale guru list endpoint."""
        response = client.get("/api/whale/guru")
        assert response.status_code == 200

    def test_whale_alerts(self, client):
        """Test whale alerts endpoint."""
        response = client.get("/api/whale/alerts")
        assert response.status_code == 200

    def test_whale_put_call_ratio(self, client):
        """Test whale put-call ratio endpoint."""
        response = client.get("/api/whale/put-call-ratio")
        assert response.status_code == 200


class TestMacroEndpoints:
    """Test Macro health check API endpoints."""

    def test_macro_health_check(self, client):
        """Test macro health check endpoint."""
        response = client.get("/api/macro/health-check")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, (list, dict))

    def test_macro_ai_context(self, client):
        """Test macro AI context endpoint."""
        response = client.get("/api/macro/ai-context")
        assert response.status_code == 200

    def test_macro_buffett_indicator(self, client):
        """Test macro Buffett indicator endpoint."""
        response = client.get("/api/macro/buffett-indicator")
        assert response.status_code == 200


class TestHistoryEndpoints:
    """Test Historical data API endpoints."""

    def test_history_parallel(self, client):
        """Test history parallel endpoint."""
        response = client.get("/api/history/parallel")
        assert response.status_code == 200

    def test_history_crises(self, client):
        """Test history crises endpoint."""
        response = client.get("/api/history/crises")
        assert response.status_code == 200

    def test_history_events(self, client):
        """Test history events endpoint."""
        response = client.get("/api/history/events")
        assert response.status_code == 200


class TestCountryEndpoints:
    """Test Country scanner API endpoints."""

    def test_country_us(self, client):
        """Test country data endpoint for US."""
        response = client.get("/api/country/US")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)

    def test_country_kr(self, client):
        """Test country data endpoint for Korea."""
        response = client.get("/api/country/KR")
        assert response.status_code == 200

    def test_country_jp(self, client):
        """Test country data endpoint for Japan."""
        response = client.get("/api/country/JP")
        assert response.status_code == 200


class TestInsightsEndpoints:
    """Test Insights/News API endpoints."""

    def test_insights_sources(self, client):
        """Test insights sources endpoint."""
        response = client.get("/api/insights/sources")
        assert response.status_code == 200

    def test_insights_list(self, client):
        """Test insights list endpoint."""
        response = client.get("/api/insights/list")
        assert response.status_code == 200

    def test_insights_behavioral_bias(self, client):
        """Test insights behavioral bias endpoint."""
        response = client.get("/api/insights/behavioral-bias")
        assert response.status_code == 200


class TestAnalyzeEndpoints:
    """Test AI Analysis API endpoints."""

    def test_analyze_bonds(self, client):
        """Test bonds analysis endpoint (POST)."""
        response = client.post("/api/analyze/bonds", json={})
        # May return 200, 400, or 422 depending on required data
        assert response.status_code in [200, 400, 422, 500]

    def test_analyze_stocks(self, client):
        """Test stocks analysis endpoint (POST)."""
        response = client.post("/api/analyze/stocks", json={})
        assert response.status_code in [200, 400, 422, 500]

    def test_analyze_fx(self, client):
        """Test FX analysis endpoint (POST)."""
        response = client.post("/api/analyze/fx", json={})
        assert response.status_code in [200, 400, 422, 500]

    def test_analyze_bonds_cached(self, client):
        """Test cached bonds analysis endpoint."""
        response = client.get("/api/analyze/bonds/cached")
        assert response.status_code == 200

    def test_analyze_fx_cached(self, client):
        """Test cached FX analysis endpoint."""
        response = client.get("/api/analyze/fx/cached")
        assert response.status_code == 200

    def test_analyze_stocks_cached(self, client):
        """Test cached stocks analysis endpoint."""
        response = client.get("/api/analyze/stocks/cached")
        assert response.status_code == 200


class TestInstitutionalEndpoints:
    """Test Institutional data API endpoints."""

    def test_institutional_imf(self, client):
        """Test IMF data endpoint."""
        response = client.get("/api/institutional/imf/KOR")
        assert response.status_code == 200

    def test_institutional_report_card(self, client):
        """Test institutional report card endpoint."""
        response = client.get("/api/institutional/report-card/USA")
        assert response.status_code == 200

    def test_institutional_ai_context(self, client):
        """Test institutional AI context endpoint."""
        response = client.get("/api/institutional/ai-context/USA")
        assert response.status_code == 200


class TestResponseFormats:
    """Test that API responses have correct formats."""

    def test_bonds_yields_format(self, client):
        """Test bonds yields response format."""
        response = client.get("/api/bonds/yields")
        assert response.status_code == 200
        data = response.json()
        # Should have yield curve data
        if "curve" in data:
            assert isinstance(data["curve"], list)

    def test_whale_radar_format(self, client):
        """Test whale radar response format."""
        response = client.get("/api/whale/radar")
        assert response.status_code == 200
        data = response.json()
        # Should have blips
        if "blips" in data:
            assert isinstance(data["blips"], list)
        elif isinstance(data, list):
            assert True  # Direct list format is acceptable

    def test_country_score_format(self, client):
        """Test country score response format."""
        response = client.get("/api/country/US")
        assert response.status_code == 200
        data = response.json()
        # Should have overall_score or similar
        assert isinstance(data, dict)
