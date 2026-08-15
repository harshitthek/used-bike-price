/**
 * useValuationHistory.js — Browser localStorage CRUD for saved valuations
 * Stores up to 20 recent valuations locally. No backend auth needed.
 * Supports legacy storage keys ('motovalue_history', 'used_vehicle_history') for seamless data retention.
 */
import { useState, useCallback } from 'react'

const STORAGE_KEY = 'autovaluate_history'
const LEGACY_STORAGE_KEYS = ['motovalue_history', 'moto_value_history', 'used_vehicle_history', 'used_bike_history']
const MAX_ITEMS = 20

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)

    // Backward compatibility: seamlessly migrate from older keys if present
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      const legacyRaw = localStorage.getItem(legacyKey)
      if (legacyRaw) {
        try {
          const parsed = JSON.parse(legacyRaw)
          if (Array.isArray(parsed) && parsed.length > 0) {
            localStorage.setItem(STORAGE_KEY, legacyRaw)
            return parsed
          }
        } catch {
          // ignore corrupted legacy items
        }
      }
    }
    return []
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
