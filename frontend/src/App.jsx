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
  ShieldCheck,
  Scale,
  Layers,
  FileDown,
  Printer,
  X,
  Plus,
  Trash2,
  Download
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
  // Navigation View Modes: 'single' | 'compare' | 'fleet'
  const [viewMode, setViewMode] = useState('single')
  const [vehicleType, setVehicleType] = useState('bike')

  // Single Valuation Form State
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

  // Comparison Mode States (Vehicle A & Vehicle B)
  const [compareA, setCompareA] = useState({
    vehicle_type: 'bike',
    brand: 'Royal Enfield',
    power: 350,
    engine_cc: 350,
    fuel: 'Petrol',
    transmission: 'Manual',
    kms_driven: 15000,
    age: 3,
    owner_rank: 1
  })
  const [compareB, setCompareB] = useState({
    vehicle_type: 'bike',
    brand: 'KTM',
    power: 373,
    engine_cc: 373,
    fuel: 'Petrol',
    transmission: 'Manual',
    kms_driven: 9000,
    age: 2,
    owner_rank: 1
  })
  const [resultA, setResultA] = useState(null)
  const [resultB, setResultB] = useState(null)
  const [compareLoading, setCompareLoading] = useState(false)

  // Fleet Batch State
  const [fleetList, setFleetList] = useState([
    { vehicle_type: 'bike', brand: 'Royal Enfield', power: 350, engine_cc: 350, kms_driven: 15000, age: 3, owner_rank: 1, fuel: 'Petrol', transmission: 'Manual' },
    { vehicle_type: 'car', brand: 'Maruti', power: 1197, engine_cc: 1197, kms_driven: 35000, age: 4, owner_rank: 1, fuel: 'Petrol', transmission: 'Manual' },
    { vehicle_type: 'car', brand: 'Hyundai', power: 1493, engine_cc: 1493, kms_driven: 38000, age: 3, owner_rank: 1, fuel: 'Diesel', transmission: 'Automatic' }
  ])
  const [fleetResult, setFleetResult] = useState(null)
  const [fleetLoading, setFleetLoading] = useState(false)

  // General App State
  const [contracts, setContracts] = useState({ bike: null, car: null })
  const [contractError, setContractError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showCertModal, setShowCertModal] = useState(false)

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

  // Single Prediction
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
      }, 500)
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

  // Side-by-Side Comparison Submit
  const handleCompareSubmit = async () => {
    setCompareLoading(true)
    setResultA(null)
    setResultB(null)

    try {
      const [resA, resB] = await Promise.all([
        fetch(`${API_BASE_URL}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': import.meta.env.VITE_API_KEY || "dev_12345" },
          body: JSON.stringify(compareA),
        }).then(r => r.json()),
        fetch(`${API_BASE_URL}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': import.meta.env.VITE_API_KEY || "dev_12345" },
          body: JSON.stringify(compareB),
        }).then(r => r.json())
      ])
      setTimeout(() => {
        setResultA(resA)
        setResultB(resB)
        setCompareLoading(false)
      }, 500)
    } catch (err) {
      setCompareLoading(false)
    }
  }

  // Fleet Batch Submit
  const handleFleetBatchSubmit = async () => {
    setFleetLoading(true)
    setFleetResult(null)

    try {
      const res = await fetch(`${API_BASE_URL}/predict/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': import.meta.env.VITE_API_KEY || "dev_12345" },
        body: JSON.stringify({ vehicles: fleetList }),
      })
      const data = await res.json()
      setTimeout(() => {
        setFleetResult(data)
        setFleetLoading(false)
      }, 600)
    } catch (err) {
      setFleetLoading(false)
    }
  }

  const handleCopyValuation = () => {
    if (!result) return
    const text = `AutoValuate AI Valuation Certificate:
Vehicle: ${currentFormData.brand} (${vehicleType.toUpperCase()})
Estimated Fair Price: ₹${result.estimated_price.toLocaleString('en-IN')}
Valuation Range: ₹${result.price_range?.min?.toLocaleString('en-IN')} - ₹${result.price_range?.max?.toLocaleString('en-IN')}
Odometer: ${currentFormData.kms_driven.toLocaleString('en-IN')} km | Age: ${currentFormData.age} yrs | Owner: ${currentFormData.owner_rank}
Certificate Date: ${new Date().toLocaleDateString('en-IN')}`
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
      <header className="relative z-10 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-base)]/60 backdrop-blur-xl no-print">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              {vehicleType === 'bike' ? <Bike size={22} className="text-white" /> : <Car size={22} className="text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight">AutoValuate AI</h1>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Pro Suite v2.5
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">Multi-Vehicle Resale Valuation & Analytics Platform</p>
            </div>
          </div>

          {/* View Mode Navigation Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'single' ? 'text-white' : 'text-[var(--color-text-secondary)] hover:text-white'
              }`}
            >
              {viewMode === 'single' && (
                <motion.div
                  layoutId="active-view-tab"
                  className="absolute inset-0 rounded-lg bg-[var(--color-accent)] shadow-md shadow-indigo-500/30"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Zap size={13} /> Valuation Engine
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('compare')}
              className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'compare' ? 'text-white' : 'text-[var(--color-text-secondary)] hover:text-white'
              }`}
            >
              {viewMode === 'compare' && (
                <motion.div
                  layoutId="active-view-tab"
                  className="absolute inset-0 rounded-lg bg-[var(--color-accent)] shadow-md shadow-indigo-500/30"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Scale size={13} /> Comparison Mode
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('fleet')}
              className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'fleet' ? 'text-white' : 'text-[var(--color-text-secondary)] hover:text-white'
              }`}
            >
              {viewMode === 'fleet' && (
                <motion.div
                  layoutId="active-view-tab"
                  className="absolute inset-0 rounded-lg bg-[var(--color-accent)] shadow-md shadow-indigo-500/30"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Layers size={13} /> Fleet Batch
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        
        {/* VIEW MODE 1: SINGLE VALUATION ENGINE */}
        {viewMode === 'single' && (
          <div>
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-[var(--color-text-secondary)] mb-3">
                <Sparkles size={13} className="text-[var(--color-accent)]" />
                Empirical Dual-Engine XGBoost ML Models (92% Accuracy)
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
                Valuate Used{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200 bg-clip-text text-transparent capitalize">
                  {vehicleType === 'bike' ? 'Motorcycles' : 'Cars'}
                </span>
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm max-w-lg mx-auto">
                {vehicleType === 'bike'
                  ? 'Real-time market appraisal with 5-year depreciation forecast & price driver breakdown.'
                  : 'Multi-feature passenger car appraisal across fuel types, transmission, and power metrics.'}
              </p>
            </motion.div>

            {/* Vehicle Mode Switcher & 1-Click Popular Presets */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                {/* Vehicle Toggle */}
                <div className="flex p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => handleVehicleTypeChange('bike')}
                    className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      vehicleType === 'bike' ? 'text-white' : 'text-[var(--color-text-secondary)] hover:text-white'
                    }`}
                  >
                    {vehicleType === 'bike' && (
                      <motion.div
                        layoutId="active-vehicle-tab-single"
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
                    className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      vehicleType === 'car' ? 'text-white' : 'text-[var(--color-text-secondary)] hover:text-white'
                    }`}
                  >
                    {vehicleType === 'car' && (
                      <motion.div
                        layoutId="active-vehicle-tab-single"
                        className="absolute inset-0 rounded-lg bg-[var(--color-accent)] shadow-md shadow-indigo-500/30"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Car size={14} /> Passenger Cars
                    </span>
                  </button>
                </div>

                <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <Sparkles size={12} className="text-indigo-400" /> Click any preset for 1-click auto-fill
                </span>
              </div>

              {/* Presets Grid */}
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
                        Generating Machine Learning Valuation...
                      </>
                    ) : (
                      <>
                        Calculate Fair Valuation
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
                className="lg:col-span-2"
              >
                <GlassCard className="min-h-[440px] flex flex-col justify-center p-7">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-5 text-center py-10"
                      >
                        <div className="relative">
                          <div className="h-16 w-16 rounded-full border-2 border-[var(--color-border-subtle)]" />
                          <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-transparent border-t-[var(--color-accent)] animate-spin" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Running {vehicleType.toUpperCase()} Valuation...</p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-1">Simulating 5-Year Forecast & Value Drivers</p>
                        </div>
                      </motion.div>

                    ) : result ? (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                      >
                        {/* Header Badge */}
                        <div className="flex items-center justify-between mb-4">
                          {result.prediction_quality?.level === 'low' ? (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 text-[var(--color-warning)] text-xs font-semibold warning-pulse-border">
                              <AlertTriangle size={14} />
                              Out of Distribution
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-[var(--color-success)] text-xs font-semibold">
                              <ShieldCheck size={14} />
                              High Confidence Valuation
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => setShowCertModal(true)}
                            className="text-xs text-indigo-300 hover:text-white flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 cursor-pointer transition-colors"
                          >
                            <FileDown size={13} /> Certificate
                          </button>
                        </div>

                        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-widest font-semibold text-center mb-1">
                          Estimated Fair Resale Value
                        </p>

                        <div className="price-reveal text-center mb-3">
                          <p className="text-5xl flex items-center justify-center gap-1 font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                            <span>₹</span>
                            <NumberTicker value={result.estimated_price} />
                          </p>
                        </div>

                        {/* Price Range Band */}
                        {result.price_range && (
                          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-5">
                            <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] mb-2 font-medium">
                              <span>Wholesale Low</span>
                              <span className="text-indigo-300 font-semibold">Fair Market</span>
                              <span>Dealer Retail</span>
                            </div>

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

                        {/* 📈 5-YEAR DEPRECIATION FORECAST CHART */}
                        {result.depreciation_forecast && result.depreciation_forecast.length > 0 && (
                          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-5">
                            <div className="flex items-center justify-between mb-2.5">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                <TrendingDown size={14} className="text-indigo-400" /> 5-Year Resale Forecast
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                                Optimal Sell: Yr 2 ({result.depreciation_forecast[2]?.calendar_year})
                              </span>
                            </div>

                            <DepreciationForecastChart data={result.depreciation_forecast} />
                          </div>
                        )}

                        {/* 🔍 VALUE DRIVERS WATERFALL BREAKDOWN */}
                        {result.waterfall_breakdown && result.waterfall_breakdown.length > 0 && (
                          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-5">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-3">
                              <Sparkles size={14} className="text-indigo-400" /> Valuation Price Drivers
                            </span>

                            <div className="space-y-2">
                              {result.waterfall_breakdown.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                  <div className="truncate pr-2">
                                    <span className="text-[var(--color-text-secondary)] font-medium">{item.factor}</span>
                                    <p className="text-[10px] text-[var(--color-text-muted)] truncate">{item.description}</p>
                                  </div>
                                  <span className={`font-mono font-bold shrink-0 ${
                                    item.direction === 'positive' ? 'text-emerald-400' :
                                    item.direction === 'negative' ? 'text-rose-400' : 'text-slate-300'
                                  }`}>
                                    {item.impact > 0 ? `+₹${item.impact.toLocaleString('en-IN')}` :
                                     item.impact < 0 ? `-₹${Math.abs(item.impact).toLocaleString('en-IN')}` :
                                     `₹${item.impact.toLocaleString('en-IN')}`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2.5">
                          <button
                            type="button"
                            onClick={handleCopyValuation}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
                          >
                            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            <span>{copied ? 'Copied Summary' : 'Copy Summary'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowCertModal(true)}
                            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Printer size={14} /> Certificate
                          </button>
                        </div>
                      </motion.div>

                    ) : error ? (
                      <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 text-[var(--color-danger)] text-xs font-semibold mb-4">
                          <AlertTriangle size={14} /> Valuation Error
                        </div>
                        <p className="text-sm text-[var(--color-text-secondary)]">{error}</p>
                      </motion.div>
                    ) : (
                      <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
                        <div className="h-16 w-16 rounded-2xl bg-[var(--color-accent)]/10 border border-[var(--color-border-subtle)] flex items-center justify-center mx-auto mb-4">
                          <Zap size={28} className="text-indigo-400" />
                        </div>
                        <p className="text-base font-semibold text-white mb-1">Ready for Appraisal</p>
                        <p className="text-xs text-[var(--color-text-muted)] max-w-xs mx-auto">
                          Configure specifications and click <strong className="text-white">Calculate Fair Valuation</strong>.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            </div>
          </div>
        )}

        {/* VIEW MODE 2: SIDE-BY-SIDE VEHICLE COMPARISON */}
        {viewMode === 'compare' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2 flex items-center justify-center gap-2">
                <Scale className="text-indigo-400" /> Side-by-Side Vehicle Comparison
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] max-w-md mx-auto">
                Compare valuation, price delta, and 5-year depreciation retention between two vehicles simultaneously.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Vehicle A */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-indigo-300">Vehicle A (Reference)</h3>
                  <select 
                    value={compareA.vehicle_type} 
                    onChange={(e) => setCompareA(prev => ({ ...prev, vehicle_type: e.target.value }))}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white"
                  >
                    <option value="bike" className="bg-slate-900">Motorcycle</option>
                    <option value="car" className="bg-slate-900">Car</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-[var(--color-text-muted)]">Brand</label>
                    <input
                      type="text"
                      value={compareA.brand}
                      onChange={(e) => setCompareA(prev => ({ ...prev, brand: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/[0.08] text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[var(--color-text-muted)]">Displacement (cc)</label>
                      <input
                        type="number"
                        value={compareA.power || compareA.engine_cc}
                        onChange={(e) => setCompareA(prev => ({ ...prev, power: Number(e.target.value), engine_cc: Number(e.target.value) }))}
                        className="w-full mt-1 px-3 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/[0.08] text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--color-text-muted)]">Age (Years)</label>
                      <input
                        type="number"
                        value={compareA.age}
                        onChange={(e) => setCompareA(prev => ({ ...prev, age: Number(e.target.value) }))}
                        className="w-full mt-1 px-3 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/[0.08] text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[var(--color-text-muted)]">Odometer (km)</label>
                    <input
                      type="number"
                      value={compareA.kms_driven}
                      onChange={(e) => setCompareA(prev => ({ ...prev, kms_driven: Number(e.target.value) }))}
                      className="w-full mt-1 px-3 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/[0.08] text-white"
                    />
                  </div>
                </div>

                {resultA && (
                  <div className="mt-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                    <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Valuation A</p>
                    <p className="text-3xl font-black text-white mt-1">₹{resultA.estimated_price?.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-[var(--color-text-secondary)] mt-1">
                      Range: ₹{resultA.price_range?.min?.toLocaleString('en-IN')} - ₹{resultA.price_range?.max?.toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
              </GlassCard>

              {/* Vehicle B */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-sky-300">Vehicle B (Alternative)</h3>
                  <select 
                    value={compareB.vehicle_type} 
                    onChange={(e) => setCompareB(prev => ({ ...prev, vehicle_type: e.target.value }))}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white"
                  >
                    <option value="bike" className="bg-slate-900">Motorcycle</option>
                    <option value="car" className="bg-slate-900">Car</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-[var(--color-text-muted)]">Brand</label>
                    <input
                      type="text"
                      value={compareB.brand}
                      onChange={(e) => setCompareB(prev => ({ ...prev, brand: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/[0.08] text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[var(--color-text-muted)]">Displacement (cc)</label>
                      <input
                        type="number"
                        value={compareB.power || compareB.engine_cc}
                        onChange={(e) => setCompareB(prev => ({ ...prev, power: Number(e.target.value), engine_cc: Number(e.target.value) }))}
                        className="w-full mt-1 px-3 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/[0.08] text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--color-text-muted)]">Age (Years)</label>
                      <input
                        type="number"
                        value={compareB.age}
                        onChange={(e) => setCompareB(prev => ({ ...prev, age: Number(e.target.value) }))}
                        className="w-full mt-1 px-3 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/[0.08] text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[var(--color-text-muted)]">Odometer (km)</label>
                    <input
                      type="number"
                      value={compareB.kms_driven}
                      onChange={(e) => setCompareB(prev => ({ ...prev, kms_driven: Number(e.target.value) }))}
                      className="w-full mt-1 px-3 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/[0.08] text-white"
                    />
                  </div>
                </div>

                {resultB && (
                  <div className="mt-6 p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center">
                    <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Valuation B</p>
                    <p className="text-3xl font-black text-white mt-1">₹{resultB.estimated_price?.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-[var(--color-text-secondary)] mt-1">
                      Range: ₹{resultB.price_range?.min?.toLocaleString('en-IN')} - ₹{resultB.price_range?.max?.toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Compare Action */}
            <div className="text-center mb-8">
              <button
                type="button"
                onClick={handleCompareSubmit}
                disabled={compareLoading}
                className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 font-bold text-white text-sm shadow-xl shadow-indigo-500/25 hover:brightness-110 transition-all cursor-pointer"
              >
                {compareLoading ? "Computing Dual Valuation..." : "Run Side-by-Side Comparison"}
              </button>
            </div>

            {/* Comparative Summary Card */}
            {resultA && resultB && (
              <GlassCard className="p-6 text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
                  <Scale size={14} /> Valuation Differential
                </div>
                <h4 className="text-2xl font-bold text-white mb-2">
                  {resultB.estimated_price >= resultA.estimated_price ? (
                    <span>
                      Vehicle B commands a <strong className="text-emerald-400">₹{(resultB.estimated_price - resultA.estimated_price).toLocaleString('en-IN')} (+{Math.round(((resultB.estimated_price - resultA.estimated_price) / resultA.estimated_price) * 100)}%)</strong> premium
                    </span>
                  ) : (
                    <span>
                      Vehicle A commands a <strong className="text-emerald-400">₹{(resultA.estimated_price - resultB.estimated_price).toLocaleString('en-IN')} (+{Math.round(((resultA.estimated_price - resultB.estimated_price) / resultB.estimated_price) * 100)}%)</strong> premium
                    </span>
                  )}
                </h4>
              </GlassCard>
            )}
          </motion.div>
        )}

        {/* VIEW MODE 3: BULK FLEET BATCH ESTIMATOR */}
        {viewMode === 'fleet' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2 flex items-center justify-center gap-2">
                <Layers className="text-indigo-400" /> Dealership & Fleet Batch Valuation
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] max-w-md mx-auto">
                Appraise multiple vehicles simultaneously using vectorised batch machine learning inference.
              </p>
            </div>

            {/* Fleet Summary Metrics */}
            {fleetResult && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <p className="text-2xl font-black text-white">₹{fleetResult.summary.total_fleet_value.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Total Portfolio Resale Value</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <p className="text-2xl font-black text-white">₹{fleetResult.summary.average_vehicle_price.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Average Vehicle Valuation</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <p className="text-2xl font-black text-white">{fleetResult.summary.vehicle_count} Units</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Batch Count Evaluated</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <p className="text-2xl font-black text-emerald-400">{fleetResult.summary.high_confidence_count} / {fleetResult.summary.vehicle_count}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">High-Confidence Listings</p>
                </div>
              </div>
            )}

            {/* Fleet Table */}
            <GlassCard className="p-6 mb-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-[var(--color-text-muted)] uppercase tracking-wider">
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Brand</th>
                    <th className="pb-3">Displacement</th>
                    <th className="pb-3">Age</th>
                    <th className="pb-3">Odometer</th>
                    <th className="pb-3">Owner</th>
                    <th className="pb-3">Estimated Price</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {fleetList.map((item, idx) => (
                    <tr key={idx} className="py-2.5">
                      <td className="py-2.5 font-medium capitalize text-indigo-300">{item.vehicle_type}</td>
                      <td className="py-2.5 font-bold text-white">{item.brand}</td>
                      <td className="py-2.5 text-[var(--color-text-secondary)]">{item.power || item.engine_cc} cc</td>
                      <td className="py-2.5 text-[var(--color-text-secondary)]">{item.age} yrs</td>
                      <td className="py-2.5 text-[var(--color-text-secondary)]">{item.kms_driven?.toLocaleString('en-IN')} km</td>
                      <td className="py-2.5 text-[var(--color-text-secondary)]">Rank {item.owner_rank}</td>
                      <td className="py-2.5 font-bold text-emerald-400">
                        {fleetResult?.predictions[idx] ? `₹${fleetResult.predictions[idx].estimated_price.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => setFleetList(prev => prev.filter((_, i) => i !== idx))}
                          className="text-rose-400 hover:text-rose-300 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setFleetList(prev => [...prev, { vehicle_type: 'bike', brand: 'Honda', power: 150, engine_cc: 150, kms_driven: 20000, age: 3, owner_rank: 1, fuel: 'Petrol', transmission: 'Manual' }])}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> Add Vehicle
                </button>

                <button
                  type="button"
                  onClick={handleFleetBatchSubmit}
                  disabled={fleetLoading}
                  className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  {fleetLoading ? "Processing Batch..." : "Evaluate Entire Batch"}
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}

      </main>

      {/* 🧾 OFFICIAL VALUATION CERTIFICATE MODAL */}
      {showCertModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-white/20 p-8 shadow-2xl print-certificate-container text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 no-print">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-indigo-400" size={20} />
                <span className="text-sm font-bold uppercase tracking-wider">Official Valuation Certificate</span>
              </div>
              <button 
                onClick={() => setShowCertModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Certificate Body */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-black tracking-tight">AutoValuate AI Valuation Certificate</h3>
              <p className="text-xs text-slate-400 mt-1">Certified Machine Learning Appraisal Document</p>
              <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono">
                Doc ID: AV-{Math.random().toString(36).substring(2, 9).toUpperCase()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/5 border border-white/10 mb-6 text-xs">
              <div>
                <p className="text-slate-400">Vehicle Specification</p>
                <p className="text-sm font-bold text-white mt-0.5">{currentFormData.brand} ({vehicleType.toUpperCase()})</p>
              </div>
              <div>
                <p className="text-slate-400">Displacement</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {vehicleType === 'bike' ? `${bikeData.power} cc` : `${carData.engine_cc} cc (${carData.fuel})`}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Odometer & Age</p>
                <p className="text-sm font-bold text-white mt-0.5">{currentFormData.kms_driven?.toLocaleString('en-IN')} km | {currentFormData.age} yrs</p>
              </div>
              <div>
                <p className="text-slate-400">Appraisal Date</p>
                <p className="text-sm font-bold text-white mt-0.5">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="text-center p-5 rounded-xl bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 mb-6">
              <p className="text-xs uppercase tracking-widest text-indigo-300 font-semibold">Certified Fair Market Estimate</p>
              <p className="text-4xl font-black text-white mt-1">₹{result.estimated_price?.toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-400 mt-1">
                Authorized Valuation Range: ₹{result.price_range?.min?.toLocaleString('en-IN')} – ₹{result.price_range?.max?.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-4 border-t border-white/10">
              <span>Authenticity Verification: Verified Dual-Engine Model</span>
              <div className="flex gap-3 no-print">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Printer size={14} /> Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── 5-YEAR DEPRECIATION FORECAST SVG CHART ─── */

function DepreciationForecastChart({ data }) {
  if (!data || data.length === 0) return null

  const maxPrice = Math.max(...data.map(d => d.estimated_price)) * 1.05
  const minPrice = Math.min(...data.map(d => d.estimated_price)) * 0.90
  const width = 360
  const height = 120
  const padding = 20

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding)
    const y = height - padding - ((d.estimated_price - minPrice) / (maxPrice - minPrice)) * (height - 2 * padding)
    return { x, y, ...d }
  })

  const pathD = points.reduce((acc, p, i) => (
    i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`
  ), "")

  const areaD = `${pathD} L ${points[points.length - 1].x},${height - padding} L ${points[0].x},${height - padding} Z`

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible">
        <defs>
          <linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />

        {/* Area fill */}
        <path d={areaD} fill="url(#forecastArea)" />

        {/* Line curve */}
        <path d={pathD} fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Milestone Nodes */}
        {points.map((p, i) => (
          <g key={i} className="group cursor-pointer">
            <circle cx={p.x} cy={p.y} r="4" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5" />
            <text x={p.x} y={height - 5} textAnchor="middle" fill="#71717a" fontSize="9" fontFamily="sans-serif">
              '{String(p.calendar_year).slice(2)}
            </text>
          </g>
        ))}
      </svg>

      <div className="grid grid-cols-6 gap-1 mt-2 text-center font-mono">
        {data.map((d, i) => (
          <div key={i} className="p-1 rounded bg-white/[0.02]">
            <p className="text-[9px] text-[var(--color-text-muted)]">Yr {d.year_offset}</p>
            <p className="text-[10px] font-bold text-white truncate">₹{Math.round(d.estimated_price / 1000)}k</p>
            <p className="text-[8px] text-indigo-400">{d.retention_pct}%</p>
          </div>
        ))}
      </div>
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

export default App
