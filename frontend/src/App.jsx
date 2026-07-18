import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings2, Activity, Clock, Database, GitCommit, Target, 
  ChevronRight, RefreshCcw, Sparkles
} from 'lucide-react'
import { NumberTicker } from "@/components/ui/NumberTicker"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const BRANDS = [
  "Bajaj", "Benelli", "Ducati", "Harley-Davidson", "Hero", "Honda",
  "Jawa", "Kawasaki", "KTM", "Mahindra", "Royal Enfield",
  "Suzuki", "Triumph", "TVS", "Yamaha"
]

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
const REQUEST_TIMEOUT_MS = 10000

function App() {
  const [formData, setFormData] = useState({
    brand: 'Royal Enfield',
    power: 350,
    kms_driven: 15000,
    age: 3,
    owner_rank: 1
  })

  const [contract, setContract] = useState(null)
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [result, setResult] = useState(null)
  const [latency, setLatency] = useState(0)
  
  // UI State
  const [mode, setMode] = useState('input') // 'input' or 'result'
  const debounceTimer = useRef(null)

  useEffect(() => {
    fetch(`${API_BASE_URL}/contract`)
      .then(res => res.json())
      .then(data => setContract(data))
      .catch(() => {})
  }, [])

  const fetchPrediction = async (dataToPredict) => {
    setStatus('loading')
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
      const data = await res.json()
      if (res.ok) {
        setLatency(Math.round(performance.now() - startTime))
        setResult(data)
        setStatus('success')
        setMode('result')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    } finally {
      clearTimeout(timeoutId)
    }
  }

  // Live Debounced Preview ONLY when in result mode
  useEffect(() => {
    if (mode === 'result') {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => {
        fetchPrediction(formData)
      }, 600)
    }
    return () => clearTimeout(debounceTimer.current)
  }, [formData, mode])

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: name === 'brand' ? value : Number(value)
    }))
  }

  const handleCalculate = () => {
    fetchPrediction(formData)
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="animate-pulse text-white/20" size={24} />
      </div>
    )
  }

  const ownerOptions = Object.entries(contract.ui.owner_rank_labels).map(([val, label]) => {
    const value = parseInt(val, 10);
    return { value, label: value === 1 ? '1st' : value === 2 ? '2nd' : value === 3 ? '3rd' : '4+' };
  });

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-black text-white overflow-hidden relative selection:bg-white/30 font-sans flex flex-col items-center">
        
        {/* Cinematic Spotlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] pointer-events-none opacity-50 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[rgba(255,255,255,0.15)] via-transparent to-transparent blur-3xl animate-spotlight" />
        </div>

        {/* Dynamic Content Area */}
        <div className="relative z-10 w-full max-w-5xl flex-1 flex flex-col justify-center items-center px-4 min-h-[70vh]">
          <AnimatePresence mode="wait">
            
            {/* STATE 1: INITIAL HERO */}
            {mode === 'input' && (
              <motion.div 
                key="hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40, scale: 0.95 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-center mb-16"
              >
                <Badge variant="outline" className="bg-white/5 text-white/60 border-white/10 mb-6 font-mono text-[10px] tracking-[0.2em] uppercase rounded-full px-4 py-1">
                  Model v1.2.0 • XGBoost Active
                </Badge>
                <h1 className="text-6xl sm:text-7xl md:text-8xl font-medium tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 leading-tight">
                  Predict value<br/>with precision.
                </h1>
              </motion.div>
            )}

            {/* STATE 2: MASSIVE VALUATION REVEAL */}
            {mode === 'result' && result && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full flex flex-col items-center justify-center pt-10"
              >
                {/* The HUD */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none">
                  {/* Latency Badge */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                    className="absolute top-10 left-0 pointer-events-auto"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 cursor-help">
                          <Clock size={12} className="text-white/40" />
                          <span className="font-mono text-[10px] text-white/70">{latency}ms</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-white/10 backdrop-blur-xl border-white/10 text-white">Inference Latency</TooltipContent>
                    </Tooltip>
                  </motion.div>

                  {/* Confidence Badge */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                    className="absolute top-10 right-0 pointer-events-auto"
                  >
                    <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-2">
                      <Target size={12} className={result.prediction_quality?.level === 'low' ? 'text-amber-400' : 'text-white/80'} />
                      <span className="font-mono text-[10px] text-white/70 uppercase tracking-widest">
                        {result.prediction_quality?.level === 'low' ? 'Low Confidence' : 'High Confidence'}
                      </span>
                    </div>
                  </motion.div>
                </div>

                {/* The Star: Massive Price */}
                <div className="relative text-center z-10 flex flex-col items-center">
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-semibold mb-6 flex items-center gap-2"
                  >
                    <Sparkles size={12} className="text-white/40" /> Estimated Market Value
                  </motion.div>
                  
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl md:text-6xl text-white/20 font-light font-mono tabular-nums">₹</span>
                    <h2 className="text-8xl md:text-[140px] font-medium tracking-tighter text-white tabular-nums leading-none">
                      <NumberTicker value={result.estimated_price} />
                    </h2>
                  </div>

                  {/* OOD Adjustments Alert */}
                  <AnimatePresence>
                    {result.adjustments?.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mt-8 glass-panel px-4 py-2 rounded-full flex items-center gap-3 text-xs text-amber-200/70 border-amber-500/20"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span>{result.adjustments.length} features adjusted to training distribution.</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* The Glass Dock (Configuration Engine) */}
        <motion.div 
          layout
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className={`relative z-20 w-full max-w-4xl px-4 transition-all duration-700 ${mode === 'result' ? 'pb-8' : 'pb-20'}`}
        >
          <div className={`glass-panel rounded-3xl p-2 transition-all duration-700 ${mode === 'result' ? 'glass-panel-active' : ''}`}>
            <div className="flex flex-col md:flex-row items-center gap-2">
              
              {/* Brand Selector */}
              <div className="w-full md:w-[220px] bg-white/[0.03] hover:bg-white/[0.06] transition-colors rounded-2xl p-3 border border-white/[0.05]">
                <label className="text-[9px] uppercase tracking-widest text-white/40 ml-1 mb-1 block">Brand</label>
                <Select value={formData.brand} onValueChange={(v) => handleChange('brand', v)}>
                  <SelectTrigger className="w-full h-8 bg-transparent border-none text-white focus:ring-0 px-1 font-medium shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-white/10 text-white rounded-xl">
                    {BRANDS.map(b => (
                      <SelectItem key={b} value={b} className="focus:bg-white/10 rounded-lg">{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Minimal Sliders Container */}
              <div className="flex-1 w-full grid grid-cols-4 gap-2">
                
                {/* Engine */}
                <div className="bg-white/[0.03] rounded-2xl p-3 px-4 border border-white/[0.05] flex flex-col justify-center group hover:bg-white/[0.06] transition-colors">
                  <div className="flex justify-between items-baseline mb-3">
                    <label className="text-[9px] uppercase tracking-widest text-white/40">Engine</label>
                    <span className="font-mono text-[10px] text-white/80">{formData.power}cc</span>
                  </div>
                  <Slider 
                    value={[formData.power]} min={contract.schema.properties.power.minimum} max={contract.schema.properties.power.maximum} step={25}
                    onValueChange={([v]) => handleChange('power', v)}
                    className="cursor-pointer [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-none [&_[role=slider]]:bg-white [&_[role=slider]]:shadow-[0_0_10px_rgba(255,255,255,0.5)] [&_.bg-primary]:bg-white/20 [&_.bg-secondary]:bg-white/5"
                  />
                </div>

                {/* Age */}
                <div className="bg-white/[0.03] rounded-2xl p-3 px-4 border border-white/[0.05] flex flex-col justify-center group hover:bg-white/[0.06] transition-colors">
                  <div className="flex justify-between items-baseline mb-3">
                    <label className="text-[9px] uppercase tracking-widest text-white/40">Age</label>
                    <span className="font-mono text-[10px] text-white/80">{formData.age}y</span>
                  </div>
                  <Slider 
                    value={[formData.age]} min={contract.schema.properties.age.minimum} max={contract.schema.properties.age.maximum} step={1}
                    onValueChange={([v]) => handleChange('age', v)}
                    className="cursor-pointer [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-none [&_[role=slider]]:bg-white [&_[role=slider]]:shadow-[0_0_10px_rgba(255,255,255,0.5)] [&_.bg-primary]:bg-white/20 [&_.bg-secondary]:bg-white/5"
                  />
                </div>

                {/* Odo */}
                <div className="bg-white/[0.03] rounded-2xl p-3 px-4 border border-white/[0.05] flex flex-col justify-center group hover:bg-white/[0.06] transition-colors">
                  <div className="flex justify-between items-baseline mb-3">
                    <label className="text-[9px] uppercase tracking-widest text-white/40">Odo</label>
                    <span className="font-mono text-[10px] text-white/80">{formData.kms_driven.toLocaleString()}</span>
                  </div>
                  <Slider 
                    value={[formData.kms_driven]} min={contract.schema.properties.kms_driven.minimum} max={contract.schema.properties.kms_driven.maximum} step={1000}
                    onValueChange={([v]) => handleChange('kms_driven', v)}
                    className="cursor-pointer [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-none [&_[role=slider]]:bg-white [&_[role=slider]]:shadow-[0_0_10px_rgba(255,255,255,0.5)] [&_.bg-primary]:bg-white/20 [&_.bg-secondary]:bg-white/5"
                  />
                </div>
                
                {/* Owners */}
                <div className="bg-white/[0.03] rounded-2xl p-3 border border-white/[0.05] flex flex-col justify-center group hover:bg-white/[0.06] transition-colors">
                  <label className="text-[9px] uppercase tracking-widest text-white/40 mb-2 ml-1">Owners</label>
                  <div className="flex gap-1 w-full h-[32px]">
                    {ownerOptions.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleChange('owner_rank', opt.value)}
                        className={`flex-1 rounded-lg text-[10px] font-medium transition-all duration-150 cursor-pointer flex items-center justify-center
                          ${formData.owner_rank === opt.value
                            ? 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                            : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Submit Button */}
              {mode === 'input' ? (
                <button 
                  onClick={handleCalculate}
                  className="w-full md:w-[140px] h-[68px] bg-white text-black rounded-2xl flex items-center justify-center gap-2 font-medium hover:scale-[0.98] transition-transform shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]"
                >
                  <Sparkles size={16} /> Predict
                </button>
              ) : (
                <button 
                  onClick={() => setMode('input')}
                  className="w-full md:w-[68px] h-[68px] bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl flex items-center justify-center transition-colors"
                >
                  <RefreshCcw size={16} className="text-white/60" />
                </button>
              )}

            </div>
          </div>
        </motion.div>

      </div>
    </TooltipProvider>
  )
}

export default App
