import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { GlassCard } from '../components/ui/GlassCard'

describe('GlassCard Component', () => {
  it('renders children within glass container', () => {
    render(
      <GlassCard className="custom-test-class">
        <div data-testid="card-child">Glass Card Content</div>
      </GlassCard>
    )

    const child = screen.getByTestId('card-child')
    expect(child).toBeInTheDocument()
    expect(child.textContent).toBe('Glass Card Content')
  })

  it('applies custom className to wrapper', () => {
    const { container } = render(
      <GlassCard className="border-indigo-500 shadow-xl">
        <p>Content</p>
      </GlassCard>
    )

    expect(container.firstChild).toHaveClass('border-indigo-500')
    expect(container.firstChild).toHaveClass('shadow-xl')
  })
})
