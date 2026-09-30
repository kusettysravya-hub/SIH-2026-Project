import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Cpu, 
  Binary, 
  RotateCcw, 
  AlertCircle, 
  Sparkles, 
  Activity,
  Layers,
  TrendingUp,
  TrendingDown,
  Database,
  BarChart2,
  ClipboardList,
  ShieldAlert
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import DisclaimerBanner from '../components/DisclaimerBanner';
import StatusBadge from '../components/StatusBadge';
import { api } from '../api';

const PIMA_FEATURE_CONFIGS = {
  Glucose: {
    label: 'Plasma Glucose (2h OGTT)',
    unit: 'mg/dL',
    type: 'number',
    group: 'glycemic',
    min: 40,
    max: 300,
    default: 120,
    normalRange: '70 - 140 mg/dL'
  },
  Insulin: {
    label: '2-Hour Serum Insulin',
    unit: 'μU/mL',
    type: 'number',
    group: 'glycemic',
    min: 10,
    max: 850,
    default: 80,
    normalRange: '16 - 166 μU/mL'
  },
  BMI: {
    label: 'Body Mass Index (BMI)',
    unit: 'kg/m²',
    type: 'number',
    group: 'demographics',
    min: 15,
    max: 70,
    default: 26.5,
    normalRange: '18.5 - 24.9 kg/m²'
  },
  Age: {
    label: 'Patient Age',
    unit: 'years',
    type: 'number',
    group: 'demographics',
    min: 18,
    max: 100,
    default: 35,
    normalRange: 'Adult (18+ yrs)'
  },
  Pregnancies: {
    label: 'Number of Pregnancies',
    unit: 'count',
    type: 'number',
    group: 'demographics',
    min: 0,
    max: 20,
    default: 1,
    normalRange: '0 - 15'
  },
  DiabetesPedigreeFunction: {
    label: 'Diabetes Pedigree Function',
    unit: 'score',
    type: 'number',
    group: 'history',
    min: 0.05,
    max: 2.5,
    step: 0.001,
    default: 0.35,
    normalRange: '0.08 - 0.50'
  },
  BloodPressure: {
    label: 'Diastolic Blood Pressure',
    unit: 'mm Hg',
    type: 'number',
    group: 'history',
    min: 40,
    max: 160,
    default: 72,
    normalRange: '60 - 80 mm Hg'
  },
  SkinThickness: {
    label: 'Triceps Skinfold Thickness',
    unit: 'mm',
    type: 'number',
    group: 'history',
    min: 5,
    max: 99,
    default: 23,
    normalRange: '10 - 30 mm'
  },
};

const CLINICAL_100K_FEATURE_CONFIGS = {
  HbA1c_level: {
    label: 'HbA1c Level (Glycated Hemoglobin)',
    unit: '%',
    type: 'number',
    group: 'glycemic',
    step: 0.1,
    min: 3.0,
    max: 15.0,
    default: 5.7,
    normalRange: 'Normal < 5.7%'
  },
  blood_glucose_level: {
    label: 'Blood Glucose Level',
    unit: 'mg/dL',
    type: 'number',
    group: 'glycemic',
    min: 50,
    max: 400,
    default: 140,
    normalRange: '80 - 140 mg/dL'
  },
  age: {
    label: 'Patient Age',
    unit: 'years',
    type: 'number',
    group: 'demographics',
    min: 1,
    max: 100,
    default: 54,
    normalRange: '1 - 100 yrs'
  },
  bmi: {
    label: 'Body Mass Index (BMI)',
    unit: 'kg/m²',
    type: 'number',
    group: 'demographics',
    step: 0.01,
    min: 10.0,
    max: 95.0,
    default: 25.19,
    normalRange: '18.5 - 24.9 kg/m²'
  },
  gender: {
    label: 'Biological Gender',
    type: 'select',
    group: 'demographics',
    options: [
      { label: 'Female', value: 'Female' },
      { label: 'Male', value: 'Male' },
      { label: 'Other', value: 'Other' }
    ],
    default: 'Female',
    normalRange: 'Demographic'
  },
  hypertension: {
    label: 'Hypertension Diagnosis',
    type: 'binary',
    group: 'history',
    options: [
      { label: 'No (0)', value: 0 },
      { label: 'Yes (1)', value: 1 }
    ],
    default: 0,
    normalRange: 'Binary Indicator'
  },
  heart_disease: {
    label: 'Heart Disease History',
    type: 'binary',
    group: 'history',
    options: [
      { label: 'No (0)', value: 0 },
      { label: 'Yes (1)', value: 1 }
    ],
    default: 0,
    normalRange: 'Binary Indicator'
  },
  smoking_history: {
    label: 'Smoking History',
    type: 'select',
    group: 'history',
    options: [
      { label: 'never', value: 'never' },
      { label: 'No Info', value: 'No Info' },
      { label: 'former', value: 'former' },
      { label: 'not current', value: 'not current' },
      { label: 'ever', value: 'ever' },
      { label: 'current', value: 'current' }
    ],
    default: 'never',
    normalRange: 'Lifestyle Factor'
  }
};

