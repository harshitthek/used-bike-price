import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { 
  Zap, 
  Scale, 
  Activity, 
  Layers, 
  TrendingUp, 
  Cpu, 
  Bike, 
  Car, 
  AlertTriangle,
  History,
  ShieldCheck
} from 'lucide-react'

import { GlassCard } from './components/ui/GlassCard'
import { SingleValuationView } from './views/SingleValuationView'
import { CompareView } from './views/CompareView'
import { SimulatorView } from './views/SimulatorView'
import { FleetBatchView } from './views/FleetBatchView'
import { TrendsView } from './views/TrendsView'
import { AdminDashboard } from './views/AdminDashboard'
import { HistoryPanel } from './views/HistoryPanel'
import { CertificateModal } from './views/CertificateModal'
import { useValuationHistory } from './hooks/useValuationHistory'
import { apiGet } from './hooks/useApi'

function App() {
  // Navigation View Modes: 'single' | 'compare' | 'sim' | 'fleet' | 'trends' | 'admin'
  const [viewMode, setViewMode] = useState('single')
  const [vehicleType, setVehicleType] = useState('bike')

  // Global Valuation Form State
  const [bikeData, setBikeData] = useState({
    brand: 'Royal Enfield',
    power: 350,
    kms_driven: 15000,
    age: 3,
    owner_rank: 1
  })

  const [carData, setCarData] = useState({
    brand: 'Maruti',
    fuel: 'Petrol',
    transmission: 'Manual',
    engine_cc: 1197,
    max_power_bhp: 82,
    kms_driven: 35000,
    age: 4,
    owner_rank: 1
  })

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Contract & Modal States
  const [contracts, setContracts] = useState({ bike: null, car: null })
  const [contractError, setContractError] = useState(null)
  const [showCertModal, setShowCertModal] = useState(false)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)

  // Local Storage Valuation History Hook
  const {
    history,
    saveValuation,
    deleteValuation,
    clearHistory,
    exportHistory
  } = useValuationHistory()

  // Background Parallax
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const bgX = useTransform(mouseX, [0, typeof window !== 'undefined' ? window.innerWidth : 1000], [-12, 12])
  const bgY = useTransform(mouseY, [0, typeof window !== 'undefined' ? window.innerHeight : 1000], [-12, 12])

  // Fetch contracts for both bike and car on mount
  useEffect(() => {
    Promise.all([
      apiGet('/contract?vehicle_type=bike'),
      apiGet('/contract?vehicle_type=car')
    ])
      .then(([bikeContract, carContract]) => {
        setContracts({ bike: bikeContract, car: carContract })
      })
      .catch(err => setContractError(err.message || 'Failed to initialize API contract'))
  }, [])

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  // Check URL params for shared certificate on load (?cert=HASH)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const certHash = params.get('cert')
    if (certHash) {
      apiGet(`/certificates/${certHash}`)
        .then(data => {
          if (data && data.result) {
            setVehicleType(data.vehicle_type)
            if (data.vehicle_type === 'bike') {
              setBikeData(data.input)
            } else {
              setCarData(data.input)
            }
            setResult(data.result)
            setShowCertModal(true)
          }
        })
        .catch(() => {})
    }
  }, [])

  const handleSelectHistoricalValuation = (savedItem) => {
    setVehicleType(savedItem.vehicleType)
    if (savedItem.vehicleType === 'bike') {
      setBikeData(savedItem.input)
    } else {
      setCarData(savedItem.input)
    }
    setResult({
      estimated_price: savedItem.estimatedPrice,
      price_range: savedItem.priceRange,
      confidence: savedItem.confidence
    })
    setViewMode('single')
  }

  const activeContract = contracts[vehicleType]

  if (contractError) {
    return (
      <div className="relative min-h-screen grid-pattern flex items-center justify-center p-6">
        <GlassCard className="max-w-md text-center p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold mb-4">
            <AlertTriangle size={14} />
            Initialization Failed
          </div>
          <p className="text-slate-400 mb-4 text-sm">{contractError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white cursor-pointer"
          >
            Retry Connection
          </button>
        </GlassCard>
      </div>
    )
  }

  if (!activeContract) {
    return (
      <div className="relative min-h-screen grid-pattern flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-white/10" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
          </div>
          <p className="text-xs font-medium text-slate-400">Loading Automotive Intelligence Models...</p>
        </div>
      </div>
    )
  }

  const currentFormData = vehicleType === 'bike' ? bikeData : carData

  return (
    <div className="relative min-h-screen grid-pattern selection:bg-indigo-500 selection:text-white text-slate-100">
      {/* Floating dynamic background orbs */}
      <motion.div className="orb-container" style={{ x: bgX, y: bgY }}>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </motion.div>

      {/* Glass Header Navigation */}
      <header className="relative z-20 border-b border-white/[0.08] bg-[#07080b]/80 backdrop-blur-2xl no-print sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo & Platform Tag */}
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/20">
              {vehicleType === 'bike' ? <Bike size={20} className="text-white" /> : <Car size={20} className="text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-white font-display">AutoValuate AI</h1>
                <span className="text-[9px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Enterprise Suite
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Automotive Machine Learning Valuation Platform</p>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
            {[
              { id: 'single', label: 'Valuation', icon: <Zap size={13} /> },
              { id: 'compare', label: 'Compare', icon: <Scale size={13} /> },
              { id: 'sim', label: 'Simulator', icon: <Activity size={13} /> },
              { id: 'fleet', label: 'Fleet Batch', icon: <Layers size={13} /> },
              { id: 'trends', label: 'Trends', icon: <TrendingUp size={13} /> },
              { id: 'admin', label: 'MLOps', icon: <Cpu size={13} /> }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setViewMode(tab.id)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === tab.id ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {viewMode === tab.id && (
                  <motion.div
                    layoutId="active-view-tab"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-md shadow-indigo-500/30 border border-white/20"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {tab.icon} {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main View Router */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {viewMode === 'single' && (
          <SingleValuationView
            vehicleType={vehicleType}
            setVehicleType={setVehicleType}
            bikeData={bikeData}
            setBikeData={setBikeData}
            carData={carData}
            setCarData={setCarData}
            result={result}
            setResult={setResult}
            loading={loading}
            setLoading={setLoading}
            error={error}
            setError={setError}
            contracts={contracts}
            onOpenCertificate={() => setShowCertModal(true)}
            onSaveToHistory={saveValuation}
            onOpenHistory={() => setShowHistoryPanel(true)}
          />
        )}

        {viewMode === 'compare' && (
          <CompareView contracts={contracts} />
        )}

        {viewMode === 'sim' && (
          <SimulatorView contracts={contracts} />
        )}

        {viewMode === 'fleet' && (
          <FleetBatchView contracts={contracts} />
        )}

        {viewMode === 'trends' && (
          <TrendsView />
        )}

        {viewMode === 'admin' && (
          <AdminDashboard />
        )}
      </main>

      {/* Platform Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-8 border-t border-white/[0.06] text-center text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-300">AutoValuate AI</span>
          <span>•</span>
          <span className="text-slate-400">Dual-Engine Stacking Intelligence (97.4% R²)</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <span>Built by <a href="https://github.com/harshitthek" target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Harshit (@harshitthek)</a></span>
          <span>•</span>
          <span>40,000+ Records</span>
          <span>•</span>
          <span className="font-mono text-emerald-400">v2.4.0 Live</span>
        </div>
      </footer>

      {/* Slide-out History Drawer */}
      <HistoryPanel
        isOpen={showHistoryPanel}
        onClose={() => setShowHistoryPanel(false)}
        history={history}
        onSelectValuation={handleSelectHistoricalValuation}
        onDeleteValuation={deleteValuation}
        onClearHistory={clearHistory}
        onExportHistory={exportHistory}
      />

      {/* Official Certificate Modal */}
      <CertificateModal
        show={showCertModal}
        onClose={() => setShowCertModal(false)}
        result={result}
        formData={currentFormData}
        vehicleType={vehicleType}
      />
    </div>
  )
}

export default App
