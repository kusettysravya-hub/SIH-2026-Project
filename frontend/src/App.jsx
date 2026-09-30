import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import OverviewPage from './pages/OverviewPage';
import ScreeningPage from './pages/ScreeningPage';
import ComparisonPage from './pages/ComparisonPage';
import DatasetPage from './pages/DatasetPage';
import MethodologyPage from './pages/MethodologyPage';
import AboutPage from './pages/AboutPage';
import { api } from './api';
import { AlertCircle, RotateCw } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [backendHealth, setBackendHealth] = useState(null);
  const [modelsData, setModelsData] = useState(null);
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [loadingModel, setLoadingModel] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('hybridqml_theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      try { localStorage.setItem('hybridqml_theme', 'dark'); } catch {}
    } else {
      root.classList.remove('dark');
      try { localStorage.setItem('hybridqml_theme', 'light'); } catch {}
    }
  }, [darkMode]);

  const fetchInitialData = async () => {
    try {
      setConnectionError(null);
      const [health, metrics, ds] = await Promise.all([
        api.getHealth(),
        api.getAllMetrics(),
        api.getDatasetInfo(),
      ]);
      setBackendHealth(health);
      setModelsData(metrics);
      setDatasetInfo(ds);
    } catch (err) {
      console.error('Error connecting to backend:', err);
      setConnectionError(
        'Unable to connect to the FastAPI backend (http://127.0.0.1:8000). Please verify the backend service is running.'
      );
    }
  };

  useEffect(() => {
    fetchInitialData();
    // Poll health status periodically
    const interval = setInterval(async () => {
      try {
        const health = await api.getHealth();
        setBackendHealth(health);
      } catch (e) {
        // silent catch on polling
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleTrainModel = async (modelId) => {
    setLoadingModel(modelId);
    try {
      if (modelId === 'quantum_vqc') {
        await api.trainQuantum({ steps: 25, lr: 0.08 });
      } else {
        await api.trainClassical({ algorithm: modelId });
      }
      // Refresh models data
      const updated = await api.getAllMetrics();
      setModelsData(updated);
    } catch (err) {
      console.error(`Error training ${modelId}:`, err);
      alert(`Training failed for ${modelId}: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoadingModel(null);
    }
  };

  const handleDatasetChange = async () => {
    try {
      const [ds, metrics] = await Promise.all([
        api.getDatasetInfo(),
        api.getAllMetrics(),
      ]);
      setDatasetInfo(ds);
      setModelsData(metrics);
    } catch (err) {
      console.error('Error refreshing dataset info:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        backendHealth={backendHealth}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Backend connection warning banner if server is unreachable */}
      {connectionError && (
        <div className="bg-rose-50 dark:bg-rose-950/70 border-b border-rose-200 dark:border-rose-800 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-rose-800 dark:text-rose-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <span>{connectionError}</span>
            </div>
            <button
              onClick={fetchInitialData}
              className="px-2.5 py-1 bg-rose-600 text-white rounded font-medium hover:bg-rose-700 flex items-center gap-1"
            >
              <RotateCw className="w-3 h-3" /> Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main key={activeTab} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
        {activeTab === 'overview' && (
          <OverviewPage 
            setActiveTab={setActiveTab} 
            modelsData={modelsData} 
            datasetInfo={datasetInfo}
            backendHealth={backendHealth}
          />
        )}

        {activeTab === 'screening' && (
          <ScreeningPage 
            modelsData={modelsData} 
            datasetInfo={datasetInfo}
            onTrainModel={handleTrainModel}
            onDatasetChange={handleDatasetChange}
          />
        )}

        {activeTab === 'comparison' && (
          <ComparisonPage 
            modelsData={modelsData} 
            datasetInfo={datasetInfo}
            onTrainModel={handleTrainModel} 
            onDatasetChange={handleDatasetChange}
            loadingModel={loadingModel} 
          />
        )}

        {activeTab === 'dataset' && (
          <DatasetPage 
            datasetInfo={datasetInfo} 
            onDatasetChange={handleDatasetChange} 
          />
        )}

        {activeTab === 'methodology' && (
          <MethodologyPage />
        )}

        {activeTab === 'about' && (
          <AboutPage />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/90 dark:border-slate-800 py-6 mt-auto transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            <span className="font-semibold text-navy-900 dark:text-white">Hybrid QML Platform</span> — Smart India Hackathon Prototype.
            <span className="block text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Built with React, Vite, FastAPI, Scikit-Learn &amp; PennyLane Quantum Simulator.
            </span>
          </div>
          <div className="text-center md:text-right">
            <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              This prototype is intended for screening support and research demonstration only. It does not provide a medical diagnosis.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

