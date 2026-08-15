import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Bike, 
  Car, 
  Search, 
  BarChart3, 
  Calendar, 
  Info,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck
} from 'lucide-react'
import { GlassCard } from '../components/ui/GlassCard'
import { apiGet } from '../hooks/useApi'

export function TrendsView() {
  const [vehicleType, setVehicleType] = useState('bike')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [metric, setMetric] = useState('median')
  const [brandSearch, setBrandSearch] = useState('')
  const [trendsData, setTrendsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activePoint, setActivePoint] = useState(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    const endpoint = `/api/v1/trends?vehicle_type=${vehicleType}${selectedBrand ? `&brand=${encodeURIComponent(selectedBrand)}` : ''}&metric=${metric}`
    
    apiGet(endpoint)
      .then(res => {
        if (isMounted) {
          setTrendsData(res)
          // If no brand was selected, select the first popular brand default
          if (!selectedBrand && res.available_brands?.length > 0) {
            const defaultBrand = vehicleType === 'bike' ? 'Royal Enfield' : 'Maruti'
            if (res.available_brands.includes(defaultBrand)) {
              setSelectedBrand(defaultBrand)
            }
          }
          setLoading(false)
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message || 'Failed to load price trends')
          setLoading(false)
        }
      })

    return () => { isMounted = false }
  }, [vehicleType, selectedBrand, metric])

  const availableBrands = trendsData?.available_brands || []
  const filteredBrands = availableBrands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()))

  // Filter data for the currently selected brand
  const chartPoints = (trendsData?.data || []).filter(
    d => !selectedBrand || d.brand.toLowerCase() === selectedBrand.toLowerCase()
  )

  // Chart dimensions & scale calculations
  const width = 640
  const height = 240
  const padding = { top: 20, right: 30, bottom: 40, left: 60 }

  const minYear = chartPoints.length > 0 ? Math.min(...chartPoints.map(d => d.year)) : 2010
  const maxYear = chartPoints.length > 0 ? Math.max(...chartPoints.map(d => d.year)) : 2024

  const allPrices = chartPoints.flatMap(d => [d.price, d.p25, d.p75])
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) * 0.9 : 0
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) * 1.1 : 100000

  const getX = (year) => {
    if (maxYear === minYear) return (width - padding.left - padding.right) / 2 + padding.left
    return padding.left + ((year - minYear) / (maxYear - minYear)) * (width - padding.left - padding.right)
  }

  const getY = (price) => {
    if (maxPrice === minPrice) return (height - padding.top - padding.bottom) / 2 + padding.top
    return height - padding.bottom - ((price - minPrice) / (maxPrice - minPrice)) * (height - padding.top - padding.bottom)
  }

  // Generate SVG Path
  const sortedPoints = [...chartPoints].sort((a, b) => a.year - b.year)
  const linePath = sortedPoints.reduce((acc, p, idx) => {
    const x = getX(p.year)
    const y = getY(p.price)
    return idx === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`
  }, '')

  // Generate Corridor Path (P25 to P75 band)
  const corridorPath = sortedPoints.length > 1 ? (
    sortedPoints.reduce((acc, p, idx) => {
      const x = getX(p.year)
      const y = getY(p.p75)
      return idx === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`
    }, '') +
    [...sortedPoints].reverse().reduce((acc, p) => {
      const x = getX(p.year)
      const y = getY(p.p25)
      return `${acc} L ${x},${y}`
    }, '') + ' Z'
  ) : ''

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <GlassCard className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Automotive Price Trends & Market Analysis
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Empirical History
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Aggregated transaction values, 25th-75th percentile market corridors, and brand depreciation curves
              </p>
            </div>
          </div>

          {/* Vehicle Type & Metric Filters */}
          <div className="flex items-center gap-3">
            {/* Vehicle Type Switch */}
            <div className="flex p-1 rounded-xl bg-white/[0.04] border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setVehicleType('bike')
                  setSelectedBrand('Royal Enfield')
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  vehicleType === 'bike' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bike size={14} /> Motorcycle
              </button>
              <button
                type="button"
                onClick={() => {
                  setVehicleType('car')
                  setSelectedBrand('Maruti')
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  vehicleType === 'car' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Car size={14} /> Passenger Car
              </button>
            </div>

            {/* Metric Switch */}
            <div className="flex p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setMetric('median')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  metric === 'median' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Median
              </button>
              <button
                type="button"
                onClick={() => setMetric('mean')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  metric === 'mean' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Average
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Brand Selector Sidebar */}
        <GlassCard className="lg:col-span-1 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Select Brand</h3>
            <span className="text-[10px] font-mono text-slate-500">{availableBrands.length} brands</span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Search brand..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div className="space-y-1 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
            {filteredBrands.map(b => (
              <button
                key={b}
                type="button"
                onClick={() => setSelectedBrand(b)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                  selectedBrand.toLowerCase() === b.toLowerCase()
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{b}</span>
                {selectedBrand.toLowerCase() === b.toLowerCase() && (
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                )}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Interactive Trends Chart & Data */}
        <GlassCard className="lg:col-span-3 p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {selectedBrand || 'All Brands'} Market Valuation Curve
              </h3>
              <p className="text-xs text-slate-400">
                Values plotted across model manufacture years. Shaded area represents middle 50% transaction band (P25 - P75).
              </p>
            </div>

            {chartPoints.length > 1 && (
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span className="text-slate-300">{metric === 'median' ? 'Median' : 'Average'} Price</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-4 rounded-sm bg-indigo-500/30 border border-indigo-500/40" />
                  <span className="text-slate-400">P25 - P75 Spread</span>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="h-[280px] flex items-center justify-center text-slate-400 text-xs">
              <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
              Loading historical market dataset...
            </div>
          ) : error ? (
            <div className="h-[280px] flex items-center justify-center text-rose-400 text-xs">
              {error}
            </div>
          ) : chartPoints.length === 0 ? (
            <div className="h-[280px] flex flex-col items-center justify-center text-slate-500 text-xs">
              <BarChart3 size={32} className="text-slate-600 mb-2" />
              No price transaction points found for {selectedBrand}. Select another brand from the list.
            </div>
          ) : (
            <div className="space-y-6">
              {/* SVG Chart Container */}
              <div className="relative w-full overflow-x-auto">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64 overflow-visible">
                  <defs>
                    <linearGradient id="trendsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines & Y-Axis Labels */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                    const priceVal = minPrice + pct * (maxPrice - minPrice)
                    const y = height - padding.bottom - pct * (height - padding.top - padding.bottom)
                    return (
                      <g key={i}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={width - padding.right}
                          y2={y}
                          stroke="rgba(255,255,255,0.06)"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={padding.left - 10}
                          y={y + 3}
                          textAnchor="end"
                          fill="#64748b"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          ₹{Math.round(priceVal / 1000)}k
                        </text>
                      </g>
                    )
                  })}

                  {/* P25-P75 Corridor Area */}
                  {corridorPath && (
                    <path
                      d={corridorPath}
                      fill="#6366f1"
                      fillOpacity="0.12"
                      stroke="#6366f1"
                      strokeOpacity="0.3"
                      strokeWidth="1"
                    />
                  )}

                  {/* Main Line */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points */}
                  {sortedPoints.map((p, i) => {
                    const cx = getX(p.year)
                    const cy = getY(p.price)
                    const isHovered = activePoint?.year === p.year

                    return (
                      <g 
                        key={i} 
                        className="cursor-pointer"
                        onMouseEnter={() => setActivePoint(p)}
                        onMouseLeave={() => setActivePoint(null)}
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isHovered ? 6 : 4}
                          fill={isHovered ? "#38bdf8" : "#06b6d4"}
                          stroke="#ffffff"
                          strokeWidth={isHovered ? 2 : 1.5}
                          className="transition-all duration-150"
                        />
                        <text
                          x={cx}
                          y={height - padding.bottom + 16}
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight={isHovered ? "bold" : "normal"}
                        >
                          {p.year}
                        </text>
                      </g>
                    )
                  })}
                </svg>

                {/* Hover Tooltip Overlay */}
                {activePoint && (
                  <div 
                    className="absolute z-10 px-3 py-2 rounded-xl bg-slate-900/95 border border-cyan-500/40 shadow-xl backdrop-blur-md text-xs pointer-events-none transform -translate-x-1/2 -translate-y-full"
                    style={{
                      left: `${(getX(activePoint.year) / width) * 100}%`,
                      top: `${(getY(activePoint.price) / height) * 100 - 4}%`
                    }}
                  >
                    <p className="font-bold text-white">{activePoint.year} {activePoint.brand}</p>
                    <p className="text-cyan-300 font-mono font-bold mt-0.5">
                      ₹{activePoint.price.toLocaleString('en-IN')} <span className="text-[10px] text-slate-400 font-normal">({metric})</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      P25-P75: ₹{activePoint.p25.toLocaleString('en-IN')} - ₹{activePoint.p75.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      Based on {activePoint.sample_count} sample listings
                    </p>
                  </div>
                )}
              </div>

              {/* Data Table */}
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-slate-400 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Year</th>
                      <th className="py-2.5 px-4">{metric === 'median' ? 'Median Price' : 'Average Price'}</th>
                      <th className="py-2.5 px-4">25th Percentile</th>
                      <th className="py-2.5 px-4">75th Percentile</th>
                      <th className="py-2.5 px-4 text-right">Listings Sampled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {sortedPoints.map(p => (
                      <tr key={p.year} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-4 font-bold text-white">{p.year}</td>
                        <td className="py-2.5 px-4 font-bold text-cyan-300">₹{p.price.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-4 text-slate-400">₹{p.p25.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-4 text-slate-400">₹{p.p75.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-4 text-right text-slate-400">{p.sample_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
