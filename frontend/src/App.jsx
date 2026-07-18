import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, CheckCircle2, AlertTriangle, Gauge, Calendar, Road, Users, Bike, Info, ArrowLeft } from 'lucide-react'
import { NumberTicker } from "@/components/ui/NumberTicker"
import { MagicCard } from "@/components/ui/magic-card"
import { AuroraBackground } from "@/components/ui/aurora-background"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

const BRANDS = [
  "Bajaj", "Benelli", "Ducati", "Harley-Davidson", "Hero", "Honda",
  "Jawa", "Kawasaki", "KTM", "Mahindra", "Royal Enfield",
  "Suzuki", "Triumph", "TVS", "Yamaha"
]

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
const REQUEST_TIMEOUT_MS = 10000

function validateFormData(data, contract) {
  if (!contract) return null;
  const p = contract.schema.properties;
  
  if (typeof data.brand !== 'string' || data.brand.trim().length < p.brand.minLength) {
    return `Brand must contain at least ${p.brand.minLength} characters.`
  }
  if (data.power < p.power.minimum || data.power > p.power.maximum) {
    return `Engine power must be between ${p.power.minimum} and ${p.power.maximum} cc.`
  }
  if (data.kms_driven < p.kms_driven.minimum || data.kms_driven > p.kms_driven.maximum) {
    return `Odometer must be between ${p.kms_driven.minimum} and ${p.kms_driven.maximum} km.`
  }
  if (data.age < p.age.minimum || data.age > p.age.maximum) {
    return `Age must be between ${p.age.minimum} and ${p.age.maximum} years.`
  }
  if (data.owner_rank < p.owner_rank.minimum || data.owner_rank > p.owner_rank.maximum) {
    return `Owner rank must be between ${p.owner_rank.minimum} and ${p.owner_rank.maximum}.`
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

  const [contract, setContract] = useState(null)
  const [contractError, setContractError] = useState(null)
  
  const [view, setView] = useState('form') // 'form', 'loading', 'result', 'error'
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE_URL}/contract`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch API contract')
        return res.json()
      })
      .then(data => setContract(data))
      .catch(err => setContractError(err.message))
  }, [])

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: name === 'brand' ? value : Number(value)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setView('loading')
    setResult(null)
    setError(null)

    const validationError = validateFormData(formData, contract)
    if (validationError) {
      setError(validationError)
      setView('error')
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
        setResult(data)
        setView('result')
      }, 1200)
    } catch (err) {
      setTimeout(() => {
        if (err?.name === 'AbortError') {
          setError('Prediction request timed out. Please try again.')
        } else {
          setError(err?.message || 'Could not connect to the prediction API.')
        }
        setView('error')
      }, 500)
    } finally {
      clearTimeout(timeoutId)
    }
  }

  if (contractError) {
    return (
      <AuroraBackground>
        <div className="z-10 flex flex-col items-center justify-center p-6">
          <MagicCard className="max-w-md text-center p-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold mb-4">
              <AlertTriangle size={14} />
              Initialization Failed
            </div>
            <p className="text-zinc-400 mb-6">{contractError}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Retry Connection</Button>
          </MagicCard>
        </div>
      </AuroraBackground>
    )
  }

  if (!contract) {
    return (
      <AuroraBackground>
         <div className="z-10 flex flex-col items-center gap-4">
           <div className="relative">
              <div className="h-12 w-12 rounded-full border-2 border-white/10" />
              <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
           </div>
           <p className="text-sm font-medium text-zinc-400 tracking-wider uppercase">Loading model schema...</p>
         </div>
      </AuroraBackground>
    )
  }

  const ownerOptions = Object.entries(contract.ui.owner_rank_labels).map(([val, label]) => {
    const value = parseInt(val, 10);
    return { value, label: value === 1 ? '1st' : value === 2 ? '2nd' : value === 3 ? '3rd' : '4+' };
  });

  return (
    <AuroraBackground>
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              <Bike size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">MotoValue</h1>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium">AI Price Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 backdrop-blur-md">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            Model Active
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-2xl mx-auto px-4 pt-24 pb-12 flex flex-col items-center justify-center min-h-screen">
        
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center mb-10 w-full"
        >
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">
            Valuation <span className="gradient-text">Engine</span>
          </h2>
          <p className="text-zinc-400 text-sm md:text-base max-w-md mx-auto">
            Powered by a highly tuned XGBoost model. Configure your motorcycle parameters below to predict its market value.
          </p>
        </motion.div>

        {/* Central Wizard Card */}
        <motion.div 
          className="w-full relative"
          layout
        >
          <MagicCard className="w-full p-1 shadow-2xl">
            <div className="bg-zinc-950/80 rounded-xl p-6 md:p-8 backdrop-blur-xl border border-white/5 w-full min-h-[400px] flex flex-col justify-center">
              
              <AnimatePresence mode="wait">
                
                {view === 'form' && (
                  <motion.form 
                    key="form"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleSubmit} 
                    className="flex flex-col gap-8 w-full"
                  >
                    
                    {/* Brand Select */}
                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                         Brand
                      </label>
                      <Select value={formData.brand} onValueChange={(v) => handleChange('brand', v)}>
                        <SelectTrigger className="w-full h-12 bg-white/5 border-white/10 text-white rounded-xl focus:ring-blue-500">
                          <SelectValue placeholder="Select a brand" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-h-[300px]">
                          {BRANDS.map(b => (
                            <SelectItem key={b} value={b} className="focus:bg-blue-500 focus:text-white cursor-pointer rounded-lg">
                              {b}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Engine & Age Row */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                            <Gauge size={14}/> Engine
                          </label>
                          <span className="text-sm font-bold text-white">{formData.power} <span className="text-zinc-500 font-normal text-xs">cc</span></span>
                        </div>
                      <div className="pt-2 pb-1">
                          <Slider 
                            value={[formData.power]} 
                            min={contract.schema.properties.power.minimum} 
                            max={contract.schema.properties.power.maximum} 
                            step={25}
                            onValueChange={([v]) => handleChange('power', v)}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                            <Calendar size={14}/> Age
                          </label>
                          <span className="text-sm font-bold text-white">{formData.age} <span className="text-zinc-500 font-normal text-xs">yrs</span></span>
                        </div>
                      <div className="pt-2 pb-1">
                          <Slider 
                            value={[formData.age]} 
                            min={contract.schema.properties.age.minimum} 
                            max={contract.schema.properties.age.maximum} 
                            step={1}
                            onValueChange={([v]) => handleChange('age', v)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Odometer */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                          <Road size={14}/> Odometer
                        </label>
                        <span className="text-sm font-bold text-white">{formData.kms_driven.toLocaleString('en-IN')} <span className="text-zinc-500 font-normal text-xs">km</span></span>
                      </div>
                      <div className="pt-2 pb-1">
                        <Slider 
                          value={[formData.kms_driven]} 
                          min={contract.schema.properties.kms_driven.minimum} 
                          max={contract.schema.properties.kms_driven.maximum} 
                          step={1000}
                          onValueChange={([v]) => handleChange('kms_driven', v)}
                        />
                      </div>
                    </div>

                    {/* Ownership Pills */}
                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                        <Users size={14} /> Owners
                      </label>
                      <div className="flex gap-2 w-full p-1 bg-white/5 rounded-xl border border-white/5">
                        {ownerOptions.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleChange('owner_rank', opt.value)}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-300 cursor-pointer
                              ${formData.owner_rank === opt.value
                                ? 'bg-blue-500 text-white shadow-lg'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                              }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full h-14 rounded-xl bg-white text-black hover:bg-zinc-200 text-base font-bold transition-transform active:scale-95 group relative overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          Analyze Value <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                      </Button>
                    </div>

                  </motion.form>
                )}

                {view === 'loading' && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full gap-6 py-12"
                  >
                    <div className="relative">
                      <div className="h-20 w-20 rounded-full border-2 border-white/10" />
                      <div className="absolute inset-0 h-20 w-20 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="text-blue-500 animate-pulse" size={24} />
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-lg font-bold text-white tracking-wide">Processing Data</p>
                      <p className="text-sm text-zinc-400">Running XGBoost inference...</p>
                    </div>
                  </motion.div>
                )}

                {view === 'result' && result && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="flex flex-col items-center text-center py-4 w-full"
                  >
                    {/* Quality Badge */}
                    {result.prediction_quality?.level === 'low' ? (
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold uppercase tracking-wider mb-8 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                        <AlertTriangle size={14} />
                        Low Confidence
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-8 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
                        <CheckCircle2 size={14} />
                        High Confidence
                      </div>
                    )}

                    <p className="text-xs text-zinc-500 mb-3 uppercase tracking-[0.2em] font-bold">Estimated Market Value</p>

                    <div className="mb-8">
                      <h3 className="text-6xl md:text-7xl flex items-center justify-center font-black tracking-tighter gradient-text drop-shadow-2xl">
                        <span className="text-4xl md:text-5xl mr-1 text-white/50">₹</span>
                        <NumberTicker value={result.estimated_price} />
                      </h3>
                    </div>
                    
                    {/* OOD Adjustments Alert */}
                    {result.adjustments && result.adjustments.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="w-full mb-8 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-left backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-2 text-amber-500 text-[10px] font-black uppercase tracking-widest mb-3">
                          <Info size={14} />
                          Data Normalization Applied
                        </div>
                        <div className="text-xs text-zinc-400 space-y-2">
                          {result.adjustments.map((adj, i) => (
                            <div key={i} className="flex justify-between items-center border-b border-white/5 pb-1 last:border-0 last:pb-0">
                              <span className="capitalize text-zinc-300 font-medium">{adj.feature.replace('_', ' ')}</span>
                              <span>clamped: <span className="line-through opacity-50 mr-1">{adj.original}</span> {adj.adjusted}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Summary Chips */}
                    <div className="flex flex-wrap justify-center gap-2 mb-8">
                      <div className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 text-xs font-medium text-zinc-300">{formData.brand}</div>
                      <div className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 text-xs font-medium text-zinc-300">{formData.power}cc</div>
                      <div className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 text-xs font-medium text-zinc-300">{formData.age}y</div>
                      <div className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 text-xs font-medium text-zinc-300">{formData.kms_driven.toLocaleString()}km</div>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl h-12 border-white/10 hover:bg-white/10 hover:text-white transition-colors"
                      onClick={() => setView('form')}
                    >
                      <ArrowLeft size={16} className="mr-2" /> Start New Valuation
                    </Button>
                  </motion.div>
                )}

                {view === 'error' && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center text-center py-12"
                  >
                    <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                      <AlertTriangle size={28} className="text-red-500" />
                    </div>
                    <p className="text-lg font-bold text-white mb-2">Request Failed</p>
                    <p className="text-sm text-zinc-400 max-w-sm mb-8">{error}</p>
                    <Button 
                      variant="outline" 
                      className="rounded-xl border-white/10 hover:bg-white/10 hover:text-white"
                      onClick={() => setView('form')}
                    >
                      Try Again
                    </Button>
                  </motion.div>
                )}
                
              </AnimatePresence>
            </div>
          </MagicCard>
        </motion.div>

      </main>
    </AuroraBackground>
  )
}

function Zap(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

export default App