const GROUP_META = [
  { id: 'glycemic', title: '1. Core Glycemic & Metabolic Biomarkers', badge: 'Primary Risk Drivers' },
  { id: 'demographics', title: '2. Patient Demographics & Anthropometrics', badge: 'Baseline Profile' },
  { id: 'history', title: '3. Cardiovascular & Clinical History', badge: 'Comorbidity & Lifestyle' },
];

const PIMA_PRESETS = [
  {
    name: 'Normoglycemic Profile (Low Risk)',
    values: {
      Pregnancies: 1, Glucose: 85, BloodPressure: 66, SkinThickness: 29,
      Insulin: 94, BMI: 26.6, DiabetesPedigreeFunction: 0.351, Age: 31
    }
  },
  {
    name: 'Borderline Metabolic Profile',
    values: {
      Pregnancies: 3, Glucose: 128, BloodPressure: 74, SkinThickness: 30,
      Insulin: 135, BMI: 30.1, DiabetesPedigreeFunction: 0.48, Age: 42
    }
  },
  {
    name: 'Hyperglycemic Profile (High Risk)',
    values: {
      Pregnancies: 6, Glucose: 178, BloodPressure: 78, SkinThickness: 35,
      Insulin: 180, BMI: 35.2, DiabetesPedigreeFunction: 0.68, Age: 54
    }
  }
];

const CLINICAL_100K_PRESETS = [
  {
    name: 'Low Risk Profile (HbA1c 5.4%, Glu 85)',
    values: {
      gender: 'Female', age: 38, hypertension: 0, heart_disease: 0,
      smoking_history: 'never', bmi: 23.4, HbA1c_level: 5.4, blood_glucose_level: 85
    }
  },
  {
    name: 'Borderline Profile (HbA1c 6.4%, Glu 145)',
    values: {
      gender: 'Female', age: 62, hypertension: 0, heart_disease: 0,
      smoking_history: 'former', bmi: 28.5, HbA1c_level: 6.4, blood_glucose_level: 145
    }
  },
  {
    name: 'High Risk Profile (HbA1c 8.2%, Glu 240)',
    values: {
      gender: 'Male', age: 67, hypertension: 1, heart_disease: 1,
      smoking_history: 'former', bmi: 34.8, HbA1c_level: 8.2, blood_glucose_level: 240
    }
  }
];

