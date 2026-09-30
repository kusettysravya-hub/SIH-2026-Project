import React, { useState } from 'react';
import { 
  BarChart3, 
  Cpu, 
  Binary, 
  Layers, 
  RotateCw, 
  Scale,
  Database,
  Filter
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import ConfusionMatrixCard from '../components/ConfusionMatrixCard';
import StatusBadge from '../components/StatusBadge';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { api } from '../api';

export const ComparisonPage = ({ modelsData, datasetInfo, onTrainModel, onDatasetChange, loadingModel }) => {
  const [highlightCriterion, setHighlightCriterion] = useState('none');

  const lr = modelsData?.models?.logistic_regression;
  const rf = modelsData?.models?.random_forest;
  const qml = modelsData?.models?.quantum_vqc;

  const anyTrained = lr?.trained || rf?.trained || qml?.trained;
  const totalTestSamples = modelsData?.total_test_samples || 154;
  const isClinical100k = datasetInfo?.filename?.includes('prediction') || modelsData?.dataset_name?.includes('prediction');

  const handleSwitchDataset = async (fname) => {
    try {
      await api.selectDataset(fname);
      if (onDatasetChange) onDatasetChange();
    } catch (e) {
      console.error(e);
    }
  };

  // Optional user-controlled metric highlight (never auto-crowns an overall winner)
  const getHighlightedModelId = () => {
    if (highlightCriterion === 'none') return null;
    const candidates = [lr, rf, qml].filter(m => m && m.trained);
    if (candidates.length === 0) return null;
    if (highlightCriterion === 'inference_latency_ms') {
      return candidates.reduce((prev, curr) =>
        (curr.inference_latency_ms || 999) < (prev.inference_latency_ms || 999) ? curr : prev
      ).model_id;
    }
    return candidates.reduce((prev, curr) =>
      (curr[highlightCriterion] || 0) > (prev[highlightCriterion] || 0) ? curr : prev
    ).model_id;
  };

  const highlightedId = getHighlightedModelId();

  // Build chart dataset with actual backend metrics including ROC-AUC
  const chartData = [
    {
      metric: 'Accuracy',
      'Classical Logistic Regression': lr?.trained && lr?.accuracy ? Math.round(lr.accuracy * 1000) / 10 : 0,
      'Classical Random Forest': rf?.trained && rf?.accuracy ? Math.round(rf.accuracy * 1000) / 10 : 0,
      'Quantum VQC (4-Qubit)': qml?.trained && qml?.accuracy ? Math.round(qml.accuracy * 1000) / 10 : 0,
    },
    {
      metric: 'Precision',
      'Classical Logistic Regression': lr?.trained && lr?.precision ? Math.round(lr.precision * 1000) / 10 : 0,
      'Classical Random Forest': rf?.trained && rf?.precision ? Math.round(rf.precision * 1000) / 10 : 0,
      'Quantum VQC (4-Qubit)': qml?.trained && qml?.precision ? Math.round(qml.precision * 1000) / 10 : 0,
    },
    {
      metric: 'Recall (Sensitivity)',
      'Classical Logistic Regression': lr?.trained && lr?.recall ? Math.round(lr.recall * 1000) / 10 : 0,
      'Classical Random Forest': rf?.trained && rf?.recall ? Math.round(rf.precision ? rf.recall * 1000 : 0) / 10 : 0,
      'Quantum VQC (4-Qubit)': qml?.trained && qml?.recall ? Math.round(qml.recall * 1000) / 10 : 0,
    },
    {
      metric: 'F1-Score',
      'Classical Logistic Regression': lr?.trained && lr?.f1_score ? Math.round(lr.f1_score * 1000) / 10 : 0,
      'Classical Random Forest': rf?.trained && rf?.f1_score ? Math.round(rf.f1_score * 1000) / 10 : 0,
      'Quantum VQC (4-Qubit)': qml?.trained && qml?.f1_score ? Math.round(qml.f1_score * 1000) / 10 : 0,
    },
    {
      metric: 'ROC-AUC',
      'Classical Logistic Regression': lr?.trained && lr?.roc_auc ? Math.round(lr.roc_auc * 1000) / 10 : 0,
      'Classical Random Forest': rf?.trained && rf?.roc_auc ? Math.round(rf.roc_auc * 1000) / 10 : 0,
      'Quantum VQC (4-Qubit)': qml?.trained && qml?.roc_auc ? Math.round(qml.roc_auc * 1000) / 10 : 0,
    },
  ];

  const renderModelCard = (model, title, subtitle, Icon, accentColor) => {
    const isHighlighted = highlightedId && model?.model_id === highlightedId;
    return (
      <div
        className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-card hover:shadow-card-hover transition-all ${
          isHighlighted
            ? 'border-sky-500 ring-2 ring-sky-500/20'
            : accentColor === 'teal'
            ? 'border-teal-200 dark:border-teal-800/70'
            : 'border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${
              accentColor === 'teal'
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
                : accentColor === 'purple'
                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                : 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400'
            }`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy-900 dark:text-white">{title}</h3>
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
          </div>
          <StatusBadge status={model?.status} />
        </div>

        {isHighlighted && (
          <div className="mt-2.5 px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 text-[11px] font-semibold text-sky-800 dark:text-sky-300 text-center">
            Highest on selected criterion: {highlightCriterion.replace(/_/g, ' ').toUpperCase()}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 py-4 text-center">
          <div className="bg-slate-50/70 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Accuracy</span>
            <div className="text-base font-extrabold text-navy-900 dark:text-white mt-0.5">
              {model?.accuracy ? `${(model.accuracy * 100).toFixed(1)}%` : '--'}
            </div>
          </div>
          <div className="bg-slate-50/70 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">F1-Score</span>
            <div className="text-base font-extrabold text-navy-900 dark:text-white mt-0.5">
              {model?.f1_score ? `${(model.f1_score * 100).toFixed(1)}%` : '--'}
            </div>
          </div>
          <div className="bg-slate-50/70 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">ROC-AUC</span>
            <div className="text-base font-extrabold text-teal-600 dark:text-teal-400 mt-0.5">
              {model?.roc_auc ? `${(model.roc_auc * 100).toFixed(1)}%` : '--'}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Train: <strong className="text-navy-900 dark:text-slate-200">{model?.training_time_seconds ? `${model.training_time_seconds}s` : '--'}</strong></span>
          <span>Inference: <strong className="text-navy-900 dark:text-slate-200">{model?.inference_latency_ms ? `${model.inference_latency_ms} ms` : '--'}</strong></span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <DisclaimerBanner />

      {/* Header and Quick Train Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-navy-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            Empirical Classical vs. Quantum Model Comparison
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dataset: <strong className="text-navy-900 dark:text-white">{modelsData?.dataset_name || datasetInfo?.filename}</strong> • Held-Out Test Split: <strong>N = {totalTestSamples.toLocaleString()}</strong> (20%)
          </p>
        </div>

        {/* Retrain Action buttons + Dataset Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 shadow-sm mr-1">
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
          <button
            onClick={() => onTrainModel && onTrainModel('logistic_regression')}
            disabled={loadingModel === 'logistic_regression'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-all"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loadingModel === 'logistic_regression' ? 'animate-spin text-sky-600' : 'text-slate-400'}`} />
            {loadingModel === 'logistic_regression' ? 'Training LR...' : 'Retrain LR'}
          </button>

          <button
            onClick={() => onTrainModel && onTrainModel('random_forest')}
            disabled={loadingModel === 'random_forest'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-all"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loadingModel === 'random_forest' ? 'animate-spin text-purple-600' : 'text-slate-400'}`} />
            {loadingModel === 'random_forest' ? 'Training RF...' : 'Retrain RF'}
          </button>

          <button
            onClick={() => onTrainModel && onTrainModel('quantum_vqc')}
            disabled={loadingModel === 'quantum_vqc'}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-xs font-semibold text-white shadow-sm transition-all"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loadingModel === 'quantum_vqc' ? 'animate-spin text-teal-200' : 'text-teal-200'}`} />
            {loadingModel === 'quantum_vqc' ? 'Simulating VQC...' : 'Retrain Quantum VQC'}
          </button>
        </div>
      </div>

      {/* User-Controlled Metric Trade-off Selector (Does not auto-crown a winner) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-card">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <Filter className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
          <span>
            <strong>Clinical Trade-off Explorer:</strong> Medical screening balances sensitivity, precision, interpretability, and speed. Select a specific criterion to highlight:
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'none', label: 'Balanced View (No Auto-Winner)' },
            { id: 'recall', label: 'Recall / Sensitivity' },
            { id: 'precision', label: 'Precision (PPV)' },
            { id: 'f1_score', label: 'F1-Score' },
            { id: 'roc_auc', label: 'ROC-AUC' },
            { id: 'inference_latency_ms', label: 'Inference Speed' },
          ].map((crit) => (
            <button
              key={crit.id}
              type="button"
              onClick={() => setHighlightCriterion(crit.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                highlightCriterion === crit.id
                  ? 'bg-navy-900 dark:bg-sky-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {crit.label}
            </button>
          ))}
        </div>
      </div>

      {!anyTrained ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-card">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-2">No Trained Models Available</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            Initiate training for Classical Machine Learning or Quantum VQC to inspect empirical test-split metrics.
          </p>
        </div>
      ) : (
        <>
          {/* Top Level Metric Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {renderModelCard(lr, 'Logistic Regression', 'Classical Linear Baseline (8 Features)', Binary, 'sky')}
            {renderModelCard(rf, 'Random Forest', 'Classical 100-Tree Ensemble (8 Features)', Layers, 'purple')}
            {renderModelCard(qml, 'Quantum VQC', 'PennyLane 4-Qubit Circuit (default.qubit)', Cpu, 'teal')}
          </div>

          {/* Comparative Bar Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-navy-900 dark:text-white">Multi-Metric Side-by-Side Comparison (Accuracy, Precision, Recall, F1, ROC-AUC)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Evaluated on the identical 20% stratified held-out test split (N = {totalTestSamples.toLocaleString()}).
                </p>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.4} />
                  <XAxis dataKey="metric" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val) => [`${val}%`, '']}
                    contentStyle={{ backgroundColor: '#ffffff', color: '#0f172a', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Classical Logistic Regression" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Classical Random Forest" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Quantum VQC (4-Qubit)" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side-by-Side Confusion Matrices */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ConfusionMatrixCard 
              matrix={lr?.confusion_matrix} 
              title="Logistic Regression Matrix" 
              testSamples={totalTestSamples} 
            />
            <ConfusionMatrixCard 
              matrix={rf?.confusion_matrix} 
              title="Random Forest Matrix" 
              testSamples={totalTestSamples} 
            />
            <ConfusionMatrixCard 
              matrix={qml?.confusion_matrix} 
              title="Quantum VQC Matrix" 
              testSamples={totalTestSamples} 
            />
          </div>

          {/* Benchmark Comparison Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-card">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-navy-900 dark:text-white">Comprehensive Empirical Benchmark Table</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Full comparison across predictive performance, ROC-AUC discrimination, training time, and single-patient inference latency
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Architecture</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Accuracy</th>
                    <th className="py-3 px-4">Precision</th>
                    <th className="py-3 px-4">Recall</th>
                    <th className="py-3 px-4">F1-Score</th>
                    <th className="py-3 px-4">ROC-AUC</th>
                    <th className="py-3 px-4">Train Time</th>
                    <th className="py-3 px-4">Inference Time</th>
                    <th className="py-3 px-4">Feature Space</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  
                  {/* LR Row */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-navy-900 dark:text-white">
                      Logistic Regression (Classical)
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={lr?.status} /></td>
                    <td className="py-3 px-4 font-bold text-navy-900 dark:text-white">
                      {lr?.accuracy ? `${(lr.accuracy * 100).toFixed(2)}%` : '--'}
                    </td>
                    <td className="py-3 px-4">{lr?.precision ? `${(lr.precision * 100).toFixed(2)}%` : '--'}</td>
                    <td className="py-3 px-4">{lr?.recall ? `${(lr.recall * 100).toFixed(2)}%` : '--'}</td>
                    <td className="py-3 px-4 font-semibold">{lr?.f1_score ? `${(lr.f1_score * 100).toFixed(2)}%` : '--'}</td>
                    <td className="py-3 px-4 text-sky-600 dark:text-sky-400 font-semibold">{lr?.roc_auc ? `${(lr.roc_auc * 100).toFixed(2)}%` : '--'}</td>
                    <td className="py-3 px-4 font-mono">{lr?.training_time_seconds ? `${lr.training_time_seconds}s` : '--'}</td>
                    <td className="py-3 px-4 font-mono">{lr?.inference_latency_ms ? `${lr.inference_latency_ms} ms` : '--'}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">8 Clinical Features</td>
                  </tr>

                  {/* RF Row */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-navy-900 dark:text-white">
                      Random Forest (Classical Ensemble)
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={rf?.status} /></td>
                    <td className="py-3 px-4 font-bold text-navy-900 dark:text-white">
                      {rf?.accuracy ? `${(rf.accuracy * 100).toFixed(2)}%` : '--'}
                    </td>
                    <td className="py-3 px-4">{rf?.precision ? `${(rf.precision * 100).toFixed(2)}%` : '--'}</td>
                    <td className="py-3 px-4">{rf?.recall ? `${(rf.recall * 100).toFixed(2)}%` : '--'}</td>
                    <td className="py-3 px-4 font-semibold">{rf?.f1_score ? `${(rf.f1_score * 100).toFixed(2)}%` : '--'}</td>
                    <td className="py-3 px-4 text-purple-600 dark:text-purple-400 font-semibold">{rf?.roc_auc ? `${(rf.roc_auc * 100).toFixed(2)}%` : '--'}</td>
                    <td className="py-3 px-4 font-mono">{rf?.training_time_seconds ? `${rf.training_time_seconds}s` : '--'}</td>
                    <td className="py-3 px-4 font-mono">{rf?.inference_latency_ms ? `${rf.inference_latency_ms} ms` : '--'}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">8 Clinical Features</td>
                  </tr>

                  {/* Quantum Row */}
                  <tr className="hover:bg-teal-50/30 dark:hover:bg-teal-950/30 bg-teal-50/10 dark:bg-teal-950/20">
                    <td className="py-3 px-4 font-semibold text-teal-900 dark:text-teal-300">
                      Quantum VQC (PennyLane default.qubit)
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={qml?.status} /></td>
                    <td className="py-3 px-4 font-bold text-teal-800 dark:text-teal-300">
                      {qml?.accuracy ? `${(qml.accuracy * 100).toFixed(2)}%` : '--'}
                    </td>
                    <td className="py-3 px-4">{qml?.precision ? `${(qml.precision * 100).toFixed(2)}%` : '--'}</td>
                    <td className="py-3 px-4">{qml?.recall ? `${(qml.recall * 100).toFixed(2)}%` : '--'}</td>
                    <td className="py-3 px-4 font-semibold">{qml?.f1_score ? `${(qml.f1_score * 100).toFixed(2)}%` : '--'}</td>
                    <td className="py-3 px-4 text-teal-600 dark:text-teal-400 font-semibold">{qml?.roc_auc ? `${(qml.roc_auc * 100).toFixed(2)}%` : '--'}</td>
                    <td className="py-3 px-4 font-mono">{qml?.training_time_seconds ? `${qml.training_time_seconds}s` : '--'}</td>
                    <td className="py-3 px-4 font-mono">{qml?.inference_latency_ms ? `${qml.inference_latency_ms} ms` : '--'}</td>
                    <td className="py-3 px-4 text-teal-700 dark:text-teal-400">4 Key Biomarkers (Angle Embedding)</td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

          {/* Research & Fairness Disclosure Card */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-navy-900 dark:text-white">
              <Scale className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Fair Evaluation &amp; Clinical Trade-Off Disclosure
            </div>
            <p className="leading-relaxed">
              <strong>No Single Automatic Winner:</strong> In clinical risk screening, choosing a model depends on operational goals—high <strong>Recall (Sensitivity)</strong> minimizes missed positive cases, high <strong>Precision</strong> minimizes false-alarm referrals, <strong>Logistic Regression</strong> offers direct linear log-odds interpretability, and <strong>Quantum VQC</strong> demonstrates competitive classification in a compact 4-qubit Hilbert feature space.
            </p>
            <p className="leading-relaxed">
              <strong>Evaluation Fairness:</strong> All models were evaluated on the exact same 20% held-out stratified test cohort (N = {totalTestSamples.toLocaleString()}) with random seed 42.
            </p>
          </div>

        </>
      )}

    </div>
  );
};

export default ComparisonPage;
