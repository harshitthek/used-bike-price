import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { Button } from '../components/ui/button'

describe('Button Component', () => {
  it('renders standard button and handles clicks', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click Me</Button>)

    const btn = screen.getByRole('button', { name: /click me/i })
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders with destructive variant styles', () => {
    render(<Button variant="destructive">Delete Item</Button>)
    const btn = screen.getByRole('button', { name: /delete item/i })
    expect(btn).toHaveClass('bg-destructive/10')
  })

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled Action</Button>)
    const btn = screen.getByRole('button', { name: /disabled action/i })
    expect(btn).toBeDisabled()
  })
})
