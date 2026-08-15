import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { SingleValuationView } from '../views/SingleValuationView'

describe('SingleValuationView Component', () => {
  const mockContracts = {
    bike: {
      ui: {
        brands: ['Royal Enfield', 'KTM', 'Bajaj', 'Honda', 'Yamaha'],
        brand_power_limits: { 'Royal Enfield': [350, 650] },
      },
    },
    car: {
      ui: {
        brands: ['Maruti', 'Hyundai', 'Tata', 'Toyota'],
        brand_engine_limits: { 'Maruti': [800, 1500] },
      },
    },
  }

  const defaultProps = {
    vehicleType: 'bike',
    setVehicleType: vi.fn(),
    bikeData: { brand: 'Royal Enfield', power: 350, kms_driven: 15000, age: 3, owner_rank: 1 },
    setBikeData: vi.fn(),
    carData: { brand: 'Maruti', engine_cc: 1197, kms_driven: 35000, age: 4, owner_rank: 1, fuel: 'Petrol', transmission: 'Manual' },
    setCarData: vi.fn(),
    result: null,
    setResult: vi.fn(),
    loading: false,
    setLoading: vi.fn(),
    error: null,
    setError: vi.fn(),
    contracts: mockContracts,
    onOpenCertificate: vi.fn(),
    onSaveToHistory: vi.fn(),
    onOpenHistory: vi.fn(),
  }

  it('renders presets and brand selectors properly', () => {
    render(<SingleValuationView {...defaultProps} />)
    expect(screen.getByText('Valuation Engine Configuration')).toBeInTheDocument()
    expect(screen.getByText('Popular Market Presets')).toBeInTheDocument()
    expect(screen.getByText('Classic 350')).toBeInTheDocument()
    expect(screen.getByText('Duke 390')).toBeInTheDocument()
    expect(screen.getByText('Generate Valuation Appraisal')).toBeInTheDocument()
  })

  it('renders valuation result card when result is present', () => {
    const propsWithResult = {
      ...defaultProps,
      result: {
        estimated_price: 125000,
        price_range: { min: 110000, max: 140000 },
        confidence: '92.0% Empirical Confidence',
        depreciation_forecast: [
          { year_offset: 0, calendar_year: 2026, estimated_price: 125000, retention_pct: 100 },
          { year_offset: 1, calendar_year: 2027, estimated_price: 106250, retention_pct: 85 },
        ],
      },
    }

    render(<SingleValuationView {...propsWithResult} />)
    expect(screen.getByText('Certified Fair Market Valuation')).toBeInTheDocument()
    expect(screen.getByText('Official Certificate')).toBeInTheDocument()
    expect(screen.getByText('Save to History')).toBeInTheDocument()
  })
})
