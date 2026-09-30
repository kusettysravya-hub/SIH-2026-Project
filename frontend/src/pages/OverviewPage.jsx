import React, { useState } from 'react';
import { 
  Cpu, 
  Binary, 
  Database, 
  BarChart3, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Stethoscope,
  Sliders,
  Eye,
  Activity
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import MetricCard from '../components/MetricCard';
import DisclaimerBanner from '../components/DisclaimerBanner';
import QuantumVisualPlayer from '../components/QuantumVisualPlayer';

const WORKFLOW_STAGES = [
  {
    id: 'dataset',
    step: '01',
    title: 'Dataset',
    subtitle: 'Cohort Ingestion',
    icon: Database,
    color: 'from-sky-500 to-blue-600',
    summary: 'Loads validated clinical cohorts: the 100,000-record Comprehensive Clinical Diabetes Dataset or the 768-record Pima Indians Diabetes benchmark.',
    metricLabel: 'Supported Cohorts',
    metricValue: '100,000 & 768 rows'
  },
  {
    id: 'preprocessing',
    step: '02',
    title: 'Preprocessing',
    subtitle: 'Imputation & Split',
    icon: Sliders,
    color: 'from-blue-600 to-indigo-600',
    summary: 'Performs stratified 80/20 train-test splitting, physiological zero-value median imputation on training data only, and categorical feature mapping.',
    metricLabel: 'Validation Protocol',
    metricValue: '80% Train / 20% Test'
  },
  {
    id: 'encoding',
    step: '03',
    title: 'Feature Encoding',
    subtitle: 'Z-Score & Bloch Ry(θ)',
    icon: Layers,
    color: 'from-indigo-600 to-purple-600',
    summary: 'Classical pipelines standardize features to zero mean and unit variance (z-score). Quantum pipelines scale top biomarkers into [0, π] radians for Bloch sphere AngleEmbedding.',
    metricLabel: 'Quantum State Map',
    metricValue: 'Ry(θᵢ) ∈ [0, π]'
  },
  {
    id: 'models',
    step: '04',
    title: 'Classical / Quantum ML',
    subtitle: 'Dual-Engine Training',
    icon: Cpu,
    color: 'from-teal-500 to-emerald-600',
    summary: 'Trains Scikit-Learn Logistic Regression and Random Forest baselines alongside a 4-qubit PennyLane Variational Quantum Circuit (VQC) with circular CNOT entanglement.',
    metricLabel: 'Active Architectures',
    metricValue: '2 Classical + 1 QML VQC'
  },
  {
    id: 'prediction',
    step: '05',
    title: 'Prediction',
    subtitle: 'Probabilistic Screening',
    icon: Stethoscope,
    color: 'from-emerald-600 to-teal-600',
    summary: 'Computes calibrated diabetes risk probability, predicted risk category (Low, Moderate, or High Risk), and single-sample inference latency in milliseconds.',
    metricLabel: 'Readout Observable',
    metricValue: '⟨Z₀, Z₁, Z₂, Z₃⟩ → P(y=1)'
  },
  {
    id: 'explainability',
    step: '06',
    title: 'Explainability',
    subtitle: 'Feature Attribution',
    icon: Eye,
    color: 'from-amber-500 to-orange-600',
    summary: 'Visualizes patient-specific biomarker contributions: standardized linear log-odds impacts, ensemble tree Gini importances, and quantum qubit rotation angles.',
    metricLabel: 'Transparency',
    metricValue: 'Per-Patient Attribution'
  }
];

export const OverviewPage = ({ setActiveTab, modelsData, datasetInfo, backendHealth }) => {
  const [activeStageIdx, setActiveStageIdx] = useState(2);

  const lrModel = modelsData?.models?.logistic_regression;
  const rfModel = modelsData?.models?.random_forest;
  const qmlModel = modelsData?.models?.quantum_vqc;

  const trainedCount = [lrModel, rfModel, qmlModel].filter(m => m?.trained).length;
  const totalRows = datasetInfo?.total_rows || 100000;
  const featureCount = datasetInfo?.feature_names?.length || 8;
  const activeStage = WORKFLOW_STAGES[activeStageIdx] || WORKFLOW_STAGES[0];

  const qmlFeatures = qmlModel?.features_used?.length === 4
    ? qmlModel.features_used
    : ['HbA1c_level', 'blood_glucose_level', 'bmi', 'age'];

  return (
    <div className="space-y-8 pb-12">
      {/* Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Hero Section with Interactive Quantum Visual / Video Stream */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-slate-900 to-sky-950 text-white p-6 md:p-9 shadow-xl border border-navy-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 -mb-10 w-72 h-72 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Title, Concept Explanation & Primary Actions */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              Smart India Hackathon Prototype • Healthcare &amp; Quantum AI
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Hybrid Quantum Machine Learning Platform for Early Disease Detection
            </h1>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed font-normal">
              A unified clinical screening and research benchmarking platform that combines{' '}
              <span className="text-sky-300 font-semibold">Classical Machine Learning</span> baselines with{' '}
              <span className="text-teal-300 font-semibold">Variational Quantum Circuits (VQC)</span>.
              Designed for early Type 2 diabetes risk screening using real physiological biomarkers mapped onto multi-qubit Hilbert space.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <span className="text-sky-300 font-bold block mb-0.5">Classical ML Pipeline</span>
                <span className="text-slate-300">
                  Scikit-Learn Logistic Regression &amp; Random Forest across all {featureCount} clinical attributes.
                </span>
              </div>
              <div className="bg-teal-500/10 border border-teal-400/20 rounded-xl p-3">
                <span className="text-teal-300 font-bold block mb-0.5">Quantum VQC Pipeline</span>
                <span className="text-slate-300">
                  PennyLane 4-qubit Bloch angle embedding, variational rotations, and Pauli-Z readout.
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('screening')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 text-white font-semibold text-sm shadow-md hover:from-sky-600 hover:to-teal-600 transition-all hover:scale-[1.02]"
              >
                <Stethoscope className="w-4 h-4" />
                Start Screening Demonstration
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('comparison')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/20 transition-all hover:scale-[1.02]"
              >
                <BarChart3 className="w-4 h-4 text-sky-300" />
                Compare Models
              </button>

              <button
                onClick={() => setActiveTab('dataset')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-semibold text-xs border border-white/15 transition-all"
              >
                <Database className="w-3.5 h-3.5 text-teal-300" />
                Switch Dataset ({totalRows.toLocaleString()} rows)
              </button>
            </div>
          </div>

          {/* Right Column: Scientific Bloch Sphere & 4-Qubit VQC Visual Player */}
          <div className="lg:col-span-5">
            <QuantumVisualPlayer mode="hero" featureNames={qmlFeatures} />
          </div>
        </div>
      </div>

      {/* Live Backend-Driven Metric Summary Cards (with count-up animation) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Dataset Cohort"
          value={totalRows}
          subtitle={`File: ${datasetInfo?.filename || 'diabetes_prediction_dataset.csv'}`}
          icon={Database}
          badge={totalRows > 10000 ? '100k Clinical' : 'Pima Cohort'}
          color="emerald"
        />
        <MetricCard
          title="Supported Features"
          value={featureCount}
          subtitle={`Target: ${datasetInfo?.target_column || 'diabetes'} (Binary 0/1)`}
          icon={Layers}
          badge="4 QML + All Classical"
          color="blue"
        />
        <MetricCard
          title="Implemented Models"
          value={3}
          subtitle="Logistic Regression, Random Forest & Quantum VQC"
          icon={Cpu}
          badge="Hybrid Stack"
          color="teal"
        />
        <MetricCard
          title="Model Evaluation Status"
          value={`${trainedCount} / 3 Ready`}
          subtitle={`Evaluated on ${(modelsData?.total_test_samples || Math.round(totalRows * 0.2)).toLocaleString()} held-out test records`}
          icon={CheckCircle2}
          badge={trainedCount === 3 ? 'All Trained' : 'Ready'}
          color="purple"
        />
      </div>

      {/* Interactive 6-Stage Hybrid Quantum ML Workflow */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 md:p-7 shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              End-to-End Scientific Architecture
            </span>
            <h3 className="text-lg font-bold text-navy-900 dark:text-white">
              Hybrid Classical &amp; Quantum Screening Workflow
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('methodology')}
            className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 inline-flex items-center gap-1"
          >
            Explore Full Quantum Methodology <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 6 Connected Stage Cards: Dataset -> Preprocessing -> Feature Encoding -> Classical / Quantum ML -> Prediction -> Explainability */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {WORKFLOW_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isSelected = idx === activeStageIdx;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setActiveStageIdx(idx)}
                className={`text-left rounded-xl p-3.5 border transition-all duration-200 relative group ${
                  isSelected
                    ? 'bg-navy-900 dark:bg-sky-950 text-white border-navy-900 dark:border-sky-500 shadow-md -translate-y-0.5'
                    : 'bg-slate-50/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700/80 hover:border-sky-300 dark:hover:border-sky-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    STEP {stage.step}
                  </span>
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-300' : 'text-sky-600 dark:text-sky-400'}`} />
                </div>
                <div className={`text-xs font-bold mb-0.5 ${isSelected ? 'text-white' : 'text-navy-900 dark:text-white'}`}>
                  {stage.title}
                </div>
                <div className={`text-[11px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                  {stage.subtitle}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Stage Detail Strip */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                Stage {activeStage.step}: {activeStage.title} ({activeStage.subtitle})
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              {activeStage.summary}
            </p>
          </div>
          <div className="flex-shrink-0 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">{activeStage.metricLabel}</span>
            <span className="text-xs font-bold text-navy-900 dark:text-sky-300 font-mono">{activeStage.metricValue}</span>
          </div>
        </div>
      </div>

      {/* Live Model Benchmark Snapshot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Logistic Regression */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800/60">
              <Binary className="w-5 h-5" />
            </div>
            <StatusBadge status={lrModel?.status} />
          </div>
          <h3 className="text-base font-bold text-navy-900 dark:text-white mb-1">Logistic Regression</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Interpretable linear baseline with standardized clinical features and log-odds attribution.
          </p>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Accuracy</span>
              <span className="font-bold text-navy-900 dark:text-white">
                {lrModel?.accuracy ? `${(lrModel.accuracy * 100).toFixed(1)}%` : '--'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">F1-Score</span>
              <span className="font-bold text-navy-900 dark:text-white">
                {lrModel?.f1_score ? `${(lrModel.f1_score * 100).toFixed(1)}%` : '--'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">ROC-AUC</span>
              <span className="font-bold text-sky-600 dark:text-sky-400">
                {lrModel?.roc_auc ? `${(lrModel.roc_auc * 100).toFixed(1)}%` : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Random Forest */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60">
              <Activity className="w-5 h-5" />
            </div>
            <StatusBadge status={rfModel?.status} />
          </div>
          <h3 className="text-base font-bold text-navy-900 dark:text-white mb-1">Random Forest Ensemble</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Non-linear ensemble of 100 depth-regularized decision trees capturing biomarker thresholds.
          </p>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Accuracy</span>
              <span className="font-bold text-navy-900 dark:text-white">
                {rfModel?.accuracy ? `${(rfModel.accuracy * 100).toFixed(1)}%` : '--'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">F1-Score</span>
              <span className="font-bold text-navy-900 dark:text-white">
                {rfModel?.f1_score ? `${(rfModel.f1_score * 100).toFixed(1)}%` : '--'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">ROC-AUC</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {rfModel?.roc_auc ? `${(rfModel.roc_auc * 100).toFixed(1)}%` : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Quantum VQC */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-teal-200 dark:border-teal-800/70 p-5 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800/60">
              <Cpu className="w-5 h-5" />
            </div>
            <StatusBadge status={qmlModel?.status} />
          </div>
          <h3 className="text-base font-bold text-navy-900 dark:text-white mb-1">4-Qubit Quantum VQC</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Parameterized quantum circuit on PennyLane <code>default.qubit</code> with 4-wire Pauli-Z readout.
          </p>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Accuracy</span>
              <span className="font-bold text-teal-700 dark:text-teal-300">
                {qmlModel?.accuracy ? `${(qmlModel.accuracy * 100).toFixed(1)}%` : '--'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">F1-Score</span>
              <span className="font-bold text-teal-700 dark:text-teal-300">
                {qmlModel?.f1_score ? `${(qmlModel.f1_score * 100).toFixed(1)}%` : '--'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">ROC-AUC</span>
              <span className="font-bold text-teal-600 dark:text-teal-400">
                {qmlModel?.roc_auc ? `${(qmlModel.roc_auc * 100).toFixed(1)}%` : '--'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
