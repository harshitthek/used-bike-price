/**
 * useApi.js — Shared fetch helper for AutoValuate AI frontend
 * Centralizes API calls with res.ok validation, timeout, API key injection, and error extraction.
 * Backward compatible with legacy environment variables and endpoints.
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.REACT_APP_API_URL ||
  'http://127.0.0.1:8000'
).replace(/\/$/, '')

const API_KEY =
  import.meta.env.VITE_API_KEY ||
  import.meta.env.VITE_ADMIN_KEY ||
  import.meta.env.VITE_AUTH_KEY ||
  'dev_12345'

const DEFAULT_TIMEOUT_MS = 10000

/**
 * Make an authenticated API request with safety checks.
 * @param {string} endpoint - API path (e.g. '/predict')
 * @param {object} options - fetch options override
 * @param {number} timeoutMs - request timeout in ms
 * @returns {Promise<object>} parsed JSON response
 * @throws {Error} with user-friendly message on failure
 */
export async function apiFetch(endpoint, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        ...options.headers,
      },
    })

    if (!res.ok) {
      const errPayload = await res.json().catch(() => ({}))
      let message = errPayload?.detail || `Request failed (${res.status})`
      if (res.status === 401) message = 'Authentication failed. Check your API key.'
      if (res.status === 422) message = 'Some input values are outside allowed limits.'
      if (res.status === 429) message = 'Too many requests. Please wait and try again.'
      if (res.status >= 500) message = 'Server error while processing request.'
      throw new Error(message)
    }

    return await res.json()
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * POST helper — convenience wrapper for JSON POST requests
 */
export async function apiPost(endpoint, body, timeoutMs) {
  return apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  }, timeoutMs)
}

/**
 * GET helper — convenience wrapper for GET requests
 */
export async function apiGet(endpoint, timeoutMs) {
  return apiFetch(endpoint, { method: 'GET' }, timeoutMs)
}

export { API_BASE_URL, API_KEY }
