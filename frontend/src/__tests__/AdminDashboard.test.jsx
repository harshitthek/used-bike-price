import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { AdminDashboard } from '../views/AdminDashboard'

describe('AdminDashboard Component Suite', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        total_predictions: 142,
        predictions_24h: 18,
        recommendation: 'stable',
        generated_at: '2026-08-15T18:00:00Z',
        drift_analysis: {
          bike_price: {
            psi: 0.042,
            status: 'stable',
            recent_mean: 62000,
            training_mean: 58000,
            sample_size: 28
          }
        }
      })
    })
  })

  it('renders MLOps telemetry and drift metrics properly', async () => {
    render(<AdminDashboard />)

    expect(await screen.findByText(/Telemetry, Drift Detection & Production Operations/i)).toBeInTheDocument()
    expect(await screen.findByText(/Hot-Reload Models/i)).toBeInTheDocument()
    expect(await screen.findByText(/Refresh Telemetry/i)).toBeInTheDocument()
  })
})
