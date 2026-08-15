import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { HistoryPanel } from '../views/HistoryPanel'

describe('HistoryPanel View', () => {
  const mockHistory = [
    {
      id: 'hist_1',
      vehicleType: 'bike',
      brand: 'Royal Enfield',
      input: { kms_driven: 12000, age: 2, power: 350 },
      estimatedPrice: 135000,
      savedAt: '2026-08-15T12:00:00Z',
    },
    {
      id: 'hist_2',
      vehicleType: 'car',
      brand: 'Maruti',
      input: { kms_driven: 40000, age: 4, engine_cc: 1197 },
      estimatedPrice: 480000,
      savedAt: '2026-08-15T13:00:00Z',
    },
  ]

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <HistoryPanel
        isOpen={false}
        onClose={vi.fn()}
        history={[]}
        onSelectValuation={vi.fn()}
        onDeleteValuation={vi.fn()}
        onClearHistory={vi.fn()}
        onExportHistory={vi.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders empty state message when history is empty', () => {
    render(
      <HistoryPanel
        isOpen={true}
        onClose={vi.fn()}
        history={[]}
        onSelectValuation={vi.fn()}
        onDeleteValuation={vi.fn()}
        onClearHistory={vi.fn()}
        onExportHistory={vi.fn()}
      />
    )
    expect(screen.getByText('Saved Valuations')).toBeInTheDocument()
    expect(screen.getByText('No Saved Valuations Yet')).toBeInTheDocument()
  })

  it('renders saved valuation items with price and brand', () => {
    render(
      <HistoryPanel
        isOpen={true}
        onClose={vi.fn()}
        history={mockHistory}
        onSelectValuation={vi.fn()}
        onDeleteValuation={vi.fn()}
        onClearHistory={vi.fn()}
        onExportHistory={vi.fn()}
      />
    )
    expect(screen.getByText('Royal Enfield')).toBeInTheDocument()
    expect(screen.getByText('Maruti')).toBeInTheDocument()
    expect(screen.getByText('2 / 20 saved')).toBeInTheDocument()
    expect(screen.getByText('₹1,35,000')).toBeInTheDocument()
  })

  it('calls onSelectValuation when an item is clicked', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    render(
      <HistoryPanel
        isOpen={true}
        onClose={onClose}
        history={mockHistory}
        onSelectValuation={onSelect}
        onDeleteValuation={vi.fn()}
        onClearHistory={vi.fn()}
        onExportHistory={vi.fn()}
      />
    )
    fireEvent.click(screen.getByText('Royal Enfield'))
    expect(onSelect).toHaveBeenCalledWith(mockHistory[0])
    expect(onClose).toHaveBeenCalled()
  })
})
