import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, AlertTriangle, Info, Bike, Settings2, 
  DatabaseZap, ShieldAlert, Sparkles, Activity
} from 'lucide-react'
import { NumberTicker } from "@/components/ui/NumberTicker"
import { MagicCard } from "@/components/ui/magic-card"
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
    }, 800) // 800ms debounce
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="animate-pulse text-blue-500" size={32} />
          <p className="text-xs tracking-widest uppercase text-zinc-500 font-medium">Booting Model...</p>
        </div>
      </div>
    )
  }

  const ownerOptions = Object.entries(contract.ui.owner_rank_labels).map(([val, label]) => {
    const value = parseInt(val, 10);
    return { value, label: value === 1 ? '1st' : value === 2 ? '2nd' : value === 3 ? '3rd' : '4+' };
  });

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#0a0a0c] noise-bg text-zinc-100 overflow-x-hidden selection:bg-blue-500/30">
        
        {/* Navigation / Top Bar */}
        <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Bike size={16} className="text-white" />
              </div>
              <span className="font-semibold tracking-tight text-white">MotoValue AI</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-mono text-[10px] uppercase tracking-wider hidden sm:flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                XGBoost Live
              </Badge>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-16 pb-12 relative">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0a0c] to-[#0a0a0c]" />
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-white">
              Predict market value with <span className="gradient-text">precision</span>.
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Configure your motorcycle parameters to instantly generate a real-time valuation utilizing our ensemble machine learning model.
            </p>
          </motion.div>
        </section>

        {/* Dashboard Split Layout */}
        <main className="max-w-7xl mx-auto px-6 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Pane: Configuration Engine */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="shadow-border bg-[#121214] rounded-2xl p-6 lg:p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 to-transparent" />
              
              <div className="flex items-center gap-2 mb-8">
                <Settings2 size={18} className="text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Configuration</h2>
              </div>

              <form onSubmit={handleExplicitSubmit} className="space-y-8">
                
                {/* Brand */}
                <div className="space-y-3">
                  <label className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 flex justify-between">
                    Manufacturer
                  </label>
                  <Select value={formData.brand} onValueChange={(v) => handleChange('brand', v)}>
                    <SelectTrigger className="w-full h-11 bg-[#1c1c1f] border-white/10 text-white rounded-lg focus:ring-1 focus:ring-blue-500">
                      <SelectValue placeholder="Select a brand" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1c1c1f] border-white/10 text-zinc-100">
                      {BRANDS.map(b => (
                        <SelectItem key={b} value={b} className="focus:bg-blue-500/20 focus:text-white cursor-pointer rounded-md">
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="bg-white/5" />

                {/* Engine Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                      Engine Displacement
                    </label>
                    <span className="font-mono text-sm text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {formData.power}cc
                    </span>
                  </div>
                  <div className="pt-1">
                    <Slider 
                      value={[formData.power]} 
                      min={contract.schema.properties.power.minimum} 
                      max={contract.schema.properties.power.maximum} 
                      step={25}
                      onValueChange={([v]) => handleChange('power', v)}
                    />
                  </div>
                </div>

                {/* Age Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                      Vehicle Age
                    </label>
                    <span className="font-mono text-sm text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {formData.age} yrs
                    </span>
                  </div>
                  <div className="pt-1">
                    <Slider 
                      value={[formData.age]} 
                      min={contract.schema.properties.age.minimum} 
                      max={contract.schema.properties.age.maximum} 
                      step={1}
                      onValueChange={([v]) => handleChange('age', v)}
                    />
                  </div>
                </div>

                {/* Odometer Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                      Odometer
                    </label>
                    <span className="font-mono text-sm text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {formData.kms_driven.toLocaleString()} km
                    </span>
                  </div>
                  <div className="pt-1">
                    <Slider 
                      value={[formData.kms_driven]} 
                      min={contract.schema.properties.kms_driven.minimum} 
                      max={contract.schema.properties.kms_driven.maximum} 
                      step={1000}
                      onValueChange={([v]) => handleChange('kms_driven', v)}
                    />
                  </div>
                </div>

                <Separator className="bg-white/5" />

                {/* Owners Segmented Control */}
                <div className="space-y-3">
                  <label className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                    Previous Owners
                  </label>
                  <div className="flex gap-1 p-1 bg-[#1c1c1f] rounded-lg shadow-inner border border-white/5">
                    {ownerOptions.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleChange('owner_rank', opt.value)}
                        className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer
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
                
                <Button 
                  type="submit" 
                  className="w-full bg-white text-black hover:bg-zinc-200 h-10 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98] transition-all"
                >
                  <Sparkles size={16} className="mr-2" />
                  Lock Valuation
                </Button>

              </form>
            </div>
          </div>

          {/* Right Pane: Intelligence Dashboard */}
          <div className="lg:col-span-7 h-full flex flex-col">
            <AuroraBackground showRadialGradient={true} className="rounded-2xl shadow-border overflow-hidden h-full min-h-[500px]">
              <div className="w-full h-full p-6 lg:p-10 flex flex-col relative z-10">
                
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <DatabaseZap size={18} className="text-indigo-400" />
                    <h2 className="text-lg font-semibold text-white">Intelligence Dashboard</h2>
                  </div>
                  {status === 'loading' && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-mono text-[10px] uppercase">
                      Computing...
                    </Badge>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {status === 'error' && (
                    <motion.div 
                      key="error"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col items-center justify-center text-center"
                    >
                      <AlertTriangle size={32} className="text-red-500 mb-4" />
                      <p className="text-red-400 font-medium mb-1">Inference Error</p>
                      <p className="text-sm text-zinc-500">{error}</p>
                    </motion.div>
                  )}

                  {status === 'success' && result && (
                    <motion.div 
                      key="success"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1 flex flex-col"
                    >
                      {/* Price Reveal Card */}
                      <MagicCard className="w-full p-1 mb-8" gradientColor="rgba(99, 102, 241, 0.2)">
                        <div className="bg-[#0a0a0c]/90 rounded-[14px] p-8 backdrop-blur-xl border border-white/5 flex flex-col items-center justify-center text-center">
                          <p className="text-[11px] text-zinc-500 mb-3 uppercase tracking-[0.2em] font-semibold">Estimated Market Value</p>
                          <h3 className="text-6xl md:text-7xl flex items-center font-bold tracking-tighter text-white">
                            <span className="text-4xl mr-2 text-zinc-600 font-light">₹</span>
                            <NumberTicker value={result.estimated_price} />
                          </h3>
                        </div>
                      </MagicCard>

                      {/* Analytics Section */}
                      <div className="bg-[#121214]/80 backdrop-blur-md rounded-xl shadow-border-inner border border-white/5 p-6 mt-auto">
                        <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">Diagnostics</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-zinc-400 font-medium">Confidence Level</span>
                              <Tooltip>
                                <TooltipTrigger><Info size={12} className="text-zinc-600" /></TooltipTrigger>
                                <TooltipContent>Model's certainty based on training data density.</TooltipContent>
                              </Tooltip>
                            </div>
                            {result.prediction_quality?.level === 'low' ? (
                              <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">
                                Low Confidence
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20">
                                High Confidence
                              </Badge>
                            )}
                          </div>
                          <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-zinc-400 font-medium">Data Integrity</span>
                            </div>
                            <span className="text-sm font-mono text-zinc-200">
                              {result.adjustments?.length > 0 ? `${result.adjustments.length} Adjustments` : 'Pristine Input'}
                            </span>
                          </div>
                        </div>

                        {/* Adjustments Accordion */}
                        {result.adjustments && result.adjustments.length > 0 && (
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="adjustments" className="border-white/5">
                              <AccordionTrigger className="text-sm text-zinc-300 hover:text-white py-3">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle size={14} className="text-amber-500" />
                                  View OOD Adjustments
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="bg-black/40 rounded-lg overflow-hidden border border-white/5">
                                  <table className="w-full text-sm text-left">
                                    <thead className="bg-white/5 text-[10px] uppercase text-zinc-500 tracking-wider">
                                      <tr>
                                        <th className="px-4 py-2 font-medium">Feature</th>
                                        <th className="px-4 py-2 font-medium">Original</th>
                                        <th className="px-4 py-2 font-medium">Clamped</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                      {result.adjustments.map((adj, idx) => (
                                        <tr key={idx} className="font-mono text-xs">
                                          <td className="px-4 py-2 text-zinc-300 capitalize">{adj.feature.replace('_', ' ')}</td>
                                          <td className="px-4 py-2 text-red-400 line-through opacity-70">{adj.original}</td>
                                          <td className="px-4 py-2 text-emerald-400">{adj.adjusted}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </AuroraBackground>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}

export default App
