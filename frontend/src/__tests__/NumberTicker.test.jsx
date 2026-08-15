import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { NumberTicker } from '../components/ui/NumberTicker'

describe('NumberTicker Component', () => {
  it('renders numeric value with Indian locale formatting', () => {
    render(<NumberTicker value={150000} />)
    const element = screen.getByText(/1,50,000|0/)
    expect(element).toBeInTheDocument()
  })

  it('renders decimal places if configured', () => {
    render(<NumberTicker value={94.5} decimalPlaces={1} />)
    const element = screen.getByText(/94.5|0.0/)
    expect(element).toBeInTheDocument()
  })
})
