import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { Zap, ChevronRight, CheckCircle2, AlertTriangle, Gauge, Calendar, Road, Users, Bike } from 'lucide-react'
import { NumberTicker } from "@/components/ui/NumberTicker"
import { GlassCard } from "@/components/ui/GlassCard"

const BRANDS = [
  "Bajaj", "Benelli", "Ducati", "Harley-Davidson", "Hero", "Honda",
  "Jawa", "Kawasaki", "KTM", "Mahindra", "Royal Enfield",
  "Suzuki", "Triumph", "TVS", "Yamaha"
]

const OWNER_OPTIONS = [
  { value: 1, label: '1st Owner', tag: 'Best value' },
  { value: 2, label: '2nd Owner', tag: null },
  { value: 3, label: '3rd Owner', tag: null },
  { value: 4, label: '4th Owner', tag: null },
  { value: 5, label: '5th+', tag: 'High depreciation' },
]

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
const REQUEST_TIMEOUT_MS = 10000

function validateFormData(data) {
  if (typeof data.brand !== 'string' || data.brand.trim().length < 2) {
    return 'Brand must contain at least 2 characters.'
  }
  if (data.power < 50 || data.power > 2500) {
    return 'Engine power must be between 50 and 2500 cc.'
  }
  if (data.kms_driven < 0 || data.kms_driven > 999999) {
    return 'Odometer must be between 0 and 999999 km.'
  }
  if (data.age < 0 || data.age > 50) {
    return 'Age must be between 0 and 50 years.'
  }
  if (data.owner_rank < 1 || data.owner_rank > 5) {
    return 'Owner rank must be between 1 and 5.'
  }
  return null
}

