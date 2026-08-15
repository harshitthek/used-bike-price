import React, { useState, useEffect } from 'react'
import { 
  Activity, 
  RefreshCw, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  Database, 
  Clock, 
  BarChart2, 
  Check, 
  Cpu
} from 'lucide-react'
import { GlassCard } from '../components/ui/GlassCard'
import { apiGet, apiPost } from '../hooks/useApi'

export function AdminDashboard() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloading, setReloading] = useState(false)
  const [reloadSuccess, setReloadSuccess] = useState(null)

  const fetchReport = () => {
    setLoading(true)
    setError(null)
    apiGet('/admin/drift-report')
      .then(data => {
        setReport(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Could not fetch drift monitoring report')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchReport()
  }, [])

  const handleReloadModels = async () => {
    setReloading(true)
    setReloadSuccess(null)
    try {
      const res = await apiPost('/admin/reload-models', {})
      setReloadSuccess(res.message || 'Models hot-reloaded successfully from disk.')
      setTimeout(() => setReloadSuccess(null), 4000)
    } catch (err) {
      setError(err.message || 'Failed to reload models.')
    } finally {
      setReloading(false)
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'stable') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
          <ShieldCheck size={12} /> Stable
        </span>
      )
    }
    if (status === 'monitor') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
          <AlertTriangle size={12} /> Monitor
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
        <ShieldAlert size={12} /> Drift
      </span>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <GlassCard className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Telemetry, Drift Detection & Production Operations
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  MLOps Suite
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Live Population Stability Index (PSI) monitoring, inference telemetry, and zero-downtime hot reloading
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchReport}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Telemetry
            </button>

            <button
              type="button"
              onClick={handleReloadModels}
              disabled={reloading}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-colors cursor-pointer"
            >
              <Cpu size={14} className={reloading ? 'animate-spin' : ''} /> Hot-Reload Models
            </button>
          </div>
        </div>

        {reloadSuccess && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check size={14} /> {reloadSuccess}
          </div>
        )}
      </GlassCard>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Live Inferences</span>
            <p className="text-2xl font-black text-white font-mono mt-1">
              {report?.total_predictions?.toLocaleString('en-IN') || 0}
            </p>
            <span className="text-[11px] text-slate-500">Logged in persistent telemetry store</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Database size={18} />
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Last 24h Inferences</span>
            <p className="text-2xl font-black text-cyan-400 font-mono mt-1">
              {report?.predictions_24h?.toLocaleString('en-IN') || 0}
            </p>
            <span className="text-[11px] text-slate-500">Rolling throughput activity</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Clock size={18} />
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Production Stability</span>
            <div className="mt-1">
              {getStatusBadge(report?.recommendation || 'stable')}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {report?.recommendation === 'stable' ? 'All input features in baseline' : 'Action recommended'}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <BarChart2 size={18} />
          </div>
        </GlassCard>
      </div>

      {/* Population Stability Index (PSI) Table */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Population Stability Index (PSI) Feature Breakdown</h3>
            <p className="text-xs text-slate-400">
              Evaluates statistical shift between training dataset distributions and live incoming requests.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
            <span>PSI &lt; 0.10: Stable</span>
            <span>0.10 - 0.20: Moderate Shift</span>
            <span>&gt; 0.20: Significant Drift</span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Computing Population Stability Index against baseline distributions...
          </div>
        ) : error ? (
          <div className="py-8 text-center text-rose-400 text-xs">{error}</div>
        ) : !report?.drift_analysis || Object.keys(report.drift_analysis).length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <Activity size={28} className="text-slate-600 mx-auto mb-2" />
            Collecting live prediction telemetry... Need ≥20 requests to calculate empirical PSI scores.
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-slate-400 font-mono text-[10px] uppercase">
                <tr>
                  <th className="py-3 px-4">Feature Dimension</th>
                  <th className="py-3 px-4">PSI Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Live Mean</th>
                  <th className="py-3 px-4">Training Mean</th>
                  <th className="py-3 px-4 text-right">Sample Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {Object.entries(report.drift_analysis).map(([key, data]) => (
                  <tr key={key} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-bold text-white uppercase">{key.replace('_', ' ')}</td>
                    <td className="py-3 px-4 font-bold text-cyan-300">{data.psi}</td>
                    <td className="py-3 px-4">{getStatusBadge(data.status)}</td>
                    <td className="py-3 px-4 text-slate-300">₹{data.recent_mean?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-slate-400">₹{data.training_mean?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right text-slate-400">{data.sample_size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
