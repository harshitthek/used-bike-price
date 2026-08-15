import React from 'react'
import { AlertTriangle, Compass, ArrowRight, Gauge, Activity, LineChart } from 'lucide-react'

export function NotFoundView({ onNavigate }) {
  return (
    <div className="min-h-[65vh] flex items-center justify-center py-12 px-4">
      <div className="relative max-w-lg w-full rounded-3xl bg-slate-900/80 border border-white/10 p-8 sm:p-10 text-center backdrop-blur-2xl shadow-2xl overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold tracking-wide uppercase mb-6">
            <AlertTriangle size={14} />
            <span>404 — Route Unmapped</span>
          </div>

          <h1 className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-3">
            404
          </h1>

          <h2 className="text-xl font-bold text-white mb-3">
            Off-Road Track Deviation
          </h2>

          <p className="text-sm text-slate-400 leading-relaxed mb-8">
            The valuation telemetry path or simulator coordinate you requested does not exist in our catalog. Select one of the verified bays below to resume.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => onNavigate('single')}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-cyan-500 to-emerald-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Gauge size={18} />
              <span>Return to Valuation Studio</span>
              <ArrowRight size={16} />
            </button>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => onNavigate('simulator')}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <Activity size={15} className="text-cyan-400" />
                <span>Lifecycle Simulator</span>
              </button>

              <button
                onClick={() => onNavigate('trends')}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <LineChart size={15} className="text-emerald-400" />
                <span>Price Trends</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFoundView
