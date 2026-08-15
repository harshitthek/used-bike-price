import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { CertificateModal } from '../views/CertificateModal'
import * as pdfUtil from '../utils/generatePdf'

describe('CertificateModal & PDF Generation Suite', () => {
  const mockResult = {
    estimated_price: 30607,
    price_range: { min: 12600, max: 48600 },
    confidence: '97.4% Empirical Stacking Ensemble',
    metadata: { timestamp: '2026-08-15T18:00:00Z' },
  }

  const mockFormData = {
    brand: 'Royal Enfield',
    power: 350,
    kms_driven: 100000,
    age: 13,
    owner_rank: 1,
  }

  it('renders official valuation certificate modal correctly', () => {
    render(
      <CertificateModal
        show={true}
        onClose={vi.fn()}
        result={mockResult}
        formData={mockFormData}
        vehicleType="bike"
      />
    )

    expect(screen.getByText('AutoValuate AI Official Certificate')).toBeInTheDocument()
    expect(screen.getByText('Download PDF')).toBeInTheDocument()
    expect(screen.getByText('Print')).toBeInTheDocument()
    expect(screen.getByText('Share Link')).toBeInTheDocument()
  })

  it('triggers pure jsPDF generator instantly on download click without hanging', () => {
    const spy = vi.spyOn(pdfUtil, 'generateCertificatePdf').mockImplementation(() => null)

    render(
      <CertificateModal
        show={true}
        onClose={vi.fn()}
        result={mockResult}
        formData={mockFormData}
        vehicleType="bike"
      />
    )

    const downloadBtn = screen.getByText('Download PDF')
    fireEvent.click(downloadBtn)

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        result: mockResult,
        formData: mockFormData,
        vehicleType: 'bike',
      })
    )
  })
})
