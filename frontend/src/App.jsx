import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ChevronRight, Zap, RefreshCw } from 'lucide-react'

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
      
      // Artificial delay for UI polish/animation
      setTimeout(() => {
        setResult({
          price: data.estimated_price,
          success: true
        });
        setLoading(false);
      }, 800);
      
    } catch (err) {
      setTimeout(() => {
        setResult({ success: false, msg: err.message });
        setLoading(false);
      }, 500);
    }
  };

  return (
    <div className="app-layout">
      {/* Background Orbs */}
      <div className="background-aurora">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>

      <header className="header">
        <div className="logo-container">
          <Zap className="logo-icon" size={28} />
          <h1>MotoValue Engine</h1>
        </div>
      </header>

      <main className="dashboard-main">
        
        {/* Left Panel: Configuration */}
        <motion.div 
          className="glass-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2 className="panel-title">Asset Configuration</h2>
          
          <form onSubmit={handleSubmit} className="form-section">
            
            {/* Brand */}
            <div className="input-block">
              <div className="input-header">
                <label>Manufacturer Brand</label>
              </div>
              <select name="brand" value={formData.brand} onChange={handleChange}>
                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Power Slider */}
            <div className="input-block">
              <div className="input-header">
                <label>Engine Power</label>
                <span className="input-value-display">{formData.power} CC</span>
              </div>
              <input type="range" name="power" value={formData.power} onChange={handleChange} min="50" max="1500" step="50" />
            </div>

            {/* Age Slider */}
            <div className="input-block">
              <div className="input-header">
                <label>Vehicle Age</label>
                <span className="input-value-display">{formData.age} Years</span>
              </div>
              <input type="range" name="age" value={formData.age} onChange={handleChange} min="0" max="30" step="1" />
            </div>

            {/* KMS Slider */}
            <div className="input-block">
              <div className="input-header">
                <label>Kilometers Driven</label>
                <span className="input-value-display">{formData.kms_driven.toLocaleString('en-IN')} KM</span>
              </div>
              <input type="range" name="kms_driven" value={formData.kms_driven} onChange={handleChange} min="0" max="100000" step="1000" />
            </div>

            {/* Ownership */}
            <div className="input-block" style={{ marginBottom: '1rem' }}>
              <div className="input-header">
                <label>Registration Status</label>
              </div>
              <select name="owner_rank" value={formData.owner_rank} onChange={handleChange}>
                <option value={1}>1st Owner</option>
                <option value={2}>2nd Owner</option>
                <option value={3}>3rd Owner</option>
                <option value={4}>4th Owner or more</option>
              </select>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="cta-button" 
              disabled={loading}
            >
              {loading ? 'Processing neural net...' : 'Calculate Valuation'}
              {!loading && <ChevronRight size={24} />}
            </motion.button>
            
          </form>
        </motion.div>

        {/* Right Panel: Output */}
        <motion.div 
          className="glass-panel"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <div className="result-display">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="pulse-ring"
                >
                </motion.div>
              ) : result && result.success ? (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  <div className="result-tag">
                    <CheckCircle2 size={16} style={{display: 'inline', marginRight: '6px', verticalAlign: '-3px'}}/>
                    Valuation Complete
                  </div>
                  
                  <div className="glowing-price">
                    ₹{result.price.toLocaleString('en-IN')}
                  </div>
                  
                  <div className="result-meta">
                    <strong>{formData.brand}</strong> inside top 5% confidence.<br/>
                    Adjusted for {formData.power}cc engine decay over {formData.age} yrs.
                  </div>
                </motion.div>
              ) : result && !result.success ? (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="result-tag" style={{ color: '#ff4444', borderColor: 'rgba(255,0,0,0.3)', background: 'rgba(255,0,0,0.1)' }}>
                    API Disconnected
                  </div>
                  <p style={{ opacity: 0.7 }}>Ensure the FastAPI backend is running.</p>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <RefreshCw size={48} style={{ opacity: 0.2, marginBottom: '2rem' }} />
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>No Data Injected</h3>
                  <p className="result-meta">Adjust the asset configuration parameters and run the calculation.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </main>
    </div>
  )
}

export default App
