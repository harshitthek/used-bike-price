import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiPost, apiGet } from '../hooks/useApi'

describe('Edge Inference Fallback Engine', () => {
  beforeEach(() => {
    // Simulate offline / server unavailable by mocking fetch rejection
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
  })

  it('computes edge prediction for motorcycle gracefully when backend is offline', async () => {
    const payload = {
      vehicle_type: 'bike',
      brand: 'Royal Enfield',
      power: 350,
      kms_driven: 15000,
      age: 3,
      owner_rank: 1,
    }

    const result = await apiPost('/predict', payload)
    expect(result).toBeDefined()
    expect(result.vehicle_type).toBe('bike')
    expect(result.brand).toBe('Royal Enfield')
    expect(result.estimated_price).toBeGreaterThan(50000)
    expect(result.price_range.min).toBeLessThan(result.estimated_price)
    expect(result.price_range.max).toBeGreaterThan(result.estimated_price)
    expect(result.depreciation_forecast).toHaveLength(6)
  })

  it('computes edge prediction for car gracefully when backend is offline', async () => {
    const payload = {
      vehicle_type: 'car',
      brand: 'Toyota',
      engine_cc: 2755,
      kms_driven: 45000,
      age: 4,
      owner_rank: 1,
      fuel: 'Diesel',
      transmission: 'Automatic',
    }

    const result = await apiPost('/predict', payload)
    expect(result).toBeDefined()
    expect(result.vehicle_type).toBe('car')
    expect(result.brand).toBe('Toyota')
    expect(result.estimated_price).toBeGreaterThan(400000)
    expect(result.depreciation_forecast).toHaveLength(6)
  })

  it('computes edge lifecycle simulation when backend is offline', async () => {
    const payload = {
      vehicle_type: 'bike',
      brand: 'KTM',
      power: 390,
      kms_driven: 10000,
      age: 2,
      owner_rank: 1,
      annual_kms: 8000,
    }

    const result = await apiPost('/simulate/lifecycle', payload)
    expect(result).toBeDefined()
    expect(result.timeline).toHaveLength(6)
    expect(result.summary.optimal_liquidation_year).toBe(3)
    expect(result.summary.total_5yr_tco).toBeGreaterThan(0)
  })

  it('provides edge historical price trends when backend is offline', async () => {
    const result = await apiGet('/api/v1/trends?vehicle_type=bike&brand=Yamaha')
    expect(result).toBeDefined()
    expect(result.vehicle_type).toBe('bike')
    expect(result.available_brands).toContain('Yamaha')
    expect(result.data.length).toBeGreaterThan(0)
  })

  it('provides edge contract schemas when backend is offline', async () => {
    const result = await apiGet('/contract')
    expect(result).toBeDefined()
    expect(result.bike.ui.brands).toContain('Royal Enfield')
    expect(result.car.ui.brands).toContain('Maruti')
  })
})
