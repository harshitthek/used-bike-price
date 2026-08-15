import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { TrendsView } from '../views/TrendsView'

describe('TrendsView Component Suite', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        vehicle_type: 'bike',
        brand_filter: null,
        metric: 'median',
        available_brands: ['Bajaj', 'Hero', 'Honda', 'Royal Enfield'],
        data: [
          { brand: 'Royal Enfield', year: 2018, price: 85000, p25: 75000, p75: 95000, sample_count: 120 }
        ]
      })
    })
  })

  it('renders historical market trends and filters correctly', async () => {
    render(<TrendsView />)

    expect(await screen.findByText(/Automotive Price Trends & Market Analysis/i)).toBeInTheDocument()
    expect(await screen.findByText('Median')).toBeInTheDocument()
    expect(await screen.findByText('Average')).toBeInTheDocument()
  })
})
