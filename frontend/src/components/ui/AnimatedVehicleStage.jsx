import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Award, 
  Gauge, 
  Flame, 
  Sun, 
  Moon, 
  CloudRain, 
  Volume2, 
  VolumeX, 
  Fuel,
  Shield,
  Wrench,
  TrendingDown,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react'

// Web Audio API engine sound generator
class EngineAudio {
  constructor() {
    this.ctx = null
    this.osc1 = null
    this.osc2 = null
    this.gainNode = null
    this.filterNode = null
    this.isMuted = false
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
  }

  start(rpm = 2500) {
    if (this.isMuted) return
    this.init()
    if (!this.ctx) return

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    if (this.osc1) return

    try {
      this.osc1 = this.ctx.createOscillator()
      this.osc2 = this.ctx.createOscillator()
      this.gainNode = this.ctx.createGain()
      this.filterNode = this.ctx.createBiquadFilter()

      this.osc1.type = 'sawtooth'
      this.osc2.type = 'triangle'

      const freq = Math.max(28, (rpm / 60) * 1.4)
      this.osc1.frequency.setValueAtTime(freq, this.ctx.currentTime)
      this.osc2.frequency.setValueAtTime(freq * 0.5, this.ctx.currentTime)

      this.filterNode.type = 'lowpass'
      this.filterNode.frequency.setValueAtTime(420, this.ctx.currentTime)

      this.gainNode.gain.setValueAtTime(0.001, this.ctx.currentTime)
      this.gainNode.gain.exponentialRampToValueAtTime(0.035, this.ctx.currentTime + 0.1)

      this.osc1.connect(this.filterNode)
      this.osc2.connect(this.filterNode)
      this.filterNode.connect(this.gainNode)
      this.gainNode.connect(this.ctx.destination)

      this.osc1.start()
      this.osc2.start()
    } catch (e) {}
  }

  setRPM(rpm) {
    if (!this.ctx || !this.osc1) return
    try {
      const freq = Math.max(28, (rpm / 60) * 1.4)
      this.osc1.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05)
      this.osc2.frequency.setTargetAtTime(freq * 0.5, this.ctx.currentTime, 0.05)
    } catch (e) {}
  }

  stop() {
    if (this.gainNode && this.ctx) {
      try {
        this.gainNode.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.04)
      } catch (e) {}
    }
    const o1 = this.osc1
    const o2 = this.osc2
    this.osc1 = null
    this.osc2 = null
    setTimeout(() => {
      if (o1) {
        try {
          o1.stop()
          o1.disconnect()
        } catch (e) {}
      }
      if (o2) {
        try {
          o2.stop()
          o2.disconnect()
        } catch (e) {}
      }
    }, 50)
  }
}

const engineAudio = new EngineAudio()

// Brand color palette mapper
const getBrandColor = (brand, vType) => {
  const b = (brand || '').toLowerCase()
  if (b.includes('ktm')) return '#f97316'
  if (b.includes('enfield')) return '#eab308'
  if (b.includes('yamaha')) return '#3b82f6'
  if (b.includes('hero')) return '#10b981'
  if (b.includes('bajaj')) return '#a855f7'
  if (b.includes('harley')) return '#ea580c'
  if (b.includes('hyundai')) return '#38bdf8'
  if (b.includes('maruti')) return '#60a5fa'
  if (b.includes('tata')) return '#34d399'
  if (b.includes('mahindra')) return '#fbbf24'
  if (b.includes('toyota')) return '#f43f5e'
  if (b.includes('bmw') || b.includes('audi') || b.includes('mercedes')) return '#c084fc'
  return vType === 'bike' ? '#818cf8' : '#38bdf8'
}

// Year Strategy Advisor Helper
const getYearInsight = (year, optYear) => {
  if (year === 0) return { tag: 'Brand New', tip: 'Initial acquisition baseline with maximum market retention.' }
  if (year === optYear) return { tag: '🔥 Peak Liquidation Window', tip: 'Optimal inflection point to trade-in before steep compounding service & depreciation costs.' }
  if (year < optYear) return { tag: 'Prime Value Phase', tip: 'Enjoyable ownership phase with high retention rate.' }
  if (year <= optYear + 2) return { tag: 'High-Utility Plateau', tip: 'Moderate maintenance compounding; still viable for long-term hold.' }
  return { tag: 'Elevated Maintenance Exposure', tip: 'Residual resale value plateaus while scheduled maintenance risk increases.' }
}

