/**
 * useValuationHistory.js — Browser localStorage CRUD for saved valuations
 * Stores up to 20 recent valuations locally. No backend auth needed.
 */
import { useState, useCallback } from 'react'

const STORAGE_KEY = 'autovaluate_history'
const MAX_ITEMS = 20

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Storage full or unavailable — silently fail
  }
}

export function useValuationHistory() {
  const [history, setHistory] = useState(() => loadFromStorage())

  const saveValuation = useCallback((vehicleType, inputData, result) => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      vehicleType,
      brand: inputData.brand,
      input: inputData,
      estimatedPrice: result.estimated_price,
      priceRange: result.price_range,
      confidence: result.confidence,
      savedAt: new Date().toISOString(),
    }

    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, MAX_ITEMS)
      saveToStorage(updated)
      return updated
    })

    return entry.id
  }, [])

  const deleteValuation = useCallback((id) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id)
      saveToStorage(updated)
      return updated
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    saveToStorage([])
  }, [])

  const loadValuation = useCallback((id) => {
    return history.find(item => item.id === id) || null
  }, [history])

  const exportHistory = useCallback(() => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `autovaluate_history_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [history])

  return {
    history,
    saveValuation,
    deleteValuation,
    clearHistory,
    loadValuation,
    exportHistory,
  }
}
