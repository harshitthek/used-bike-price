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
  Sparkles,
  TrendingDown
} from 'lucide-react'

// Web Audio API engine sound generator with smooth gain ramping
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
  const simulatedSpeed = isPlaying ? Math.min(110, 40 + activeYear * 12) : 0
  const simulatedRPM = isPlaying ? Math.min(7500, 2400 + (activeYear % 3) * 1600 + Math.sin(activeYear) * 400) : 900
  const currentGear = isPlaying ? Math.min(6, Math.max(1, Math.floor(activeYear / 1.4) + 1)) : 'N'

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

  // Clamp vehicle horizontal position (15% to 78%)
  const vehicleProgressPct = maxYear > 0 ? (activeYear / maxYear) * 63 + 15 : 45

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
      {/* 🎛️ TOP CONTROL & TELEMETRY RIBBON                            */}
      {/* ============================================================ */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08] mb-4">
        
        {/* Left: Brand Badge & Body Type Selector */}
        <div className="flex items-center gap-3">
          <div 
            className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg border border-white/20"
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

        {/* Center: Live Real-Time Telemetry Gauges */}
        <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-inner">
          <div className="text-center">
            <span className="text-[8px] uppercase tracking-wider text-slate-400 block">Speed</span>
            <span className="text-xs font-black text-white font-mono">{simulatedSpeed} <span className="text-[9px] font-normal text-slate-400">km/h</span></span>
          </div>

          <div className="w-[1px] h-5 bg-white/10" />

          <div className="text-center">
            <span className="text-[8px] uppercase tracking-wider text-slate-400 block">Gear</span>
            <span className="text-xs font-black text-cyan-300 font-mono">{currentGear}</span>
          </div>

          <div className="w-[1px] h-5 bg-white/10" />

          <div className="w-14 text-center">
            <div className="flex justify-between text-[8px] font-mono text-slate-400">
              <span>RPM</span>
              <span className={simulatedRPM > 5500 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{simulatedRPM}</span>
            </div>
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mt-0.5">
              <div 
                className={`h-full transition-all duration-100 ${simulatedRPM > 5500 ? 'bg-gradient-to-r from-amber-400 to-rose-500' : 'bg-gradient-to-r from-cyan-400 to-indigo-500'}`}
                style={{ width: `${Math.min(100, (simulatedRPM / 8000) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Environment, Sound & Playback Controls */}
        <div className="flex items-center gap-2">
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

          {/* Speed Toggle */}
          <button
            type="button"
            onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 2 : 1)}
            className="px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-mono font-bold text-slate-300 border border-white/[0.08] cursor-pointer"
          >
            {playbackSpeed}x
          </button>

          {/* Play / Pause Action Button */}
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
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
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
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 🛣️ MAIN HIGHWAY STAGE (CLEAN VIEWPORT WITHOUT HUD CLUTTER)  */}
      {/* ============================================================ */}
      <div className="relative w-full h-48 rounded-xl bg-[#090b12] border border-white/[0.06] overflow-hidden flex flex-col justify-end">
        
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

        {/* Milestone Roadside Signposts (Positioned cleanly on top of roadside) */}
        <div className="absolute top-4 left-0 right-0 flex justify-between px-8 pointer-events-none z-10">
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

        {/* 🏆 Optimal Sell Horizon Celebratory Banner */}
        <AnimatePresence>
          {isOptimal && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="absolute top-12 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-amber-500/30 border border-amber-400/70 shadow-xl shadow-amber-500/30 flex items-center gap-1.5 text-amber-200 text-[11px] font-black backdrop-blur-md"
            >
              <Award size={13} className="text-amber-400 animate-bounce" />
              <span>Optimal Liquidation Sweet-Spot Reached! (Year {activeYear})</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🚗 MOVING VEHICLE STAGE AREA */}
        <div className="relative w-full h-24 mb-2 overflow-hidden">
          <motion.div
            className="absolute bottom-1 z-20"
            animate={{
              left: `${vehicleProgressPct}%`,
              x: "-50%",
              y: [0, -1.5, 0, 1.2, 0]
            }}
            transition={{
              left: { type: 'spring', stiffness: 90, damping: 22 },
              y: { repeat: Infinity, duration: isPlaying ? 0.6 : 1.2, ease: 'easeInOut' }
            }}
          >
            {/* Vehicle Graphic Wrapper */}
            <div className="relative">
              
              {/* Dynamic Neon Underglow */}
              <div 
                className="absolute -bottom-1 left-4 right-4 h-3 rounded-full blur-md opacity-70 pointer-events-none"
                style={{ background: brandColor }}
              />

              {/* Exhaust Particle Flame */}
              {isPlaying && (
                <div className="absolute top-8 -left-4 pointer-events-none">
                  <Flame size={15} className="text-amber-400 animate-exhaust-particle" />
                </div>
              )}

              {/* Monsoon Tire Water Spray */}
              {environment === 'monsoon' && isPlaying && (
                <div className="absolute bottom-0 -left-6 pointer-events-none opacity-60">
                  <div className="w-8 h-2 bg-gradient-to-l from-cyan-300 to-transparent blur-sm transform -rotate-12" />
                </div>
              )}

              {/* VEHICLE RENDERING SELECTION */}
              {vehicleType === 'bike' ? (
                /* 🏍️ ACCURATE MOTORCYCLE VECTOR */
                <div className="relative">
                  {/* Headlight Beam from Front Lamp */}
                  <div 
                    className="absolute top-7 left-24 w-44 h-12 pointer-events-none animate-beam"
                    style={{
                      background: 'linear-gradient(90deg, rgba(255,255,255,0.45) 0%, rgba(34,211,238,0.2) 35%, transparent 100%)',
                      clipPath: 'polygon(0% 40%, 100% 0%, 100% 100%, 0% 60%)'
                    }}
                  />

                  <svg width="130" height="75" viewBox="0 0 130 75" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Chassis Frame & Engine */}
                    <path d="M30 52 L56 36 L80 36 L98 52" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
                    <path d="M56 36 L66 50 L46 50 Z" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                    
                    {/* Engine Details */}
                    <rect x="52" y="42" width="14" height="8" rx="2" fill="#475569" />
                    <line x1="54" y1="44" x2="64" y2="44" stroke="#94a3b8" strokeWidth="1" />
                    <line x1="54" y1="47" x2="64" y2="47" stroke="#94a3b8" strokeWidth="1" />

                    {/* Tank & Fairing by Style */}
                    {bodyStyle === 'sport' ? (
                      <path 
                        d="M46 36 C52 26, 75 24, 88 34 L82 44 L50 42 Z" 
                        fill={brandColor} 
                        stroke="#ffffff" 
                        strokeWidth="0.8" 
                      />
                    ) : bodyStyle === 'naked' ? (
                      <path 
                        d="M50 36 C54 30, 72 28, 80 34 L74 38 L52 38 Z" 
                        fill={brandColor} 
                        stroke="#ffffff" 
                        strokeWidth="0.8" 
                      />
                    ) : (
                      <path 
                        d="M50 35 C52 28, 70 27, 80 34 L72 38 L52 38 Z" 
                        fill={brandColor} 
                        stroke="#ffffff" 
                        strokeWidth="0.8" 
                      />
                    )}

                    {/* Seat & Tail */}
                    <path d="M40 35 C44 35, 50 36, 54 38 L42 41 Z" fill="#0f172a" />
                    <rect x="38" y="33" width="18" height="4" rx="2" fill="#020617" />

                    {/* Handlebars & Mirror */}
                    <path d="M78 35 L84 25 L91 26" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="91" cy="26" r="2" fill="#38bdf8" />

                    {/* Exhaust Pipe */}
                    <path d="M58 50 C68 52, 42 54, 26 55" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                    <path d="M26 55 L20 55" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" />

                    {/* Rider Silhouette */}
                    <g opacity="0.95">
                      <circle cx="70" cy="17" r="7" fill="#0f172a" stroke={brandColor} strokeWidth="1.5" />
                      <path d="M73 16 Q77 17 76 19" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                      <path d="M67 24 L56 35 L74 35 Z" fill="#1e293b" />
                      <path d="M64 27 L82 29" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
                    </g>

                    {/* Rear Wheel (Zero-Centered Transform) */}
                    <g transform="translate(30, 52)">
                      <circle cx="0" cy="0" r="14" stroke="#0f172a" strokeWidth="5" fill="#020617" />
                      <g className={isPlaying ? "animate-wheel-spin" : ""}>
                        <circle cx="0" cy="0" r="10" stroke={brandColor} strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
                        <line x1="-8" y1="0" x2="8" y2="0" stroke="#cbd5e1" strokeWidth="1.2" />
                        <line x1="0" y1="-8" x2="0" y2="8" stroke="#cbd5e1" strokeWidth="1.2" />
                        <circle cx="0" cy="0" r="3.5" fill="#64748b" />
                      </g>
                    </g>

                    {/* Front Wheel (Zero-Centered Transform) */}
                    <g transform="translate(98, 52)">
                      <circle cx="0" cy="0" r="14" stroke="#0f172a" strokeWidth="5" fill="#020617" />
                      <g className={isPlaying ? "animate-wheel-spin" : ""}>
                        <circle cx="0" cy="0" r="10" stroke={brandColor} strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
                        <line x1="-8" y1="0" x2="8" y2="0" stroke="#cbd5e1" strokeWidth="1.2" />
                        <line x1="0" y1="-8" x2="0" y2="8" stroke="#cbd5e1" strokeWidth="1.2" />
                        <circle cx="0" cy="0" r="3.5" fill="#64748b" />
                      </g>
                    </g>

                    {/* Front Headlight Bulb */}
                    <circle cx="94" cy="32" r="3" fill="#ffffff" />
                  </svg>
                </div>
              ) : (
                /* 🚗 HANDCRAFTED AUTOMOTIVE CAR / SUV VECTOR */
                <div className="relative">
                  {/* Headlight Beam from Front Bumper Nose */}
                  <div 
                    className="absolute top-9 left-36 w-48 h-12 pointer-events-none animate-beam"
                    style={{
                      background: 'linear-gradient(90deg, rgba(255,255,255,0.5) 0%, rgba(34,211,238,0.25) 35%, transparent 100%)',
                      clipPath: 'polygon(0% 45%, 100% 0%, 100% 100%, 0% 55%)'
                    }}
                  />

                  <svg width="156" height="70" viewBox="0 0 156 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="bodyPaintGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                        <stop offset="30%" stopColor={brandColor} stopOpacity="1" />
                        <stop offset="100%" stopColor="#0f172a" stopOpacity="1" />
                      </linearGradient>
                      <linearGradient id="glassGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#020617" />
                      </linearGradient>
                    </defs>

                    {/* Dynamic Body Silhouette by Style */}
                    {bodyStyle === 'offroad' ? (
                      /* 🛻 Rugged 4x4 with Wheel Arches */
                      <>
                        <path 
                          d="M12 48 L12 32 L34 32 L46 18 L100 18 L118 32 L146 36 L148 48 L134 48 A 16 16 0 0 0 102 48 L54 48 A 16 16 0 0 0 22 48 Z" 
                          fill="url(#bodyPaintGradient2)" 
                          stroke="#ffffff" 
                          strokeWidth="0.8" 
                        />
                        <line x1="48" y1="15" x2="98" y2="15" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="58" y1="15" x2="58" y2="18" stroke="#94a3b8" strokeWidth="2" />
                        <line x1="88" y1="15" x2="88" y2="18" stroke="#94a3b8" strokeWidth="2" />
                        <path d="M48 20 L96 20 L112 32 L36 32 Z" fill="url(#glassGradient2)" stroke="#334155" strokeWidth="1" />
                        <line x1="72" y1="20" x2="72" y2="32" stroke="#475569" strokeWidth="2" />
                      </>
                    ) : bodyStyle === 'suv' ? (
                      /* 🚙 Modern Compact SUV */
                      <>
                        <path 
                          d="M12 48 L22 36 L44 20 L98 20 L122 34 L146 38 L148 48 L134 48 A 16 16 0 0 0 102 48 L54 48 A 16 16 0 0 0 22 48 Z" 
                          fill="url(#bodyPaintGradient2)" 
                          stroke="#ffffff" 
                          strokeWidth="0.8" 
                        />
                        <line x1="50" y1="17" x2="94" y2="17" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
                        <path d="M46 22 L94 22 L116 34 L38 34 Z" fill="url(#glassGradient2)" stroke="#334155" strokeWidth="1" />
                        <line x1="74" y1="22" x2="74" y2="34" stroke="#475569" strokeWidth="2" />
                      </>
                    ) : (
                      /* 🚗 Aerodynamic Luxury Sedan */
                      <>
                        <path 
                          d="M12 48 L25 38 L48 22 L94 22 L120 34 L144 38 L148 48 L134 48 A 16 16 0 0 0 102 48 L54 48 A 16 16 0 0 0 22 48 Z" 
                          fill="url(#bodyPaintGradient2)" 
                          stroke="#ffffff" 
                          strokeWidth="0.8" 
                        />
                        <path d="M50 24 L92 24 L114 34 L44 34 Z" fill="url(#glassGradient2)" stroke="#334155" strokeWidth="1" />
                        <line x1="72" y1="24" x2="72" y2="34" stroke="#475569" strokeWidth="2" />
                      </>
                    )}

                    {/* Side Character Line */}
                    <path d="M28 40 L136 40" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1" />
                    
                    {/* Door Handles */}
                    <rect x="58" y="36" width="7" height="1.8" rx="0.8" fill="#020617" />
                    <rect x="88" y="36" width="7" height="1.8" rx="0.8" fill="#020617" />

                    {/* Side Mirror */}
                    <path d="M112 33 L118 31 L118 35 Z" fill="#0f172a" stroke="#ffffff" strokeWidth="0.5" />

                    {/* Front Projector Headlight */}
                    <path d="M140 39 L147 40 L145 44 Z" fill="#ffffff" />
                    <circle cx="143" cy="42" r="1.5" fill="#38bdf8" />

                    {/* Rear LED Taillight */}
                    <path d="M12 40 L16 40 L15 44 Z" fill="#f43f5e" />
                    <circle cx="14" cy="42" r="1.2" fill="#ff4d4d" />

                    {/* Rear Wheel (Zero-Centered Math Pivot cx=38, cy=48) */}
                    <g transform="translate(38, 48)">
                      <circle cx="0" cy="0" r="13" stroke="#020617" strokeWidth="4.5" fill="#0f172a" />
                      <g className={isPlaying ? "animate-wheel-spin" : ""}>
                        <circle cx="0" cy="0" r="9" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="3 3" fill="none" />
                        <line x1="-7" y1="0" x2="7" y2="0" stroke="#cbd5e1" strokeWidth="1.5" />
                        <line x1="0" y1="-7" x2="0" y2="7" stroke="#cbd5e1" strokeWidth="1.5" />
                        <line x1="-5" y1="-5" x2="5" y2="5" stroke="#cbd5e1" strokeWidth="1.5" />
                        <line x1="-5" y1="5" x2="5" y2="-5" stroke="#cbd5e1" strokeWidth="1.5" />
                        <circle cx="0" cy="0" r="3" fill="#cbd5e1" />
                      </g>
                    </g>

                    {/* Front Wheel (Zero-Centered Math Pivot cx=118, cy=48) */}
                    <g transform="translate(118, 48)">
                      <circle cx="0" cy="0" r="13" stroke="#020617" strokeWidth="4.5" fill="#0f172a" />
                      <g className={isPlaying ? "animate-wheel-spin" : ""}>
                        <circle cx="0" cy="0" r="9" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="3 3" fill="none" />
                        <line x1="-7" y1="0" x2="7" y2="0" stroke="#cbd5e1" strokeWidth="1.5" />
                        <line x1="0" y1="-7" x2="0" y2="7" stroke="#cbd5e1" strokeWidth="1.5" />
                        <line x1="-5" y1="-5" x2="5" y2="5" stroke="#cbd5e1" strokeWidth="1.5" />
                        <line x1="-5" y1="5" x2="5" y2="-5" stroke="#cbd5e1" strokeWidth="1.5" />
                        <circle cx="0" cy="0" r="3" fill="#cbd5e1" />
                      </g>
                    </g>
                  </svg>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* 🛣️ Animated Roadway Asphalt with Dynamic Center Markings */}
        <div className={`relative w-full h-8 bg-gradient-to-b from-[#181d2e] via-[#111422] to-[#0a0c16] border-t ${envConfig.roadBorder} overflow-hidden flex items-center`}>
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
      {/* 🧭 BOTTOM TIMELINE MILESTONE SCRUBBER & LIVE STATISTICS       */}
      {/* ============================================================ */}
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
