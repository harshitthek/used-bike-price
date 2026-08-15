import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiFetch, apiGet, apiPost } from '../hooks/useApi'

describe('useApi Utility Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('apiGet returns parsed JSON on 200 OK', async () => {
    const mockData = { status: 'healthy', version: '2.5.0' }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    })

    const result = await apiGet('/health')
    expect(result).toEqual(mockData)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/health'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-api-key': expect.any(String),
        }),
      })
    )
  })

  it('apiPost sends JSON payload and returns response', async () => {
    const payload = { vehicle_type: 'bike', brand: 'Royal Enfield' }
    const mockResponse = { estimated_price: 125000 }
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await apiPost('/predict', payload)
    expect(result).toEqual(mockResponse)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/predict'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    )
  })

  it('throws friendly error on 401 Unauthorized', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'Invalid API Key' }),
    })

    await expect(apiGet('/predict')).rejects.toThrow('Authentication failed. Check your API key.')
  })

  it('throws friendly error on 422 Unprocessable Entity', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ detail: 'Validation error' }),
    })

    await expect(apiGet('/predict')).rejects.toThrow('Some input values are outside allowed limits.')
  })

  it('throws friendly error on 429 Rate Limit Exceeded', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ detail: 'Rate limit' }),
    })

    await expect(apiGet('/predict')).rejects.toThrow('Too many requests. Please wait and try again.')
  })
})
