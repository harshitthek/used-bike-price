import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { FleetBatchView } from '../views/FleetBatchView'

describe('FleetBatchView Component', () => {
  const mockContracts = {
    bike: { ui: { brands: ['Royal Enfield', 'KTM'] } },
    car: { ui: { brands: ['Maruti', 'Hyundai'] } },
  }

  it('renders fleet inventory schedule with default vehicles', () => {
    render(<FleetBatchView contracts={mockContracts} />)
    expect(screen.getByText('Enterprise Fleet & Dealership Batch Valuation')).toBeInTheDocument()
    expect(screen.getByText('Active Inventory Schedule')).toBeInTheDocument()
    expect(screen.getByText('Add Bike')).toBeInTheDocument()
    expect(screen.getByText('Add Car')).toBeInTheDocument()
  })
})
