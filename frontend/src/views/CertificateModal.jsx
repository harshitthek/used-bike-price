import React, { useState } from 'react'
import { 
  ShieldCheck, 
  X, 
  Download, 
  Printer, 
  Share2, 
  Check, 
  Calendar, 
  Gauge, 
  Award,
  Sparkles
} from 'lucide-react'
import { apiPost } from '../hooks/useApi'
import { generateCertificatePdf } from '../utils/generatePdf'

export function CertificateModal({
  show,
  onClose,
  result,
  formData,
  vehicleType
}) {
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)
  const [shareError, setShareError] = useState(null)

  // Lock background page scroll when modal is open
  React.useEffect(() => {
    if (show) {
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prevOverflow
      }
    }
  }, [show])

  if (!show || !result) return null

  const certId = result.metadata?.timestamp 
    ? `AV-${new Date(result.metadata.timestamp).getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    : `AV-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  const appraisalDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

  const handleDownloadPdf = () => {
    if (downloadingPdf || !result) return
    setDownloadingPdf(true)

    try {
      generateCertificatePdf({ result, formData, vehicleType })
    } catch (err) {
      console.error('PDF generation error:', err)
    } finally {
      setTimeout(() => setDownloadingPdf(false), 300)
    }
  }

  const handleShareCertificate = async () => {
    setSharing(true)
    setShareError(null)
    try {
      const res = await apiPost('/certificates/generate', {
        vehicle_type: vehicleType,
        brand: formData?.brand || 'Vehicle',
        input: formData,
        result: result
      })
      const hashId = res.hash_id
      const shareUrl = `${window.location.origin}?cert=${hashId}`
      await navigator.clipboard.writeText(shareUrl)
      setCopiedShare(true)
      setTimeout(() => setCopiedShare(false), 2500)
    } catch (err) {
      setShareError(err.message || 'Could not generate share link')
      setTimeout(() => setShareError(null), 3000)
    } finally {
      setSharing(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div 
        id="printable-valuation-certificate" 
        className="relative w-full max-w-2xl my-auto rounded-2xl bg-[#090b12] border border-white/20 p-8 shadow-2xl print-certificate-container text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-indigo-400" size={20} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Official Valuation Certificate</span>
          </div>
          <button 
            aria-label="Close certificate modal"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 cursor-pointer text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Certificate Body */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-black tracking-tight font-display">AutoValuate AI Official Certificate</h3>
          <p className="text-xs text-slate-400 mt-0.5">Verified Machine Learning Market Valuation Document</p>
          <div className="inline-block mt-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-slate-400">
            Certificate ID: {certId}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs bg-white/[0.02] p-5 rounded-xl border border-white/10 mb-6">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Vehicle Specification</span>
            <span className="font-bold text-white text-sm">{formData?.brand} ({vehicleType.toUpperCase()})</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Displacement & Fuel</span>
            <span className="font-bold text-white text-sm">
              {vehicleType === 'bike' ? `${formData?.power} cc` : `${formData?.engine_cc} cc • ${formData?.fuel || 'Petrol'}`}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Odometer & Age</span>
            <span className="font-mono text-slate-300 font-bold">
              {formData?.kms_driven?.toLocaleString('en-IN')} km | {formData?.age} yrs
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Appraisal Date</span>
            <span className="font-mono text-slate-300 font-bold">{appraisalDate}</span>
          </div>
        </div>

        <div className="text-center p-5 rounded-xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/30 mb-6 shadow-inner">
          <p className="text-[11px] uppercase tracking-widest text-indigo-300 font-bold">Certified Fair Resale Appraisal</p>
          <p className="text-4xl font-black text-white mt-1 font-display">
            ₹{result.estimated_price?.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Authorized Interval: ₹{result.price_range?.min?.toLocaleString('en-IN')} – ₹{result.price_range?.max?.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-4 border-t border-white/10">
          <span>Authenticity Seal: 97.4% Empirical Stacking Ensemble</span>
          <div className="flex gap-2.5 no-print">
            <button
              type="button"
              onClick={handleShareCertificate}
              disabled={sharing}
              className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 font-semibold flex items-center gap-1.5 cursor-pointer text-xs transition-colors"
            >
              {copiedShare ? (
                <>
                  <Check size={14} className="text-emerald-400" /> Link Copied!
                </>
              ) : (
                <>
                  <Share2 size={14} /> Share Link
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-colors"
            >
              {downloadingPdf ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download size={14} /> Download PDF
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer text-xs shadow-md shadow-indigo-500/20 transition-colors"
            >
              <Printer size={14} /> Print
            </button>
          </div>
        </div>

        {shareError && (
          <p className="text-rose-400 text-xs text-right mt-2 no-print">{shareError}</p>
        )}
      </div>
    </div>
  )
}
