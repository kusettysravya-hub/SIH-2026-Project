import React, { useState } from 'react';
import { 
  Database, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  FileSpreadsheet,
  Layers,
  Check,
  BarChart2,
  Copy
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { api } from '../api';

export const DatasetPage = ({ datasetInfo, onDatasetChange }) => {
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [selectedFeatureIdx, setSelectedFeatureIdx] = useState(0);

  const rows = datasetInfo?.sample_preview || [];
  const totalRows = datasetInfo?.total_rows || 0;
  const duplicateRows = datasetInfo?.duplicate_rows ?? 0;
  const classDist = datasetInfo?.class_distribution || {};
  const availableDatasets = datasetInfo?.available_datasets || [];
  const featureDistributions = datasetInfo?.feature_distributions || [];

  const totalMissing = (datasetInfo?.column_stats || []).reduce((acc, c) => acc + (c.null_count || 0), 0);

  const pieData = Object.keys(classDist).map(key => ({
    name: key === '1' ? 'Diabetes Positive (Class 1)' : 'Non-Diabetic / Low Risk (Class 0)',
    value: classDist[key],
    color: key === '1' ? '#0d9488' : '#0284c7'
  }));

  const activeDist = featureDistributions[selectedFeatureIdx] || featureDistributions[0] || null;

  const handleSelectDataset = async (filename) => {
    if (filename === datasetInfo?.filename) return;
    setSwitching(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      const res = await api.selectDataset(filename);
      setSelectedFeatureIdx(0);
      setUploadSuccess(`Switched active dataset to ${res.filename} (${res.total_rows.toLocaleString()} rows, ${res.total_columns} columns).`);
      if (onDatasetChange) onDatasetChange();
    } catch (err) {
      setUploadError(err.response?.data?.detail || err.message || 'Failed to switch dataset.');
    } finally {
      setSwitching(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setUploadError('Please select a valid CSV file (.csv).');
        setFileToUpload(null);
        return;
      }
      setFileToUpload(file);
      setUploadError(null);
      setUploadSuccess(null);
    }
  };

  const handleUpload = async () => {
    if (!fileToUpload) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const res = await api.uploadDataset(fileToUpload);
      setSelectedFeatureIdx(0);
      setUploadSuccess(`Successfully uploaded ${res.filename} (${res.rows.toLocaleString()} rows, ${res.columns} columns).`);
      setFileToUpload(null);
      if (onDatasetChange) onDatasetChange();
    } catch (err) {
      setUploadError(err.response?.data?.detail || err.message || 'Failed to upload CSV file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <DisclaimerBanner />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-navy-900 dark:text-white tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            Dataset Explorer &amp; Multi-Cohort Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Inspect clinical feature distributions, missing/duplicate record summaries, and switch between the 100,000-row Clinical Cohort and 768-row Pima Cohort.
          </p>
        </div>
      </div>

      {/* Multi-Dataset Switcher Cards */}
      {availableDatasets.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Select Active Research Cohort ({availableDatasets.length} Datasets Available)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Both preloaded datasets are indexed with trained Classical &amp; Quantum models. Click any cohort card to switch active dataset.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableDatasets.map((ds) => {
              const isActive = ds.filename === datasetInfo?.filename;
              return (
                <button
                  key={ds.filename}
                  type="button"
                  disabled={switching}
                  onClick={() => handleSelectDataset(ds.filename)}
                  className={`text-left p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    isActive
                      ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 ring-2 ring-teal-500/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-sky-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-navy-900 dark:text-white">{ds.label}</span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      File: {ds.filename} • {ds.rows.toLocaleString()} rows × {ds.columns} cols ({ds.size_kb.toLocaleString()} KB)
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 flex-shrink-0 ${
                    isActive
                      ? 'bg-teal-600 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}>
                    {isActive ? <><Check className="w-3 h-3" /> Active</> : 'Switch'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Zone & Dataset Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Upload Card (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Upload Custom CSV Dataset
            </h3>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded font-semibold">
              Supports up to 50 MB
            </span>
          </div>

          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-sky-400 rounded-xl p-6 text-center transition-colors bg-slate-50/50 dark:bg-slate-800/40">
            <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <label className="cursor-pointer">
              <span className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-navy-900 dark:text-white hover:bg-slate-50 font-semibold text-xs rounded-lg shadow-sm transition-all inline-block">
                Choose Local CSV File
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <p className="text-[11px] text-slate-400 mt-2">
              {fileToUpload ? fileToUpload.name : 'Select any local CSV file (>1 MB files supported directly)'}
            </p>
          </div>

          {fileToUpload && (
            <div className="flex items-center justify-between p-3 bg-sky-50 dark:bg-sky-950/50 rounded-xl border border-sky-100 dark:border-sky-800 text-xs">
              <div className="truncate pr-2">
                <span className="font-semibold text-sky-900 dark:text-sky-200 truncate block">{fileToUpload.name}</span>
                <span className="text-[11px] text-sky-600 dark:text-sky-400">{(fileToUpload.size / 1024).toFixed(1)} KB</span>
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
              >
                {uploading ? 'Processing...' : 'Upload & Validate'}
              </button>
            </div>
          )}

          {uploadError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-1">
            <span className="font-semibold text-navy-900 dark:text-white block">Data Hygiene &amp; Encoding:</span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li>Supports numeric and categorical columns (<code>gender</code>, <code>smoking_history</code>).</li>
              <li>Auto-detects target column (<code>diabetes</code> or <code>Outcome</code>).</li>
              <li>Aggregates histograms on the backend so 100k+ rows render smoothly.</li>
            </ul>
          </div>
        </div>

        {/* Dataset Meta, Missing/Duplicate Summary & Class Balance (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Active Benchmark Dataset
              </span>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">{datasetInfo?.filename || 'diabetes_prediction_dataset.csv'}</h3>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              {totalRows.toLocaleString()} Patient Records
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {datasetInfo?.description}
          </p>

          {/* 4 Summary Pills: Rows, Features, Missing Values, Duplicate Rows */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Records</span>
              <div className="text-xl font-bold text-navy-900 dark:text-white mt-0.5">{totalRows.toLocaleString()}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Features</span>
              <div className="text-xl font-bold text-navy-900 dark:text-white mt-0.5">{datasetInfo?.feature_names?.length || 8}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Missing (Nulls)</span>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{totalMissing.toLocaleString()}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Duplicate Rows</span>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{duplicateRows.toLocaleString()}</div>
            </div>
          </div>

          {/* Class Distribution Chart */}
          <div className="pt-1">
            <h4 className="text-xs font-bold text-navy-900 dark:text-white mb-2 flex items-center justify-between">
              <span>Target Class Balance ({datasetInfo?.target_column || 'diabetes'})</span>
              <span className="text-[11px] text-slate-400 font-normal">
                {(classDist['1'] || 0).toLocaleString()} Positive ({totalRows ? ((classDist['1'] || 0) / totalRows * 100).toFixed(1) : 0}%) vs {(classDist['0'] || 0).toLocaleString()} Negative
              </span>
            </h4>
            
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val) => val.toLocaleString()}
                    contentStyle={{ backgroundColor: '#ffffff', color: '#0f172a', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Feature Distribution Explorer (Stratified by Target Class) */}
      {featureDistributions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                Interactive Clinical Feature Distributions (Stratified by Diabetes Outcome)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Backend-aggregated histogram bins across all {totalRows.toLocaleString()} patient records comparing Class 0 (Non-Diabetic) vs Class 1 (Diabetes Risk).
              </p>
            </div>

            {/* Feature Selector Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {featureDistributions.map((fd, idx) => (
                <button
                  key={fd.feature}
                  type="button"
                  onClick={() => setSelectedFeatureIdx(idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedFeatureIdx === idx
                      ? 'bg-navy-900 dark:bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {fd.feature}
                </button>
              ))}
            </div>
          </div>

          {activeDist && (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeDist.bins} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="bin_label" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val) => val.toLocaleString()}
                    contentStyle={{ backgroundColor: '#ffffff', color: '#0f172a', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="negative_count" name="Class 0 (Low Risk / Non-Diabetic)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="positive_count" name="Class 1 (High Risk / Diabetic)" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Feature Column Statistics Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-card">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-navy-900 dark:text-white">Clinical Feature Summary &amp; Encoding Diagnostics</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Data types, range bounds, categorical levels, missing values, and hybrid pipeline assignment.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Feature Name</th>
                <th className="py-3 px-4">Data Type</th>
                <th className="py-3 px-4">Min / Categories</th>
                <th className="py-3 px-4">Mean</th>
                <th className="py-3 px-4">Max</th>
                <th className="py-3 px-4">Missing (Null)</th>
                <th className="py-3 px-4">Zero Count</th>
                <th className="py-3 px-4">Pipeline Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {datasetInfo?.column_stats?.map((col, idx) => {
                const isQuantumFeature = ['Glucose', 'BMI', 'Age', 'DiabetesPedigreeFunction', 'HbA1c_level', 'blood_glucose_level', 'bmi', 'age'].includes(col.name);
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-semibold text-navy-900 dark:text-white">{col.name}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">{col.dtype}</td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                      {col.categories ? (
                        <span className="text-[11px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800/60">
                          Categorical: {col.categories.join(', ')}
                        </span>
                      ) : col.min !== null ? col.min : '--'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{col.mean !== null ? col.mean : '--'}</td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{col.max !== null ? col.max : '--'}</td>
                    <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">{col.null_count}</td>
                    <td className="py-2.5 px-4">
                      {col.zero_count > 0 && ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI'].includes(col.name) ? (
                        <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium text-[11px] border border-amber-200 dark:border-amber-800/60">
                          {col.zero_count.toLocaleString()} zeros (Imputed)
                        </span>
                      ) : (
                        <span className="text-slate-400">{col.zero_count.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      {col.name === datasetInfo?.target_column ? (
                        <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold text-[10px]">
                          Target (Binary)
                        </span>
                      ) : isQuantumFeature ? (
                        <span className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold text-[10px] border border-teal-200 dark:border-teal-800/60">
                          Classical + Quantum (4-Qubit)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Classical Feature</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dataset Sample Preview Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-card">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-navy-900 dark:text-white">Cohort Sample Records Preview ({datasetInfo?.filename})</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">First 10 records from the active dataset ({totalRows.toLocaleString()} total rows)</p>
          </div>
          <span className="text-xs text-slate-400 font-medium">Read-only preview</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                {rows.length > 0 && Object.keys(rows[0]).map((h, i) => (
                  <th key={i} className="py-2.5 px-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
              {rows.map((r, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  {Object.keys(r).map((key, cIdx) => (
                    <td key={cIdx} className={`py-2 px-3 whitespace-nowrap ${key === datasetInfo?.target_column ? 'font-bold text-sky-700 dark:text-sky-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {r[key] !== null && r[key] !== undefined ? String(r[key]) : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DatasetPage;
