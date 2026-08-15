# ADR 008: Pure Vector PDF Generation, MLOps Drift Monitoring & Backward-Compatible Aliases

## Status
Accepted

## Context
1. **PDF Generation Thread Locks**: Initially, PDF generation used `html2pdf.js`/`html2canvas` which traversed the DOM and parsed CSS stylesheets. Under modern CSS frameworks like Tailwind v4 using `oklch()` color functions and container queries, DOM crawler parsers entered regex/recursion hangs, freezing the browser window.
2. **Production Drift & Telemetry**: Machine learning models in production can suffer from feature drift over time (e.g. shifts in mileage or inflation in used vehicle transaction prices). We required continuous monitoring without requiring external heavy dependencies.
3. **Ecosystem Backward Compatibility**: As the platform evolved from a motorcycle-only prototype into the comprehensive **AutoValuate AI** enterprise suite, external integrations, legacy bookmarks, and existing client code may still use older parameter names (`"motorcycle"`, `"2-wheeler"`) or legacy localStorage keys (`motovalue_history`).

## Decision

1. **Pure Vector jsPDF Engine**:
   - Replaced all DOM-crawling PDF libraries with pure in-memory `jsPDF` vector rendering (`frontend/src/utils/generatePdf.js`).
   - Draw all shapes, headers, watermark badges, tables, and 6-point depreciation forecasts directly on vector coordinates.
   - Generation time reduced to $<5\text{ms}$ with zero DOM parsing or thread blocking.
   - Deterministic SHA-256 certificate IDs are generated and verified against the backend.

2. **MLOps Telemetry & PSI Drift Monitoring**:
   - Ingest live inference logs into SQLite via asynchronous SQLAlchemy (`src/database.py`).
   - Implement Population Stability Index (PSI) analysis comparing 30-day live distributions against training baseline distributions (`src/monitoring.py`).
   - Protect administrative endpoints (`/admin/drift-report`, `/admin/reload-models`) with timing-safe API key authentication (`secrets.compare_digest`).

3. **Universal Compatibility & Alias Resilience**:
   - Added Pydantic field validators and query parameter normalizers to accept legacy terms (`"motorcycle"`, `"2-wheeler"`, `"passenger_car"`, `"automobile"`) and map them safely to `"bike"` or `"car"`.
   - Client-side history hook seamlessly detects and migrates `motovalue_history` to `autovaluate_history`.
   - Drop-in portfolio widget (`/api/v1/demo/widget.js`) dynamically searches for multiple legacy container IDs (`autovaluate-portfolio-widget`, `motovalue-portfolio-widget`, `used-bike-price-widget`).

## Consequences

### Positive
- **Instantaneous PDF Export**: Valuation certificates export in $<5\text{ms}$ with zero UI lag or freezing.
- **Continuous Quality Control**: Operators can view live PSI drift metrics and trigger zero-downtime hot reloads without restarting the service.
- **Zero Breaking Changes**: Legacy API callers, portfolio widgets, and saved browser sessions continue functioning seamlessly.
