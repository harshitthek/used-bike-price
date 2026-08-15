import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Zap, 
  Bike, 
  Car, 
  Search, 
  Gauge, 
  Calendar, 
  Road, 
  Users, 
  Fuel, 
  Settings2, 
  Sparkles, 
  Info, 
  Copy, 
  Check, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  FileDown, 
  History, 
  Bookmark,
  AlertTriangle,
  Award
} from 'lucide-react'
import { NumberTicker } from '../components/ui/NumberTicker'
import { GlassCard } from '../components/ui/GlassCard'
import { AnimatedVehicleStage } from '../components/ui/AnimatedVehicleStage'
import { apiPost } from '../hooks/useApi'

// ── POPULAR PRESETS ──────────────────────────────────────────────────

const BIKE_PRESETS = [
  {
    name: "Classic 350",
    badge: "Cruiser",
    color: "from-amber-500/20 to-orange-500/10",
    tagColor: "text-amber-300 border-amber-500/30",
    data: { brand: "Royal Enfield", power: 350, kms_driven: 18000, age: 3, owner_rank: 1 }
  },
  {
    name: "Duke 390",
    badge: "Streetfighter",
    color: "from-orange-500/20 to-amber-500/10",
    tagColor: "text-orange-300 border-orange-500/30",
    data: { brand: "KTM", power: 373, kms_driven: 12000, age: 2, owner_rank: 1 }
  },
  {
    name: "Pulsar NS200",
    badge: "Naked Sport",
    color: "from-blue-500/20 to-indigo-500/10",
    tagColor: "text-blue-300 border-blue-500/30",
    data: { brand: "Bajaj", power: 200, kms_driven: 28000, age: 4, owner_rank: 1 }
  },
  {
    name: "Activa 6G",
    badge: "Commuter",
    color: "from-rose-500/20 to-red-500/10",
    tagColor: "text-rose-300 border-rose-500/30",
    data: { brand: "Honda", power: 110, kms_driven: 22000, age: 3, owner_rank: 1 }
  },
  {
    name: "YZF R15 V4",
    badge: "Supersport",
    color: "from-cyan-500/20 to-blue-500/10",
    tagColor: "text-cyan-300 border-cyan-500/30",
    data: { brand: "Yamaha", power: 155, kms_driven: 14000, age: 2, owner_rank: 1 }
  }
]

const CAR_PRESETS = [
  {
    name: "Swift ZXI",
    badge: "Hatchback",
    color: "from-blue-500/20 to-indigo-500/10",
    tagColor: "text-blue-300 border-blue-500/30",
    data: { brand: "Maruti", fuel: "Petrol", transmission: "Manual", engine_cc: 1197, max_power_bhp: 88, kms_driven: 32000, age: 3, owner_rank: 1 }
  },
  {
    name: "Creta SX",
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
  }
]

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

        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
        <path d={areaD} fill="url(#forecastArea)" />
        <path d={pathD} fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

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

