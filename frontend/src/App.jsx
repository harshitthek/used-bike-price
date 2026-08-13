import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { 
  Zap, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  Gauge, 
  Calendar, 
  Road, 
  Users, 
  Bike, 
  Car, 
  Fuel, 
  Settings2, 
  Sparkles, 
  Info, 
  Copy, 
  Check, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck 
} from 'lucide-react'
import { NumberTicker } from "@/components/ui/NumberTicker"
import { GlassCard } from "@/components/ui/GlassCard"

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
const REQUEST_TIMEOUT_MS = 10000

// ── POPULAR PRESETS ──────────────────────────────────────────────────

const BIKE_PRESETS = [
  {
    name: "Classic 350",
    badge: "Cruiser",
    data: { brand: "Royal Enfield", power: 350, kms_driven: 15000, age: 3, owner_rank: 1 }
  },
  {
    name: "Duke 390",
    badge: "Street Fighter",
    data: { brand: "KTM", power: 373, kms_driven: 9000, age: 2, owner_rank: 1 }
  },
  {
    name: "YZF-R15 V3",
    badge: "Track / Sports",
    data: { brand: "Yamaha", power: 155, kms_driven: 14000, age: 3, owner_rank: 1 }
  },
  {
    name: "Splendor Plus",
    badge: "Commuter",
    data: { brand: "Hero", power: 100, kms_driven: 24000, age: 4, owner_rank: 1 }
  },
  {
    name: "Pulsar NS200",
    badge: "Naked Sport",
    data: { brand: "Bajaj", power: 200, kms_driven: 28000, age: 5, owner_rank: 2 }
  },
  {
    name: "Himalayan 411",
    badge: "Adventure",
    data: { brand: "Royal Enfield", power: 411, kms_driven: 18000, age: 3, owner_rank: 1 }
  }
]

const CAR_PRESETS = [
  {
    name: "Swift VXI",
    badge: "Hatchback",
    data: { brand: "Maruti", fuel: "Petrol", transmission: "Manual", engine_cc: 1197, max_power_bhp: 82, kms_driven: 35000, age: 4, owner_rank: 1 }
  },
  {
    name: "Creta SX(O)",
    badge: "Compact SUV",
    data: { brand: "Hyundai", fuel: "Diesel", transmission: "Automatic", engine_cc: 1493, max_power_bhp: 113, kms_driven: 38000, age: 3, owner_rank: 1 }
  },
  {
    name: "Nexon XZ+",
    badge: "5-Star Safety",
    data: { brand: "Tata", fuel: "Petrol", transmission: "Manual", engine_cc: 1199, max_power_bhp: 118, kms_driven: 26000, age: 2, owner_rank: 1 }
  },
  {
    name: "Thar 4x4",
    badge: "Off-Road",
    data: { brand: "Mahindra", fuel: "Diesel", transmission: "Automatic", engine_cc: 2184, max_power_bhp: 130, kms_driven: 22000, age: 2, owner_rank: 1 }
  },
  {
    name: "Fortuner 4x2",
    badge: "Premium SUV",
    data: { brand: "Toyota", fuel: "Diesel", transmission: "Automatic", engine_cc: 2755, max_power_bhp: 201, kms_driven: 62000, age: 5, owner_rank: 1 }
  },
  {
    name: "City ZX",
    badge: "Sedan",
    data: { brand: "Honda", fuel: "Petrol", transmission: "Automatic", engine_cc: 1498, max_power_bhp: 119, kms_driven: 42000, age: 4, owner_rank: 1 }
  }
]

