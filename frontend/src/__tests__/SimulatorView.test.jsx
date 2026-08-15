import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { SimulatorView } from '../views/SimulatorView'

// Mock AnimatedVehicleStage to isolate view testing
vi.mock('../components/ui/AnimatedVehicleStage', () => ({
  AnimatedVehicleStage: () => <div data-testid="mock-vehicle-stage">Vehicle Stage</div>
}))

describe('SimulatorView Component Suite', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        vehicle_type: 'bike',
        brand: 'Royal Enfield',
        initial_price: 150000,
        optimal_sell_window: { recommended_sell_year: 3 },
        timeline: [
          { year: 1, age: 1, cumulative_kms: 12000, estimated_resale_value: 125000, annual_depreciation: 25000, fuel_cost: 24000, maintenance_cost: 4000, insurance_cost: 3500, annual_total_cost: 56500, cumulative_total_cost: 56500, retention_pct: 83.3 }
        ]
      })
    })
  })

  it('renders simulator banner and parameters properly without crashing', async () => {
    render(
      <SimulatorView
        contracts={{
          bike: { ui: { brands: ['Royal Enfield', 'KTM'] } },
          car: { ui: { brands: ['Maruti', 'Hyundai'] } }
        }}
      />
    )

    expect(await screen.findByText(/Dynamic Vehicle Lifecycle & Total Cost of Ownership/i)).toBeInTheDocument()
    expect(await screen.findByText(/Annual Distance/i)).toBeInTheDocument()
    expect(await screen.findByText(/Vehicle & Usage Parameters/i)).toBeInTheDocument()
  })
})
