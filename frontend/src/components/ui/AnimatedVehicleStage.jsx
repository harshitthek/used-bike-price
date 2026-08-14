import React, { useState, useEffect, useRef } from 'react'
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
  Fuel
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

      // Smooth volume ramp
      this.gainNode.gain.setValueAtTime(0.001, this.ctx.currentTime)
      this.gainNode.gain.exponentialRampToValueAtTime(0.035, this.ctx.currentTime + 0.1)

      this.osc1.connect(this.filterNode)
      this.osc2.connect(this.filterNode)
      this.filterNode.connect(this.gainNode)
      this.gainNode.connect(this.ctx.destination)

      this.osc1.start()
      this.osc2.start()
    } catch (e) {
      // Audio playback gesture pending
    }
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
    setTimeout(() => {
      if (this.osc1) {
        try {
          this.osc1.stop()
          this.osc2.stop()
          this.osc1.disconnect()
          this.osc2.disconnect()
        } catch (e) {}
        this.osc1 = null
        this.osc2 = null
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
  if (b.includes('hyundai')) return '#60a5fa'
  if (b.includes('maruti')) return '#38bdf8'
  if (b.includes('tata')) return '#34d399'
  if (b.includes('mahindra')) return '#fbbf24'
  if (b.includes('toyota')) return '#f43f5e'
  if (b.includes('bmw') || b.includes('audi') || b.includes('mercedes')) return '#c084fc'
  return vType === 'bike' ? '#818cf8' : '#38bdf8'
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

  const brandColor = getBrandColor(brand, vehicleType)
  const maxYear = timeline.length > 0 ? timeline[timeline.length - 1].year : 5
  const currentPoint = timeline.find((p) => p.year === activeYear) || timeline[0] || {}
  const isOptimal = activeYear === optimalYear

  // Simulated live speed and RPM values
  const simulatedSpeed = isPlaying ? Math.min(110, 45 + activeYear * 10) : 0
  const simulatedRPM = isPlaying ? Math.min(7500, 2400 + (activeYear % 3) * 1600 + Math.sin(activeYear) * 400) : 900
  const currentGear = isPlaying ? Math.min(6, Math.max(1, Math.floor(activeYear / 1.5) + 1)) : 'N'

  // Sync Audio with Playback and RPM
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

  // Stop audio on component unmount
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

  // Playback Loop: Stop smoothly at maxYear without glitching
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

  // Horizontal position clamp (12% to 82% to prevent overflow)
  const vehicleProgressPct = maxYear > 0 ? (activeYear / maxYear) * 65 + 15 : 50

  // Environment styles
  const envStyles = {
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
    <div className={`relative w-full overflow-hidden rounded-2xl bg-gradient-to-b ${envStyles.bg} border border-white/[0.1] shadow-2xl p-5 mb-5 select-none transition-all duration-700`}>
      
      {/* 🌌 Scenery Ambient Light Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div 
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl opacity-25"
          style={{ background: brandColor }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* 🌧️ Monsoon Rain Streaks */}
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

      {/* ☀️ Golden Hour Sun Glow */}
      {environment === 'golden' && (
        <div className="absolute top-2 right-12 w-28 h-28 rounded-full bg-gradient-to-br from-amber-300/40 to-orange-500/10 blur-2xl pointer-events-none" />
      )}

      {/* 🎛️ TOP CONTROL & TELEMETRY BAR */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08] mb-4">
        
        {/* Left: Brand Badge & Body Type Toggle */}
        <div className="flex items-center gap-3">
          <div 
            className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg border border-white/20"
            style={{ background: `linear-gradient(135deg, ${brandColor}, #312e81)` }}
          >
            <Gauge size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white uppercase tracking-wider">{brand} Lifecycle Simulator</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-cyan-300 border border-white/10 font-mono">
                {vehicleType === 'bike' ? '🏍️ Motorcycle' : '🚗 Automotive'}
              </span>
            </div>

            {/* Vehicle Body Style Switcher */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-slate-500">Body:</span>
              {vehicleType === 'bike' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setBodyStyle('cruiser')}
                    className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${bodyStyle === 'cruiser' ? 'bg-indigo-500/30 text-indigo-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Cruiser
                  </button>
                  <button
                    type="button"
                    onClick={() => setBodyStyle('sport')}
                    className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${bodyStyle === 'sport' ? 'bg-indigo-500/30 text-indigo-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Supersport
                  </button>
                  <button
                    type="button"
                    onClick={() => setBodyStyle('naked')}
                    className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${bodyStyle === 'naked' ? 'bg-indigo-500/30 text-indigo-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Naked
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setBodyStyle('sedan')}
                    className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${bodyStyle === 'sedan' ? 'bg-indigo-500/30 text-indigo-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Sedan
                  </button>
                  <button
                    type="button"
                    onClick={() => setBodyStyle('suv')}
                    className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${bodyStyle === 'suv' ? 'bg-indigo-500/30 text-indigo-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Compact SUV
                  </button>
                  <button
                    type="button"
                    onClick={() => setBodyStyle('offroad')}
                    className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${bodyStyle === 'offroad' ? 'bg-indigo-500/30 text-indigo-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Rugged 4x4
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Environment & Sound Toggles */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setEnvironment('midnight')}
            title="Cyberpunk Midnight"
            className={`p-1.5 rounded-lg cursor-pointer transition-all ${environment === 'midnight' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <Moon size={13} />
          </button>
          <button
            type="button"
            onClick={() => setEnvironment('golden')}
            title="Golden Hour Expressway"
            className={`p-1.5 rounded-lg cursor-pointer transition-all ${environment === 'golden' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <Sun size={13} />
          </button>
          <button
            type="button"
            onClick={() => setEnvironment('monsoon')}
            title="Monsoon Highway"
            className={`p-1.5 rounded-lg cursor-pointer transition-all ${environment === 'monsoon' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <CloudRain size={13} />
          </button>

          <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

          {/* Sound Toggle */}
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
            className={`p-1.5 rounded-lg cursor-pointer transition-all ${soundEnabled ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>
        </div>

        {/* Right: Playback Controls */}
        <div className="flex items-center gap-2">
          {/* Speed Toggle (1x / 2x) */}
          <button
            type="button"
            onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 2 : 1)}
            className="px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-mono font-bold text-slate-300 border border-white/[0.08] cursor-pointer"
          >
            {playbackSpeed}x
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeYear >= maxYear && !isPlaying) {
                onYearSelect(0)
              }
              setIsPlaying(!isPlaying)
            }}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:opacity-90 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/25 cursor-pointer transition-all"
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            <span>{isPlaying ? 'Pause' : 'Play Drive'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false)
              onYearSelect(0)
            }}
            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] cursor-pointer transition-all"
            title="Reset Simulation"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* 🛣️ MAIN HIGHWAY CANVAS */}
      <div className="relative w-full h-52 rounded-xl bg-[#090b12] border border-white/[0.06] overflow-hidden flex flex-col justify-end">
        
        {/* Speed Wind Streaks */}
        <div className="absolute top-2 left-0 right-0 h-20 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
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

        {/* 📊 Live Dashboard Speedometer & RPM Gauges (HUD Overlay) */}
        <div className="absolute top-3 left-4 z-20 flex items-center gap-4 bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-lg">
          {/* Digital Speedometer */}
          <div className="flex items-center gap-2">
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-wider text-slate-400">Velocity</div>
              <div className="text-base font-black text-white font-mono leading-none">
                {simulatedSpeed} <span className="text-[10px] font-normal text-slate-400">km/h</span>
              </div>
            </div>
          </div>

          <div className="w-[1px] h-6 bg-white/10" />

          {/* Gear Indicator */}
          <div className="text-center px-1">
            <div className="text-[9px] uppercase tracking-wider text-slate-400">Gear</div>
            <div className="text-sm font-black text-cyan-300 font-mono leading-none">
              {currentGear}
            </div>
          </div>

          <div className="w-[1px] h-6 bg-white/10" />

          {/* Mini RPM Bar */}
          <div className="w-16">
            <div className="flex justify-between text-[8px] font-mono text-slate-400 mb-0.5">
              <span>RPM</span>
              <span className={simulatedRPM > 5500 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{simulatedRPM}</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-100 ${simulatedRPM > 5500 ? 'bg-gradient-to-r from-amber-400 to-rose-500' : 'bg-gradient-to-r from-cyan-400 to-indigo-500'}`}
                style={{ width: `${Math.min(100, (simulatedRPM / 8000) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Milestone Roadside Signposts */}
        <div className="absolute top-6 left-0 right-0 flex justify-between px-6 pointer-events-none z-10">
          {timeline.map((pt) => {
            const isTarget = pt.year === activeYear
            const isOpt = pt.year === optimalYear
            return (
              <div 
                key={pt.year}
                className={`flex flex-col items-center transition-all duration-300 ${
                  isTarget ? 'scale-110 opacity-100' : 'opacity-40'
                }`}
              >
                <div 
                  className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold border ${
                    isOpt
                      ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 shadow-lg shadow-amber-500/20'
                      : isTarget
                      ? 'bg-cyan-500/25 text-cyan-200 border-cyan-500/60'
                      : 'bg-white/[0.04] text-slate-400 border-white/[0.08]'
                  }`}
                >
                  {isOpt ? '🏆 YR ' + pt.year : 'YR ' + pt.year}
                </div>
                <div className="w-[1px] h-3 bg-white/10 mt-1" />
              </div>
            )
          })}
        </div>

        {/* Floating Financial Cashflow Notification */}
        <AnimatePresence>
          {activeYear > 0 && currentPoint && (
            <motion.div
              key={activeYear}
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/15 shadow-xl flex items-center gap-3 text-[11px] font-mono"
            >
              <div className="flex items-center gap-1 text-rose-400">
                <span>Deprec:</span>
                <span className="font-bold">-₹{((currentPoint.depreciation_loss || 0) / 1000).toFixed(0)}k</span>
              </div>
              <div className="w-[1px] h-3 bg-white/10" />
              <div className="flex items-center gap-1 text-amber-300">
                <Fuel size={11} />
                <span>₹{((currentPoint.annual_fuel_cost || 0) / 1000).toFixed(0)}k/yr</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🏆 Optimal Sell Horizon Celebratory Banner */}
        <AnimatePresence>
          {isOptimal && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="absolute top-14 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-amber-500/30 border border-amber-400/70 shadow-xl shadow-amber-500/30 flex items-center gap-2 text-amber-200 text-xs font-black backdrop-blur-md"
            >
              <Award size={15} className="text-amber-400 animate-bounce" />
              <span>Optimal Liquidation Sweet-Spot Reached! (Year {activeYear})</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🚗 MOVING VEHICLE STAGE AREA */}
        <div className="relative w-full h-28 mb-3 overflow-hidden">
          <motion.div
            className="absolute bottom-1 z-20"
            animate={{
              left: `${vehicleProgressPct}%`,
              y: [0, -1.8, 0, 1.2, 0]
            }}
            transition={{
              left: { type: 'spring', stiffness: 90, damping: 22 },
              y: { repeat: Infinity, duration: isPlaying ? 0.6 : 1.2, ease: 'easeInOut' }
            }}
            style={{ transform: 'translateX(-50%)' }}
          >
            {/* Vehicle Vector Graphic Container */}
            <div className="relative">
              
              {/* Dynamic Headlight Light Cone */}
              <div 
                className="absolute top-7 left-24 w-44 h-12 pointer-events-none animate-beam"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.45) 0%, rgba(34,211,238,0.2) 35%, transparent 100%)',
                  clipPath: 'polygon(0% 40%, 100% 0%, 100% 100%, 0% 60%)'
                }}
              />

              {/* Dynamic Neon Underglow */}
              <div 
                className="absolute -bottom-1 left-4 right-4 h-3 rounded-full blur-md opacity-70 pointer-events-none"
                style={{ background: brandColor }}
              />

              {/* Exhaust Particle Flame */}
              {isPlaying && (
                <div className="absolute top-10 -left-4 pointer-events-none">
                  <Flame size={16} className="text-amber-400 animate-exhaust-particle" />
                </div>
              )}

              {/* 🌧️ Water Spray when raining */}
              {environment === 'monsoon' && isPlaying && (
                <div className="absolute bottom-0 -left-6 pointer-events-none opacity-60">
                  <div className="w-8 h-2 bg-gradient-to-l from-cyan-300 to-transparent blur-sm transform -rotate-12" />
                </div>
              )}

              {/* VEHICLE RENDERING SELECTION */}
              {vehicleType === 'bike' ? (
                /* 🏍️ BICYCLE / MOTORCYCLE RENDERING */
                <svg width="130" height="75" viewBox="0 0 130 75" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Chassis Frame */}
                  <path d="M38 52 L56 36 L80 36 L94 50" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
                  <path d="M56 36 L66 50 L46 50 Z" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                  
                  {/* Engine Details */}
                  <rect x="52" y="42" width="14" height="8" rx="2" fill="#475569" />
                  <line x1="54" y1="44" x2="64" y2="44" stroke="#94a3b8" strokeWidth="1" />
                  <line x1="54" y1="47" x2="64" y2="47" stroke="#94a3b8" strokeWidth="1" />

                  {/* Body Geometry by Style */}
                  {bodyStyle === 'sport' ? (
                    /* Supersport Fairing */
                    <path 
                      d="M46 36 C52 26, 75 24, 88 34 L82 44 L50 42 Z" 
                      fill={brandColor} 
                      stroke="#ffffff" 
                      strokeWidth="0.8" 
                    />
                  ) : bodyStyle === 'naked' ? (
                    /* Naked Angular Tank */
                    <path 
                      d="M50 36 C54 30, 72 28, 80 34 L74 38 L52 38 Z" 
                      fill={brandColor} 
                      stroke="#ffffff" 
                      strokeWidth="0.8" 
                    />
                  ) : (
                    /* Classic Teardrop Cruiser Tank */
                    <path 
                      d="M50 35 C52 28, 70 27, 80 34 L72 38 L52 38 Z" 
                      fill={brandColor} 
                      stroke="#ffffff" 
                      strokeWidth="0.8" 
                    />
                  )}

                  {/* Seat & Pillion */}
                  <path d="M40 35 C44 35, 50 36, 54 38 L42 41 Z" fill="#0f172a" />
                  <rect x="38" y="33" width="18" height="4" rx="2" fill="#020617" />

                  {/* Handlebars */}
                  <path d="M78 35 L84 25 L91 26" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="91" cy="26" r="2" fill="#38bdf8" />

                  {/* Exhaust Pipe */}
                  <path d="M58 50 C68 52, 42 54, 26 55" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                  <path d="M26 55 L20 55" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" />

                  {/* Rider Silhouette */}
                  <g opacity="0.95">
                    {/* Helmet */}
                    <circle cx="70" cy="17" r="7" fill="#0f172a" stroke={brandColor} strokeWidth="1.5" />
                    <path d="M73 16 Q77 17 76 19" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                    {/* Torso */}
                    <path d="M67 24 L56 35 L74 35 Z" fill="#1e293b" />
                    {/* Arm to Handlebar */}
                    <path d="M64 27 L82 29" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
                  </g>

                  {/* Rear Wheel (Spinning) */}
                  <g className={isPlaying ? "animate-wheel-spin" : ""} style={{ transformOrigin: '30px 52px' }}>
                    <circle cx="30" cy="52" r="15" stroke="#0f172a" strokeWidth="5" fill="#020617" />
                    <circle cx="30" cy="52" r="11" stroke={brandColor} strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
                    <circle cx="30" cy="52" r="4" fill="#64748b" />
                  </g>

                  {/* Front Wheel (Spinning) */}
                  <g className={isPlaying ? "animate-wheel-spin" : ""} style={{ transformOrigin: '98px 52px' }}>
                    <circle cx="98" cy="52" r="15" stroke="#0f172a" strokeWidth="5" fill="#020617" />
                    <circle cx="98" cy="52" r="11" stroke={brandColor} strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
                    <circle cx="98" cy="52" r="4" fill="#64748b" />
                  </g>

                  {/* Front Headlight */}
                  <circle cx="94" cy="32" r="3" fill="#ffffff" />
                </svg>
              ) : (
                /* 🚗 AUTOMOTIVE CAR / SUV RENDERING */
                <svg width="150" height="70" viewBox="0 0 150 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {bodyStyle === 'offroad' ? (
                    /* 🛻 Rugged Boxy 4x4 */
                    <>
                      <path 
                        d="M15 48 L15 32 L35 32 L48 20 L98 20 L115 32 L142 38 L142 50 L15 50 Z" 
                        fill={brandColor} 
                        stroke="#ffffff" 
                        strokeWidth="0.8" 
                      />
                      {/* Roof Rack */}
                      <line x1="50" y1="17" x2="96" y2="17" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                      <line x1="60" y1="17" x2="60" y2="20" stroke="#94a3b8" strokeWidth="1.5" />
                      <line x1="85" y1="17" x2="85" y2="20" stroke="#94a3b8" strokeWidth="1.5" />
                      {/* Windows */}
                      <path d="M50 22 L95 22 L110 32 L38 32 Z" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    </>
                  ) : bodyStyle === 'suv' ? (
                    /* 🚙 Compact SUV Crossover */
                    <>
                      <path 
                        d="M15 46 L22 36 L44 22 L94 22 L120 34 L142 40 L142 50 L15 50 Z" 
                        fill={brandColor} 
                        stroke="#ffffff" 
                        strokeWidth="0.8" 
                      />
                      {/* Roof Rails */}
                      <line x1="52" y1="19" x2="90" y2="19" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
                      {/* Windows */}
                      <path d="M46 24 L92 24 L114 34 L40 34 Z" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    </>
                  ) : (
                    /* 🚗 Aerodynamic Sleek Sedan */
                    <>
                      <path 
                        d="M15 45 L26 38 L48 24 L92 24 L118 36 L140 40 L142 49 L15 49 Z" 
                        fill={brandColor} 
                        stroke="#ffffff" 
                        strokeWidth="0.8" 
                      />
                      {/* Windows */}
                      <path d="M50 26 L90 26 L112 36 L48 36 Z" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    </>
                  )}

                  {/* Headlight & Taillight */}
                  <path d="M136 41 L142 42 L140 46 Z" fill="#ffffff" />
                  <path d="M15 42 L18 42 L17 46 Z" fill="#f43f5e" />

                  {/* Character Lines & Door Handles */}
                  <path d="M32 42 L125 42" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1" />
                  <rect x="56" y="38" width="6" height="1.5" rx="0.5" fill="#020617" />
                  <rect x="86" y="38" width="6" height="1.5" rx="0.5" fill="#020617" />

                  {/* Rear Wheel (Spinning) */}
                  <g className={isPlaying ? "animate-wheel-spin" : ""} style={{ transformOrigin: '40px 50px' }}>
                    <circle cx="40" cy="50" r="13" stroke="#020617" strokeWidth="5" fill="#0f172a" />
                    <circle cx="40" cy="50" r="9" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
                    <circle cx="40" cy="50" r="4" fill="#cbd5e1" />
                  </g>

                  {/* Front Wheel (Spinning) */}
                  <g className={isPlaying ? "animate-wheel-spin" : ""} style={{ transformOrigin: '116px 50px' }}>
                    <circle cx="116" cy="50" r="13" stroke="#020617" strokeWidth="5" fill="#0f172a" />
                    <circle cx="116" cy="50" r="9" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
                    <circle cx="116" cy="50" r="4" fill="#cbd5e1" />
                  </g>
                </svg>
              )}
            </div>
          </motion.div>
        </div>

        {/* 🛣️ Animated Roadway Asphalt with Dynamic Center Markings */}
        <div className={`relative w-full h-8 bg-gradient-to-b from-[#181d2e] via-[#111422] to-[#0a0c16] border-t ${envStyles.roadBorder} overflow-hidden flex items-center`}>
          {/* Animated Center Dashes */}
          <div className={`absolute inset-0 flex items-center ${isPlaying ? (playbackSpeed === 2 ? 'animate-road-fast' : 'animate-road-medium') : ''}`}>
            {[...Array(32)].map((_, idx) => (
              <div
                key={idx}
                className={`w-8 h-1 bg-gradient-to-r ${envStyles.dashColor} rounded-full mx-3 shrink-0 shadow-sm`}
              />
            ))}
          </div>

          {/* Road Curb Bottom Accent */}
          <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
        </div>
      </div>

      {/* 🧭 INTERACTIVE MILESTONE TIME-TRAVEL SCRUB BAR */}
      <div className="mt-4 pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Simulated Year:</span>
          <div className="flex items-center gap-1 flex-wrap">
            {timeline.map((pt) => {
              const isOpt = pt.year === optimalYear
              const isSel = activeYear === pt.year
              return (
                <button
                  key={pt.year}
                  type="button"
                  onClick={() => {
                    setIsPlaying(false)
                    onYearSelect(pt.year)
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
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
        </div>

        {/* Live Step Stats Pill */}
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1 text-slate-300">
            <span className="text-slate-500">Odometer:</span>
            <span className="font-bold text-cyan-300">{currentPoint.total_kms?.toLocaleString('en-IN') || 0} km</span>
          </div>

          <div className="flex items-center gap-1 text-slate-300">
            <span className="text-slate-500">Resale:</span>
            <span className="font-bold text-emerald-400">₹{currentPoint.resale_value?.toLocaleString('en-IN') || 0}</span>
          </div>

          <div className="flex items-center gap-1 text-slate-300">
            <span className="text-slate-500">Cost/KM:</span>
            <span className="font-bold text-indigo-300">₹{currentPoint.net_cost_per_km || 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
