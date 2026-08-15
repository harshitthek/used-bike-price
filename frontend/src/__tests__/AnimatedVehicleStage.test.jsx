import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { AnimatedVehicleStage } from '../components/ui/AnimatedVehicleStage'

describe('AnimatedVehicleStage Component', () => {
  const sampleTimeline = [
    { year: 0, calendar_year: 2026, resale_value: 145000, retention_rate: 100, depreciation_loss: 0, annual_fuel_cost: 0, annual_maintenance: 0, cumulative_tco: 0, net_cost_per_km: '3.1' },
    { year: 1, calendar_year: 2027, resale_value: 126150, retention_rate: 87, depreciation_loss: 18850, annual_fuel_cost: 19200, annual_maintenance: 5200, cumulative_tco: 46750, net_cost_per_km: '5.8' },
    { year: 2, calendar_year: 2028, resale_value: 109750, retention_rate: 76, depreciation_loss: 35250, annual_fuel_cost: 39552, annual_maintenance: 11648, cumulative_tco: 93030, net_cost_per_km: '5.8' },
    { year: 3, calendar_year: 2029, resale_value: 95480, retention_rate: 66, depreciation_loss: 49520, annual_fuel_cost: 60825, annual_maintenance: 19344, cumulative_tco: 139589, net_cost_per_km: '5.8' },
  ]

  it('renders motorcycle vehicle stage with telemetry HUD and controls', () => {
    render(
      <AnimatedVehicleStage
        vehicleType="bike"
        brand="Royal Enfield"
        timeline={sampleTimeline}
        activeYear={0}
        optimalYear={3}
        onYearSelect={vi.fn()}
      />
    )

    expect(screen.getByText(/Royal Enfield Simulator/i)).toBeInTheDocument()
    expect(screen.getByText(/Speed/i)).toBeInTheDocument()
    expect(screen.getByText(/Gear/i)).toBeInTheDocument()
    expect(screen.getByText(/RPM/i)).toBeInTheDocument()
    expect(screen.getByText('Play Drive (Rev Engine)')).toBeInTheDocument()
    expect(screen.getByText('Audio OFF')).toBeInTheDocument()
  })

  it('toggles audio on/off when sound button is clicked', () => {
    render(
      <AnimatedVehicleStage
        vehicleType="bike"
        brand="KTM"
        timeline={sampleTimeline}
        activeYear={0}
        optimalYear={3}
        onYearSelect={vi.fn()}
      />
    )

    const soundBtn = screen.getByText('Audio OFF')
    fireEvent.click(soundBtn)
    expect(screen.getByText('Audio ON')).toBeInTheDocument()
  })

  it('renders car stage properly when vehicleType is car', () => {
    render(
      <AnimatedVehicleStage
        vehicleType="car"
        brand="Toyota"
        timeline={sampleTimeline}
        activeYear={0}
        optimalYear={3}
        onYearSelect={vi.fn()}
      />
    )

    expect(screen.getByText(/Toyota Simulator/i)).toBeInTheDocument()
    expect(screen.getByText('Sedan')).toBeInTheDocument()
    expect(screen.getByText('Compact SUV')).toBeInTheDocument()
  })
})
