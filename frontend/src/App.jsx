import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, AlertTriangle, Info, Bike, Settings2, 
  DatabaseZap, ShieldAlert, Sparkles, Activity, Clock, 
  Database, GitCommit, Target, BarChart3, ChevronDown, ListFilter
} from 'lucide-react'
import { NumberTicker } from "@/components/ui/NumberTicker"
import { AuroraBackground } from "@/components/ui/aurora-background"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"

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
  
  const [status, setStatus] = useState('idle') // 'idle', 'loading', 'success', 'error'
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [latency, setLatency] = useState(0)
  
  // Debounce ref
  const debounceTimer = useRef(null)

  useEffect(() => {
    fetch(`${API_BASE_URL}/contract`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch API contract')
        return res.json()
      })
      .then(data => setContract(data))
      .catch(err => setContractError(err.message))
  }, [])

  const fetchPrediction = async (dataToPredict) => {
    setStatus('loading')
    setError(null)
    const validationError = validateFormData(dataToPredict, contract)
    if (validationError) {
      setError(validationError)
      setStatus('error')
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    const startTime = performance.now()

    try {
      const res = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_API_KEY || "dev_12345"
        },
        signal: controller.signal,
        body: JSON.stringify(dataToPredict),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.detail || 'Prediction request failed.')
      }
      
      const endTime = performance.now()
      setLatency(Math.round(endTime - startTime))
      setResult(data)
      setStatus('success')
    } catch (err) {
      if (err?.name === 'AbortError') {
        setError('Prediction timed out.')
      } else {
        setError(err?.message || 'Could not connect to API.')
      }
      setStatus('error')
    } finally {
      clearTimeout(timeoutId)
    }
  }

  // Live Debounced Preview
  useEffect(() => {
    if (!contract) return
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      fetchPrediction(formData)
    }, 600) // 600ms debounce for snappier feel
    return () => clearTimeout(debounceTimer.current)
  }, [formData, contract])

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: name === 'brand' ? value : Number(value)
    }))
  }

  const handleExplicitSubmit = (e) => {
    e.preventDefault()
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    fetchPrediction(formData)
  }

  if (contractError) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full shadow-border bg-[#121214] p-8 rounded-2xl text-center">
          <ShieldAlert className="mx-auto text-red-500 mb-4" size={32} />
          <h2 className="text-xl font-bold mb-2">Initialization Failed</h2>
          <p className="text-zinc-400 mb-6 text-sm">{contractError}</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="w-full">Retry Connection</Button>
        </div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="animate-pulse text-indigo-500" size={32} />
          <p className="text-[10px] tracking-widest uppercase text-zinc-500 font-medium">Booting Model Weights...</p>
        </div>
      </div>
    )
  }

  const ownerOptions = Object.entries(contract.ui.owner_rank_labels).map(([val, label]) => {
    const value = parseInt(val, 10);
    return { value, label: value === 1 ? '1st' : value === 2 ? '2nd' : value === 3 ? '3rd' : '4+' };
  });

  return (
    <TooltipProvider delayDuration={100}>
      <div className="min-h-screen bg-[#0a0a0c] noise-bg text-zinc-100 overflow-x-hidden selection:bg-indigo-500/30 font-sans">
        
        {/* Mission Control Header */}
        <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl">
          <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-md bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Bike size={14} className="text-white" />
              </div>
              <span className="font-semibold tracking-tight text-white text-sm">MotoValue AI</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-500/5 text-emerald-400 border-emerald-500/20 font-mono text-[9px] uppercase tracking-wider hidden sm:flex items-center gap-1.5 h-6 rounded-md">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                XGBoost Active
              </Badge>
              <Badge variant="outline" className="bg-blue-500/5 text-blue-400 border-blue-500/20 font-mono text-[9px] uppercase tracking-wider hidden md:flex items-center gap-1 h-6 rounded-md">
                <Database size={10} /> Metadata Loaded
              </Badge>
              <Badge variant="outline" className="bg-zinc-800/50 text-zinc-400 border-white/10 font-mono text-[9px] uppercase tracking-wider hidden sm:flex items-center gap-1 h-6 rounded-md">
                <GitCommit size={10} /> Model v1.2.0
              </Badge>
            </div>
          </div>
        </header>

        {/* Dashboard Split Layout */}
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-8 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Pane: Configuration Engine */}
          <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-6 sticky top-24">
            <div className="shadow-border bg-[#121214] rounded-xl p-5 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                <Settings2 size={16} className="text-zinc-400" />
                <h2 className="text-sm font-semibold text-white">Configuration Engine</h2>
              </div>

              <form onSubmit={handleExplicitSubmit} className="space-y-6">
                
                {/* Brand */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                    Manufacturer
                  </label>
                  <Select value={formData.brand} onValueChange={(v) => handleChange('brand', v)}>
                    <SelectTrigger className="w-full h-9 bg-[#1c1c1f] border-white/10 text-zinc-200 rounded-md focus:ring-1 focus:ring-indigo-500 text-sm shadow-inner transition-colors hover:bg-[#222225]">
                      <SelectValue placeholder="Select a brand" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1c1c1f] border-white/10 text-zinc-200 shadow-xl rounded-md">
                      {BRANDS.map(b => (
                        <SelectItem key={b} value={b} className="focus:bg-indigo-500/20 focus:text-white cursor-pointer rounded text-sm">
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Engine Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                      Displacement (cc)
                    </label>
                    <span className="font-mono text-[11px] text-zinc-300">
                      {formData.power}
                    </span>
                  </div>
                  <Slider 
                    value={[formData.power]} 
                    min={contract.schema.properties.power.minimum} 
                    max={contract.schema.properties.power.maximum} 
                    step={25}
                    onValueChange={([v]) => handleChange('power', v)}
                    className="py-1"
                  />
                </div>

                {/* Age Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                      Vehicle Age (Yrs)
                    </label>
                    <span className="font-mono text-[11px] text-zinc-300">
                      {formData.age}
                    </span>
                  </div>
                  <Slider 
                    value={[formData.age]} 
                    min={contract.schema.properties.age.minimum} 
                    max={contract.schema.properties.age.maximum} 
                    step={1}
                    onValueChange={([v]) => handleChange('age', v)}
                    className="py-1"
                  />
                </div>

                {/* Odometer Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                      Odometer (km)
                    </label>
                    <span className="font-mono text-[11px] text-zinc-300">
                      {formData.kms_driven.toLocaleString()}
                    </span>
                  </div>
                  <Slider 
                    value={[formData.kms_driven]} 
                    min={contract.schema.properties.kms_driven.minimum} 
                    max={contract.schema.properties.kms_driven.maximum} 
                    step={1000}
                    onValueChange={([v]) => handleChange('kms_driven', v)}
                    className="py-1"
                  />
                </div>

                {/* Owners Segmented Control */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                    Previous Owners
                  </label>
                  <div className="flex gap-1 p-1 bg-[#1c1c1f] rounded-md shadow-inner border border-white/5">
                    {ownerOptions.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleChange('owner_rank', opt.value)}
                        className={`flex-1 py-1.5 rounded text-[11px] font-medium transition-all duration-150 cursor-pointer
                          ${formData.owner_rank === opt.value
                            ? 'bg-zinc-700 text-white shadow-sm'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-2 border-t border-white/5">
                  <Button 
                    type="submit" 
                    className="w-full bg-white text-black hover:bg-zinc-200 h-9 text-xs font-semibold shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all rounded-md"
                  >
                    Lock Parameters
                  </Button>
                </div>

              </form>
            </div>
          </div>

          {/* Right Pane: Intelligence Dashboard */}
          <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-6">
            
            {/* Main Result Module */}
            <div className="shadow-border bg-[#121214] rounded-xl p-6 lg:p-8 relative overflow-hidden flex flex-col justify-center min-h-[200px]">
              <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <BarChart3 size={14} className="text-indigo-400" />
                  Estimated Valuation
                </h3>
                {status === 'loading' && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-mono text-[9px] uppercase h-5 rounded animate-pulse">
                    Computing
                  </Badge>
                )}
              </div>

              <AnimatePresence mode="popLayout">
                {status === 'error' && (
                  <motion.div 
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 text-red-400 bg-red-500/10 p-4 rounded-lg border border-red-500/20"
                  >
                    <AlertTriangle size={18} />
                    <span className="text-sm">{error}</span>
                  </motion.div>
                )}

                {status !== 'error' && result && (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col sm:flex-row sm:items-end justify-between gap-6"
                  >
                    <div>
                      <div className="flex items-baseline gap-1 text-white">
                        <span className="text-3xl text-zinc-600 font-light tabular-nums">₹</span>
                        <h2 className="text-5xl lg:text-6xl font-bold tracking-tighter tabular-nums">
                          <NumberTicker value={result.estimated_price} />
                        </h2>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 items-start sm:items-end">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] uppercase font-mono tracking-widest font-semibold cursor-help transition-colors
                            ${result.prediction_quality?.level === 'low' 
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'}`
                          }>
                            {result.prediction_quality?.level === 'low' ? <AlertTriangle size={12} /> : <Target size={12} />}
                            {result.prediction_quality?.level === 'low' ? 'Low Confidence' : 'High Confidence'}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-800 border-white/10 text-zinc-200">
                          <p className="text-xs">Based on training data density for these specific inputs.</p>
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-[10px] text-zinc-500 font-mono">ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Two-Column Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Input Factors */}
              <div className="shadow-border bg-[#121214] rounded-xl p-5 flex flex-col">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-4 border-b border-white/5 pb-2">
                  Input Factors
                </h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 flex-1">
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">Brand</p>
                    <p className="text-xs font-medium text-zinc-200">{formData.brand}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">Engine</p>
                    <p className="text-xs font-medium text-zinc-200 font-mono">{formData.power} cc</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">Age</p>
                    <p className="text-xs font-medium text-zinc-200 font-mono">{formData.age} Years</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">Odometer</p>
                    <p className="text-xs font-medium text-zinc-200 font-mono">{formData.kms_driven.toLocaleString()} km</p>
                  </div>
                </div>
              </div>

              {/* Model Information */}
              <div className="shadow-border bg-[#121214] rounded-xl p-5 flex flex-col">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-4 border-b border-white/5 pb-2">
                  Model Diagnostics
                </h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 flex-1">
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1 flex items-center gap-1">
                      <Clock size={10} /> Latency
                    </p>
                    <p className="text-xs font-medium text-emerald-400 font-mono">{latency}ms</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1 flex items-center gap-1">
                      <Database size={10} /> Training Data
                    </p>
                    <p className="text-xs font-medium text-zinc-200 font-mono">32,410 Samples</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">Engine</p>
                    <p className="text-xs font-medium text-zinc-200">XGBoost Ensemble</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">Last Updated</p>
                    <p className="text-xs font-medium text-zinc-200 font-mono">2026-07-18</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Data Adjustments Accordion */}
            {result && result.adjustments && result.adjustments.length > 0 && (
              <div className="shadow-border bg-[#121214] rounded-xl overflow-hidden">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="adjustments" className="border-none">
                    <AccordionTrigger className="text-[11px] uppercase tracking-widest font-semibold text-zinc-500 hover:text-white hover:bg-white/5 px-5 py-4 transition-colors">
                      <div className="flex items-center gap-2">
                        <ListFilter size={14} className="text-amber-500" />
                        Out-of-Distribution Adjustments Applied
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-5 pt-1">
                      <div className="bg-[#0a0a0c] rounded-lg overflow-hidden border border-white/5 shadow-inner">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-[#1c1c1f] text-[9px] uppercase text-zinc-500 tracking-wider border-b border-white/5">
                            <tr>
                              <th className="px-4 py-2 font-medium">Feature</th>
                              <th className="px-4 py-2 font-medium">Original Input</th>
                              <th className="px-4 py-2 font-medium">Clamped To</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {result.adjustments.map((adj, idx) => (
                              <tr key={idx} className="font-mono hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-2 text-zinc-300 capitalize">{adj.feature.replace('_', ' ')}</td>
                                <td className="px-4 py-2 text-red-400 line-through opacity-70">{adj.original}</td>
                                <td className="px-4 py-2 text-emerald-400 font-semibold">{adj.adjusted}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-3 flex items-center gap-1">
                        <Info size={12} /> Values were clamped to the 99th percentile of the training distribution to ensure model stability.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
            
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}

export default App
