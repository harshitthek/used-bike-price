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
  Download,
  Search,
  Award,
  Activity
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
    color: "from-amber-500/20 to-orange-500/10",
    tagColor: "text-amber-300 border-amber-500/30",
    data: { brand: "Royal Enfield", power: 350, kms_driven: 15000, age: 3, owner_rank: 1 }
  },
  {
    name: "Duke 390",
    badge: "Streetfighter",
    color: "from-orange-500/20 to-rose-500/10",
    tagColor: "text-orange-300 border-orange-500/30",
    data: { brand: "KTM", power: 373, kms_driven: 9000, age: 2, owner_rank: 1 }
  },
  {
    name: "YZF-R15 V3",
    badge: "Track / Sport",
    color: "from-blue-500/20 to-indigo-500/10",
    tagColor: "text-blue-300 border-blue-500/30",
    data: { brand: "Yamaha", power: 155, kms_driven: 14000, age: 3, owner_rank: 1 }
  },
  {
    name: "Splendor Plus",
    badge: "High Mileage",
    color: "from-emerald-500/20 to-teal-500/10",
    tagColor: "text-emerald-300 border-emerald-500/30",
    data: { brand: "Hero", power: 100, kms_driven: 24000, age: 4, owner_rank: 1 }
  },
  {
    name: "Pulsar NS200",
    badge: "Naked Sport",
    color: "from-purple-500/20 to-indigo-500/10",
    tagColor: "text-purple-300 border-purple-500/30",
    data: { brand: "Bajaj", power: 200, kms_driven: 28000, age: 5, owner_rank: 2 }
  },
  {
    name: "Himalayan 411",
    badge: "Adventure Tour",
    color: "from-cyan-500/20 to-sky-500/10",
    tagColor: "text-cyan-300 border-cyan-500/30",
    data: { brand: "Royal Enfield", power: 411, kms_driven: 18000, age: 3, owner_rank: 1 }
  }
]