export function SingleValuationView({
  vehicleType,
  setVehicleType,
  bikeData,
  setBikeData,
  carData,
  setCarData,
  result,
  setResult,
  loading,
  setLoading,
  error,
  setError,
  contracts,
  onOpenCertificate,
  onSaveToHistory,
  onOpenHistory
}) {
  const [brandSearch, setBrandSearch] = useState('')
  const [copied, setCopied] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const activeContract = contracts?.[vehicleType]
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)

    const payload = {
      vehicle_type: vehicleType,
      ...currentFormData
    }

    try {
      const data = await apiPost('/predict', payload)
      setTimeout(() => {
        setResult(data)
        setLoading(false)
      }, 450)
    } catch (err) {
      setError(err.message || 'Could not connect to the prediction API.')
      setLoading(false)
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

  const handleSaveClick = () => {
    if (!result) return
    onSaveToHistory(vehicleType, currentFormData, result)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  const allBrands = activeContract?.ui?.brands || []
  const filteredBrands = allBrands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()))
  const presets = vehicleType === 'bike' ? BIKE_PRESETS : CAR_PRESETS

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner with Presets & Vehicle Switch */}
      <GlassCard className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Valuation Engine Configuration</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Live Inference
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select vehicle class, apply market presets, or configure specifications below
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Vehicle Switch */}
            <div className="flex p-1 rounded-xl bg-white/[0.04] border border-white/10">
              <button
                type="button"
                onClick={() => setVehicleType('bike')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  vehicleType === 'bike' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bike size={14} /> Motorcycle
              </button>
              <button
                type="button"
                onClick={() => setVehicleType('car')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  vehicleType === 'car' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Car size={14} /> Passenger Car
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenHistory}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <History size={14} /> History
            </button>
          </div>
        </div>

        {/* Popular Presets Cards */}
        <div className="mt-5 pt-5 border-t border-white/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Popular Market Presets
            </span>
            <span className="text-[10px] text-slate-500 font-mono">One-click configuration</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {presets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset.data)}
                className={`p-3 rounded-xl bg-gradient-to-br ${preset.color} border border-white/10 hover:border-white/20 transition-all text-left group cursor-pointer`}
              >
                <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border mb-1.5 ${preset.tagColor}`}>
                  {preset.badge}
                </span>
                <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {preset.name}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {vehicleType === 'bike' ? `${preset.data.power}cc` : `${preset.data.engine_cc}cc`} • {preset.data.kms_driven / 1000}k km
                </p>
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Main Valuation Grid: Form (Left) & Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Vehicle Specifications</h3>
                <span className="text-[10px] text-indigo-400 font-mono font-bold">Step 1 of 1</span>
              </div>

              {/* Brand Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Manufacturer Brand</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                  <input
                    type="text"
                    placeholder="Search brand..."
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 mb-2"
                  />
                </div>

                <div className="grid grid-cols-3 gap-1.5 max-h-28 overflow-y-auto custom-scrollbar pr-1">
                  {filteredBrands.map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleFieldChange('brand', b)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium truncate transition-all text-left cursor-pointer ${
                        currentFormData.brand === b
                          ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Car Specific Fields */}
              {vehicleType === 'car' && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Fuel Type</label>
                    <select
                      value={carData.fuel}
                      onChange={(e) => handleFieldChange('fuel', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50"
                    >
                      <option value="Petrol" className="bg-slate-900 text-white">Petrol</option>
                      <option value="Diesel" className="bg-slate-900 text-white">Diesel</option>
                      <option value="CNG" className="bg-slate-900 text-white">CNG</option>
                      <option value="LPG" className="bg-slate-900 text-white">LPG</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Transmission</label>
                    <select
                      value={carData.transmission}
                      onChange={(e) => handleFieldChange('transmission', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50"
                    >
                      <option value="Manual" className="bg-slate-900 text-white">Manual</option>
                      <option value="Automatic" className="bg-slate-900 text-white">Automatic</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Sliders */}
              <div className="space-y-3 pt-2">
                <SliderField
                  icon={<Gauge size={14} className="text-indigo-400" />}
                  label={vehicleType === 'bike' ? "Engine Capacity" : "Engine Displacement"}
                  unit="cc"
                  value={vehicleType === 'bike' ? bikeData.power : carData.engine_cc}
                  min={vehicleType === 'bike' ? 100 : 796}
                  max={vehicleType === 'bike' ? 650 : 3000}
                  step={vehicleType === 'bike' ? 25 : 50}
                  onChange={(val) => handleFieldChange(vehicleType === 'bike' ? 'power' : 'engine_cc', val)}
                />

                <SliderField
                  icon={<Road size={14} className="text-cyan-400" />}
                  label="Odometer Mileage"
                  unit="km"
                  value={currentFormData.kms_driven}
                  min={1000}
                  max={150000}
                  step={1000}
                  onChange={(val) => handleFieldChange('kms_driven', val)}
                  formatValue={(v) => v.toLocaleString('en-IN')}
                />

                <SliderField
                  icon={<Calendar size={14} className="text-amber-400" />}
                  label="Vehicle Age"
                  unit="yrs"
                  value={currentFormData.age}
                  min={0}
                  max={20}
                  step={1}
                  onChange={(val) => handleFieldChange('age', val)}
                />

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <Users size={14} className="text-purple-400" /> Ownership History
                  </label>
                  <select
                    value={currentFormData.owner_rank}
                    onChange={(e) => handleFieldChange('owner_rank', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value={1} className="bg-slate-900 text-white">First Owner (Highest Resale Retention)</option>
                    <option value={2} className="bg-slate-900 text-white">Second Owner (Standard Market Wear)</option>
                    <option value={3} className="bg-slate-900 text-white">Third Owner (Higher Depreciation)</option>
                    <option value={4} className="bg-slate-900 text-white">Fourth Owner Or More</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle size={14} /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Executing Ensemble Stacking...
                  </>
                ) : (
                  <>
                    <Zap size={14} className="text-cyan-300" /> Generate Valuation Appraisal
                  </>
                )}
              </button>
            </form>
          </GlassCard>
        </div>

        {/* Right Appraisal Display (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
              {/* Interactive Vehicle Simulation & Headlamp Stage */}
              <AnimatedVehicleStage
                vehicleType={vehicleType}
                brand={currentFormData.brand}
                timeline={result.depreciation_forecast || []}
                activeYear={0}
                optimalYear={3}
                annualKms={Math.round(currentFormData.kms_driven / Math.max(1, currentFormData.age))}
              />

              {/* Primary Appraisal Card */}
              <GlassCard className="p-6 border-indigo-500/40 relative overflow-hidden bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-cyan-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {currentFormData.brand} ({vehicleType.toUpperCase()})
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-bold font-mono">
                    {result.confidence || '92.0% Empirical Confidence'}
                  </span>
                </div>

                <div className="text-center py-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-300 block mb-1">
                    Certified Fair Market Valuation
                  </span>
                  <div className="text-4xl sm:text-5xl font-black text-white tracking-tight font-display">
                    ₹<NumberTicker value={result.estimated_price} />
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-2">
                    Authorized Interval: ₹{result.price_range?.min?.toLocaleString('en-IN')} – ₹{result.price_range?.max?.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 text-center font-mono text-xs">
                  <div className="p-2 rounded-lg bg-white/[0.02]">
                    <span className="text-[9px] text-slate-500 block uppercase">Base Spec</span>
                    <span className="font-bold text-white">{vehicleType === 'bike' ? `${bikeData.power}cc` : `${carData.engine_cc}cc`}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.02]">
                    <span className="text-[9px] text-slate-500 block uppercase">Mileage Rate</span>
                    <span className="font-bold text-white">{currentFormData.kms_driven?.toLocaleString('en-IN')} km</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.02]">
                    <span className="text-[9px] text-slate-500 block uppercase">Wear Profile</span>
                    <span className="font-bold text-emerald-400">{currentFormData.age} Years</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleCopyValuation}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveClick}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {savedSuccess ? <Check size={13} className="text-emerald-400" /> : <Bookmark size={13} />}
                    {savedSuccess ? 'Saved!' : 'Save to History'}
                  </button>

                  <button
                    type="button"
                    onClick={onOpenCertificate}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-colors cursor-pointer"
                  >
                    <FileDown size={14} /> Official Certificate
                  </button>
                </div>
              </GlassCard>

              {/* 5-Year Depreciation Forecast SVG Chart */}
              {result.depreciation_forecast && (
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">5-Year Forward Depreciation Curve</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Projected retention value over subsequent ownership cycles</p>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-400">Empirical Decay</span>
                  </div>

                  <DepreciationForecastChart data={result.depreciation_forecast} />
                </GlassCard>
              )}
            </div>
          ) : (
            <GlassCard className="p-12 text-center h-full flex flex-col items-center justify-center text-slate-500">
              <Sparkles size={36} className="text-indigo-400/50 mb-3 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-300">Appraisal Ready</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Configure your motorcycle or car specifications on the left and click "Generate Valuation Appraisal" to execute stacking inference.
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  )
}
