import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { CompareView } from '../views/CompareView'

describe('CompareView Component', () => {
  const mockContracts = {
    bike: { ui: { brands: ['Royal Enfield', 'KTM', 'Bajaj'] } },
    car: { ui: { brands: ['Maruti', 'Hyundai', 'Tata'] } },
  }

  it('renders dual configuration cards for Vehicle A and B', () => {
    render(<CompareView contracts={mockContracts} />)
    expect(screen.getByText('Side-by-Side Comparative Market Appraisal')).toBeInTheDocument()
    expect(screen.getByText('Vehicle A Configuration')).toBeInTheDocument()
    expect(screen.getByText('Vehicle B Configuration')).toBeInTheDocument()
    expect(screen.getByText('Run Head-to-Head Valuation')).toBeInTheDocument()
  })
})
