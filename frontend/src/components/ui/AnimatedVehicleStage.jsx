import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Award, Gauge, Flame } from 'lucide-react'

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
  const brandColor = getBrandColor(brand, vehicleType)
  const maxYear = timeline.length > 0 ? timeline[timeline.length - 1].year : 5
  const currentPoint = timeline.find((p) => p.year === activeYear) || timeline[0] || {}
  const isOptimal = activeYear === optimalYear

  // Automatic playback loop
  useEffect(() => {
    let interval = null
    if (isPlaying) {
      interval = setInterval(() => {
        onYearSelect((prev) => {
          if (prev >= maxYear) {
            setIsPlaying(false)
            return 0
          }
          return prev + 1
        })
      }, 1200)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying, maxYear, onYearSelect])

  // Calculate vehicle horizontal position based on timeline year
  const vehicleProgressPct = maxYear > 0 ? (activeYear / maxYear) * 70 + 15 : 50

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#0e111d] via-[#090b14] to-[#05060a] border border-white/[0.1] shadow-2xl p-5 mb-5 select-none">
      {/* Dynamic Background Stars / City Horizon Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div 
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl opacity-20"
          style={{ background: brandColor }}
        />
        {/* Subtle grid backdrop */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Top HUD Telemetry Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08] mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="h-8 w-8 rounded-lg flex items-center justify-center shadow-lg border border-white/20"
            style={{ background: `linear-gradient(135deg, ${brandColor}, #4338ca)` }}
          >
            <Gauge size={16} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white uppercase tracking-wider">{brand} Simulation Telemetry</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-cyan-300 border border-white/10 font-mono">
                {vehicleType === 'bike' ? '🏍️ Motorcycle Track' : '🚗 Automotive Highway'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live Real-Time Mileage Accumulation & Depreciation Dynamics
            </p>
          </div>
        </div>

        {/* Play / Scrub Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/25 cursor-pointer transition-all"
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            <span>{isPlaying ? 'Pause Drive' : 'Play Lifecycle Drive'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false)
              onYearSelect(0)
            }}
            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] cursor-pointer transition-all"
            title="Reset Simulation to Year 0"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Main Highway Canvas */}
      <div className="relative w-full h-44 rounded-xl bg-[#090b12] border border-white/[0.06] overflow-hidden flex flex-col justify-end">
        
        {/* Sky / Speed Streaks */}
        <div className="absolute top-2 left-0 right-0 h-16 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-[1px] bg-gradient-to-l from-transparent via-cyan-400/30 to-transparent"
              style={{
                top: `${i * 10 + 4}px`,
                width: `${60 + i * 20}px`,
                right: `${(i * 70) % 300}px`
              }}
              animate={{
                x: [0, -400],
                opacity: [0, 0.8, 0]
              }}
              transition={{
                duration: 1.2 + (i % 3) * 0.4,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          ))}
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
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/20'
                      : isTarget
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50'
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

        {/* Optimal Sell Horizon Overlay Banner */}
        <AnimatePresence>
          {isOptimal && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-amber-500/30 border border-amber-400/60 shadow-lg shadow-amber-500/20 flex items-center gap-1.5 text-amber-200 text-[11px] font-extrabold backdrop-blur-md"
            >
              <Award size={13} className="text-amber-400 animate-bounce" />
              <span>Optimal Liquidation Sweet-Spot Reached! (Year {activeYear})</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Moving Vehicle Stage Area */}
        <div className="relative w-full h-24 mb-4">
          <motion.div
            className="absolute bottom-2 z-20"
            animate={{
              left: `${vehicleProgressPct}%`,
              y: [0, -1.8, 0, 1.2, 0]
            }}
            transition={{
              left: { type: 'spring', stiffness: 80, damping: 20 },
              y: { repeat: Infinity, duration: 0.8, ease: 'easeInOut' }
            }}
            style={{ transform: 'translateX(-50%)' }}
          >
            {/* Vehicle Vector Graphic */}
            <div className="relative">
              {/* Headlight Forward Cone */}
              <div 
                className="absolute top-5 left-20 w-48 h-12 pointer-events-none animate-beam"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.4) 0%, rgba(34,211,238,0.15) 40%, transparent 100%)',
                  clipPath: 'polygon(0% 40%, 100% 0%, 100% 100%, 0% 60%)'
                }}
              />

              {/* Exhaust particle flame */}
              <div className="absolute top-8 -left-3 pointer-events-none">
                <Flame size={14} className="text-amber-400 animate-exhaust-particle" />
              </div>

              {vehicleType === 'bike' ? (
                /* 🏍️ CUSTOM VECTOR MOTORCYCLE */
                <svg width="120" height="70" viewBox="0 0 120 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Motorcycle Frame & Engine */}
                  <path d="M35 50 L52 35 L75 35 L88 48" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
                  <path d="M52 35 L62 48 L42 48 Z" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                  
                  {/* Fuel Tank & Fairing */}
                  <path 
                    d="M48 34 C50 28, 65 26, 75 33 L68 37 L50 37 Z" 
                    fill={brandColor} 
                    stroke="#ffffff" 
                    strokeWidth="0.8" 
                  />

                  {/* Seat & Tail */}
                  <path d="M38 34 C42 34, 48 35, 52 37 L40 40 Z" fill="#0f172a" />
                  <rect x="36" y="32" width="16" height="4" rx="2" fill="#020617" />

                  {/* Handlebars & Mirror */}
                  <path d="M74 34 L80 24 L86 25" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="86" cy="25" r="2" fill="#38bdf8" />

                  {/* Exhaust Pipe */}
                  <path d="M55 48 C65 50, 40 52, 24 53" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M24 53 L18 53" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />

                  {/* Rider Silhouette */}
                  <g opacity="0.9">
                    {/* Helmet */}
                    <circle cx="66" cy="16" r="6.5" fill="#0f172a" stroke={brandColor} strokeWidth="1.5" />
                    {/* Visor */}
                    <path d="M68 15 Q72 16 71 18" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                    {/* Torso leaning forward */}
                    <path d="M63 22 L52 33 L70 33 Z" fill="#1e293b" />
                    {/* Arms to handlebars */}
                    <path d="M60 25 L76 27" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
                  </g>

                  {/* Rear Wheel */}
                  <g className="animate-wheel-spin" style={{ transformOrigin: '28px 50px' }}>
                    <circle cx="28" cy="50" r="14" stroke="#0f172a" strokeWidth="5" fill="#020617" />
                    <circle cx="28" cy="50" r="10" stroke={brandColor} strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
                    <circle cx="28" cy="50" r="4" fill="#64748b" />
                  </g>

                  {/* Front Wheel */}
                  <g className="animate-wheel-spin" style={{ transformOrigin: '92px 50px' }}>
                    <circle cx="92" cy="50" r="14" stroke="#0f172a" strokeWidth="5" fill="#020617" />
                    <circle cx="92" cy="50" r="10" stroke={brandColor} strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
                    <circle cx="92" cy="50" r="4" fill="#64748b" />
                  </g>

                  {/* Front LED Headlight */}
                  <circle cx="88" cy="30" r="2.5" fill="#ffffff" />
                </svg>
              ) : (
                /* 🚗 CUSTOM VECTOR CAR / SEDAN */
                <svg width="140" height="65" viewBox="0 0 140 65" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Car Body Aerodynamic Profile */}
                  <path 
                    d="M15 42 L25 35 L45 22 L88 22 L112 34 L132 38 L134 48 L15 48 Z" 
                    fill={brandColor} 
                    stroke="#ffffff" 
                    strokeWidth="0.8" 
                  />

                  {/* Panoramic Roof & Glass Windows */}
                  <path d="M47 24 L86 24 L108 34 L45 34 Z" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                  <line x1="68" y1="24" x2="68" y2="34" stroke="#475569" strokeWidth="1.5" />

                  {/* Headlight & Taillight */}
                  <path d="M128 39 L134 40 L132 44 Z" fill="#ffffff" />
                  <path d="M15 40 L18 40 L17 44 Z" fill="#f43f5e" />

                  {/* Side Character Line & Door Handles */}
                  <path d="M30 40 L115 40" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1" />
                  <rect x="52" y="36" width="6" height="1.5" rx="0.5" fill="#020617" />
                  <rect x="80" y="36" width="6" height="1.5" rx="0.5" fill="#020617" />

                  {/* Rear Wheel */}
                  <g className="animate-wheel-spin" style={{ transformOrigin: '38px 48px' }}>
                    <circle cx="38" cy="48" r="12" stroke="#020617" strokeWidth="5" fill="#0f172a" />
                    <circle cx="38" cy="48" r="8" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
                    <circle cx="38" cy="48" r="3.5" fill="#cbd5e1" />
                  </g>

                  {/* Front Wheel */}
                  <g className="animate-wheel-spin" style={{ transformOrigin: '108px 48px' }}>
                    <circle cx="108" cy="48" r="12" stroke="#020617" strokeWidth="5" fill="#0f172a" />
                    <circle cx="108" cy="48" r="8" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
                    <circle cx="108" cy="48" r="3.5" fill="#cbd5e1" />
                  </g>
                </svg>
              )}
            </div>
          </motion.div>
        </div>

        {/* Asphalt Roadway with Animated Center Lane */}
        <div className="relative w-full h-8 bg-gradient-to-b from-[#181d2e] via-[#111422] to-[#0a0c16] border-t border-cyan-500/30 overflow-hidden flex items-center">
          {/* Animated Center Dashes */}
          <div className="absolute inset-0 flex items-center animate-road-fast">
            {[...Array(30)].map((_, idx) => (
              <div
                key={idx}
                className="w-8 h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 rounded-full mx-3 shrink-0 shadow-sm shadow-amber-400/50"
              />
            ))}
          </div>

          {/* Road Curb Bottom Glow */}
          <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
        </div>
      </div>

      {/* Interactive Milestone Scrub Bar */}
      <div className="mt-4 pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Simulated Timeline:</span>
          <div className="flex items-center gap-1">
            {timeline.map((pt) => (
              <button
                key={pt.year}
                type="button"
                onClick={() => {
                  setIsPlaying(false)
                  onYearSelect(pt.year)
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeYear === pt.year
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-500/30 scale-105 border border-white/20'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                Yr {pt.year}
              </button>
            ))}
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
            <span className="text-slate-500">Net Cost:</span>
            <span className="font-bold text-indigo-300">₹{currentPoint.net_cost_per_km || 0}/km</span>
          </div>
        </div>
      </div>
    </div>
  )
}
