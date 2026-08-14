# 🚀 AutoValuate AI — Portfolio Integration & Public Demo API Guide

Embed live enterprise-grade automotive machine learning valuations into your personal portfolio website, personal projects, or mobile apps with zero setup required.

---

## ⚡ Quick Summary
* **Public Base URL**: `https://<your-deployment-domain>` (or `http://127.0.0.1:8000` for local dev)
* **Auth**: **No API Key Required** for `/api/v1/demo/*` endpoints.
* **CORS**: Wildcard enabled (`*`) — callable from GitHub Pages, Vercel, Netlify, localhost, or custom domains.
* **Architecture**: CatBoost + XGBoost Stacking Ensemble ($R^2 = 97.4\%$).

---

## 🛠️ Integration Options

### Option A: 1-Line Drop-in HTML Widget (Easiest)
Copy and paste this into any HTML or Markdown page on your portfolio:

```html
<!-- 1. Container where the widget renders -->
<div id="autovaluate-portfolio-widget"></div>

<!-- 2. AutoValuate drop-in script -->
<script src="http://127.0.0.1:8000/api/v1/demo/widget.js"></script>
```

---

### Option B: JavaScript `fetch()` (Vanilla JS / Next.js / Vue / Svelte)

```javascript
// Quick GET estimate call (perfect for mini calculators)
async function getVehicleValuation() {
  const params = new URLSearchParams({
    vehicle_type: 'bike',         // 'bike' or 'car'
    brand: 'Royal Enfield',
    power: '350',                 // CC for bikes / engine_cc for cars
    kms_driven: '15000',
    age: '3',                     // Years
    owner_rank: '1'               // 1 = First Owner, 2 = Second Owner, etc.
  });

  const response = await fetch(`http://127.0.0.1:8000/api/v1/demo/estimate?${params}`);
  const data = await response.json();

  console.log("Estimated Price:", data.valuation.formatted_price); // "₹1,42,000"
  console.log("Authorized Range:", data.valuation.price_range.formatted); // "₹1,24,000 - ₹1,60,000"
  console.log("ML Confidence:", data.valuation.confidence_score); // "97.4%"
  return data;
}
```

---

### Option C: React / Next.js Component

```tsx
import React, { useState } from 'react';

export function PortfolioValuationWidget() {
  const [brand, setBrand] = useState('Royal Enfield');
  const [power, setPower] = useState(350);
  const [age, setAge] = useState(3);
  const [kms, setKms] = useState(15000);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        vehicle_type: 'bike',
        brand,
        power: String(power),
        age: String(age),
        kms_driven: String(kms),
        owner_rank: '1'
      });
      const res = await fetch(`http://127.0.0.1:8000/api/v1/demo/estimate?${query}`);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-white max-w-sm">
      <h3 className="text-sm font-bold text-indigo-400">⚡ AutoValuate AI Live Demo</h3>
      <p className="text-xs text-slate-400 mb-4">97.4% R² Stacking Ensemble Valuation</p>

      <div className="space-y-3 text-xs">
        <div>
          <label className="text-slate-400 block mb-1">Manufacturer</label>
          <select 
            value={brand} 
            onChange={(e) => setBrand(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
          >
            <option value="Royal Enfield">Royal Enfield</option>
            <option value="KTM">KTM</option>
            <option value="Yamaha">Yamaha</option>
            <option value="Bajaj">Bajaj</option>
            <option value="Honda">Honda</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-slate-400 block mb-1">Power: {power}cc</label>
            <input 
              type="range" min="100" max="650" step="25" value={power} 
              onChange={(e) => setPower(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Age: {age} yrs</label>
            <input 
              type="range" min="0" max="25" step="1" value={age} 
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <button 
          onClick={calculate}
          disabled={loading}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold transition-all disabled:opacity-50"
        >
          {loading ? 'Evaluating...' : 'Predict Fair Resale'}
        </button>

        {result && (
          <div className="mt-4 p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-center">
            <span className="text-[10px] text-indigo-300 uppercase font-semibold">Estimated Fair Value</span>
            <p className="text-2xl font-black">{result.valuation.formatted_price}</p>
            <p className="text-[10px] text-slate-400">{result.valuation.price_range.formatted}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 📡 API Reference

### 1. `GET /api/v1/demo/estimate`
**Query Parameters:**
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `vehicle_type` | `string` | `bike` | `bike` or `car` |
| `brand` | `string` | `Royal Enfield` | Brand name (e.g., `Royal Enfield`, `Maruti`, `KTM`, `BMW`) |
| `power` | `number` | `350` | Engine displacement in CC for bikes |
| `engine_cc` | `number` | `1197` | Engine capacity in CC for cars |
| `kms_driven` | `number` | `15000` | Odometer reading in KM |
| `age` | `number` | `3` | Vehicle age in years ($\ge 0.0$) |
| `owner_rank` | `number` | `1` | Owner rank ($1 = \text{1st Owner}, 2 = \text{2nd Owner}, \dots$) |
| `fuel` | `string` | `Petrol` | `Petrol`, `Diesel`, `CNG`, or `Electric` |
| `transmission` | `string` | `Manual` | `Manual` or `Automatic` |

**Sample JSON Response:**
```json
{
  "success": true,
  "vehicle": {
    "type": "bike",
    "brand": "Royal Enfield",
    "displacement": "350 cc",
    "odometer": "15,000 km",
    "age": "3 years",
    "ownership": "Owner 1",
    "fuel": "Petrol"
  },
  "valuation": {
    "estimated_price": 142000,
    "formatted_price": "₹1,42,000",
    "price_range": {
      "min": 124000,
      "max": 160000,
      "formatted": "₹1,24,000 - ₹1,60,000"
    },
    "currency": "INR",
    "confidence_score": "97.4%",
    "model_architecture": "CatBoost + XGBoost Stacking Ensemble"
  },
  "insights": {
    "reliability": "HIGH",
    "depreciation_status": "High Residual Value",
    "recommendation": "Optimal time to sell or trade in."
  },
  "warnings": [],
  "adjustments": [],
  "metadata": {
    "api_version": "2026.08.15",
    "engine": "AutoValuate AI Enterprise",
    "portfolio_demo": true,
    "timestamp": "2026-08-15T01:05:00.000Z"
  }
}
```

---

### 2. `POST /api/v1/demo/estimate`
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "vehicle_type": "car",
  "brand": "Maruti",
  "engine_cc": 1197,
  "max_power_bhp": 82,
  "fuel": "Petrol",
  "transmission": "Manual",
  "kms_driven": 35000,
  "age": 4,
  "owner_rank": 1
}
```

---

### 3. cURL Test Command

```bash
# Test motorcycle appraisal
curl -X GET "http://127.0.0.1:8000/api/v1/demo/estimate?vehicle_type=bike&brand=Royal%20Enfield&power=350&kms_driven=15000&age=3"

# Test car appraisal
curl -X GET "http://127.0.0.1:8000/api/v1/demo/estimate?vehicle_type=car&brand=Maruti&engine_cc=1197&kms_driven=35000&age=4"
```
