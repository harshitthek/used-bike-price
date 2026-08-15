import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useValuationHistory } from '../hooks/useValuationHistory'

describe('useValuationHistory Hook Suite', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('starts with empty history when storage is empty', () => {
    const { result } = renderHook(() => useValuationHistory())
    expect(result.current.history).toEqual([])
  })

  it('saves a valuation entry and stores it in localStorage', () => {
    const { result } = renderHook(() => useValuationHistory())

    act(() => {
      result.current.saveValuation('bike', { brand: 'Royal Enfield', kms_driven: 15000, age: 3 }, { estimated_price: 120000, confidence: 'high' })
    })

    expect(result.current.history.length).toBe(1)
    expect(result.current.history[0].brand).toBe('Royal Enfield')
    expect(result.current.history[0].estimatedPrice).toBe(120000)

    const stored = JSON.parse(localStorage.getItem('autovaluate_history'))
    expect(stored.length).toBe(1)
    expect(stored[0].brand).toBe('Royal Enfield')
  })

  it('deletes an entry by id', () => {
    const { result } = renderHook(() => useValuationHistory())

    let id
    act(() => {
      id = result.current.saveValuation('bike', { brand: 'KTM' }, { estimated_price: 180000 })
    })

    expect(result.current.history.length).toBe(1)

    act(() => {
      result.current.deleteValuation(id)
    })

    expect(result.current.history.length).toBe(0)
  })

  it('clears all history', () => {
    const { result } = renderHook(() => useValuationHistory())

    act(() => {
      result.current.saveValuation('bike', { brand: 'Yamaha' }, { estimated_price: 90000 })
      result.current.saveValuation('car', { brand: 'Maruti' }, { estimated_price: 450000 })
    })

    expect(result.current.history.length).toBe(2)

    act(() => {
      result.current.clearHistory()
    })

    expect(result.current.history.length).toBe(0)
    expect(JSON.parse(localStorage.getItem('autovaluate_history'))).toEqual([])
  })
})
