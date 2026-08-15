import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  Bike, 
  Car, 
  Sparkles, 
  AlertTriangle, 
  Calendar, 
  Fuel, 
  ShieldCheck, 
  TrendingDown, 
  Zap, 
  Award,
  ChevronRight,
  Info
} from 'lucide-react'
import { GlassCard } from '../components/ui/GlassCard'
import { AnimatedVehicleStage } from '../components/ui/AnimatedVehicleStage'
import { apiPost } from '../hooks/useApi'

export function SimulatorView({ contracts }) {
  const [simData, setSimData] = useState({
    vehicle_type: 'bike',
    brand: 'Royal Enfield',
    power: 350,
    engine_cc: 350,
    max_power_bhp: 20,
    fuel: 'Petrol',
    transmission: 'Manual',
    purchase_price: 220000,
    current_age: 0,
    current_kms: 0,
    owner_rank: 1,
    annual_kms: 10000,
    horizon_years: 5,
    custom_fuel_price: 102,
    custom_mileage_kml: 35
  })

  const [simResult, setSimResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeYear, setActiveYear] = useState(null)

  const handleRunSimulation = async (overrideData = null) => {
    const dataToUse = overrideData || simData
    setLoading(true)
    setError(null)
    try {
      const data = await apiPost('/simulate/lifecycle', dataToUse)
      setSimResult(data)
      setActiveYear(data.optimal_sell_window?.recommended_sell_year || 3)
    } catch (err) {
      setError(err.message || 'Could not connect to simulation server')
    } finally {
      setLoading(false)
    }
  }

  // Run simulation on initial mount if not yet generated
  useEffect(() => {
    if (!simResult) {
      handleRunSimulation()
    }
  }, [])

  const getBikeBrands = () => contracts?.bike?.ui?.brands || ['Royal Enfield', 'KTM', 'Bajaj', 'Yamaha', 'Honda', 'TVS']
  const getCarBrands = () => contracts?.car?.ui?.brands || ['Maruti', 'Hyundai', 'Tata', 'Mahindra', 'Toyota', 'Honda']

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <GlassCard className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-cyan-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Dynamic Vehicle Lifecycle & Total Cost of Ownership (TCO) Simulator
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  5-10 Yr Forecast
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Simulate multi-year depreciation, scheduled maintenance, insurance premiums, and find your optimal liquidation sweet-spot
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleRunSimulation()}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Simulating Lifecycle...
              </>
            ) : (
              <>
                <Zap size={14} className="text-cyan-300" /> Run Full Lifecycle Simulation
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

      {/* Main Simulator Content: Left Controls & Right Stage / Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulator Parameters Form */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Vehicle & Usage Parameters</h3>
            <div className="flex p-0.5 rounded-lg bg-white/5 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => {
                  const updated = {
                    ...simData,
                    vehicle_type: 'bike',
                    brand: 'Royal Enfield',
                    power: 350,
                    engine_cc: 350,
                    purchase_price: 220000,
                    custom_mileage_kml: 35
                  }
                  setSimData(updated)
                  handleRunSimulation(updated)
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                  simData.vehicle_type === 'bike' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Bike
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = {
                    ...simData,
                    vehicle_type: 'car',
                    brand: 'Maruti',
                    power: 1197,
                    engine_cc: 1197,
                    purchase_price: 750000,
                    custom_mileage_kml: 20
                  }
                  setSimData(updated)
                  handleRunSimulation(updated)
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                  simData.vehicle_type === 'car' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
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
                value={simData.brand}
                onChange={(e) => setSimData(prev => ({ ...prev, brand: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50"
              >
                {(simData.vehicle_type === 'bike' ? getBikeBrands() : getCarBrands()).map(b => (
                  <option key={b} value={b} className="bg-slate-900 text-white">{b}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Initial Price (₹)</label>
                <input
                  type="number"
                  value={simData.purchase_price}
                  onChange={(e) => setSimData(prev => ({ ...prev, purchase_price: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Annual Distance (km)</label>
                <input
                  type="number"
                  value={simData.annual_kms}
                  onChange={(e) => setSimData(prev => ({ ...prev, annual_kms: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Horizon (Years)</label>
                <select
                  value={simData.horizon_years}
                  onChange={(e) => setSimData(prev => ({ ...prev, horizon_years: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50"
                >
                  <option value={3} className="bg-slate-900 text-white">3 Years</option>
                  <option value={5} className="bg-slate-900 text-white">5 Years</option>
                  <option value={7} className="bg-slate-900 text-white">7 Years</option>
                  <option value={10} className="bg-slate-900 text-white">10 Years</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Fuel Price (₹/L)</label>
                <input
                  type="number"
                  value={simData.custom_fuel_price}
                  onChange={(e) => setSimData(prev => ({ ...prev, custom_fuel_price: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Dynamic Simulation Stage & Sweet-Spot */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatedVehicleStage
            vehicleType={simData.vehicle_type}
            brand={simData.brand}
            speedKmh={60}
          />

          {/* Optimal Liquidation Sweet-Spot Card */}
          {simResult?.optimal_sell_window && (
            <GlassCard className="p-5 border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-indigo-950/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Award size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                      Optimal Liquidation Sweet-Spot
                    </span>
                    <h4 className="text-base font-bold text-white">
                      Recommended Exit: Year {simResult.optimal_sell_window.recommended_sell_year} ({new Date().getFullYear() + simResult.optimal_sell_window.recommended_sell_year})
                    </h4>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-400 block">Effective Monthly Burn</span>
                  <span className="text-lg font-black text-emerald-400">
                    ₹{simResult.optimal_sell_window.effective_monthly_cost?.toLocaleString('en-IN')}/mo
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-300 mt-2">
                {simResult.optimal_sell_window.reasoning}
              </p>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Progressive Lifecycle Timeline Table */}
      {simResult?.timeline && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Multi-Year Total Cost of Ownership (TCO) Timeline</h3>
            <span className="text-[11px] text-slate-400 font-mono">Simulated over {simData.horizon_years} years @ {simData.annual_kms.toLocaleString('en-IN')} km/yr</span>
          </div>

          <div className="rounded-xl border border-white/10 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-white/5 text-slate-400 text-[10px] uppercase">
                <tr>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4">Odometer</th>
                  <th className="py-3 px-4">Resale Value</th>
                  <th className="py-3 px-4">Fuel Exp</th>
                  <th className="py-3 px-4">Maintenance</th>
                  <th className="py-3 px-4">Insurance</th>
                  <th className="py-3 px-4">Cumulative TCO</th>
                  <th className="py-3 px-4 text-right">Net Cost / km</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {simResult.timeline.map((row) => (
                  <tr 
                    key={row.year} 
                    onClick={() => setActiveYear(row.year)}
                    className={`hover:bg-white/[0.02] cursor-pointer transition-colors ${
                      activeYear === row.year ? 'bg-indigo-500/10' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-white font-bold">Yr {row.year} ({row.calendar_year})</td>
                    <td className="py-3 px-4 text-slate-300">{row.total_kms?.toLocaleString('en-IN')} km</td>
                    <td className="py-3 px-4 text-cyan-300 font-bold">₹{row.resale_value?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-slate-400">₹{row.annual_fuel_cost?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-slate-400">₹{row.annual_maintenance?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-slate-400">₹{row.annual_insurance?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-indigo-300 font-bold">₹{row.cumulative_tco?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold text-right">₹{row.net_cost_per_km}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
