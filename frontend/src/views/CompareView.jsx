import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Scale, 
  Bike, 
  Car, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Award,
  Zap,
  Gauge
} from 'lucide-react'
import { GlassCard } from '../components/ui/GlassCard'
import { apiPost } from '../hooks/useApi'

export function CompareView({ contracts }) {
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleCompareSubmit = async () => {
    setLoading(true)
    setError(null)
    setResultA(null)
    setResultB(null)

    try {
      const [resA, resB] = await Promise.all([
        apiPost('/predict', compareA),
        apiPost('/predict', compareB)
      ])
      setTimeout(() => {
        setResultA(resA)
        setResultB(resB)
        setLoading(false)
      }, 400)
    } catch (err) {
      setError(err.message || 'Comparative valuation failed.')
      setLoading(false)
    }
  }

  const priceDiff = resultA && resultB ? Math.abs(resultA.estimated_price - resultB.estimated_price) : 0
  const higherVehicle = resultA && resultB 
    ? (resultA.estimated_price > resultB.estimated_price ? 'Vehicle A' : 'Vehicle B')
    : null

  const getBikeBrands = () => contracts?.bike?.ui?.brands || ['Royal Enfield', 'KTM', 'Bajaj', 'Yamaha', 'Honda', 'TVS']
  const getCarBrands = () => contracts?.car?.ui?.brands || ['Maruti', 'Hyundai', 'Tata', 'Mahindra', 'Toyota', 'Honda']

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <GlassCard className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Scale size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Side-by-Side Comparative Market Appraisal
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Head-to-Head
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Compare valuations, market retention rates, and specification impacts across two vehicles simultaneously
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCompareSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Computing Dual Appraisal...
              </>
            ) : (
              <>
                <Zap size={14} className="text-cyan-300" /> Run Head-to-Head Valuation
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>
        )}
      </GlassCard>

      {/* Dual Vehicle Form Setup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicle A */}
        <GlassCard className="p-6 space-y-4 border-indigo-500/30">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-md bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                A
              </span>
              <h3 className="text-sm font-bold text-white">Vehicle A Configuration</h3>
            </div>

            <div className="flex p-0.5 rounded-lg bg-white/5 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setCompareA(prev => ({ ...prev, vehicle_type: 'bike' }))}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                  compareA.vehicle_type === 'bike' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Bike
              </button>
              <button
                type="button"
                onClick={() => setCompareA(prev => ({ ...prev, vehicle_type: 'car' }))}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                  compareA.vehicle_type === 'car' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Car
              </button>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Brand</label>
              <select
                value={compareA.brand}
                onChange={(e) => setCompareA(prev => ({ ...prev, brand: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50"
              >
                {(compareA.vehicle_type === 'bike' ? getBikeBrands() : getCarBrands()).map(b => (
                  <option key={b} value={b} className="bg-slate-900 text-white">{b}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">
                  {compareA.vehicle_type === 'bike' ? 'Engine (cc)' : 'Engine Displacement (cc)'}
                </label>
                <input
                  type="number"
                  value={compareA.vehicle_type === 'bike' ? compareA.power : compareA.engine_cc}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    setCompareA(prev => ({ ...prev, power: val, engine_cc: val }))
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Age (Years)</label>
                <input
                  type="number"
                  value={compareA.age}
                  onChange={(e) => setCompareA(prev => ({ ...prev, age: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Odometer (km)</label>
                <input
                  type="number"
                  value={compareA.kms_driven}
                  onChange={(e) => setCompareA(prev => ({ ...prev, kms_driven: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Ownership Rank</label>
                <select
                  value={compareA.owner_rank}
                  onChange={(e) => setCompareA(prev => ({ ...prev, owner_rank: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50"
                >
                  <option value={1} className="bg-slate-900 text-white">First Owner (Rank 1)</option>
                  <option value={2} className="bg-slate-900 text-white">Second Owner (Rank 2)</option>
                  <option value={3} className="bg-slate-900 text-white">Third Owner (Rank 3)</option>
                  <option value={4} className="bg-slate-900 text-white">Fourth Owner (Rank 4)</option>
                </select>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Vehicle B */}
        <GlassCard className="p-6 space-y-4 border-cyan-500/30">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-md bg-cyan-600 text-white font-black text-xs flex items-center justify-center">
                B
              </span>
              <h3 className="text-sm font-bold text-white">Vehicle B Configuration</h3>
            </div>

            <div className="flex p-0.5 rounded-lg bg-white/5 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setCompareB(prev => ({ ...prev, vehicle_type: 'bike' }))}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                  compareB.vehicle_type === 'bike' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Bike
              </button>
              <button
                type="button"
                onClick={() => setCompareB(prev => ({ ...prev, vehicle_type: 'car' }))}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                  compareB.vehicle_type === 'car' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Car
              </button>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Brand</label>
              <select
                value={compareB.brand}
                onChange={(e) => setCompareB(prev => ({ ...prev, brand: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50"
              >
                {(compareB.vehicle_type === 'bike' ? getBikeBrands() : getCarBrands()).map(b => (
                  <option key={b} value={b} className="bg-slate-900 text-white">{b}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">
                  {compareB.vehicle_type === 'bike' ? 'Engine (cc)' : 'Engine Displacement (cc)'}
                </label>
                <input
                  type="number"
                  value={compareB.vehicle_type === 'bike' ? compareB.power : compareB.engine_cc}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    setCompareB(prev => ({ ...prev, power: val, engine_cc: val }))
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Age (Years)</label>
                <input
                  type="number"
                  value={compareB.age}
                  onChange={(e) => setCompareB(prev => ({ ...prev, age: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Odometer (km)</label>
                <input
                  type="number"
                  value={compareB.kms_driven}
                  onChange={(e) => setCompareB(prev => ({ ...prev, kms_driven: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Ownership Rank</label>
                <select
                  value={compareB.owner_rank}
                  onChange={(e) => setCompareB(prev => ({ ...prev, owner_rank: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50"
                >
                  <option value={1} className="bg-slate-900 text-white">First Owner (Rank 1)</option>
                  <option value={2} className="bg-slate-900 text-white">Second Owner (Rank 2)</option>
                  <option value={3} className="bg-slate-900 text-white">Third Owner (Rank 3)</option>
                  <option value={4} className="bg-slate-900 text-white">Fourth Owner (Rank 4)</option>
                </select>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Comparison Results Card */}
      {resultA && resultB && (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Vehicle A Result */}
            <GlassCard className="p-6 text-center border-indigo-500/40 relative overflow-hidden">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Vehicle A Appraisal</span>
              <h4 className="text-base font-bold text-white mt-1">{compareA.brand} ({compareA.vehicle_type})</h4>
              <p className="text-3xl font-black text-white font-display mt-2">
                ₹{resultA.estimated_price?.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Authorized: ₹{resultA.price_range?.min?.toLocaleString('en-IN')} – ₹{resultA.price_range?.max?.toLocaleString('en-IN')}
              </p>
              <span className="inline-block mt-3 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-bold">
                {resultA.confidence || '92.0% Confidence'}
              </span>
            </GlassCard>

            {/* Differential / Head-to-Head Metric */}
            <GlassCard className="p-6 flex flex-col items-center justify-center text-center bg-gradient-to-b from-white/[0.04] to-transparent">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Valuation Spread</span>
              <p className="text-2xl font-black text-cyan-300 font-mono mt-1">
                ₹{priceDiff.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-300 mt-1 font-semibold">
                {higherVehicle} commands +{Math.round((priceDiff / Math.min(resultA.estimated_price, resultB.estimated_price)) * 100)}% premium
              </p>
              <div className="mt-4 pt-4 border-t border-white/10 w-full flex items-center justify-around text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">Km Delta</span>
                  <span className="text-white font-bold">{Math.abs(compareA.kms_driven - compareB.kms_driven).toLocaleString('en-IN')} km</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Age Delta</span>
                  <span className="text-white font-bold">{Math.abs(compareA.age - compareB.age)} yrs</span>
                </div>
              </div>
            </GlassCard>

            {/* Vehicle B Result */}
            <GlassCard className="p-6 text-center border-cyan-500/40 relative overflow-hidden">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Vehicle B Appraisal</span>
              <h4 className="text-base font-bold text-white mt-1">{compareB.brand} ({compareB.vehicle_type})</h4>
              <p className="text-3xl font-black text-white font-display mt-2">
                ₹{resultB.estimated_price?.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Authorized: ₹{resultB.price_range?.min?.toLocaleString('en-IN')} – ₹{resultB.price_range?.max?.toLocaleString('en-IN')}
              </p>
              <span className="inline-block mt-3 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] font-bold">
                {resultB.confidence || '92.0% Confidence'}
              </span>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  )
}
