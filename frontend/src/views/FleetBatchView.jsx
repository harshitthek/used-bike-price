import React, { useState } from 'react'
import { 
  Layers, 
  Plus, 
  Trash2, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Bike, 
  Car, 
  Sparkles,
  Download,
  Building,
  TrendingUp,
  Award
} from 'lucide-react'
import { GlassCard } from '../components/ui/GlassCard'
import { apiPost } from '../hooks/useApi'

export function FleetBatchView({ contracts }) {
  const [fleetList, setFleetList] = useState([
    { vehicle_type: 'bike', brand: 'Royal Enfield', power: 350, engine_cc: 350, kms_driven: 15000, age: 3, owner_rank: 1, fuel: 'Petrol', transmission: 'Manual' },
    { vehicle_type: 'car', brand: 'Maruti', power: 1197, engine_cc: 1197, kms_driven: 35000, age: 4, owner_rank: 1, fuel: 'Petrol', transmission: 'Manual' },
    { vehicle_type: 'car', brand: 'Hyundai', power: 1493, engine_cc: 1493, kms_driven: 38000, age: 3, owner_rank: 1, fuel: 'Diesel', transmission: 'Automatic' },
    { vehicle_type: 'car', brand: 'Tata', power: 1199, engine_cc: 1199, kms_driven: 26000, age: 2, owner_rank: 1, fuel: 'Petrol', transmission: 'Manual' },
    { vehicle_type: 'bike', brand: 'KTM', power: 373, engine_cc: 373, kms_driven: 9000, age: 2, owner_rank: 1, fuel: 'Petrol', transmission: 'Manual' }
  ])

  const [fleetResult, setFleetResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleFleetBatchSubmit = async () => {
    setLoading(true)
    setError(null)
    setFleetResult(null)

    try {
      const data = await apiPost('/predict/batch', { vehicles: fleetList })
      setTimeout(() => {
        setFleetResult(data)
        setLoading(false)
      }, 450)
    } catch (err) {
      setError(err.message || 'Fleet batch appraisal failed.')
      setFleetResult(null)
      setLoading(false)
    }
  }

  const handleAddVehicle = (type = 'bike') => {
    if (fleetList.length >= 50) return
    const newVehicle = type === 'bike'
      ? { vehicle_type: 'bike', brand: 'Royal Enfield', power: 350, engine_cc: 350, kms_driven: 20000, age: 3, owner_rank: 1, fuel: 'Petrol', transmission: 'Manual' }
      : { vehicle_type: 'car', brand: 'Maruti', power: 1197, engine_cc: 1197, kms_driven: 40000, age: 4, owner_rank: 1, fuel: 'Petrol', transmission: 'Manual' }
    
    setFleetResult(null)
    setFleetList(prev => [...prev, newVehicle])
  }

  const handleRemoveVehicle = (indexToRemove) => {
    setFleetResult(null)
    setFleetList(prev => prev.filter((_, i) => i !== indexToRemove))
  }

  const handleExportCsv = () => {
    if (!fleetResult?.predictions) return
    const headers = ['Type', 'Brand', 'Engine (cc)', 'Kms Driven', 'Age (yrs)', 'Owner Rank', 'Valuation (INR)']
    const rows = fleetList.map((item, idx) => [
      item.vehicle_type,
      item.brand,
      item.power || item.engine_cc,
      item.kms_driven,
      item.age,
      item.owner_rank,
      fleetResult.predictions[idx]?.estimated_price || 'N/A'
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `fleet_valuation_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <GlassCard className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Building size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Enterprise Fleet & Dealership Batch Valuation
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Bulk Pipeline
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Execute parallel real-time valuations across mixed inventories of two-wheelers and commercial passenger cars
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAddVehicle('bike')}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus size={13} /> Add Bike
              </button>
              <button
                type="button"
                onClick={() => handleAddVehicle('car')}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus size={13} /> Add Car
              </button>
            </div>

            <button
              type="button"
              onClick={handleFleetBatchSubmit}
              disabled={loading || fleetList.length === 0}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Valuating {fleetList.length} Assets...
                </>
              ) : (
                <>
                  <Zap size={14} className="text-cyan-300" /> Appraise Fleet ({fleetList.length})
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>
        )}
      </GlassCard>

      {/* Portfolio Summary Stats */}
      {fleetResult?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-bottom duration-300">
          <GlassCard className="p-5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Portfolio Value</span>
            <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
              ₹{fleetResult.summary.total_portfolio_value?.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{fleetResult.summary.total_vehicles} total assets appraised</span>
          </GlassCard>

          <GlassCard className="p-5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Average Unit Valuation</span>
            <p className="text-2xl font-black text-white font-mono mt-1">
              ₹{fleetResult.summary.average_valuation?.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Portfolio mean across inventory</span>
          </GlassCard>

          <GlassCard className="p-5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Top-Tier Asset Value</span>
            <p className="text-2xl font-black text-cyan-300 font-mono mt-1">
              ₹{fleetResult.summary.max_valuation?.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Highest single vehicle appraisal</span>
          </GlassCard>

          <GlassCard className="p-5 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Export & Reporting</span>
            <button
              type="button"
              onClick={handleExportCsv}
              className="w-full mt-2 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download size={13} /> Export Fleet CSV
            </button>
          </GlassCard>
        </div>
      )}

      {/* Fleet Inventory Table */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Active Inventory Schedule</h3>
          <span className="text-[11px] text-slate-400 font-mono">{fleetList.length} of 50 maximum entries</span>
        </div>

        <div className="rounded-xl border border-white/10 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-slate-400 font-mono text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Brand</th>
                <th className="py-3 px-4">Displacement</th>
                <th className="py-3 px-4">Odometer</th>
                <th className="py-3 px-4">Age</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Appraisal Value</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {fleetList.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 text-slate-500 font-bold">{idx + 1}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 font-sans">
                      {item.vehicle_type === 'bike' ? <Bike size={13} className="text-indigo-400" /> : <Car size={13} className="text-cyan-400" />}
                      {item.vehicle_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-white font-sans">{item.brand}</td>
                  <td className="py-3 px-4 text-slate-300">{item.power || item.engine_cc} cc</td>
                  <td className="py-3 px-4 text-slate-300">{item.kms_driven?.toLocaleString('en-IN')} km</td>
                  <td className="py-3 px-4 text-slate-300">{item.age} yrs</td>
                  <td className="py-3 px-4 text-slate-300">Rank {item.owner_rank}</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">
                    {fleetResult?.predictions?.[idx] ? `₹${fleetResult.predictions[idx].estimated_price?.toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      aria-label="Remove vehicle from fleet"
                      onClick={() => handleRemoveVehicle(idx)}
                      className="text-rose-400 hover:text-rose-300 cursor-pointer p-1 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