function validateFormData(vehicleType, data, contract) {
  if (!contract) return null;
  const p = contract.schema.properties;
  
  if (typeof data.brand !== 'string' || data.brand.trim().length < (p.brand?.minLength || 2)) {
    return `Brand must contain at least ${p.brand?.minLength || 2} characters.`
  }

  const powerField = vehicleType === 'car' ? p.engine_cc : p.power;
  const powerVal = vehicleType === 'car' ? data.engine_cc : data.power;
  if (powerField && (powerVal < powerField.minimum || powerVal > powerField.maximum)) {
    return `Engine displacement must be between ${powerField.minimum} and ${powerField.maximum} cc.`
  }

  if (p.kms_driven && (data.kms_driven < p.kms_driven.minimum || data.kms_driven > p.kms_driven.maximum)) {
    return `Odometer must be between ${p.kms_driven.minimum} and ${p.kms_driven.maximum} km.`
  }
  if (p.age && (data.age < p.age.minimum || data.age > p.age.maximum)) {
    return `Age must be between ${p.age.minimum} and ${p.age.maximum} years.`
  }
  if (p.owner_rank && (data.owner_rank < p.owner_rank.minimum || data.owner_rank > p.owner_rank.maximum)) {
    return `Owner rank must be between ${p.owner_rank.minimum} and ${p.owner_rank.maximum}.`
  }
  return null
}