export const ScreeningPage = ({ modelsData, datasetInfo, onTrainModel, onDatasetChange }) => {
  const [selectedModel, setSelectedModel] = useState('quantum_vqc');
  const isClinical100k = datasetInfo?.filename?.includes('prediction') || datasetInfo?.feature_names?.includes('HbA1c_level');

  const activeConfigMap = isClinical100k ? CLINICAL_100K_FEATURE_CONFIGS : PIMA_FEATURE_CONFIGS;
  const activePresets = isClinical100k ? CLINICAL_100K_PRESETS : PIMA_PRESETS;

  const [formData, setFormData] = useState(activePresets[0].values);
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    setFormData(isClinical100k ? CLINICAL_100K_PRESETS[0].values : PIMA_PRESETS[0].values);
    setPredictionResult(null);
    setValidationErrors({});
    setApiError(null);
  }, [isClinical100k, datasetInfo?.filename]);

  const currentModelMeta = modelsData?.models?.[selectedModel];
  const isTrained = currentModelMeta?.trained;

  const requiredFeatures = selectedModel === 'quantum_vqc'
    ? (isClinical100k ? ['HbA1c_level', 'blood_glucose_level', 'bmi', 'age'] : ['Glucose', 'BMI', 'Age', 'DiabetesPedigreeFunction'])
    : Object.keys(activeConfigMap);

  const handleSwitchDataset = async (fname) => {
    try {
      await api.selectDataset(fname);
      if (onDatasetChange) onDatasetChange();
    } catch (e) {
      setApiError('Failed to switch dataset.');
    }
  };

  const handleInputChange = (feature, val, cfg) => {
    if (cfg.type === 'binary') {
      setFormData(prev => ({ ...prev, [feature]: Number(val) }));
    } else if (cfg.type === 'select') {
      setFormData(prev => ({ ...prev, [feature]: val }));
    } else {
      const num = parseFloat(val);
      setFormData(prev => ({ ...prev, [feature]: isNaN(num) ? val : num }));
    }
    if (validationErrors[feature]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[feature];
        return copy;
      });
    }
  };

  const loadPreset = (preset) => {
    setFormData(preset.values);
    setValidationErrors({});
    setPredictionResult(null);
  };

  const handleReset = () => {
    loadPreset(activePresets[0]);
    setPredictionResult(null);
    setApiError(null);
  };

  const validateInputs = () => {
    const errors = {};
    requiredFeatures.forEach(feature => {
      const cfg = activeConfigMap[feature];
      if (!cfg) return;
      const val = formData[feature];
      if (cfg.type === 'number') {
        if (val === '' || val === undefined || isNaN(val)) {
          errors[feature] = 'This clinical field is required.';
        } else if (val < cfg.min || val > cfg.max) {
          errors[feature] = `Must be between ${cfg.min} and ${cfg.max} ${cfg.unit || ''}.`;
        }
      }
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!isTrained) {
      setApiError(`The selected model (${currentModelMeta?.model_name || selectedModel}) is not trained yet. Please train it first.`);
      return;
    }

    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    try {
      const res = await api.predict({
        model_id: selectedModel,
        features: formData
      });
      setPredictionResult(res);
    } catch (err) {
      setApiError(err.response?.data?.detail || err.message || 'Failed to generate screening prediction.');
    } finally {
      setLoading(false);
    }
  };

  // Prepare explainability chart data from predictionResult
  const explainChartData = (predictionResult?.feature_contributions || []).map((fc) => ({
    feature: fc.feature,
    impact: Number(fc.weight_or_impact) || 0,
    absImpact: Math.abs(Number(fc.weight_or_impact) || 0),
    rawVal: fc.value,
    desc: fc.importance_description
  }));

  return (
    <div className="space-y-6 pb-12">
      <DisclaimerBanner />

      {/* Top Header + Quick Cohort Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-navy-900 dark:text-white tracking-tight flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            Interactive Patient Risk Screening &amp; Explainability
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Active Cohort: <strong className="text-navy-900 dark:text-white">{datasetInfo?.filename}</strong> ({datasetInfo?.total_rows?.toLocaleString()} records)
          </p>
        </div>

        {/* Quick Dataset Toggle & Demo Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 shadow-sm mr-2">
            <button
              type="button"
              onClick={() => handleSwitchDataset('diabetes_prediction_dataset.csv')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                isClinical100k ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:text-navy-900'
              }`}
            >
              <Database className="w-3 h-3" /> 100k Clinical Dataset
            </button>
            <button
              type="button"
              onClick={() => handleSwitchDataset('diabetes.csv')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                !isClinical100k ? 'bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:text-navy-900'
              }`}
            >
              <Database className="w-3 h-3" /> 768 Pima Dataset
            </button>
          </div>

          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Sample Profiles:
          </span>
          {activePresets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadPreset(p)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-sky-300 font-medium transition-all shadow-sm"
            >
              {p.name}
            </button>
          ))}
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:text-navy-900 transition-colors"
            title="Reset Form"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Grouped Clinical Form (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-card">
          
          {/* Model Selector Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Select Inference Model Architecture
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              <button
                type="button"
                onClick={() => { setSelectedModel('quantum_vqc'); setPredictionResult(null); }}
                className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                  selectedModel === 'quantum_vqc'
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 ring-2 ring-teal-500/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-teal-300">
                    <Cpu className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    Quantum VQC
                  </div>
                  <StatusBadge status={modelsData?.models?.quantum_vqc?.status} />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">4-Qubit Bloch Angle Embedding</span>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedModel('logistic_regression'); setPredictionResult(null); }}
                className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                  selectedModel === 'logistic_regression'
                    ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 ring-2 ring-sky-500/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 dark:text-sky-300">
                    <Binary className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    Logistic Reg.
                  </div>
                  <StatusBadge status={modelsData?.models?.logistic_regression?.status} />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Standard Linear Baseline</span>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedModel('random_forest'); setPredictionResult(null); }}
                className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                  selectedModel === 'random_forest'
                    ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/40 ring-2 ring-purple-500/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-800 dark:text-purple-300">
                    <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Random Forest
                  </div>
                  <StatusBadge status={modelsData?.models?.random_forest?.status} />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">100-Tree Ensemble Baseline</span>
              </button>

            </div>

            {selectedModel === 'quantum_vqc' && (
              <p className="mt-2.5 text-[11px] text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 border border-teal-100 dark:border-teal-800/60 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-teal-600 dark:text-teal-400" />
                {isClinical100k
                  ? 'Quantum VQC encodes the 4 core clinical biomarkers (HbA1c_level, blood_glucose_level, bmi, age) onto 4 entangled qubits.'
                  : 'Quantum VQC encodes the 4 core Pima biomarkers (Glucose, BMI, Age, DiabetesPedigreeFunction) onto 4 entangled qubits.'}
              </p>
            )}
          </div>

          {!isTrained && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">Model Not Yet Trained on Active Dataset</h4>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    Train this model on {datasetInfo?.filename} to enable live screening.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onTrainModel && onTrainModel(selectedModel)}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
              >
                Train Model Now
              </button>
            </div>
          )}

          {/* Grouped Clinical Feature Inputs Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {GROUP_META.map((group) => {
              const groupKeys = requiredFeatures.filter(
                (k) => activeConfigMap[k] && activeConfigMap[k].group === group.id
              );
              if (groupKeys.length === 0) return null;

              return (
                <div key={group.id} className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-700/70 pb-2">
                    <h4 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                      {group.title}
                    </h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {group.badge}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {groupKeys.map((key) => {
                      const cfg = activeConfigMap[key];
                      const error = validationErrors[key];
                      const currentVal = formData[key] !== undefined ? formData[key] : cfg.default;

                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-navy-900 dark:text-slate-200">
                              {cfg.label}
                            </label>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {cfg.normalRange}
                            </span>
                          </div>

                          {/* Binary Toggle Buttons for Hypertension / Heart Disease */}
                          {cfg.type === 'binary' ? (
                            <div className="grid grid-cols-2 gap-2 pt-0.5">
                              {cfg.options.map((opt) => {
                                const active = Number(currentVal) === Number(opt.value);
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleInputChange(key, opt.value, cfg)}
                                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                                      active
                                        ? Number(opt.value) === 1
                                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                          : 'bg-navy-900 dark:bg-sky-600 text-white border-navy-900 dark:border-sky-500 shadow-sm'
                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          ) : cfg.type === 'select' ? (
                            <select
                              value={currentVal}
                              onChange={(e) => handleInputChange(key, e.target.value, cfg)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-navy-900 dark:text-white"
                            >
                              {cfg.options.map((opt, i) => (
                                <option key={i} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="relative">
                              <input
                                type="number"
                                step={cfg.step || 'any'}
                                min={cfg.min}
                                max={cfg.max}
                                value={formData[key] !== undefined ? formData[key] : ''}
                                onChange={(e) => handleInputChange(key, e.target.value, cfg)}
                                className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                                  error
                                    ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-500/20 text-rose-900 dark:text-rose-200'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-sky-500 focus:ring-sky-500/20 text-navy-900 dark:text-white'
                                }`}
                                placeholder={`e.g. ${cfg.default}`}
                              />
                              <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">
                                {cfg.unit}
                              </span>
                            </div>
                          )}

                          {error && (
                            <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5">
                              <AlertCircle className="w-3 h-3 flex-shrink-0" />
                              {error}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {apiError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{apiError}</span>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400">
                Validated against {datasetInfo?.filename} schema.
              </span>
              <button
                type="submit"
                disabled={loading || !isTrained}
                className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md ${
                  loading || !isTrained
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                    : selectedModel === 'quantum_vqc'
                    ? 'bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white hover:scale-[1.01]'
                    : 'bg-gradient-to-r from-sky-600 to-navy-900 hover:from-sky-700 hover:to-navy-950 text-white hover:scale-[1.01]'
                }`}
              >
                {loading ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin text-white" />
                    Running Model Inference...
                  </>
                ) : (
                  <>
                    <Stethoscope className="w-4 h-4" />
                    Generate Screening Assessment
                  </>
                )}
              </button>
            </div>
          </form>

        </div>

        {/* Right Column: Prediction Result & Explainability Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {predictionResult ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-5 animate-fade-in-up">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Screening Assessment Result
                  </span>
                  <h3 className="text-base font-bold text-navy-900 dark:text-white">{predictionResult.model_name}</h3>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {predictionResult.latency_ms} ms
                </span>
              </div>

              {/* Risk Level Badge & Probability Gauge */}
              <div className="text-center py-1">
                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                  predictionResult.risk_level === 'High Risk'
                    ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    : predictionResult.risk_level === 'Moderate Risk'
                    ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                }`}>
                  {predictionResult.risk_level === 'High Risk' ? (
                    <TrendingUp className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                  {predictionResult.risk_level} ({predictionResult.predicted_label})
                </span>

                <div className="mt-3">
                  <div className="text-4xl font-extrabold text-navy-900 dark:text-white tracking-tight">
                    {(predictionResult.probability * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Estimated Diabetes Screening Probability
                  </p>
                </div>

                {/* Progress bar gauge */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full mt-3 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      predictionResult.probability >= 0.65
                        ? 'bg-gradient-to-r from-rose-500 to-red-600'
                        : predictionResult.probability >= 0.35
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                        : 'bg-gradient-to-r from-emerald-400 to-teal-500'
                    }`}
                    style={{ width: `${Math.max(5, Math.min(100, predictionResult.probability * 100))}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                  <span>0% (Low)</span>
                  <span>35% (Moderate)</span>
                  <span>65% (High)</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Confidence & Dataset Metadata */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="bg-slate-50 dark:bg-slate-800/70 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Decision Confidence Margin</span>
                  <span className="font-bold text-navy-900 dark:text-white">{predictionResult.confidence_score}%</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/70 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Dataset Cohort Used</span>
                  <span className="font-bold text-navy-900 dark:text-white truncate block">{predictionResult.dataset_version}</span>
                </div>
              </div>

              {/* Patient Input Summary */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-navy-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  Submitted Patient Input Summary
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                  {requiredFeatures.map((fKey) => (
                    <div key={fKey} className="bg-slate-50 dark:bg-slate-800/50 px-2 py-1.5 rounded border border-slate-200/60 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px] truncate">{fKey}</span>
                      <span className="font-mono font-bold text-navy-900 dark:text-slate-200">
                        {String(formData[fKey])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Feature Contribution / Explainability Chart */}
              {explainChartData.length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
                      <BarChart2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      Model Explainability &amp; Feature Attribution
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Method: <strong className="text-slate-700 dark:text-slate-200">{predictionResult.explainability_method || 'Feature Impact Analysis'}</strong>
                  </p>

                  {/* Horizontal Bar Chart */}
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={explainChartData.slice(0, 6)}
                        layout="vertical"
                        margin={{ top: 4, right: 20, left: 10, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                        <YAxis dataKey="feature" type="category" width={110} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Tooltip
                          formatter={(val) => [val, 'Weight / Angle']}
                          contentStyle={{ backgroundColor: '#ffffff', color: '#0f172a', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                        />
                        <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                          {explainChartData.slice(0, 6).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                predictionResult.model_type === 'quantum'
                                  ? '#0d9488'
                                  : entry.impact >= 0
                                  ? '#0284c7'
                                  : '#10b981'
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Detailed Attribution List */}
                  <div className="space-y-1.5">
                    {predictionResult.feature_contributions.slice(0, 4).map((fc, i) => (
                      <div key={i} className="text-xs bg-slate-50/80 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{fc.feature} = {String(fc.value)}</span>
                          <span className="font-mono text-navy-900 dark:text-sky-300 font-bold">
                            {fc.weight_or_impact > 0 ? `+${fc.weight_or_impact}` : fc.weight_or_impact}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                          {fc.importance_description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Required Medical Disclaimer */}
              <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 rounded-xl border border-amber-200/80 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  {predictionResult.disclaimer || 'This prototype is intended for screening support and research demonstration only. It does not provide a medical diagnosis.'}
                </span>
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-slate-400 shadow-card">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Awaiting Patient Inputs</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Select a Classical or Quantum model, enter clinical biomarkers or choose a sample profile preset, and click Generate Screening Assessment.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ScreeningPage;
