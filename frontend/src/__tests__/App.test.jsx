import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import App from '../App'

describe('Main App Shell & Navigation', () => {
  it('renders navbar brand title and author credit in footer after contracts load', async () => {
    render(<App />)

    const valBtn = await screen.findByText('Valuation', {}, { timeout: 6000 })
    expect(valBtn).toBeInTheDocument()

    expect(screen.getAllByText(/AutoValuate AI/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Harshit/i)).toBeInTheDocument()
    expect(screen.getByText('Compare')).toBeInTheDocument()
    expect(screen.getByText('Simulator')).toBeInTheDocument()
    expect(screen.getByText('Fleet Batch')).toBeInTheDocument()
    expect(screen.getByText('Trends')).toBeInTheDocument()
    expect(screen.getByText('MLOps')).toBeInTheDocument()
  })

  it('switches to Compare tab when Compare button is clicked', async () => {
    render(<App />)

    const compareTab = await screen.findByText('Compare', {}, { timeout: 6000 })
    fireEvent.click(compareTab)

    await waitFor(() => {
      expect(screen.getByText(/Side-by-Side Comparative Market Appraisal/i)).toBeInTheDocument()
    })
  })

  it('switches to Market Trends tab when Trends button is clicked', async () => {
    render(<App />)

    const trendsTab = await screen.findByText('Trends', {}, { timeout: 6000 })
    fireEvent.click(trendsTab)

    await waitFor(() => {
      expect(screen.getByText(/Automotive Price Trends & Market Analysis/i)).toBeInTheDocument()
    })
  })

  it('switches to Fleet Batch tab when Fleet Batch button is clicked', async () => {
    render(<App />)

    const fleetTab = await screen.findByText('Fleet Batch', {}, { timeout: 6000 })
    fireEvent.click(fleetTab)

    await waitFor(() => {
      expect(screen.getByText(/Enterprise Fleet & Dealership Batch Valuation/i)).toBeInTheDocument()
    })
  })
})