function App() {
  const [vehicleType, setVehicleType] = useState('bike')

  const [bikeData, setBikeData] = useState({
    brand: 'Royal Enfield',
    power: 350,
    kms_driven: 15000,
    age: 3,
    owner_rank: 1
  })

  const [carData, setCarData] = useState({
    brand: 'Maruti',
    fuel: 'Petrol',
    transmission: 'Manual',
    engine_cc: 1197,
    max_power_bhp: 82,
    kms_driven: 35000,
    age: 4,
    owner_rank: 1
  })

  const [contracts, setContracts] = useState({ bike: null, car: null })
  const [contractError, setContractError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const bgX = useTransform(mouseX, [0, window.innerWidth], [-15, 15])
  const bgY = useTransform(mouseY, [0, window.innerHeight], [-15, 15])

  // Fetch contracts for both bike and car
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/contract?vehicle_type=bike`).then(res => res.json()),
      fetch(`${API_BASE_URL}/contract?vehicle_type=car`).then(res => res.json())
    ])
      .then(([bikeContract, carContract]) => {
        setContracts({ bike: bikeContract, car: carContract })
      })
      .catch(err => setContractError(err.message || 'Failed to initialize API contract'))
  }, [])

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  const activeContract = contracts[vehicleType]
  const currentFormData = vehicleType === 'bike' ? bikeData : carData

  const handleFieldChange = (name, value) => {
    const numericFields = ['power', 'engine_cc', 'max_power_bhp', 'kms_driven', 'age', 'owner_rank']
    const parsedVal = numericFields.includes(name) ? Number(value) : value

    if (vehicleType === 'bike') {
      setBikeData(prev => ({ ...prev, [name]: parsedVal }))
    } else {
      setCarData(prev => ({ ...prev, [name]: parsedVal }))
    }
  }

  const applyPreset = (presetData) => {
    if (vehicleType === 'bike') {
      setBikeData({ ...presetData })
    } else {
      setCarData({ ...presetData })
    }
  }

  const handleVehicleTypeChange = (type) => {
    setVehicleType(type)
    setResult(null)
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)

    const validationError = validateFormData(vehicleType, currentFormData, activeContract)
    if (validationError) {
      setError(validationError)
      setLoading(false)
      return
    }

    const payload = {
      vehicle_type: vehicleType,
      ...currentFormData
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
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        let message = data?.detail || 'Prediction request failed.'
        if (res.status === 401) message = 'Authentication failed. Check your API key.'
        if (res.status === 422) message = 'Some input values are outside allowed limits.'
        if (res.status === 429) message = 'Too many requests. Please wait and try again.'
        if (res.status >= 500) message = 'Server error while generating valuation.'
        throw new Error(message)
      }

      setTimeout(() => {
        setResult(data)
        setLoading(false)
      }, 700)
    } catch (err) {
      setTimeout(() => {
        if (err?.name === 'AbortError') {
          setError('Prediction request timed out. Please try again.')
        } else {
          setError(err?.message || 'Could not connect to the prediction API.')
        }
        setLoading(false)
      }, 400)
    } finally {
      clearTimeout(timeoutId)
    }
  }

  const handleCopyValuation = () => {
    if (!result) return
    const text = `AutoValuate AI Valuation:
Vehicle: ${currentFormData.brand} (${vehicleType.toUpperCase()})
Estimated Price: ₹${result.estimated_price.toLocaleString('en-IN')}
Valuation Range: ₹${result.price_range?.min?.toLocaleString('en-IN')} - ₹${result.price_range?.max?.toLocaleString('en-IN')}
Odometer: ${currentFormData.kms_driven.toLocaleString('en-IN')} km | Age: ${currentFormData.age} yrs | Owner: ${currentFormData.owner_rank}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (contractError) {
    return (
      <div className="relative min-h-screen grid-pattern flex items-center justify-center p-6">
        <GlassCard className="max-w-md text-center p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 text-[var(--color-danger)] text-xs font-semibold mb-4">
            <AlertTriangle size={14} />
            Initialization Failed
          </div>
          <p className="text-[var(--color-text-secondary)] mb-4">{contractError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg text-sm font-medium cursor-pointer"
          >
            Retry Connection
          </button>
        </GlassCard>
      </div>
    )
  }

  if (!activeContract) {
    return (
      <div className="relative min-h-screen grid-pattern flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-[var(--color-border-subtle)]" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-transparent border-t-[var(--color-accent)] animate-spin" />
          </div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">Loading vehicle intelligence models...</p>
        </div>
      </div>
    )
  }

  const brands = activeContract.ui?.brands || []
  const ownerLabels = activeContract.ui?.owner_rank_labels || {}
  const ownerOptions = Object.entries(ownerLabels).map(([val, label]) => {
    const value = parseInt(val, 10)
    let tag = null
    if (value === 1) tag = 'Max Value'
    if (value >= 4) tag = 'Higher Wear'
    return { value, label, tag }
  })

  const presets = vehicleType === 'bike' ? BIKE_PRESETS : CAR_PRESETS

  return (
    <div className="relative min-h-screen grid-pattern">
      {/* Floating dynamic orbs */}
      <motion.div className="orb-container" style={{ x: bgX, y: bgY }}>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </motion.div>

      {/* Header */}
      <header className="relative z-10 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-base)]/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              {vehicleType === 'bike' ? <Bike size={22} className="text-white" /> : <Car size={22} className="text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight">AutoValuate AI</h1>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  v2.0 Dual Engine
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">Bikes & Cars Resale Pricing Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Top Switcher */}
            <div className="flex p-1 rounded-xl bg-white/[0.05] border border-white/[0.08]">
              <button
                type="button"
                onClick={() => handleVehicleTypeChange('bike')}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  vehicleType === 'bike' ? 'text-white' : 'text-[var(--color-text-secondary)] hover:text-white'
                }`}
              >
                {vehicleType === 'bike' && (
                  <motion.div
                    layoutId="active-vehicle-tab"
                    className="absolute inset-0 rounded-lg bg-[var(--color-accent)] shadow-md shadow-indigo-500/30"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Bike size={14} /> Motorcycles
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleVehicleTypeChange('car')}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  vehicleType === 'car' ? 'text-white' : 'text-[var(--color-text-secondary)] hover:text-white'
                }`}
              >
                {vehicleType === 'car' && (
                  <motion.div
                    layoutId="active-vehicle-tab"
                    className="absolute inset-0 rounded-lg bg-[var(--color-accent)] shadow-md shadow-indigo-500/30"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Car size={14} /> Cars
                </span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--color-text-muted)] border-l border-white/[0.08] pl-3">
              <div className="h-2 w-2 rounded-full bg-[var(--color-success)] animate-pulse" />
              Models Active
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-[var(--color-text-secondary)] mb-3">
            <Sparkles size={13} className="text-[var(--color-accent)]" />
            Empirical Machine Learning Valuation Models
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
            Predict Resale Value for{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200 bg-clip-text text-transparent capitalize">
              {vehicleType === 'bike' ? 'Motorcycles' : 'Cars'}
            </span>
          </h2>
          <p className="text-[var(--color-text-secondary)] text-base max-w-xl mx-auto">
            {vehicleType === 'bike'
              ? 'Trained on 7,000+ real Indian motorcycle transactions with 91.1% accuracy.'
              : 'Trained on 6,700+ real Indian car listings across 23 brands with 92.0% accuracy.'}
          </p>
        </motion.div>

        {/* 1-Click Popular Presets Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-400" /> Popular Market Presets
            </span>
            <span className="text-[11px] text-[var(--color-text-muted)]">Click any preset to instant-fill</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p.data)}
                className="group p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-indigo-500/40 text-left transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {p.name}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-[var(--color-text-secondary)] font-mono">
                    {p.badge}
                  </span>
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <span>{p.data.brand}</span>
                  <span>•</span>
                  <span>{vehicleType === 'bike' ? `${p.data.power}cc` : `${p.data.engine_cc}cc`}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Form & Output Grid */}
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          
          {/* Input Panel — 3 cols */}
          <motion.div
            key={vehicleType}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-3"
          >
            <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] backdrop-blur-md p-7 glow-border shadow-2xl">
              
              {/* Brand Selector */}
              <div className="mb-7">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">Manufacturer / Brand</label>
                  <span className="text-xs text-[var(--color-text-muted)] font-mono">{currentFormData.brand}</span>
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
                  {brands.map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleFieldChange('brand', b)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-150 cursor-pointer ${
                        currentFormData.brand === b
                          ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white shadow-lg shadow-indigo-500/25'
                          : 'border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)] hover:text-white'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Car-Specific: Fuel & Transmission */}
              {vehicleType === 'car' && (
                <div className="grid sm:grid-cols-2 gap-5 mb-7 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div>
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 flex items-center gap-1.5">
                      <Fuel size={14} /> Fuel Type
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['Petrol', 'Diesel', 'CNG'].map(f => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => handleFieldChange('fuel', f)}
                          className={`py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                            currentFormData.fuel === f
                              ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                              : 'border-white/[0.08] text-[var(--color-text-muted)] hover:text-white'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 flex items-center gap-1.5">
                      <Settings2 size={14} /> Transmission
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {['Manual', 'Automatic'].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleFieldChange('transmission', t)}
                          className={`py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                            currentFormData.transmission === t
                              ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                              : 'border-white/[0.08] text-[var(--color-text-muted)] hover:text-white'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Sliders Grid */}
              <div className="grid sm:grid-cols-3 gap-6 mb-7">
                {vehicleType === 'bike' ? (
                  <SliderField
                    icon={<Gauge size={15} />}
                    label="Engine Power"
                    unit="cc"
                    value={bikeData.power}
                    min={50}
                    max={activeContract?.schema?.properties?.power?.maximum || 2500}
                    step={25}
                    onChange={(v) => handleFieldChange('power', v)}
                  />
                ) : (
                  <SliderField
                    icon={<Gauge size={15} />}
                    label="Engine Capacity"
                    unit="cc"
                    value={carData.engine_cc}
                    min={600}
                    max={4000}
                    step={50}
                    onChange={(v) => handleFieldChange('engine_cc', v)}
                  />
                )}

                <SliderField
                  icon={<Calendar size={15} />}
                  label="Vehicle Age"
                  unit={currentFormData.age === 1 ? 'year' : 'years'}
                  value={currentFormData.age}
                  min={0}
                  max={vehicleType === 'bike' ? 30 : 25}
                  step={1}
                  onChange={(v) => handleFieldChange('age', v)}
                />

                <SliderField
                  icon={<Road size={15} />}
                  label="Odometer"
                  unit="km"
                  value={currentFormData.kms_driven}
                  min={0}
                  max={vehicleType === 'bike' ? 100000 : 250000}
                  step={1000}
                  onChange={(v) => handleFieldChange('kms_driven', v)}
                  formatValue={(v) => Number(v).toLocaleString('en-IN')}
                />
              </div>

              {/* Ownership Selector */}
              <div className="mb-7">
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2.5 flex items-center gap-2">
                  <Users size={15} /> Ownership History
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ownerOptions.slice(0, 4).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleFieldChange('owner_rank', opt.value)}
                      className={`relative px-3 py-2.5 rounded-xl text-xs font-medium border transition-all duration-150 cursor-pointer ${
                        currentFormData.owner_rank === opt.value
                          ? 'bg-[var(--color-accent)]/15 border-[var(--color-accent)] text-indigo-300 shadow-sm'
                          : 'border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
                      }`}
                    >
                      {opt.label}
                      {opt.tag && (
                        <span className={`block text-[9px] mt-0.5 ${
                          currentFormData.owner_rank === opt.value ? 'text-indigo-400' : 'text-[var(--color-text-muted)]'
                        }`}>
                          {opt.tag}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Action */}
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
                    Calculating Vehicle Valuation...
                  </>
                ) : (
                  <>
                    Calculate Resale Value
                    <ChevronRight size={18} />
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Valuation Result Panel — 2 cols */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="lg:col-span-2 sticky top-24"
          >
            <GlassCard className="min-h-[440px] flex flex-col justify-center p-7">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-5 text-center"
                  >
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full border-2 border-[var(--color-border-subtle)]" />
                      <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-transparent border-t-[var(--color-accent)] animate-spin" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Running {vehicleType.toUpperCase()} Valuation...</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">XGBoost Ensemble computing residual bounds</p>
                    </div>
                  </motion.div>

                ) : result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                    className="text-center"
                  >
                    {/* Confidence Signal Badge */}
                    {result.prediction_quality?.level === 'low' ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 text-[var(--color-warning)] text-xs font-semibold mb-5 warning-pulse-border">
                        <AlertTriangle size={14} />
                        Out of Training Distribution
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-[var(--color-success)] text-xs font-semibold mb-5">
                        <ShieldCheck size={14} />
                        High Confidence Valuation
                      </div>
                    )}

                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-widest font-semibold mb-1">
                      Estimated Fair Market Value
                    </p>

                    <div className="price-reveal">
                      <p className="text-5xl flex items-center justify-center gap-1 font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent mb-2">
                        <span>₹</span>
                        <NumberTicker value={result.estimated_price} />
                      </p>
                    </div>

                    {/* Price Range Band */}
                    {result.price_range && (
                      <div className="mt-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-left">
                        <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] mb-2 font-medium">
                          <span>Trade-in Wholesale</span>
                          <span className="text-indigo-300 font-semibold">Fair Value</span>
                          <span>Dealer Retail</span>
                        </div>

                        {/* Visual Range Gradient Track */}
                        <div className="relative h-2 rounded-full bg-gradient-to-r from-amber-500/40 via-indigo-500 to-emerald-500/40 mb-2">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-md border-2 border-indigo-600" />
                        </div>

                        <div className="flex items-center justify-between text-xs font-bold text-white">
                          <span>₹{result.price_range.min.toLocaleString('en-IN')}</span>
                          <span className="text-indigo-400 font-extrabold">₹{result.estimated_price.toLocaleString('en-IN')}</span>
                          <span>₹{result.price_range.max.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    )}

                    {/* Clamping Adjustments */}
                    {result.adjustments && result.adjustments.length > 0 && (
                      <div className="mt-4 p-3 rounded-xl bg-[var(--color-warning)]/5 border border-[var(--color-warning)]/20 text-left">
                        <div className="flex items-center gap-1.5 text-[var(--color-warning)] text-[11px] font-bold uppercase tracking-wider mb-1">
                          <Info size={13} />
                          Data Clamped to Valid Range
                        </div>
                        <div className="text-[11px] text-[var(--color-text-secondary)] space-y-0.5">
                          {result.adjustments.map((adj, i) => (
                            <p key={i}>
                              <strong className="text-white capitalize">{adj.feature.replace('_', ' ')}</strong> was clamped from {adj.original} to {adj.adjusted}.
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Value Drivers / Breakdown */}
                    <div className="mt-5 space-y-2 text-left">
                      <DetailRow label="Vehicle" value={`${currentFormData.brand} (${vehicleType.toUpperCase()})`} />
                      <DetailRow 
                        label="Displacement" 
                        value={vehicleType === 'bike' ? `${bikeData.power} cc` : `${carData.engine_cc} cc (${carData.fuel})`} 
                      />
                      <DetailRow label="Vehicle Age" value={`${currentFormData.age} ${currentFormData.age === 1 ? 'year' : 'years'}`} />
                      <DetailRow label="Mileage" value={`${currentFormData.kms_driven.toLocaleString('en-IN')} km`} />
                      <DetailRow label="Ownership" value={`${currentFormData.owner_rank}${currentFormData.owner_rank === 1 ? 'st' : currentFormData.owner_rank === 2 ? 'nd' : currentFormData.owner_rank === 3 ? 'rd' : 'th'} owner`} />
                    </div>

                    {/* Copy Summary Action */}
                    <button
                      type="button"
                      onClick={handleCopyValuation}
                      className="mt-5 w-full py-2.5 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check size={14} className="text-emerald-400" />
                          <span>Copied Valuation to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copy Valuation Summary</span>
                        </>
                      )}
                    </button>
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
                      Valuation Error
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)]">{error}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-2">Make sure the backend API is running on port 8000.</p>
                  </motion.div>

                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                  >
                    <div className="h-16 w-16 rounded-2xl bg-[var(--color-accent)]/10 border border-[var(--color-border-subtle)] flex items-center justify-center mx-auto mb-4">
                      <Zap size={28} className="text-indigo-400" />
                    </div>
                    <p className="text-base font-semibold text-white mb-1">Ready for Valuation</p>
                    <p className="text-xs text-[var(--color-text-muted)] max-w-xs mx-auto">
                      Select your {vehicleType === 'bike' ? 'motorcycle' : 'car'} specifications and click <strong className="text-white">Calculate Resale Value</strong>.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </motion.div>
        </div>

        {/* Footer Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <StatCard 
            label={vehicleType === 'bike' ? "Bike Model Accuracy" : "Car Model Accuracy"} 
            value={vehicleType === 'bike' ? "91.1% R²" : "92.0% R²"} 
          />
          <StatCard 
            label="Training Dataset" 
            value={vehicleType === 'bike' ? "7,007 Real Bikes" : "6,708 Real Cars"} 
          />
          <StatCard 
            label="Avg Resale Error" 
            value={vehicleType === 'bike' ? "₹10,110" : "₹74,976"} 
          />
          <StatCard 
            label="Supported Brands" 
            value={vehicleType === 'bike' ? "15 Two-Wheeler Brands" : "23 Passenger Car Brands"} 
          />
        </motion.div>
      </main>
    </div>
  )
}

/* ─── Sub-components ─── */

function SliderField({ icon, label, unit, value, min, max, step, onChange, formatValue }) {
  const display = formatValue ? formatValue(value) : value
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-[var(--color-text-secondary)] flex items-center gap-1.5">
          {icon} {label}
        </label>
        <span className="text-xs font-bold text-white">
          {display} <span className="text-[10px] font-normal text-[var(--color-text-muted)]">{unit}</span>
        </span>
      </div>

      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        style={{
          background: `linear-gradient(to right, #6366f1 ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%)`
        }}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex justify-between text-[9px] text-[var(--color-text-muted)] mt-1 font-mono">
        <span>{formatValue ? formatValue(min) : min}</span>
        <span>{formatValue ? formatValue(max) : max}</span>
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
      <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
      <span className="text-xs font-semibold text-white">{value}</span>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm px-5 py-4">
      <p className="text-xl font-black text-white">{value}</p>
      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{label}</p>
    </div>
  )
}

export default App
