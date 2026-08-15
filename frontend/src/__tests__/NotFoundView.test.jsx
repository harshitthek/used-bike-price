import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { NotFoundView } from '../views/NotFoundView'

describe('NotFoundView Component', () => {
  it('renders 404 header and description text correctly', () => {
    const handleNavigate = vi.fn()
    render(<NotFoundView onNavigate={handleNavigate} />)

    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText(/Route Unmapped/i)).toBeInTheDocument()
    expect(screen.getByText(/Off-Road Track Deviation/i)).toBeInTheDocument()
  })

  it('triggers onNavigate when recovery button is clicked', () => {
    const handleNavigate = vi.fn()
    render(<NotFoundView onNavigate={handleNavigate} />)

    const returnBtn = screen.getByRole('button', { name: /Return to Valuation Studio/i })
    fireEvent.click(returnBtn)

    expect(handleNavigate).toHaveBeenCalledWith('single')
  })
})
