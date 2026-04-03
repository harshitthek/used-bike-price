import { useState } from 'react'

const BRANDS = [
  "Royal Enfield", "Bajaj", "Honda", "TVS", "Yamaha", 
  "KTM", "Hero", "Suzuki", "Kawasaki", "Harley-Davidson", 
  "Benelli", "Triumph", "Ducati", "Jawa", "Mahindra"
];

function App() {
  const [formData, setFormData] = useState({
    brand: 'Royal Enfield',
    power: 350,
    kms_driven: 15000,
    age: 3,
    owner_rank: 1
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      // Convert to number unless it's the brand string
      [name]: name === 'brand' ? value : Number(value)
    }));
  };

  const calculateDepreciation = (originalPrice, predictedPrice) => {
    // Rough estimate logic purely for the UI display feel
    if (!originalPrice) return 0;
    return Math.round(((originalPrice - predictedPrice) / originalPrice) * 100);
  };

  const getRoughOriginalPrice = (brand, power) => {
    // Very rough heuristic for visual context
    const base = power * 400; 
    if (brand === "KTM" || brand === "Royal Enfield") return base * 1.5;
    if (brand === "Harley-Davidson" || brand === "Triumph" || brand === "Ducati") return base * 3;
    return base;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch prediction from the server.');
      }

      const data = await response.json();
      
      // Compute some context for the UI
      const originalEst = getRoughOriginalPrice(formData.brand, formData.power);
      const depPct = calculateDepreciation(originalEst, data.estimated_price);
      
      setResult({
        price: data.estimated_price,
        depreciation: depPct > 0 && depPct < 99 ? depPct : null
      });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      
      {/* Input Panel */}
      <div className="glass-panel animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h1>Estimate Value</h1>
        <p className="subtitle">AI-powered used motorcycle valuation</p>
        
        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label>Manufacturer Brand</label>
            <select name="brand" value={formData.brand} onChange={handleChange} required>
              {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Engine Power (CC)</label>
              <input type="number" name="power" value={formData.power} onChange={handleChange} min="50" max="2500" required />
            </div>

            <div className="form-group">
              <label>Age (Years)</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} min="0" max="30" required />
            </div>
          </div>

          <div className="form-group">
            <label>Kilometers Driven</label>
            <input type="number" name="kms_driven" value={formData.kms_driven} onChange={handleChange} min="0" max="200000" step="500" required />
          </div>

          <div className="form-group">
            <label>Ownership</label>
            <select name="owner_rank" value={formData.owner_rank} onChange={handleChange} required>
              <option value={1}>First Owner</option>
              <option value={2}>Second Owner</option>
              <option value={3}>Third Owner</option>
              <option value={4}>Fourth Owner or more</option>
            </select>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'ANALYZING...' : 'PREDICT PRICE'}
          </button>
        </form>
      </div>

      {/* Result Panel */}
      <div className="glass-panel result-card animate-slide-up" style={{ animationDelay: '0.3s' }}>
        
        {loading ? (
          <div className="loading-indicator"></div>
        ) : result ? (
          <div className="animate-slide-up">
            <div className="price-label">Estimated Market Value</div>
            <div className="price-value">
              ₹{result.price.toLocaleString('en-IN')}
            </div>
            
            <div className="price-details">
              <strong>{formData.brand}</strong> ({formData.power}cc)<br/>
              {formData.age} {formData.age === 1 ? 'year' : 'years'} old · {formData.kms_driven.toLocaleString('en-IN')} km
              
              {result.depreciation && (
                <div style={{ marginTop: '1.5rem', opacity: 0.8, fontSize: '0.95rem' }}>
                  Model estimates ~{result.depreciation}% depreciation from base MSRP off the lot.
                </div>
              )}
            </div>
          </div>
        ) : error ? (
          <div style={{ color: '#ff6b6b' }}>
            <h3 style={{ marginBottom: '1rem' }}>Connection Error</h3>
            <p>{error}</p>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>Ensure the FastAPI backend is running on port 8000.</p>
          </div>
        ) : (
          <div style={{ opacity: 0.5 }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '1.5rem' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            <div className="price-label">Awaiting Parameters</div>
            <p className="price-details">Enter the motorcycle details and click predict to see the estimated value.</p>
          </div>
        )}
      </div>

    </div>
  )
}

export default App