export function AnimatedVehicleStage({
  vehicleType = 'bike',
  brand = 'Royal Enfield',
  timeline = [],
  activeYear = 0,
  onYearSelect,
  optimalYear = 3,
  annualKms = 10000
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [environment, setEnvironment] = useState('midnight')
  const [bodyStyle, setBodyStyle] = useState(vehicleType === 'bike' ? 'cruiser' : 'suv')

  // Auto-sync bodyStyle when vehicleType toggles
  useEffect(() => {
    setBodyStyle(vehicleType === 'bike' ? 'cruiser' : 'suv')
  }, [vehicleType])

  const safeTimeline = (timeline && timeline.length > 0 ? timeline : [
    { year: 0, retention_rate: 100, estimated_price: 100000 },
    { year: 1, retention_rate: 85, estimated_price: 85000 },
    { year: 2, retention_rate: 74, estimated_price: 74000 },
    { year: 3, retention_rate: 64, estimated_price: 64000 },
    { year: 4, retention_rate: 55, estimated_price: 55000 },
    { year: 5, retention_rate: 48, estimated_price: 48000 }
  ]).map((pt, idx) => ({
    ...pt,
    year: pt.year ?? pt.calendar_year ?? pt.year_offset ?? idx,
    retention_rate: pt.retention_rate ?? pt.retention_pct ?? 100,
    estimated_price: pt.estimated_price ?? pt.resale_value ?? 0,
  }))

  const brandColor = getBrandColor(brand, vehicleType)
  const maxYear = safeTimeline.length > 0 ? safeTimeline[safeTimeline.length - 1].year : 5
  const currentPoint = safeTimeline.find((p) => p.year === activeYear) || safeTimeline[0] || {}
  const isOptimal = activeYear === optimalYear
  const yearInsight = getYearInsight(activeYear, optimalYear)

  // Simulated live speed and RPM values (integer rounded, no decimal overflow)
  const simulatedSpeed = isPlaying ? Math.round(Math.min(115, 45 + activeYear * 9.5)) : 0
  const simulatedRPM = isPlaying ? Math.round(Math.min(7200, 2400 + (activeYear % 3) * 1400 + Math.sin(activeYear) * 350)) : 900
  const currentGear = isPlaying ? Math.min(6, Math.max(1, Math.floor(activeYear / 1.6) + 1)) : 'N'

  // Audio lifecycle
  useEffect(() => {
    if (isPlaying && soundEnabled) {
      engineAudio.isMuted = false
      engineAudio.start(simulatedRPM)
    } else {
      engineAudio.stop()
    }
    return () => {
      engineAudio.stop()
    }
  }, [isPlaying, soundEnabled])

  useEffect(() => {
    return () => {
      engineAudio.stop()
    }
  }, [])

  useEffect(() => {
    if (isPlaying && soundEnabled) {
      engineAudio.setRPM(simulatedRPM)
    }
  }, [simulatedRPM, isPlaying, soundEnabled])

  // Playback Loop: Stop smoothly at maxYear
  useEffect(() => {
    let interval = null
    if (isPlaying) {
      const stepMs = Math.max(400, 1200 / playbackSpeed)
      interval = setInterval(() => {
        onYearSelect((prev) => {
          if (prev >= maxYear) {
            setIsPlaying(false)
            return maxYear
          }
          return prev + 1
        })
      }, stepMs)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying, playbackSpeed, maxYear, onYearSelect])

  // Clamp vehicle horizontal position (15% to 75%)
  const vehicleProgressPct = maxYear > 0 ? (activeYear / maxYear) * 60 + 16 : 45

  // Environment styling tokens
  const envConfig = {
    midnight: {
      bg: 'from-[#0e111d] via-[#090b14] to-[#05060a]',
      roadBorder: 'border-cyan-500/30',
      dashColor: 'from-amber-400 via-amber-300 to-amber-400'
    },
    golden: {
      bg: 'from-[#2e1065] via-[#4c1d95] to-[#0f172a]',
      roadBorder: 'border-amber-500/40',
      dashColor: 'from-yellow-300 via-amber-200 to-yellow-300'
    },
    monsoon: {
      bg: 'from-[#0f172a] via-[#1e293b] to-[#020617]',
      roadBorder: 'border-blue-400/40',
      dashColor: 'from-cyan-300 via-teal-200 to-cyan-300'
    }
  }[environment] || {
    bg: 'from-[#0e111d] via-[#090b14] to-[#05060a]',
    roadBorder: 'border-cyan-500/30',
    dashColor: 'from-amber-400 via-amber-300 to-amber-400'
  }

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl bg-gradient-to-b ${envConfig.bg} border border-white/[0.1] shadow-2xl p-5 mb-5 select-none transition-all duration-700`}>
      
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div 
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl opacity-25"
          style={{ background: brandColor }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Monsoon Rain */}
      {environment === 'monsoon' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-[1.5px] bg-gradient-to-b from-transparent via-cyan-300/40 to-transparent"
              style={{
                left: `${(i * 5) % 100}%`,
                top: `-20px`,
                height: `${20 + (i % 5) * 8}px`
              }}
              animate={{
                y: [0, 320],
                x: [0, -35]
              }}
              transition={{
                duration: 0.5 + (i % 4) * 0.1,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          ))}
        </div>
      )}

      {/* Golden Hour Sun */}
      {environment === 'golden' && (
        <div className="absolute top-2 right-12 w-28 h-28 rounded-full bg-gradient-to-br from-amber-300/40 to-orange-500/10 blur-2xl pointer-events-none" />
      )}

      {/* ============================================================ */}
      {/* 🎛️ TOP CONTROL & TELEMETRY RIBBON (Responsive 3-Column Grid) */}
      {/* ============================================================ */}
      <div className="relative z-20 grid grid-cols-1 md:grid-cols-12 items-center gap-3 pb-3 border-b border-white/[0.08] mb-4">
        
        {/* Left (Col 1-5): Brand Badge & Body Type Selector */}
        <div className="md:col-span-5 flex items-center gap-3">
          <div 
            className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg border border-white/20 shrink-0"
            style={{ background: `linear-gradient(135deg, ${brandColor}, #312e81)` }}
          >
            <Gauge size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white uppercase tracking-wider">{brand} Simulator</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-cyan-300 border border-white/10 font-mono">
                {vehicleType === 'bike' ? '🏍️ Motorcycle' : '🚗 Automotive'}
              </span>
            </div>

            {/* Body Style Chips */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-slate-500">Body:</span>
              {vehicleType === 'bike' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setBodyStyle('cruiser')}
                    className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition-all ${bodyStyle === 'cruiser' ? 'bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-500/40' : 'text-slate-400 hover:text-white'}`}
                  >
                    Cruiser
                  </button>
                  <button
                    type="button"
                    onClick={() => setBodyStyle('sport')}
                    className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition-all ${bodyStyle === 'sport' ? 'bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-500/40' : 'text-slate-400 hover:text-white'}`}
                  >
                    Supersport
                  </button>
                  <button
                    type="button"
                    onClick={() => setBodyStyle('naked')}
                    className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition-all ${bodyStyle === 'naked' ? 'bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-500/40' : 'text-slate-400 hover:text-white'}`}
                  >
                    Naked
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setBodyStyle('sedan')}
                    className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition-all ${bodyStyle === 'sedan' ? 'bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-500/40' : 'text-slate-400 hover:text-white'}`}
                  >
                    Sedan
                  </button>
                  <button
                    type="button"
                    onClick={() => setBodyStyle('suv')}
                    className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition-all ${bodyStyle === 'suv' ? 'bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-500/40' : 'text-slate-400 hover:text-white'}`}
                  >
                    Compact SUV
                  </button>
                  <button
                    type="button"
                    onClick={() => setBodyStyle('offroad')}
                    className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition-all ${bodyStyle === 'offroad' ? 'bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-500/40' : 'text-slate-400 hover:text-white'}`}
                  >
                    Rugged 4x4
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center (Col 6-8): Real-Time Telemetry Cluster */}
        <div className="md:col-span-3 flex items-center justify-center">
          <div className="flex items-center gap-2.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 shadow-inner">
            <div className="text-center">
              <span className="text-[7px] uppercase tracking-wider text-slate-400 block">Speed</span>
              <span className="text-xs font-black text-white font-mono">{simulatedSpeed} <span className="text-[8px] font-normal text-slate-400">km/h</span></span>
            </div>

            <div className="w-[1px] h-4 bg-white/10" />

            <div className="text-center">
              <span className="text-[7px] uppercase tracking-wider text-slate-400 block">Gear</span>
              <span className="text-xs font-black text-cyan-300 font-mono">{currentGear}</span>
            </div>

            <div className="w-[1px] h-4 bg-white/10" />

            <div className="w-14 text-center">
              <div className="flex justify-between text-[7px] font-mono text-slate-400">
                <span>RPM</span>
                <span className={simulatedRPM > 5500 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{simulatedRPM}</span>
              </div>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mt-0.5">
                <div 
                  className={`h-full transition-all duration-100 ${simulatedRPM > 5500 ? 'bg-gradient-to-r from-amber-400 to-rose-500' : 'bg-gradient-to-r from-cyan-400 to-indigo-500'}`}
                  style={{ width: `${Math.min(100, (simulatedRPM / 7500) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right (Col 9-12): Environment, Sound & Playback Controls */}
        <div className="md:col-span-4 flex items-center justify-end gap-2">
          {/* Environment Switcher */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setEnvironment('midnight')}
              title="Cyberpunk Midnight"
              className={`p-1.5 rounded-md cursor-pointer transition-all ${environment === 'midnight' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              <Moon size={12} />
            </button>
            <button
              type="button"
              onClick={() => setEnvironment('golden')}
              title="Golden Hour Twilight"
              className={`p-1.5 rounded-md cursor-pointer transition-all ${environment === 'golden' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              <Sun size={12} />
            </button>
            <button
              type="button"
              onClick={() => setEnvironment('monsoon')}
              title="Monsoon Highway"
              className={`p-1.5 rounded-md cursor-pointer transition-all ${environment === 'monsoon' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              <CloudRain size={12} />
            </button>
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled
                setSoundEnabled(next)
                engineAudio.isMuted = !next
                if (next && isPlaying) {
                  engineAudio.start(simulatedRPM)
                } else {
                  engineAudio.stop()
                }
              }}
              title={soundEnabled ? 'Engine Audio Active' : 'Engine Audio Muted'}
              className={`p-1.5 rounded-md cursor-pointer transition-all ${soundEnabled ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
            </button>
          </div>

          {/* Speed Multiplier */}
          <button
            type="button"
            onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 2 : 1)}
            className="px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-mono font-bold text-slate-300 border border-white/[0.08] cursor-pointer"
          >
            {playbackSpeed}x
          </button>

          {/* Play / Pause Action */}
          <button
            type="button"
            onClick={() => {
              if (activeYear >= maxYear && !isPlaying) {
                onYearSelect(0)
              }
              setIsPlaying(!isPlaying)
            }}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:opacity-90 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/25 cursor-pointer transition-all"
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            <span>{isPlaying ? 'Pause' : 'Play Drive'}</span>
          </button>

          {/* Reset Action */}
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false)
              onYearSelect(0)
            }}
            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] cursor-pointer transition-all"
            title="Reset Simulation"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 🛣️ MAIN HIGHWAY STAGE                                        */}
      {/* ============================================================ */}
      <div className="relative w-full h-44 rounded-xl bg-[#090b12] border border-white/[0.06] overflow-hidden flex flex-col justify-end">
        
        {/* Speed Wind Streaks */}
        <div className="absolute top-2 left-0 right-0 h-16 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-[1px] bg-gradient-to-l from-transparent via-cyan-400/35 to-transparent"
              style={{
                top: `${i * 9 + 4}px`,
                width: `${70 + i * 25}px`,
                right: `${(i * 60) % 350}px`
              }}
              animate={{
                x: [0, -500],
                opacity: [0, 0.8, 0]
              }}
              transition={{
                duration: (1.2 + (i % 3) * 0.3) / playbackSpeed,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          ))}
        </div>

        {/* Milestone Roadside Signposts (With Retention Value Tags) */}
        <div className="absolute top-2 inset-x-0 flex justify-between px-6 pointer-events-none z-10">
          {safeTimeline.map((pt, idx) => {
            const isTarget = pt.year === activeYear
            const isOpt = pt.year === optimalYear
            return (
              <div 
                key={pt.year ?? idx}
                className={`flex flex-col items-center transition-all duration-300 ${
                  isTarget ? 'scale-110 opacity-100' : 'opacity-40'
                }`}
              >
                <span className="text-[8px] font-mono text-slate-400 mb-0.5">
                  {pt.retention_rate}%
                </span>
                <div 
                  className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border ${
                    isOpt
                      ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 shadow-lg shadow-amber-500/20'
                      : isTarget
                      ? 'bg-cyan-500/25 text-cyan-200 border-cyan-500/60'
                      : 'bg-white/[0.04] text-slate-400 border-white/[0.08]'
                  }`}
                >
                  {isOpt ? '🏆 YR ' + pt.year : 'YR ' + pt.year}
                </div>
                <div className="w-[1px] h-2 bg-white/10 mt-0.5" />
              </div>
            )
          })}
        </div>

        {/* 🏆 Optimal Sell Horizon Celebratory Banner */}
        <AnimatePresence>
          {isOptimal && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="absolute top-10 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-amber-500/30 border border-amber-400/70 shadow-xl shadow-amber-500/30 flex items-center gap-1.5 text-amber-200 text-[11px] font-black backdrop-blur-md"
            >
              <Award size={13} className="text-amber-400 animate-bounce" />
              <span>Optimal Liquidation Sweet-Spot Reached! (Year {activeYear})</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🚗 VEHICLE GROUND-ALIGNED STAGE */}
        <div className="relative w-full h-28 sm:h-32 overflow-hidden flex items-end">
          <motion.div
            className="absolute bottom-0 z-20"
            animate={{
              left: `${vehicleProgressPct}%`,
              x: "-50%",
              y: [0, -1.2, 0, 0.8, 0]
            }}
            transition={{
              left: { type: 'spring', stiffness: 90, damping: 22 },
              y: { repeat: Infinity, duration: isPlaying ? 0.6 : 1.2, ease: 'easeInOut' }
            }}
          >
            {/* Vehicle Graphic Container */}
            <div className="relative">
              
              {/* Dynamic Underglow */}
              <div 
                className="absolute bottom-0 left-6 right-6 h-2 rounded-full blur-sm opacity-80 pointer-events-none"
                style={{ background: brandColor }}
              />

              {/* Exhaust Flame */}
              {isPlaying && (
                <div className="absolute bottom-2 -left-3 pointer-events-none">
                  <Flame size={14} className="text-amber-400 animate-exhaust-particle" />
                </div>
              )}

              {/* Monsoon Tire Water Spray */}
              {environment === 'monsoon' && isPlaying && (
                <div className="absolute bottom-0 -left-5 pointer-events-none opacity-60">
                  <div className="w-8 h-2 bg-gradient-to-l from-cyan-300 to-transparent blur-sm transform -rotate-12" />
                </div>
              )}

              {/* VEHICLE RENDERING SELECTION */}
              {vehicleType === 'bike' ? (
                /* 🏍️ ACCURATE MOTORCYCLE VECTOR */
                <div className="relative">
                  {/* High-Intensity Multi-Stage Volumetric Headlamp Beam */}
                  <div 
                    className="absolute bottom-2 left-22 w-64 h-16 pointer-events-none animate-beam z-10 opacity-95"
                    style={{
                      background: 'linear-gradient(90deg, rgba(255,255,255,0.85) 0%, rgba(56,189,248,0.45) 20%, rgba(6,182,212,0.18) 55%, transparent 100%)',
                      clipPath: 'polygon(0% 45%, 100% 0%, 100% 100%, 0% 55%)'
                    }}
                  />
                  {/* Ambient Ground Road Wash Beam */}
                  <div 
                    className="absolute -bottom-1 left-24 w-56 h-6 pointer-events-none blur-md opacity-70"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(56,189,248,0.45) 0%, rgba(34,211,238,0.15) 60%, transparent 100%)'
                    }}
                  />

                  <svg width="140" height="65" viewBox="0 0 140 65" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Chassis Frame & Engine */}
                    <path d="M34 50 L58 35 L82 35 L104 50" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
                    <path d="M58 35 L68 48 L48 48 Z" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                    
                    {/* Engine Details */}
                    <rect x="54" y="40" width="14" height="8" rx="2" fill="#475569" />
                    <line x1="56" y1="42" x2="66" y2="42" stroke="#94a3b8" strokeWidth="1" />
                    <line x1="56" y1="45" x2="66" y2="45" stroke="#94a3b8" strokeWidth="1" />

                    {/* Tank & Fairing by Style */}
                    {bodyStyle === 'sport' ? (
                      <path 
                        d="M48 35 C54 25, 78 23, 92 33 L86 43 L52 41 Z" 
                        fill={brandColor} 
                        stroke="#ffffff" 
                        strokeWidth="0.8" 
                      />
                    ) : bodyStyle === 'naked' ? (
                      <path 
                        d="M52 35 C56 29, 74 27, 82 33 L76 37 L54 37 Z" 
                        fill={brandColor} 
                        stroke="#ffffff" 
                        strokeWidth="0.8" 
                      />
                    ) : (
                      <path 
                        d="M52 34 C54 27, 72 26, 82 33 L74 37 L54 37 Z" 
                        fill={brandColor} 
                        stroke="#ffffff" 
                        strokeWidth="0.8" 
                      />
                    )}

                    {/* Seat & Tail */}
                    <path d="M42 34 C46 34, 52 35, 56 37 L44 40 Z" fill="#0f172a" />
                    <rect x="40" y="32" width="18" height="4" rx="2" fill="#020617" />

                    {/* Handlebars & Mirror */}
                    <path d="M80 34 L86 24 L93 25" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="93" cy="25" r="2" fill="#38bdf8" />

                    {/* Exhaust Pipe */}
                    <path d="M60 48 C70 50, 44 52, 28 53" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                    <path d="M28 53 L22 53" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" />

                    {/* Rider Silhouette */}
                    <g opacity="0.95">
                      <circle cx="72" cy="16" r="7" fill="#0f172a" stroke={brandColor} strokeWidth="1.5" />
                      <path d="M75 15 Q79 16 78 18" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                      <path d="M69 23 L58 34 L76 34 Z" fill="#1e293b" />
                      <path d="M66 26 L84 28" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
                    </g>

                    {/* Rear Wheel (Pivot cx=34, cy=50) */}
                    <g transform="translate(34, 50)">
                      <circle cx="0" cy="0" r="13" stroke="#0f172a" strokeWidth="4.5" fill="#020617" />
                      <g className={isPlaying ? "animate-wheel-spin" : ""}>
                        <circle cx="0" cy="0" r="9" stroke={brandColor} strokeWidth="1.2" strokeDasharray="4 3" fill="none" />
                        <line x1="-7" y1="0" x2="7" y2="0" stroke="#cbd5e1" strokeWidth="1.2" />
                        <line x1="0" y1="-7" x2="0" y2="7" stroke="#cbd5e1" strokeWidth="1.2" />
                        <circle cx="0" cy="0" r="3.5" fill="#64748b" />
                      </g>
                    </g>

                    {/* Front Wheel (Pivot cx=104, cy=50) */}
                    <g transform="translate(104, 50)">
                      <circle cx="0" cy="0" r="13" stroke="#0f172a" strokeWidth="4.5" fill="#020617" />
                      <g className={isPlaying ? "animate-wheel-spin" : ""}>
                        <circle cx="0" cy="0" r="9" stroke={brandColor} strokeWidth="1.2" strokeDasharray="4 3" fill="none" />
                        <line x1="-7" y1="0" x2="7" y2="0" stroke="#cbd5e1" strokeWidth="1.2" />
                        <line x1="0" y1="-7" x2="0" y2="7" stroke="#cbd5e1" strokeWidth="1.2" />
                        <circle cx="0" cy="0" r="3.5" fill="#64748b" />
                      </g>
                    </g>

                    {/* 💡 Prominent LED Projector Headlamp Assembly (Round Modern-Retro Bezel) */}
                    <g transform="translate(98, 29)">
                      {/* Outer Chrome / Matte Obsidian Bezel Housing */}
                      <circle cx="0" cy="0" r="5.5" fill="#0b0f19" stroke="#cbd5e1" strokeWidth="1.2" />
                      {/* Inner Parabolic Reflector */}
                      <circle cx="0" cy="0" r="4.4" fill="#1e293b" />
                      {/* Luminous DRL (Daytime Running Light) Halo Ring */}
                      <circle cx="0" cy="0" r="3.8" stroke="#38bdf8" strokeWidth="1.2" fill="none" opacity="0.95" />
                      {/* Central High-Intensity Projector Quartz Lens Core */}
                      <circle cx="0.4" cy="0" r="2.4" fill="#ffffff" />
                      {/* Specular Optic Highlight */}
                      <circle cx="1" cy="-0.7" r="0.8" fill="#e0f2fe" />
                    </g>
                  </svg>
                </div>
              ) : (
                /* 🚗 HANDCRAFTED SLEEK CAR VECTOR */
                <div className="relative">
                  {/* High-Intensity Multi-Stage Volumetric Matrix-LED Headlamp Beam */}
                  <div 
                    className="absolute bottom-1 left-34 w-72 h-18 pointer-events-none animate-beam z-10 opacity-95"
                    style={{
                      background: 'linear-gradient(90deg, rgba(255,255,255,0.85) 0%, rgba(56,189,248,0.45) 25%, rgba(6,182,212,0.18) 60%, transparent 100%)',
                      clipPath: 'polygon(0% 45%, 100% 0%, 100% 100%, 0% 55%)'
                    }}
                  />
                  {/* Ambient Ground Road Wash Beam */}
                  <div 
                    className="absolute -bottom-1 left-36 w-64 h-7 pointer-events-none blur-md opacity-70"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(56,189,248,0.5) 0%, rgba(34,211,238,0.18) 60%, transparent 100%)'
                    }}
                  />

                  <svg width="160" height="60" viewBox="0 0 160 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="bodyPaintGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                        <stop offset="35%" stopColor={brandColor} stopOpacity="1" />
                        <stop offset="100%" stopColor="#090d16" stopOpacity="1" />
                      </linearGradient>
                      <linearGradient id="glassGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#334155" />
                        <stop offset="100%" stopColor="#020617" />
                      </linearGradient>
                    </defs>

                    {/* Dynamic Body Silhouette by Style */}
                    {bodyStyle === 'offroad' ? (
                      /* 🛻 Rugged 4x4 */
                      <>
                        <circle cx="36" cy="46" r="14" fill="#06090e" />
                        <circle cx="120" cy="46" r="14" fill="#06090e" />

                        <path 
                          d="M10 46 L10 30 L32 30 L44 14 L102 14 L122 30 L150 34 L152 46 L134 46 A 14 14 0 0 0 106 46 L50 46 A 14 14 0 0 0 22 46 Z" 
                          fill="url(#bodyPaintGrad3)" 
                          stroke="#ffffff" 
                          strokeWidth="0.8" 
                        />
                        <line x1="46" y1="11" x2="100" y2="11" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="56" y1="11" x2="56" y2="14" stroke="#94a3b8" strokeWidth="2" />
                        <line x1="90" y1="11" x2="90" y2="14" stroke="#94a3b8" strokeWidth="2" />
                        <path d="M46 16 L98 16 L116 30 L34 30 Z" fill="url(#glassGrad3)" stroke="#1e293b" strokeWidth="1" />
                        <line x1="72" y1="16" x2="72" y2="30" stroke="#0f172a" strokeWidth="2.5" />
                      </>
                    ) : bodyStyle === 'suv' ? (
                      /* 🚙 Modern Compact SUV */
                      <>
                        <circle cx="36" cy="46" r="14" fill="#06090e" />
                        <circle cx="120" cy="46" r="14" fill="#06090e" />

                        <path 
                          d="M10 46 L20 34 L42 16 L100 16 L126 32 L150 36 L152 46 L134 46 A 14 14 0 0 0 106 46 L50 46 A 14 14 0 0 0 22 46 Z" 
                          fill="url(#bodyPaintGrad3)" 
                          stroke="#ffffff" 
                          strokeWidth="0.8" 
                        />
                        <line x1="48" y1="13" x2="96" y2="13" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
                        <path d="M44 18 L96 18 L120 32 L36 32 Z" fill="url(#glassGrad3)" stroke="#1e293b" strokeWidth="1" />
                        <line x1="74" y1="18" x2="74" y2="32" stroke="#0f172a" strokeWidth="2.5" />
                      </>
                    ) : (
                      /* 🚗 Aerodynamic Luxury Sedan */
                      <>
                        <circle cx="36" cy="46" r="14" fill="#06090e" />
                        <circle cx="120" cy="46" r="14" fill="#06090e" />

                        <path 
                          d="M10 46 L24 36 L48 18 L96 18 L124 32 L148 36 L152 46 L134 46 A 14 14 0 0 0 106 46 L50 46 A 14 14 0 0 0 22 46 Z" 
                          fill="url(#bodyPaintGrad3)" 
                          stroke="#ffffff" 
                          strokeWidth="0.8" 
                        />
                        <path d="M50 20 L94 20 L118 32 L42 32 Z" fill="url(#glassGrad3)" stroke="#1e293b" strokeWidth="1" />
                        <line x1="72" y1="20" x2="72" y2="32" stroke="#0f172a" strokeWidth="2.5" />
                      </>
                    )}

                    {/* Side Character Crease */}
                    <path d="M26 38 L140 38" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1" />
                    
                    {/* Door Handles */}
                    <rect x="56" y="34" width="7" height="1.8" rx="0.8" fill="#020617" />
                    <rect x="88" y="34" width="7" height="1.8" rx="0.8" fill="#020617" />

                    {/* Side Mirror */}
                    <path d="M116 31 L122 29 L122 33 Z" fill="#0f172a" stroke="#ffffff" strokeWidth="0.5" />

                    {/* 💡 Prominent Dual Matrix-LED Projector Headlamp Assembly */}
                    <g transform="translate(141, 33)">
                      {/* Outer Diamond Casing */}
                      <path d="M0 2 L13 3.5 L10 11 L0 9 Z" fill="#070b14" stroke="#64748b" strokeWidth="0.8" />
                      {/* Sweeping L-Shaped DRL Optic Fiber */}
                      <path d="M1 3 L12 4.2 L10.5 8.5" stroke="#38bdf8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      {/* Primary Low-Beam Projector Eye */}
                      <circle cx="4.2" cy="6.2" r="2.2" fill="#0f172a" stroke="#cbd5e1" strokeWidth="0.6" />
                      <circle cx="4.2" cy="6.2" r="1.6" fill="#ffffff" />
                      <circle cx="4.7" cy="5.7" r="0.6" fill="#7dd3fc" />
                      {/* Secondary High-Beam Laser Projector Eye */}
                      <circle cx="9" cy="6.8" r="1.9" fill="#0f172a" stroke="#cbd5e1" strokeWidth="0.6" />
                      <circle cx="9" cy="6.8" r="1.4" fill="#ffffff" />
                      <circle cx="9.4" cy="6.4" r="0.5" fill="#38bdf8" />
                    </g>

                    {/* Rear LED Taillight Bar */}
                    <path d="M10 38 L15 38 L14 42 Z" fill="#f43f5e" />
                    <circle cx="12" cy="40" r="1.2" fill="#ff4d4d" />

                    {/* Rear Wheel (Zero-Centered Math Pivot cx=36, cy=46) */}
                    <g transform="translate(36, 46)">
                      <circle cx="0" cy="0" r="12" stroke="#020617" strokeWidth="4" fill="#0f172a" />
                      <g className={isPlaying ? "animate-wheel-spin" : ""}>
                        <circle cx="0" cy="0" r="8.5" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="3 3" fill="none" />
                        <line x1="-6.5" y1="0" x2="6.5" y2="0" stroke="#cbd5e1" strokeWidth="1.5" />
                        <line x1="0" y1="-6.5" x2="0" y2="6.5" stroke="#cbd5e1" strokeWidth="1.5" />
                        <line x1="-4.5" y1="-4.5" x2="4.5" y2="4.5" stroke="#cbd5e1" strokeWidth="1.5" />
                        <line x1="-4.5" y1="4.5" x2="4.5" y2="-4.5" stroke="#cbd5e1" strokeWidth="1.5" />
                        <circle cx="0" cy="0" r="2.8" fill="#cbd5e1" />
                      </g>
                    </g>

                    {/* Front Wheel (Zero-Centered Math Pivot cx=120, cy=46) */}
                    <g transform="translate(120, 46)">
                      <circle cx="0" cy="0" r="12" stroke="#020617" strokeWidth="4" fill="#0f172a" />
                      <g className={isPlaying ? "animate-wheel-spin" : ""}>
                        <circle cx="0" cy="0" r="8.5" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="3 3" fill="none" />
                        <line x1="-6.5" y1="0" x2="6.5" y2="0" stroke="#cbd5e1" strokeWidth="1.5" />
                        <line x1="0" y1="-6.5" x2="0" y2="6.5" stroke="#cbd5e1" strokeWidth="1.5" />
                        <line x1="-4.5" y1="-4.5" x2="4.5" y2="4.5" stroke="#cbd5e1" strokeWidth="1.5" />
                        <line x1="-4.5" y1="4.5" x2="4.5" y2="-4.5" stroke="#cbd5e1" strokeWidth="1.5" />
                        <circle cx="0" cy="0" r="2.8" fill="#cbd5e1" />
                      </g>
                    </g>
                  </svg>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* 🛣️ Animated Roadway Asphalt with Dynamic Center Markings */}
        <div className={`relative w-full h-7 bg-gradient-to-b from-[#181d2e] via-[#111422] to-[#0a0c16] border-t ${envConfig.roadBorder} overflow-hidden flex items-center`}>
          <div className={`absolute inset-0 flex items-center ${isPlaying ? (playbackSpeed === 2 ? 'animate-road-fast' : 'animate-road-medium') : ''}`}>
            {[...Array(32)].map((_, idx) => (
              <div
                key={idx}
                className={`w-8 h-1 bg-gradient-to-r ${envConfig.dashColor} rounded-full mx-3 shrink-0 shadow-sm`}
              />
            ))}
          </div>
          <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
        </div>
      </div>

      {/* ============================================================ */}
      {/* 🧭 BOTTOM TIMELINE SCRUBBER & DENSE YEAR BREAKDOWN CARDS     */}
      {/* ============================================================ */}
      <div className="mt-4 pt-3 border-t border-white/[0.08] space-y-3">
        
        {/* Row 1: Single-Line Milestone Button Bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
            <span className="text-slate-400 font-semibold text-xs shrink-0 mr-1 flex items-center gap-1">
              <Calendar size={12} className="text-indigo-400" /> Milestone:
            </span>
            {safeTimeline.map((pt, idx) => {
              const isOpt = pt.year === optimalYear
              const isSel = activeYear === pt.year
              return (
                <button
                  key={pt.year ?? idx}
                  type="button"
                  onClick={() => {
                    setIsPlaying(false)
                    if (onYearSelect) onYearSelect(pt.year)
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shrink-0 ${
                    isSel
                      ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/30 scale-105 border border-white/20'
                      : isOpt
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06]'
                  }`}
                >
                  {isOpt ? `🏆 Yr ${pt.year}` : `Yr ${pt.year}`}
                </button>
              )
            })}
          </div>

          {/* Quick Strategy Chip */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px]">
            <span className="text-slate-500">Status:</span>
            <span className={`font-bold font-mono ${isOptimal ? 'text-amber-300' : 'text-slate-300'}`}>
              {yearInsight.tag}
            </span>
          </div>
        </div>

        {/* Row 2: Comprehensive Multi-Metric Year Inspector Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/[0.06]">
          
          {/* Metric 1: Resale Valuation */}
          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
              <span>Resale Value</span>
              <span className="text-emerald-400 font-bold">{currentPoint.retention_rate || 0}%</span>
            </div>
            <div className="text-sm font-black text-white font-mono">
              ₹{(currentPoint.resale_value || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[9px] text-slate-500 truncate">
              {currentPoint.calendar_year ? `Cal. ${currentPoint.calendar_year}` : 'Current year'}
            </div>
          </div>

          {/* Metric 2: Depreciation Hit */}
          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
              <span>Depreciation</span>
              <TrendingDown size={11} className="text-rose-400" />
            </div>
            <div className="text-sm font-black text-rose-400 font-mono">
              -₹{(currentPoint.depreciation_loss || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[9px] text-slate-500 truncate">
              Cumulative loss
            </div>
          </div>

          {/* Metric 3: Annual Fuel Expense */}
          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
              <span>Annual Fuel</span>
              <Fuel size={11} className="text-amber-400" />
            </div>
            <div className="text-sm font-black text-amber-300 font-mono">
              ₹{(currentPoint.annual_fuel_cost || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[9px] text-slate-500 truncate">
              {(annualKms || 10000).toLocaleString('en-IN')} km/yr
            </div>
          </div>

          {/* Metric 4: Annual Maintenance & Service */}
          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
              <span>Service & Care</span>
              <Wrench size={11} className="text-blue-400" />
            </div>
            <div className="text-sm font-black text-blue-300 font-mono">
              ₹{(currentPoint.annual_maintenance || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[9px] text-slate-500 truncate">
              Scheduled + Wear
            </div>
          </div>

          {/* Metric 5: Cumulative TCO */}
          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
              <span>Cumulative TCO</span>
              <Shield size={11} className="text-indigo-400" />
            </div>
            <div className="text-sm font-black text-indigo-300 font-mono">
              ₹{(currentPoint.cumulative_tco || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[9px] text-slate-500 truncate">
              All-inclusive cost
            </div>
          </div>

          {/* Metric 6: Net Cost per KM */}
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20">
            <div className="flex items-center justify-between text-[10px] text-cyan-300 mb-0.5">
              <span>Net Cost / KM</span>
              <span className="text-[9px] font-mono text-slate-400">eff.</span>
            </div>
            <div className="text-sm font-black text-white font-mono">
              ₹{currentPoint.net_cost_per_km || 0}
            </div>
            <div className="text-[9px] text-cyan-400 truncate">
              ₹{(currentPoint.monthly_cost || 0).toLocaleString('en-IN')}/mo
            </div>
          </div>

        </div>

        {/* Row 3: Strategic AI Advice Note for Active Year */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[11px] text-slate-300">
          <Info size={13} className="text-indigo-400 shrink-0" />
          <span>
            <strong className="text-white">Year {activeYear} Analysis:</strong> {yearInsight.tip}
          </span>
        </div>

      </div>
    </div>
  )
}