const CAR_PRESETS = [
  {
    name: "Swift VXI",
    badge: "City Hatch",
    color: "from-blue-500/20 to-indigo-500/10",
    tagColor: "text-blue-300 border-blue-500/30",
    data: { brand: "Maruti", fuel: "Petrol", transmission: "Manual", engine_cc: 1197, max_power_bhp: 82, kms_driven: 35000, age: 4, owner_rank: 1 }
  },
  {
    name: "Creta SX(O)",
    badge: "Compact SUV",
    color: "from-indigo-500/20 to-purple-500/10",
    tagColor: "text-indigo-300 border-indigo-500/30",
    data: { brand: "Hyundai", fuel: "Diesel", transmission: "Automatic", engine_cc: 1493, max_power_bhp: 113, kms_driven: 38000, age: 3, owner_rank: 1 }
  },
  {
    name: "Nexon XZ+",
    badge: "5-Star Safety",
    color: "from-emerald-500/20 to-teal-500/10",
    tagColor: "text-emerald-300 border-emerald-500/30",
    data: { brand: "Tata", fuel: "Petrol", transmission: "Manual", engine_cc: 1199, max_power_bhp: 118, kms_driven: 26000, age: 2, owner_rank: 1 }
  },
  {
    name: "Thar 4x4",
    badge: "Off-Road 4WD",
    color: "from-amber-500/20 to-orange-500/10",
    tagColor: "text-amber-300 border-amber-500/30",
    data: { brand: "Mahindra", fuel: "Diesel", transmission: "Automatic", engine_cc: 2184, max_power_bhp: 130, kms_driven: 22000, age: 2, owner_rank: 1 }
  },
  {
    name: "Fortuner 4x2",
    badge: "Executive SUV",
    color: "from-rose-500/20 to-pink-500/10",
    tagColor: "text-rose-300 border-rose-500/30",
    data: { brand: "Toyota", fuel: "Diesel", transmission: "Automatic", engine_cc: 2755, max_power_bhp: 201, kms_driven: 62000, age: 5, owner_rank: 1 }
  },
  {
    name: "City ZX",
    badge: "Luxury Sedan",
    color: "from-cyan-500/20 to-sky-500/10",
    tagColor: "text-cyan-300 border-cyan-500/30",
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
  const [brandSearch, setBrandSearch] = useState('')

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
    { vehicle_type: 'car', brand: 'Hyundai', power: 1493, engine_cc: 1493, kms_driven: 38000, age: 3, owner_rank: 1, fuel: 'Diesel', transmission: 'Automatic' },
    { vehicle_type: 'car', brand: 'Tata', power: 1199, engine_cc: 1199, kms_driven: 26000, age: 2, owner_rank: 1, fuel: 'Petrol', transmission: 'Manual' },
    { vehicle_type: 'bike', brand: 'KTM', power: 373, engine_cc: 373, kms_driven: 9000, age: 2, owner_rank: 1, fuel: 'Petrol', transmission: 'Manual' }
  ])
  const [fleetResult, setFleetResult] = useState(null)
  const [fleetLoading, setFleetLoading] = useState(false)

  // Lifecycle Simulator State
  const [simData, setSimData] = useState({
    vehicle_type: 'bike',
    brand: 'Royal Enfield',
    power: 350,
    engine_cc: 350,
    max_power_bhp: 20,
    fuel: 'Petrol',
    transmission: 'Manual',
    purchase_price: 220000,
    current_age: 0,
    current_kms: 0,
    owner_rank: 1,
    annual_kms: 10000,
    horizon_years: 5,
    custom_fuel_price: 102,
    custom_mileage_kml: 35
  })
  const [simResult, setSimResult] = useState(null)
  const [simLoading, setSimLoading] = useState(false)
  const [simError, setSimError] = useState(null)
  const [simActiveYear, setSimActiveYear] = useState(null)

  const handleRunSimulation = async (overrideData = null) => {
    const dataToUse = overrideData || simData
    setSimLoading(true)
    setSimError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/simulate/lifecycle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'dev_12345'
        },
        body: JSON.stringify(dataToUse)
      })
      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}))
        throw new Error(errPayload.detail || `Simulation API Error (${res.status})`)
      }
      const data = await res.json()
      setSimResult(data)
      setSimActiveYear(data.optimal_sell_window?.recommended_sell_year || 3)
    } catch (err) {
      setSimError(err.message || 'Could not connect to simulation server')
    } finally {
      setSimLoading(false)
    }
  }

  // General App State
  const [contracts, setContracts] = useState({ bike: null, car: null })
  const [contractError, setContractError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showCertModal, setShowCertModal] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)


  const handleDownloadPdf = () => {
    const element = document.getElementById('printable-valuation-certificate')
    if (!element) return
    setDownloadingPdf(true)
    import('html2pdf.js').then((html2pdfModule) => {
      const html2pdf = html2pdfModule.default || html2pdfModule
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `AutoValuate_Certificate_${currentFormData.brand}_${vehicleType.toUpperCase()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#090b12' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }
      html2pdf().set(opt).from(element).save().then(() => {
        setDownloadingPdf(false)
      }).catch(() => {
        setDownloadingPdf(false)
      })
    }).catch(() => {
      setDownloadingPdf(false)
    })
  }


  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const bgX = useTransform(mouseX, [0, window.innerWidth], [-12, 12])
  const bgY = useTransform(mouseY, [0, window.innerHeight], [-12, 12])

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

    if (name === 'brand') {
      if (vehicleType === 'bike') {
        const limits = activeContract?.ui?.brand_power_limits?.[value] || [100, 650]
        const newMin = limits[0] || 100
        const newMax = limits[1] || 650
        setBikeData(prev => ({
          ...prev,
          brand: value,
          power: prev.power > newMax ? newMax : prev.power < newMin ? newMin : prev.power
        }))
      } else {
        const limits = activeContract?.ui?.brand_engine_limits?.[value] || [800, 2500]
        const newMin = limits[0] || 800
        const newMax = limits[1] || 2500
        setCarData(prev => ({
          ...prev,
          brand: value,
          engine_cc: prev.engine_cc > newMax ? newMax : prev.engine_cc < newMin ? newMin : prev.engine_cc
        }))
      }
      return
    }

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
    setBrandSearch('')
    setResult(null)
    setError(null)
  }

  // Single Prediction Submit
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
      }, 450)
    } catch (err) {
      setTimeout(() => {
        if (err?.name === 'AbortError') {
          setError('Prediction request timed out. Please try again.')
        } else {
          setError(err?.message || 'Could not connect to the prediction API.')
        }
        setLoading(false)
      }, 350)
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
      }, 550)
    } catch (err) {
      setFleetLoading(false)
    }
  }

  const handleCopyValuation = () => {
    if (!result) return
    const text = `AutoValuate AI Certificate of Valuation:
Vehicle: ${currentFormData.brand} (${vehicleType.toUpperCase()})
Estimated Fair Resale: ₹${result.estimated_price.toLocaleString('en-IN')}
Valuation Range: ₹${result.price_range?.min?.toLocaleString('en-IN')} - ₹${result.price_range?.max?.toLocaleString('en-IN')}
Odometer: ${currentFormData.kms_driven.toLocaleString('en-IN')} km | Age: ${currentFormData.age} yrs | Owner: ${currentFormData.owner_rank}
Verification: 92.0% Empirical Machine Learning Confidence`
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
          <p className="text-[var(--color-text-secondary)] mb-4 text-sm">{contractError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white cursor-pointer"
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
            <div className="h-12 w-12 rounded-full border-2 border-white/10" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
          </div>
          <p className="text-xs font-medium text-slate-400">Loading Automotive Intelligence Models...</p>
        </div>
      </div>
    )
  }

  const allBrands = activeContract.ui?.brands || []
  const filteredBrands = allBrands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()))

  const ownerLabels = activeContract.ui?.owner_rank_labels || {}
  const ownerOptions = Object.entries(ownerLabels).map(([val, label]) => {
    const value = parseInt(val, 10)
    let tag = null
    if (value === 1) tag = 'Max Value'
    if (value >= 4) tag = 'High Wear'
    return { value, label, tag }
  })

  const presets = vehicleType === 'bike' ? BIKE_PRESETS : CAR_PRESETS

  return (
    <div className="relative min-h-screen grid-pattern selection:bg-indigo-500 selection:text-white">
      {/* Floating dynamic orbs */}
      <motion.div className="orb-container" style={{ x: bgX, y: bgY }}>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </motion.div>

      {/* Luxury Floating Glass Header */}
      <header className="relative z-20 border-b border-white/[0.08] bg-[#07080b]/80 backdrop-blur-2xl no-print sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo & Platform Tag */}
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/20">
              {vehicleType === 'bike' ? <Bike size={20} className="text-white" /> : <Car size={20} className="text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-white font-display">AutoValuate AI</h1>
                <span className="text-[9px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Pro Suite
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Automotive Resale Valuation & Analytics Platform</p>
            </div>
          </div>

          {/* View Mode Navigation Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'single' ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {viewMode === 'single' && (
                <motion.div
                  layoutId="active-view-tab"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-md shadow-indigo-500/30 border border-white/20"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Zap size={13} className={viewMode === 'single' ? 'text-cyan-300' : ''} /> Valuation
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('compare')}
              className={`relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'compare' ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {viewMode === 'compare' && (
                <motion.div
                  layoutId="active-view-tab"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-md shadow-indigo-500/30 border border-white/20"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Scale size={13} className={viewMode === 'compare' ? 'text-cyan-300' : ''} /> Compare
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('sim')
                if (!simResult) handleRunSimulation()
              }}
              className={`relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'sim' ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {viewMode === 'sim' && (
                <motion.div
                  layoutId="active-view-tab"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-md shadow-indigo-500/30 border border-white/20"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Activity size={13} className={viewMode === 'sim' ? 'text-cyan-300' : ''} /> Simulator
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('fleet')}
              className={`relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'fleet' ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {viewMode === 'fleet' && (
                <motion.div
                  layoutId="active-view-tab"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-md shadow-indigo-500/30 border border-white/20"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Layers size={13} className={viewMode === 'fleet' ? 'text-cyan-300' : ''} /> Fleet Batch
              </span>
            </button>
          </div>


          {/* Live System Signal */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              97.4% R² Verified
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
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
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-medium text-slate-300 mb-3 shadow-inner">
                <Sparkles size={13} className="text-cyan-400" />
                Empirical Machine Learning Engine • Real-Time India Market Prices
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-2 font-display text-white">
                Predict True Resale Value for{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-200 bg-clip-text text-transparent capitalize">
                  {vehicleType === 'bike' ? 'Motorcycles' : 'Passenger Cars'}
                </span>
              </h2>
              <p className="text-slate-400 text-xs md:text-sm max-w-lg mx-auto">
                {vehicleType === 'bike'
                  ? 'Trained on 32,000+ authentic Indian two-wheelers. Includes 5-year depreciation forecast and marginal price drivers.'
                  : 'Trained on 8,000+ authentic Indian passenger cars. Multi-feature valuation across fuel, transmission, and power.'}
              </p>
            </motion.div>

            {/* Vehicle Mode Switcher & 1-Click Popular Presets */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3.5 flex-wrap gap-3">
                {/* Vehicle Toggle */}
                <div className="flex p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => handleVehicleTypeChange('bike')}
                    className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      vehicleType === 'bike' ? 'text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {vehicleType === 'bike' && (
                      <motion.div
                        layoutId="active-vehicle-tab-single"
                        className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-md shadow-indigo-500/30 border border-white/20"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Bike size={14} className={vehicleType === 'bike' ? 'text-cyan-300' : ''} /> 🏍️ Motorcycles
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVehicleTypeChange('car')}
                    className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      vehicleType === 'car' ? 'text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {vehicleType === 'car' && (
                      <motion.div
                        layoutId="active-vehicle-tab-single"
                        className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-md shadow-indigo-500/30 border border-white/20"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Car size={14} className={vehicleType === 'car' ? 'text-cyan-300' : ''} /> 🚗 Passenger Cars
                    </span>
                  </button>
                </div>

                <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                  <Sparkles size={13} className="text-amber-400" /> Click any market preset for 1-click auto-fill
                </span>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(p.data)}
                    className="group p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-indigo-500/40 text-left transition-all duration-200 cursor-pointer shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {p.name}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${p.tagColor} bg-white/[0.03] font-mono font-medium`}>
                        {p.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
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
              
              {/* Input Form Panel — 3 cols */}
              <motion.div
                key={vehicleType}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="lg:col-span-3"
              >
                <form onSubmit={handleSubmit} className="rounded-2xl border border-white/[0.08] bg-[#0c0e17]/80 backdrop-blur-xl p-7 glow-border shadow-2xl">
                  
                  {/* Brand Selector */}
                  <div className="mb-7">
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Award size={14} className="text-indigo-400" /> Manufacturer / Brand
                      </label>
                      <div className="relative w-36">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Filter brand..."
                          value={brandSearch}
                          onChange={(e) => setBrandSearch(e.target.value)}
                          className="w-full pl-7 pr-2 py-1 text-[11px] rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto pr-1">
                      {filteredBrands.map(b => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => handleFieldChange('brand', b)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-150 cursor-pointer truncate ${
                            currentFormData.brand === b
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                              : 'border-white/[0.06] bg-white/[0.01] text-slate-400 hover:border-slate-500 hover:text-white'
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
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                          <Fuel size={14} className="text-cyan-400" /> Fuel Powertrain
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {['Petrol', 'Diesel', 'CNG'].map(f => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => handleFieldChange('fuel', f)}
                              className={`py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                                currentFormData.fuel === f
                                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm'
                                  : 'border-white/[0.06] text-slate-400 hover:text-white'
                              }`}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                          <Settings2 size={14} className="text-indigo-400" /> Transmission
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {['Manual', 'Automatic'].map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => handleFieldChange('transmission', t)}
                              className={`py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                                currentFormData.transmission === t
                                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-sm'
                                  : 'border-white/[0.06] text-slate-400 hover:text-white'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sliders Grid with Dynamic Brand Bounds */}
                  <div className="grid sm:grid-cols-3 gap-6 mb-7">
                    {vehicleType === 'bike' ? (
                      <SliderField
                        icon={<Gauge size={14} className="text-indigo-400" />}
                        label="Engine Power"
                        unit="cc"
                        value={bikeData.power}
                        min={activeContract?.ui?.brand_power_limits?.[bikeData.brand]?.[0] || 97}
                        max={activeContract?.ui?.brand_power_limits?.[bikeData.brand]?.[1] || 650}
                        step={
                          (activeContract?.ui?.brand_power_limits?.[bikeData.brand]?.[1] || 650) -
                          (activeContract?.ui?.brand_power_limits?.[bikeData.brand]?.[0] || 97) > 300 ? 25 : 10
                        }
                        onChange={(v) => handleFieldChange('power', v)}
                      />
                    ) : (
                      <SliderField
                        icon={<Gauge size={14} className="text-indigo-400" />}
                        label="Engine Capacity"
                        unit="cc"
                        value={carData.engine_cc}
                        min={activeContract?.ui?.brand_engine_limits?.[carData.brand]?.[0] || 793}
                        max={activeContract?.ui?.brand_engine_limits?.[carData.brand]?.[1] || 2500}
                        step={50}
                        onChange={(v) => handleFieldChange('engine_cc', v)}
                      />
                    )}

                    <SliderField
                      icon={<Calendar size={14} className="text-amber-400" />}
                      label="Vehicle Age"
                      unit={currentFormData.age === 1 ? 'year' : 'years'}
                      value={currentFormData.age}
                      min={0}
                      max={vehicleType === 'bike' ? 30 : 25}
                      step={1}
                      onChange={(v) => handleFieldChange('age', v)}
                    />

                    <SliderField
                      icon={<Road size={14} className="text-cyan-400" />}
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
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center gap-2">
                      <Users size={14} className="text-emerald-400" /> Title & Ownership History
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {ownerOptions.slice(0, 4).map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleFieldChange('owner_rank', opt.value)}
                          className={`relative px-3 py-2.5 rounded-xl text-xs font-medium border transition-all duration-150 cursor-pointer ${
                            currentFormData.owner_rank === opt.value
                              ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/10'
                              : 'border-white/[0.06] bg-white/[0.01] text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          {opt.label}
                          {opt.tag && (
                            <span className={`block text-[9px] mt-0.5 font-mono ${
                              currentFormData.owner_rank === opt.value ? 'text-cyan-300' : 'text-slate-500'
                            }`}>
                              {opt.tag}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit Action Button */}
                  <motion.button
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={loading}
                    className="glass-submit-btn w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-3 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="spinner" />
                        Calculating Empirical Resale Price...
                      </>
                    ) : (
                      <>
                        Calculate Fair Market Valuation
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
                <GlassCard className="min-h-[460px] flex flex-col justify-center p-7 border-white/[0.08]">
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
                          <div className="h-16 w-16 rounded-full border-2 border-white/10" />
                          <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Running {vehicleType.toUpperCase()} Valuation...</p>
                          <p className="text-xs text-slate-400 mt-1">Generating 5-Year Forecast & Value Drivers</p>
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
                        {/* Header Quality Signal Badge */}
                        <div className="flex items-center justify-between mb-4">
                          {result.prediction_quality?.level === 'low' ? (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold warning-pulse-border">
                              <AlertTriangle size={14} />
                              Out of Distribution Clamped
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                              <ShieldCheck size={14} />
                              High Confidence Valuation
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => setShowCertModal(true)}
                            className="text-xs text-cyan-300 hover:text-white flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 cursor-pointer transition-colors"
                          >
                            <FileDown size={13} /> Certificate
                          </button>
                        </div>

                        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold text-center mb-1">
                          Fair Resale Market Appraisal
                        </p>

                        <div className="price-reveal text-center mb-4">
                          <p className="text-5xl flex items-center justify-center gap-1 font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent font-display">
                            <span>₹</span>
                            <NumberTicker value={result.estimated_price} />
                          </p>
                        </div>

                        {/* Price Range Band */}
                        {result.price_range && (
                          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-5">
                            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 font-medium">
                              <span>Wholesale Trade-In</span>
                              <span className="text-indigo-300 font-bold">Fair Value</span>
                              <span>Retail Dealer List</span>
                            </div>

                            <div className="relative h-2 rounded-full bg-gradient-to-r from-amber-500/40 via-indigo-500 to-emerald-500/40 mb-2">
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-md border-2 border-indigo-600" />
                            </div>

                            <div className="flex items-center justify-between text-xs font-bold text-white font-mono">
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
                                <TrendingDown size={14} className="text-indigo-400" /> 5-Year Resale Projection
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
                                    <span className="text-slate-300 font-medium">{item.factor}</span>
                                    <p className="text-[10px] text-slate-500 truncate">{item.description}</p>
                                  </div>
                                  <span className={`font-mono font-bold shrink-0 ${
                                    item.direction === 'positive' ? 'text-emerald-400' :
                                    item.direction === 'negative' ? 'text-rose-400' : 'text-slate-400'
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
                            className="flex-1 py-2.5 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
                          >
                            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            <span>{copied ? 'Copied to Clipboard' : 'Copy Summary'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowCertModal(true)}
                            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-indigo-500/20"
                          >
                            <Printer size={14} /> Certificate
                          </button>
                        </div>
                      </motion.div>

                    ) : error ? (
                      <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold mb-4">
                          <AlertTriangle size={14} /> Valuation Error
                        </div>
                        <p className="text-sm text-slate-300">{error}</p>
                      </motion.div>
                    ) : (
                      <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
                        <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                          <Zap size={28} className="text-indigo-400" />
                        </div>
                        <p className="text-base font-bold text-white mb-1">Ready for Appraisal</p>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">
                          Configure specifications and click <strong className="text-white">Calculate Fair Market Valuation</strong>.
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
              <h2 className="text-3xl font-black text-white mb-2 flex items-center justify-center gap-2 font-display">
                <Scale className="text-indigo-400" /> Side-by-Side Vehicle Comparison
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Appraise two vehicles simultaneously to compare resale market retention and price differentials.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Vehicle A */}
              <GlassCard className="p-6 border-white/[0.08]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-indigo-300">Vehicle A (Reference Option)</h3>
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
                    <label className="text-xs text-slate-400">Brand</label>
                    <select
                      value={compareA.brand}
                      onChange={(e) => {
                        const b = e.target.value
                        const defaultPower = compareA.vehicle_type === 'bike' ? 350 : 1197
                        setCompareA(prev => ({ ...prev, brand: b, power: defaultPower, engine_cc: defaultPower }))
                      }}
                      className="w-full mt-1 px-3 py-2 text-xs rounded-lg bg-[#0c0e17] border border-white/[0.12] text-white focus:outline-none focus:border-indigo-500"
                    >
                      {(contracts[compareA.vehicle_type]?.ui?.brands || []).map(b => (
                        <option key={b} value={b} className="bg-slate-900 text-white">{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400">Displacement (cc)</label>
                      <input
                        type="number"
                        value={compareA.power || compareA.engine_cc}
                        onChange={(e) => setCompareA(prev => ({ ...prev, power: Number(e.target.value), engine_cc: Number(e.target.value) }))}
                        className="w-full mt-1 px-3 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Age (Years)</label>
                      <input
                        type="number"
                        value={compareA.age}
                        onChange={(e) => setCompareA(prev => ({ ...prev, age: Number(e.target.value) }))}
                        className="w-full mt-1 px-3 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Odometer (km)</label>
                    <input
                      type="number"
                      value={compareA.kms_driven}
                      onChange={(e) => setCompareA(prev => ({ ...prev, kms_driven: Number(e.target.value) }))}
                      className="w-full mt-1 px-3 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {resultA && (
                  <div className="mt-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Valuation A</p>
                    <p className="text-3xl font-black text-white mt-1 font-display">₹{resultA.estimated_price?.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      Range: ₹{resultA.price_range?.min?.toLocaleString('en-IN')} - ₹{resultA.price_range?.max?.toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
              </GlassCard>

              {/* Vehicle B */}
              <GlassCard className="p-6 border-white/[0.08]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-cyan-300">Vehicle B (Alternative Option)</h3>
                  <select 
                    value={compareB.vehicle_type} 
                    onChange={(e) => {
                      const newType = e.target.value
                      const defaultBrand = newType === 'bike' ? 'KTM' : 'Hyundai'
                      const defaultPower = newType === 'bike' ? 373 : 1493
                      setCompareB(prev => ({
                        ...prev,
                        vehicle_type: newType,
                        brand: defaultBrand,
                        power: defaultPower,
                        engine_cc: defaultPower
                      }))
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="bike" className="bg-slate-900">Motorcycle</option>
                    <option value="car" className="bg-slate-900">Car</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400">Brand</label>
                    <select
                      value={compareB.brand}
                      onChange={(e) => {
                        const b = e.target.value
                        const defaultPower = compareB.vehicle_type === 'bike' ? 373 : 1493
                        setCompareB(prev => ({ ...prev, brand: b, power: defaultPower, engine_cc: defaultPower }))
                      }}
                      className="w-full mt-1 px-3 py-2 text-xs rounded-lg bg-[#0c0e17] border border-white/[0.12] text-white focus:outline-none focus:border-cyan-500"
                    >
                      {(contracts[compareB.vehicle_type]?.ui?.brands || []).map(b => (
                        <option key={b} value={b} className="bg-slate-900 text-white">{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400">Displacement (cc)</label>
                      <input
                        type="number"
                        value={compareB.power || compareB.engine_cc}
                        onChange={(e) => setCompareB(prev => ({ ...prev, power: Number(e.target.value), engine_cc: Number(e.target.value) }))}
                        className="w-full mt-1 px-3 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Age (Years)</label>
                      <input
                        type="number"
                        value={compareB.age}
                        onChange={(e) => setCompareB(prev => ({ ...prev, age: Number(e.target.value) }))}
                        className="w-full mt-1 px-3 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Odometer (km)</label>
                    <input
                      type="number"
                      value={compareB.kms_driven}
                      onChange={(e) => setCompareB(prev => ({ ...prev, kms_driven: Number(e.target.value) }))}
                      className="w-full mt-1 px-3 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>


                {resultB && (
                  <div className="mt-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Valuation B</p>
                    <p className="text-3xl font-black text-white mt-1 font-display">₹{resultB.estimated_price?.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
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
                className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 font-bold text-white text-sm shadow-xl shadow-indigo-500/25 hover:brightness-110 transition-all cursor-pointer"
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
              <h2 className="text-3xl font-black text-white mb-2 flex items-center justify-center gap-2 font-display">
                <Layers className="text-indigo-400" /> Dealership & Fleet Batch Valuation
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Appraise multiple vehicles simultaneously using vectorised batch machine learning inference.
              </p>
            </div>

            {/* Fleet Summary KPI Tiles */}
            {fleetResult && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <p className="text-2xl font-black text-white font-display">₹{fleetResult.summary.total_fleet_value.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Total Portfolio Resale Value</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <p className="text-2xl font-black text-white font-display">₹{fleetResult.summary.average_vehicle_price.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Average Unit Valuation</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <p className="text-2xl font-black text-white font-display">{fleetResult.summary.vehicle_count} Units</p>
                  <p className="text-xs text-slate-400 mt-0.5">Batch Count Appraised</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <p className="text-2xl font-black text-emerald-400 font-display">{fleetResult.summary.high_confidence_count} / {fleetResult.summary.vehicle_count}</p>
                  <p className="text-xs text-slate-400 mt-0.5">High Confidence Units</p>
                </div>
              </div>
            )}

            {/* Fleet Table */}
            <GlassCard className="p-6 mb-6 overflow-x-auto border-white/[0.08]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-slate-400 uppercase tracking-wider text-[10px]">
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
                      <td className="py-3 font-medium capitalize text-cyan-300">{item.vehicle_type}</td>
                      <td className="py-3 font-bold text-white">{item.brand}</td>
                      <td className="py-3 text-slate-300 font-mono">{item.power || item.engine_cc} cc</td>
                      <td className="py-3 text-slate-300 font-mono">{item.age} yrs</td>
                      <td className="py-3 text-slate-300 font-mono">{item.kms_driven?.toLocaleString('en-IN')} km</td>
                      <td className="py-3 text-slate-300">Rank {item.owner_rank}</td>
                      <td className="py-3 font-bold text-emerald-400 font-mono">
                        {fleetResult?.predictions[idx] ? `₹${fleetResult.predictions[idx].estimated_price.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setFleetList(prev => prev.filter((_, i) => i !== idx))}
                          className="text-rose-400 hover:text-rose-300 cursor-pointer p-1"
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
                  <Plus size={14} /> Add Vehicle Unit
                </button>

                <button
                  type="button"
                  onClick={handleFleetBatchSubmit}
                  disabled={fleetLoading}
                  className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  {fleetLoading ? "Processing Batch..." : "Evaluate Entire Fleet Portfolio"}
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* VIEW MODE 4: CAR & BIKE LIFECYCLE & MARKET SIMULATOR */}
        {viewMode === 'sim' && (
          <div>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-medium text-slate-300 mb-3 shadow-inner">
                <Sparkles size={13} className="text-cyan-400" />
                <span>AI Ownership & Market Horizon Engine</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-display mb-2">
                Car & Bike Lifecycle Simulator
              </h2>
              <p className="text-sm text-slate-400 max-w-xl mx-auto">
                Model multi-year asset depreciation curves, project cumulative operating cash-flow (fuel, insurance, maintenance), and discover your vehicle's optimal liquidation sweet-spot.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Simulator Controls */}
              <div className="lg:col-span-4 space-y-5">
                <GlassCard className="p-5 border-white/[0.08]">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
                    <div className="flex items-center gap-2">
                      <Settings2 size={16} className="text-indigo-400" />
                      <h3 className="text-sm font-bold text-white">Simulation Setup</h3>
                    </div>

                    {/* Segment Toggle */}
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                      <button
                        type="button"
                        onClick={() => {
                          setSimData(prev => ({
                            ...prev,
                            vehicle_type: 'bike',
                            brand: 'Royal Enfield',
                            power: 350,
                            purchase_price: 220000,
                            custom_mileage_kml: 35
                          }))
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                          simData.vehicle_type === 'bike' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🏍️ Bike
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSimData(prev => ({
                            ...prev,
                            vehicle_type: 'car',
                            brand: 'Hyundai',
                            engine_cc: 1493,
                            fuel: 'Diesel',
                            transmission: 'Manual',
                            purchase_price: 1150000,
                            custom_mileage_kml: 18
                          }))
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                          simData.vehicle_type === 'car' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🚗 Car
                      </button>
                    </div>
                  </div>

                  {/* Model Quick Presets */}
                  <div className="mb-4">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
                      Quick Benchmark Presets
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {simData.vehicle_type === 'bike' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...simData, brand: 'Royal Enfield', power: 350, purchase_price: 220000, custom_mileage_kml: 35 }
                              setSimData(updated)
                              handleRunSimulation(updated)
                            }}
                            className="text-left p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white cursor-pointer"
                          >
                            <span className="font-bold block text-indigo-300">Classic 350</span>
                            <span className="text-[10px] text-slate-500">₹2.20L • 35 km/L</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...simData, brand: 'KTM', power: 373, purchase_price: 330000, custom_mileage_kml: 28 }
                              setSimData(updated)
                              handleRunSimulation(updated)
                            }}
                            className="text-left p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white cursor-pointer"
                          >
                            <span className="font-bold block text-orange-300">Duke 390</span>
                            <span className="text-[10px] text-slate-500">₹3.30L • 28 km/L</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...simData, brand: 'Hero', power: 100, purchase_price: 85000, custom_mileage_kml: 65 }
                              setSimData(updated)
                              handleRunSimulation(updated)
                            }}
                            className="text-left p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white cursor-pointer"
                          >
                            <span className="font-bold block text-emerald-300">Splendor+</span>
                            <span className="text-[10px] text-slate-500">₹85k • 65 km/L</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...simData, brand: 'Yamaha', power: 155, purchase_price: 195000, custom_mileage_kml: 45 }
                              setSimData(updated)
                              handleRunSimulation(updated)
                            }}
                            className="text-left p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white cursor-pointer"
                          >
                            <span className="font-bold block text-cyan-300">YZF-R15</span>
                            <span className="text-[10px] text-slate-500">₹1.95L • 45 km/L</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...simData, brand: 'Maruti', engine_cc: 1197, fuel: 'Petrol', purchase_price: 750000, custom_mileage_kml: 18 }
                              setSimData(updated)
                              handleRunSimulation(updated)
                            }}
                            className="text-left p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white cursor-pointer"
                          >
                            <span className="font-bold block text-blue-300">Swift VXI</span>
                            <span className="text-[10px] text-slate-500">₹7.50L • 18 km/L</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...simData, brand: 'Hyundai', engine_cc: 1493, fuel: 'Diesel', purchase_price: 1450000, custom_mileage_kml: 18 }
                              setSimData(updated)
                              handleRunSimulation(updated)
                            }}
                            className="text-left p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white cursor-pointer"
                          >
                            <span className="font-bold block text-indigo-300">Creta Diesel</span>
                            <span className="text-[10px] text-slate-500">₹14.5L • 18 km/L</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...simData, brand: 'Tata', engine_cc: 1199, fuel: 'Petrol', purchase_price: 980000, custom_mileage_kml: 16 }
                              setSimData(updated)
                              handleRunSimulation(updated)
                            }}
                            className="text-left p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white cursor-pointer"
                          >
                            <span className="font-bold block text-emerald-300">Nexon XZ+</span>
                            <span className="text-[10px] text-slate-500">₹9.80L • 16 km/L</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...simData, brand: 'Mahindra', engine_cc: 2184, fuel: 'Diesel', purchase_price: 1650000, custom_mileage_kml: 14 }
                              setSimData(updated)
                              handleRunSimulation(updated)
                            }}
                            className="text-left p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white cursor-pointer"
                          >
                            <span className="font-bold block text-amber-300">Thar 4x4</span>
                            <span className="text-[10px] text-slate-500">₹16.5L • 14 km/L</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Brand Selector */}
                  <div className="mb-3">
                    <label className="text-xs text-slate-400 block mb-1">Manufacturer</label>
                    <select
                      value={simData.brand}
                      onChange={(e) => setSimData(prev => ({ ...prev, brand: e.target.value }))}
                      className="w-full bg-[#131622] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {(contracts[simData.vehicle_type]?.ui?.brands || ['Royal Enfield', 'KTM', 'Bajaj', 'Honda', 'Yamaha', 'Hero', 'Maruti', 'Hyundai', 'Tata']).map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  {/* Initial Acquisition Price */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-400">Acquisition / Showroom Price</span>
                      <span className="text-white font-mono font-bold">₹{simData.purchase_price?.toLocaleString('en-IN')}</span>
                    </div>
                    <input
                      type="range"
                      min={simData.vehicle_type === 'bike' ? 40000 : 250000}
                      max={simData.vehicle_type === 'bike' ? 1200000 : 6000000}
                      step={simData.vehicle_type === 'bike' ? 10000 : 25000}
                      value={simData.purchase_price}
                      onChange={(e) => setSimData(prev => ({ ...prev, purchase_price: Number(e.target.value) }))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Horizon Slider */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-400">Simulation Horizon</span>
                      <span className="text-cyan-300 font-mono font-bold">{simData.horizon_years} Years</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={simData.horizon_years}
                      onChange={(e) => setSimData(prev => ({ ...prev, horizon_years: Number(e.target.value) }))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>1 yr (Short)</span>
                      <span>5 yrs (Medium)</span>
                      <span>10 yrs (Long)</span>
                    </div>
                  </div>

                  {/* Annual KM Slider */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-400">Annual Distance Driven</span>
                      <span className="text-indigo-300 font-mono font-bold">{simData.annual_kms?.toLocaleString('en-IN')} km/yr</span>
                    </div>
                    <input
                      type="range"
                      min="3000"
                      max="35000"
                      step="1000"
                      value={simData.annual_kms}
                      onChange={(e) => setSimData(prev => ({ ...prev, annual_kms: Number(e.target.value) }))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>3k km (Weekend)</span>
                      <span>10k km (Daily)</span>
                      <span>35k km (Commercial)</span>
                    </div>
                  </div>

                  {/* Fuel Economy & Fuel Price */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Fuel Economy (km/L)</label>
                      <input
                        type="number"
                        value={simData.custom_mileage_kml}
                        onChange={(e) => setSimData(prev => ({ ...prev, custom_mileage_kml: Number(e.target.value) }))}
                        className="w-full bg-[#131622] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Fuel Rate (₹/L)</label>
                      <input
                        type="number"
                        value={simData.custom_fuel_price}
                        onChange={(e) => setSimData(prev => ({ ...prev, custom_fuel_price: Number(e.target.value) }))}
                        className="w-full bg-[#131622] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRunSimulation()}
                    disabled={simLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:opacity-95 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {simLoading ? (
                      <span>Running Monte Carlo Simulation...</span>
                    ) : (
                      <>
                        <Zap size={14} className="text-cyan-200" /> Run Lifecycle Simulation
                      </>
                    )}
                  </button>
                </GlassCard>
              </div>

              {/* Right Column: Simulation Output Dashboard */}
              <div className="lg:col-span-8 space-y-5">
                {simError && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                    <AlertTriangle size={16} /> {simError}
                  </div>
                )}

                {simResult && (
                  <>
                    {/* Top 4 Summary Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <GlassCard className="p-3.5 border-white/[0.08]">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">Projected Resale</span>
                        <div className="text-lg font-black text-white font-mono">
                          ₹{simResult.summary.final_resale_value?.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-cyan-300 font-semibold">
                          {simResult.timeline[simResult.timeline.length - 1]?.retention_rate}% Retention
                        </span>
                      </GlassCard>

                      <GlassCard className="p-3.5 border-white/[0.08]">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">Depreciation Loss</span>
                        <div className="text-lg font-black text-rose-400 font-mono">
                          -₹{simResult.summary.total_depreciation_loss?.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-500">Over {simResult.horizon_years} years</span>
                      </GlassCard>

                      <GlassCard className="p-3.5 border-white/[0.08]">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">Operating Expenses</span>
                        <div className="text-lg font-black text-amber-300 font-mono">
                          ₹{simResult.summary.total_operating_expense?.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-500">Fuel + Maint + Ins</span>
                      </GlassCard>

                      <GlassCard className="p-3.5 border-white/[0.08]">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">Effective Cost</span>
                        <div className="text-lg font-black text-emerald-400 font-mono">
                          ₹{simResult.summary.average_cost_per_km} <span className="text-xs font-normal text-slate-400">/ km</span>
                        </div>
                        <span className="text-[10px] text-indigo-300 font-semibold">
                          ₹{simResult.summary.average_monthly_cost?.toLocaleString('en-IN')} / mo
                        </span>
                      </GlassCard>
                    </div>

                    {/* AI Optimal Liquidation Window Banner */}
                    <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-emerald-500/10 border border-amber-500/30 shadow-lg shadow-amber-500/5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-black font-black shrink-0 shadow-md">
                            <Award size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                                AI Optimal Liquidation Window
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-[10px] font-bold">
                                Sweet Spot
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-1">
                              {simResult.optimal_sell_window.reasoning}
                            </p>
                          </div>
                        </div>

                        <div className="text-right sm:border-l sm:border-white/10 sm:pl-4 shrink-0">
                          <div className="text-[11px] text-slate-400">Recommended Year</div>
                          <div className="text-base font-black text-white font-mono">
                            Year {simResult.optimal_sell_window.recommended_sell_year} ({simResult.optimal_sell_window.recommended_calendar_year})
                          </div>
                          <div className="text-[10px] text-emerald-400 font-bold">
                            ₹{simResult.optimal_sell_window.projected_liquidation_price?.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Interactive SVG Lifecycle Chart */}
                    <GlassCard className="p-5 border-white/[0.08]">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                            Ownership Cost & Resale Horizon Curve
                          </h4>
                          <p className="text-[11px] text-slate-500">Asset Value Trajectory vs Cumulative Total Cost of Ownership</p>
                        </div>
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className="flex items-center gap-1 text-cyan-300">
                            <span className="h-2 w-2 rounded-full bg-cyan-400" /> Resale Value
                          </span>
                          <span className="flex items-center gap-1 text-indigo-300">
                            <span className="h-2 w-2 rounded-full bg-indigo-400" /> Cumulative TCO
                          </span>
                          <span className="flex items-center gap-1 text-amber-300">
                            <span className="h-2 w-2 rounded-full bg-amber-400" /> Operating Cost
                          </span>
                        </div>
                      </div>

                      {/* SVG Multi-Layer Graph */}
                      <div className="relative w-full h-52 bg-white/[0.01] rounded-xl p-2 border border-white/[0.04]">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="resaleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
                            </linearGradient>
                            <linearGradient id="tcoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Grid Lines */}
                          {[0, 45, 90, 135, 180].map((y, idx) => (
                            <line key={idx} x1="0" y1={y} x2="500" y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                          ))}

                          {/* Generate Paths */}
                          {(() => {
                            const pts = simResult.timeline
                            const maxVal = Math.max(
                              simResult.initial_price * 1.1,
                              ...pts.map(p => p.cumulative_tco)
                            )
                            const widthStep = 500 / (pts.length - 1)

                            const resalePoints = pts.map((p, i) => {
                              const x = i * widthStep
                              const y = 170 - (p.resale_value / maxVal) * 150
                              return `${x},${y}`
                            })

                            const tcoPoints = pts.map((p, i) => {
                              const x = i * widthStep
                              const y = 170 - (p.cumulative_tco / maxVal) * 150
                              return `${x},${y}`
                            })

                            const operatingPoints = pts.map((p, i) => {
                              const x = i * widthStep
                              const y = 170 - (p.cumulative_operating_cost / maxVal) * 150
                              return `${x},${y}`
                            })

                            const resaleArea = `M 0,170 L ${resalePoints.join(' L ')} L 500,170 Z`
                            const tcoArea = `M 0,170 L ${tcoPoints.join(' L ')} L 500,170 Z`

                            return (
                              <>
                                <path d={resaleArea} fill="url(#resaleGradient)" />
                                <path d={tcoArea} fill="url(#tcoGradient)" />

                                <path d={`M ${resalePoints.join(' L ')}`} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />
                                <path d={`M ${tcoPoints.join(' L ')}`} fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />
                                <path d={`M ${operatingPoints.join(' L ')}`} fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 4" />

                                {/* Interactive Milestone Dots */}
                                {pts.map((p, i) => {
                                  const x = i * widthStep
                                  const yResale = 170 - (p.resale_value / maxVal) * 150
                                  const isOpt = p.year === simResult.optimal_sell_window.recommended_sell_year
                                  return (
                                    <g key={i} className="cursor-pointer" onClick={() => setSimActiveYear(p.year)}>
                                      <circle
                                        cx={x}
                                        cy={yResale}
                                        r={isOpt ? 6 : 4}
                                        fill={isOpt ? '#f59e0b' : '#22d3ee'}
                                        stroke="#0b0d14"
                                        strokeWidth="2"
                                      />
                                    </g>
                                  )
                                })}
                              </>
                            )
                          })()}
                        </svg>
                      </div>

                      {/* Year Timeline Selector */}
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/[0.06] text-xs">
                        {simResult.timeline.map(p => (
                          <button
                            key={p.year}
                            type="button"
                            onClick={() => setSimActiveYear(p.year)}
                            className={`px-2 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
                              simActiveYear === p.year ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Yr {p.year}
                          </button>
                        ))}
                      </div>
                    </GlassCard>

                    {/* Comparative Scenarios Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {simResult.scenarios.map((sc, idx) => (
                        <GlassCard key={idx} className="p-4 border-white/[0.08] flex flex-col justify-between">
                          <div>
                            <span className="text-xs font-black text-white block mb-1">{sc.name}</span>
                            <p className="text-[11px] text-slate-400 mb-3">{sc.summary}</p>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between text-slate-400">
                                <span>Sell Horizon</span>
                                <span className="text-white font-bold">Year {sc.sell_year}</span>
                              </div>
                              <div className="flex justify-between text-slate-400">
                                <span>Liquidation Resale</span>
                                <span className="text-cyan-300 font-mono font-bold">₹{sc.final_resale?.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between text-slate-400">
                                <span>Cumulative Spent</span>
                                <span className="text-slate-300 font-mono">₹{sc.total_spent?.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-bold">
                            <span className="text-emerald-400 font-mono">₹{sc.net_cost_per_km} / km</span>
                            <span className="text-indigo-300 font-mono">₹{sc.monthly_burn?.toLocaleString('en-IN')} / mo</span>
                          </div>
                        </GlassCard>
                      ))}
                    </div>

                    {/* Detailed Year-by-Year Financial Ledger */}
                    <GlassCard className="p-5 border-white/[0.08] overflow-x-auto">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar size={14} className="text-indigo-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Year-by-Year Financial Ledger
                        </h4>
                      </div>
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.08] text-slate-400 uppercase tracking-wider text-[10px]">
                            <th className="pb-2">Year</th>
                            <th className="pb-2">Odometer</th>
                            <th className="pb-2">Resale Price</th>
                            <th className="pb-2">Annual Fuel</th>
                            <th className="pb-2">Maintenance</th>
                            <th className="pb-2">Insurance</th>
                            <th className="pb-2">Cumulative TCO</th>
                            <th className="pb-2 text-right">Cost / KM</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04] font-mono">
                          {simResult.timeline.map((row) => (
                            <tr key={row.year} className={`hover:bg-white/[0.02] ${simActiveYear === row.year ? 'bg-indigo-500/10' : ''}`}>
                              <td className="py-2.5 text-white font-bold">Yr {row.year} ({row.calendar_year})</td>
                              <td className="py-2.5 text-slate-300">{row.total_kms?.toLocaleString('en-IN')} km</td>
                              <td className="py-2.5 text-cyan-300 font-bold">₹{row.resale_value?.toLocaleString('en-IN')}</td>
                              <td className="py-2.5 text-slate-400">₹{row.annual_fuel_cost?.toLocaleString('en-IN')}</td>
                              <td className="py-2.5 text-slate-400">₹{row.annual_maintenance?.toLocaleString('en-IN')}</td>
                              <td className="py-2.5 text-slate-400">₹{row.annual_insurance?.toLocaleString('en-IN')}</td>
                              <td className="py-2.5 text-indigo-300 font-bold">₹{row.cumulative_tco?.toLocaleString('en-IN')}</td>
                              <td className="py-2.5 text-emerald-400 font-bold text-right">₹{row.net_cost_per_km}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </GlassCard>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </main>


      {/* 🧾 LUXURY VALUATION CERTIFICATE MODAL */}
      {showCertModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div id="printable-valuation-certificate" className="relative w-full max-w-2xl rounded-2xl bg-[#090b12] border border-white/20 p-8 shadow-2xl print-certificate-container text-white">

            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 no-print">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-indigo-400" size={20} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Official Valuation Certificate</span>
              </div>
              <button 
                onClick={() => setShowCertModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 cursor-pointer text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Certificate Body */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-black tracking-tight font-display">AutoValuate AI Official Certificate</h3>
              <p className="text-xs text-slate-400 mt-1">Verified Machine Learning Market Valuation Document</p>
              <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono">
                Certificate ID: AV-2026-{Math.random().toString(36).substring(2, 8).toUpperCase()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-6 text-xs">
              <div>
                <p className="text-slate-400">Vehicle Specification</p>
                <p className="text-sm font-bold text-white mt-0.5">{currentFormData.brand} ({vehicleType.toUpperCase()})</p>
              </div>
              <div>
                <p className="text-slate-400">Displacement & Fuel</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {vehicleType === 'bike' ? `${bikeData.power} cc` : `${carData.engine_cc} cc (${carData.fuel})`}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Odometer & Age</p>
                <p className="text-sm font-bold text-white mt-0.5 font-mono">{currentFormData.kms_driven?.toLocaleString('en-IN')} km | {currentFormData.age} yrs</p>
              </div>
              <div>
                <p className="text-slate-400">Appraisal Date</p>
                <p className="text-sm font-bold text-white mt-0.5">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="text-center p-5 rounded-xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/30 mb-6 shadow-inner">
              <p className="text-[11px] uppercase tracking-widest text-indigo-300 font-bold">Certified Fair Resale Appraisal</p>
              <p className="text-4xl font-black text-white mt-1 font-display">₹{result.estimated_price?.toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Authorized Interval: ₹{result.price_range?.min?.toLocaleString('en-IN')} – ₹{result.price_range?.max?.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-4 border-t border-white/10">
              <span>Authenticity Seal: 97.4% Empirical Stacking Ensemble</span>
              <div className="flex gap-2.5 no-print">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {downloadingPdf ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download size={14} /> Download Official PDF
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer text-xs shadow-md shadow-indigo-500/20"
                >
                  <Printer size={14} /> Print
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
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />

        {/* Area fill */}
        <path d={areaD} fill="url(#forecastArea)" />

        {/* Line curve */}
        <path d={pathD} fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Milestone Nodes */}
        {points.map((p, i) => (
          <g key={i} className="group cursor-pointer">
            <circle cx={p.x} cy={p.y} r="4.5" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5" />
            <text x={p.x} y={height - 5} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="sans-serif" fontWeight="bold">
              '{String(p.calendar_year).slice(2)}
            </text>
          </g>
        ))}
      </svg>

      <div className="grid grid-cols-6 gap-1.5 mt-2 text-center font-mono">
        {data.map((d, i) => (
          <div key={i} className="p-1 rounded bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[9px] text-slate-400">Yr {d.year_offset}</p>
            <p className="text-[10px] font-bold text-white truncate">₹{Math.round(d.estimated_price / 1000)}k</p>
            <p className="text-[8px] text-indigo-400 font-semibold">{d.retention_pct}%</p>
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
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          {icon} {label}
        </label>
        <span className="text-xs font-bold text-white font-mono">
          {display} <span className="text-[10px] font-normal text-slate-400 font-sans">{unit}</span>
        </span>
      </div>

      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        style={{
          background: `linear-gradient(to right, #6366f1 0%, #06b6d4 ${percentage}%, rgba(255, 255, 255, 0.08) ${percentage}%)`
        }}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
        <span>{formatValue ? formatValue(min) : min}</span>
        <span>{formatValue ? formatValue(max) : max}</span>
      </div>
    </div>
  )
}

export default App
