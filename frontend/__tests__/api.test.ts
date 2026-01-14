import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { API_BASE_URL, apiEndpoints, apiFetch } from '../lib/api';

describe('API Configuration', () => {
  describe('API_BASE_URL', () => {
    it('should default to localhost:8000', () => {
      expect(API_BASE_URL).toBe('http://localhost:8000');
    });
  });

  describe('apiEndpoints', () => {
    describe('fx endpoints', () => {
      it('should have correct fx endpoints', () => {
        expect(apiEndpoints.fx.rates).toBe(`${API_BASE_URL}/api/fx/rates`);
        expect(apiEndpoints.fx.flows).toBe(`${API_BASE_URL}/api/fx/flows`);
      });
    });

    describe('bonds endpoints', () => {
      it('should have correct bonds endpoints', () => {
        expect(apiEndpoints.bonds.yields).toBe(`${API_BASE_URL}/api/bonds/yields`);
        expect(apiEndpoints.bonds.curve).toBe(`${API_BASE_URL}/api/bonds/curve`);
      });
    });

    describe('stocks endpoints', () => {
      it('should have correct stocks endpoints', () => {
        expect(apiEndpoints.stocks.data).toBe(`${API_BASE_URL}/api/stocks`);
        expect(apiEndpoints.stocks.indices).toBe(`${API_BASE_URL}/api/stocks/indices`);
        expect(apiEndpoints.stocks.sectors).toBe(`${API_BASE_URL}/api/stocks/sectors`);
      });
    });

    describe('policy endpoints', () => {
      it('should have correct policy endpoints', () => {
        expect(apiEndpoints.policy.global).toBe(`${API_BASE_URL}/api/policy/global`);
        expect(apiEndpoints.policy.rates).toBe(`${API_BASE_URL}/api/policy/rates`);
      });
    });

    describe('economy endpoints', () => {
      it('should have correct economy endpoints', () => {
        expect(apiEndpoints.economy.data).toBe(`${API_BASE_URL}/api/economy`);
        expect(apiEndpoints.economy.commodities).toBe(`${API_BASE_URL}/api/economy/commodities`);
        expect(apiEndpoints.economy.pmi).toBe(`${API_BASE_URL}/api/economy/pmi`);
      });
    });

    describe('whale endpoints', () => {
      it('should have correct whale endpoints', () => {
        expect(apiEndpoints.whale.alerts).toBe(`${API_BASE_URL}/api/whale/alerts`);
        expect(apiEndpoints.whale.radar).toBe(`${API_BASE_URL}/api/whale/radar`);
        expect(apiEndpoints.whale.insider).toBe(`${API_BASE_URL}/api/whale/insider`);
        expect(apiEndpoints.whale.consensus).toBe(`${API_BASE_URL}/api/whale/consensus`);
      });

      it('should generate dynamic guru endpoint', () => {
        expect(apiEndpoints.whale.guru('berkshire')).toBe(`${API_BASE_URL}/api/whale/guru/berkshire`);
        expect(apiEndpoints.whale.guru('bridgewater')).toBe(`${API_BASE_URL}/api/whale/guru/bridgewater`);
      });
    });

    describe('macro endpoints', () => {
      it('should have correct macro endpoints', () => {
        expect(apiEndpoints.macro.healthCheck).toBe(`${API_BASE_URL}/api/macro/health-check`);
      });
    });

    describe('history endpoints', () => {
      it('should have correct history endpoints', () => {
        expect(apiEndpoints.history.data).toBe(`${API_BASE_URL}/api/history`);
      });
    });

    describe('country endpoints', () => {
      it('should generate dynamic country endpoint', () => {
        expect(apiEndpoints.country.data('US')).toBe(`${API_BASE_URL}/api/country/US`);
        expect(apiEndpoints.country.data('KR')).toBe(`${API_BASE_URL}/api/country/KR`);
      });
    });

    describe('analyze endpoints', () => {
      it('should have all analysis endpoints', () => {
        expect(apiEndpoints.analyze.bonds).toBe(`${API_BASE_URL}/api/analyze/bonds`);
        expect(apiEndpoints.analyze.stocks).toBe(`${API_BASE_URL}/api/analyze/stocks`);
        expect(apiEndpoints.analyze.fx).toBe(`${API_BASE_URL}/api/analyze/fx`);
        expect(apiEndpoints.analyze.policy).toBe(`${API_BASE_URL}/api/analyze/policy`);
        expect(apiEndpoints.analyze.economy).toBe(`${API_BASE_URL}/api/analyze/economy`);
        expect(apiEndpoints.analyze.history).toBe(`${API_BASE_URL}/api/analyze/history`);
        expect(apiEndpoints.analyze.country).toBe(`${API_BASE_URL}/api/analyze/country`);
        expect(apiEndpoints.analyze.whale).toBe(`${API_BASE_URL}/api/analyze/whale`);
      });
    });

    describe('insights endpoints', () => {
      it('should have correct insights endpoints', () => {
        expect(apiEndpoints.insights.news).toBe(`${API_BASE_URL}/api/insights/news`);
        expect(apiEndpoints.insights.sources).toBe(`${API_BASE_URL}/api/insights/sources`);
      });
    });

    describe('institutional endpoints', () => {
      it('should generate dynamic institutional endpoints', () => {
        expect(apiEndpoints.institutional.imf('KOR')).toBe(`${API_BASE_URL}/api/institutional/imf/KOR`);
        expect(apiEndpoints.institutional.reports('USA')).toBe(`${API_BASE_URL}/api/institutional/reports/USA`);
      });
    });

    describe('weather endpoints', () => {
      it('should have correct weather endpoints', () => {
        expect(apiEndpoints.weather.data).toBe(`${API_BASE_URL}/api/weather`);
      });
    });
  });
});

describe('apiFetch', () => {
  const mockData = { message: 'success' };

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should make GET request and return JSON', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const result = await apiFetch('/api/test');

    expect(global.fetch).toHaveBeenCalledWith('/api/test', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(result).toEqual(mockData);
  });

  it('should include Content-Type header by default', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    await apiFetch('/api/test');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('should merge custom headers', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    await apiFetch('/api/test', {
      headers: {
        Authorization: 'Bearer token123',
      },
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/test', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token123',
      },
    });
  });

  it('should throw error on non-ok response', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    await expect(apiFetch('/api/test')).rejects.toThrow('API Error: 404 Not Found');
  });

  it('should throw error on 500 response', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    await expect(apiFetch('/api/test')).rejects.toThrow('API Error: 500 Internal Server Error');
  });

  it('should pass through request options', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    await apiFetch('/api/test', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });
});
