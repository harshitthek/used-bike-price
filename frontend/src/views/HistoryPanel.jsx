import React from 'react'
import { 
  History, 
  X, 
  Trash2, 
  Download, 
  ExternalLink, 
  Bike, 
  Car, 
  Calendar, 
  Gauge, 
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { GlassCard } from '../components/ui/GlassCard'

export function HistoryPanel({
  isOpen,
  onClose,
  history,
  onSelectValuation,
  onDeleteValuation,
  onClearHistory,
  onExportHistory
}) {
  // Lock background page scroll when panel is open
  React.useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prevOverflow
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div 
        className="w-full max-w-md bg-[#090b12] border-l border-white/10 h-full flex flex-col p-6 shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <History size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Saved Valuations</h3>
              <p className="text-[10px] text-slate-400">Stored in browser local storage</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action bar */}
        {history.length > 0 && (
          <div className="flex items-center justify-between py-3 border-b border-white/5 text-xs">
            <span className="text-slate-400 text-[11px] font-mono">{history.length} / 20 saved</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onExportHistory}
                className="text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Download size={12} /> Export JSON
              </button>
              <button
                type="button"
                onClick={onClearHistory}
                className="text-[11px] font-medium text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                <Trash2 size={12} /> Clear All
              </button>
            </div>
          </div>
        )}

        {/* History List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 custom-scrollbar">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <History size={36} className="text-slate-600 mb-3" />
              <p className="text-xs font-semibold text-slate-400">No Saved Valuations Yet</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                Run a vehicle appraisal and click "Save to History" to track valuations here.
              </p>
            </div>
          ) : (
            history.map(item => (
              <div
                key={item.id}
                className="group relative p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-indigo-500/40 transition-all cursor-pointer"
                onClick={() => {
                  onSelectValuation(item)
                  onClose()
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-300">
                      {item.vehicleType === 'bike' ? <Bike size={14} /> : <Car size={14} />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {item.brand}
                      </h4>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                        {item.vehicleType} • {item.input?.kms_driven?.toLocaleString('en-IN')} km • {item.input?.age} yrs
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteValuation(item.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-all cursor-pointer"
                    aria-label="Delete saved valuation"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    ₹{item.estimatedPrice?.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(item.savedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
