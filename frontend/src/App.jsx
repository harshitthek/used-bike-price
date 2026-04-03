import { useState } from 'react'

const BRANDS = [
  "Royal Enfield", "Bajaj", "Honda", "TVS", "Yamaha", 
  "KTM", "Hero", "Suzuki", "Kawasaki", "Harley-Davidson", 
  "Benelli", "Triumph", "Ducati", "Jawa", "Mahindra"
].sort();

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'brand' ? value : Number(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Prediction API Error');
      const data = await response.json();
      
      setResult({
        price: data.estimated_price,
        success: true
      });
    } catch (err) {
      setResult({ success: false, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <h1>BikeValuation AI</h1>
        <p>Enterprise-grade machine learning model for Indian vehicle markets</p>
      </div>

      <div className="dashboard">
        
        {/* Left Side: Input Panel */}
        <div className="panel">
          <form onSubmit={handleSubmit} className="form-grid">
            
            <div className="form-group full">
              <label>Manufacturer Brand</label>
              <select name="brand" value={formData.brand} onChange={handleChange} required>
                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Engine Power (CC)</label>
              <input type="number" name="power" value={formData.power} onChange={handleChange} min="50" max="2500" required />
            </div>

            <div className="form-group">
              <label>Age (Years)</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} min="0" max="30" required />
            </div>

            <div className="form-group">
              <label>Kilometers Driven</label>
              <input type="number" name="kms_driven" value={formData.kms_driven} onChange={handleChange} min="0" max="200000" step="100" required />
            </div>

            <div className="form-group">
              <label>Ownership</label>
              <select name="owner_rank" value={formData.owner_rank} onChange={handleChange} required>
                <option value={1}>1st Owner</option>
                <option value={2}>2nd Owner</option>
                <option value={3}>3rd Owner</option>
                <option value={4}>4th Owner or more</option>
              </select>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <span className="spinner"></span> : null}
              {loading ? 'Evaluating...' : 'Predict Fair Price'}
            </button>
            
          </form>
        </div>

        {/* Right Side: Result Panel */}
        <div className="panel result-panel">
          {result && result.success ? (
            <div className="result-success">
              <div className="price-title">Estimated Market Value</div>
              <div className="price-value">₹ {result.price.toLocaleString('en-IN')}</div>
              
              <div className="result-details">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Model confirms <span>{formData.brand}</span> ({formData.power}cc, {formData.age}yr)
              </div>
            </div>
          ) : result && !result.success ? (
             <div className="result-placeholder" style={{color: '#ef4444'}}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p>Connection Error. Is the FastAPI server running?</p>
             </div>
          ) : (
            <div className="result-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p>Awaiting parameters to generate valuation.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default App