function App() {
  const [formData, setFormData] = useState({
    brand: 'Royal Enfield',
    power: 350,
    kms_driven: 15000,
    age: 3,
    owner_rank: 1
  })

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const bgX = useTransform(mouseX, [0, window.innerWidth], [-15, 15])
  const bgY = useTransform(mouseY, [0, window.innerHeight], [-15, 15])

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: name === 'brand' ? value : Number(value)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)

    const validationError = validateFormData(formData)
    if (validationError) {
      setError(validationError)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const res = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_API_KEY || "dev_12345"
        },
        signal: controller.signal,
        body: JSON.stringify(formData),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        let message = data?.detail || 'Prediction request failed.'
        if (res.status === 401) message = 'Authentication failed. Check your API key.'
        if (res.status === 422) message = 'Some input values are outside allowed limits.'
        if (res.status === 429) message = 'Too many requests. Please wait and try again.'
        if (res.status >= 500) message = 'Server error while generating prediction.'
        throw new Error(message)
      }

      setTimeout(() => {
        setResult(data.estimated_price)
        setLoading(false)
      }, 1200)
    } catch (err) {
      setTimeout(() => {
        if (err?.name === 'AbortError') {
          setError('Prediction request timed out. Please try again.')
        } else {
          setError(err?.message || 'Could not connect to the prediction API.')
        }
        setLoading(false)
      }, 500)
    } finally {
      clearTimeout(timeoutId)
    }
  }

  return (
    <div className="relative min-h-screen grid-pattern">
      {/* Floating orbs */}
      <motion.div className="orb-container" style={{ x: bgX, y: bgY }}>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </motion.div>

      {/* Header */}
      <header className="relative z-10 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-base)]/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
              <Bike size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">MotoValue</h1>
              <p className="text-xs text-[var(--color-text-muted)]">AI Price Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <div className="h-2 w-2 rounded-full bg-[var(--color-success)] animate-pulse" />
            Model Active
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-[var(--color-accent)] uppercase tracking-widest mb-3">
            Machine Learning Powered
          </p>
          <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
            Know Your Bike's
            <br />
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              True Worth
            </span>
          </h2>
          <p className="text-[var(--color-text-secondary)] text-lg max-w-xl mx-auto">
            Trained on 7,000+ real Indian motorcycle listings. XGBoost model with R² = 0.91 accuracy.
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-5 gap-8 items-start">

          {/* Input Panel — 3 cols */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-3"
          >
            <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] backdrop-blur-md p-8 glow-border">

              {/* Brand */}
              <div className="mb-8">
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">Brand</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {BRANDS.map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleChange('brand', b)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 cursor-pointer
                        ${formData.brand === b
                          ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white shadow-lg shadow-indigo-500/25'
                          : 'border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                        }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div className="grid sm:grid-cols-3 gap-8 mb-8">
                <SliderField
                  icon={<Gauge size={16} />}
                  label="Engine Power"
                  unit="cc"
                  value={formData.power}
                  min={50} max={2500} step={25}
                  onChange={(v) => handleChange('power', v)}
                />
                <SliderField
                  icon={<Calendar size={16} />}
                  label="Vehicle Age"
                  unit={formData.age === 1 ? 'year' : 'years'}
                  value={formData.age}
                  min={0} max={50} step={1}
                  onChange={(v) => handleChange('age', v)}
                />
                <SliderField
                  icon={<Road size={16} />}
                  label="Odometer"
                  unit="km"
                  value={formData.kms_driven}
                  min={0} max={999999} step={1000}
                  onChange={(v) => handleChange('kms_driven', v)}
                  formatValue={(v) => v.toLocaleString('en-IN')}
                />
              </div>

              {/* Ownership */}
              <div className="mb-8">
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-3 flex items-center gap-2">
                  <Users size={16} /> Ownership History
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {OWNER_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleChange('owner_rank', opt.value)}
                      className={`relative px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 cursor-pointer
                        ${formData.owner_rank === opt.value
                          ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)] text-[var(--color-accent)]'
                          : 'border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
                        }`}
                    >
                      {opt.label}
                      {opt.tag && (
                        <span className={`block text-[10px] mt-0.5 ${formData.owner_rank === opt.value ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}>
                          {opt.tag}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="glass-submit-btn w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="spinner" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Get Valuation
                    <ChevronRight size={18} />
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Result Panel — 2 cols */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 sticky top-24"
          >
            <GlassCard className="min-h-[420px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full border-2 border-[var(--color-border-subtle)]" />
                      <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-transparent border-t-[var(--color-accent)] animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-[var(--color-text-secondary)]">Running inference...</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">XGBoost model evaluating</p>
                    </div>
                  </motion.div>

                ) : result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="text-center"
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-[var(--color-success)] text-xs font-semibold mb-6">
                      <CheckCircle2 size={14} />
                      Valuation Complete
                    </div>

                    <p className="text-sm text-[var(--color-text-muted)] mb-2 uppercase tracking-widest font-medium">Estimated Market Value</p>

                    <div className="price-reveal">
                      <p className="text-6xl flex items-center justify-center gap-1 font-black tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-1">
                        <span>₹</span>
                        <NumberTicker value={result} />
                      </p>
                    </div>

                    <div className="mt-8 space-y-3 text-left">
                      <DetailRow label="Brand" value={formData.brand} />
                      <DetailRow label="Engine" value={`${formData.power} cc`} />
                      <DetailRow label="Age" value={`${formData.age} ${formData.age === 1 ? 'year' : 'years'}`} />
                      <DetailRow label="Odometer" value={`${formData.kms_driven.toLocaleString('en-IN')} km`} />
                      <DetailRow label="Owner" value={`${formData.owner_rank}${formData.owner_rank === 1 ? 'st' : formData.owner_rank === 2 ? 'nd' : formData.owner_rank === 3 ? 'rd' : 'th'} owner`} />
                    </div>
                  </motion.div>

                ) : error ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 text-[var(--color-danger)] text-xs font-semibold mb-4">
                      <AlertTriangle size={14} />
                      Connection Error
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)]">{error}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-2">Make sure the FastAPI server is running on port 8000.</p>
                  </motion.div>

                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                  >
                    <div className="h-20 w-20 rounded-2xl bg-[var(--color-accent)]/5 border border-[var(--color-border-subtle)] flex items-center justify-center mx-auto mb-6">
                      <Zap size={32} className="text-[var(--color-accent)] opacity-40" />
                    </div>
                    <p className="text-lg font-semibold text-[var(--color-text-secondary)] mb-2">Ready to Predict</p>
                    <p className="text-sm text-[var(--color-text-muted)] max-w-xs mx-auto">
                      Configure the motorcycle parameters on the left and hit <strong className="text-[var(--color-text-secondary)]">Get Valuation</strong>.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </motion.div>
        </div>

        {/* Footer stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <StatCard label="Model Accuracy" value="91.1%" />
          <StatCard label="Training Data" value="7,007 bikes" />
          <StatCard label="Avg Error" value="₹10,213" />
          <StatCard label="Brands Supported" value="19" />
        </motion.div>
      </main>
    </div>
  )
}

/* ─── Sub-components ─── */

function SliderField({ icon, label, unit, value, min, max, step, onChange, formatValue }) {
  const display = formatValue ? formatValue(value) : value
  return (
    <div>
      <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1 flex items-center gap-2">
        {icon} {label}
      </label>
      <div className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">
        {display} <span className="text-sm font-normal text-[var(--color-text-muted)]">{unit}</span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-1">
        <span>{formatValue ? formatValue(min) : min}</span>
        <span>{formatValue ? formatValue(max) : max}</span>
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--color-border-subtle)]">
      <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
      <span className="text-sm font-medium text-[var(--color-text-primary)]">{value}</span>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] backdrop-blur-sm px-5 py-4">
      <p className="text-2xl font-bold text-[var(--color-text-primary)]">{value}</p>
      <p className="text-xs text-[var(--color-text-muted)] mt-1">{label}</p>
    </div>
  )
}

export default App
