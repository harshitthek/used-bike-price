import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

class MockIntersectionObserver {
  constructor() {}
  observe() { return null }
  unobserve() { return null }
  disconnect() { return null }
}

global.IntersectionObserver = MockIntersectionObserver
if (typeof window !== 'undefined') {
  window.IntersectionObserver = MockIntersectionObserver
}

afterEach(() => {
  cleanup()
})
