import React, { useState } from 'react';
import { 
  GitBranch, 
  Cpu, 
  Binary, 
  Database, 
  Layers, 
  Scale,
  Sliders,
  Stethoscope,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import DisclaimerBanner from '../components/DisclaimerBanner';
import QuantumVisualPlayer from '../components/QuantumVisualPlayer';

const PIPELINE_STEPS = [
  {
    step: '01',
    title: 'Dataset Ingestion & Multi-Cohort Validation',
    icon: Database,
    summary: 'Supports both the 100,000-record Comprehensive Clinical Diabetes Dataset and the 768-record Pima Indians Diabetes Dataset, plus custom CSV uploads up to 50 MB.',
    details: 'Validates numeric biomarkers (HbA1c_level, blood_glucose_level, bmi, age, Glucose, Insulin, BloodPressure) and categorical/binary clinical factors (gender, smoking_history, hypertension, heart_disease) while automatically detecting the binary target column.'
  },
  {
    step: '02',
    title: 'Clinical Preprocessing & Leakage Prevention',
    icon: Sliders,
    summary: 'Performs stratified 80/20 train-test splitting (seed 42) and training-only median imputation for unrecorded physiological zeros.',
    details: 'In clinical datasets such as Pima Indians, zero values in Glucose, BloodPressure, SkinThickness, Insulin, or BMI represent missing assays rather than true physiological zeroes. Medians are computed strictly on the 80% training partition to prevent test-set data leakage.'
  },
  {
    step: '03',
    title: 'Feature Encoding (StandardScaler & Bloch Sphere Ry)',
    icon: Layers,
    summary: 'Maps clinical attributes into standardized vector space for Classical ML and [0, π] radian rotation angles for Quantum VQC.',
    details: 'For Classical ML, features are standardized via z = (x - μ) / σ. For Quantum ML, the 4 primary biomarkers are scaled into θᵢ ∈ [0, π] and embedded into single-qubit quantum states via |ψ(θᵢ)⟩ = Ry(θᵢ)|0⟩ = cos(θᵢ/2)|0⟩ + sin(θᵢ/2)|1⟩.'
  },
  {
    step: '04',
    title: 'Classical & Quantum Model Execution',
    icon: Cpu,
    summary: 'Benchmarks Scikit-Learn Logistic Regression and Random Forest against a PennyLane 4-Qubit Variational Quantum Circuit.',
    details: 'The Quantum VQC executes 2 parameterized variational layers of Ry(ω) and Rz(ω) single-qubit rotations interleaved with circular CNOT entangling gates (q0→q1, q1→q2, q2→q3, q3→q0) on the PennyLane default.qubit statevector simulator.'
  },
  {
    step: '05',
    title: 'Probabilistic Prediction & Multi-Qubit Readout',
    icon: Stethoscope,
    summary: 'Measures Pauli-Z expectation values ⟨Z₀, Z₁, Z₂, Z₃⟩ across all 4 wires and maps them to calibrated diabetes risk probabilities.',
    details: 'Rather than relying on a single wire, all 4 qubit Pauli-Z expectation values in [-1, +1] are linearly combined with learned readout weights and passed through a logistic sigmoid function to produce a calibrated risk probability P(y=1).'
  },
  {
    step: '06',
    title: 'Clinical Explainability & Feature Attribution',
    icon: Eye,
    summary: 'Provides transparent per-patient feature attribution across all three model architectures.',
    details: 'Displays standardized log-odds contributions (βᵢ · zᵢ) for Logistic Regression, Gini impurity split importances for Random Forest, and qubit Bloch rotation angles Ry(θᵢ) alongside wire expectation values ⟨Zᵢ⟩ for the Quantum VQC.'
  }
];

export const MethodologyPage = () => {
  const [expandedStep, setExpandedStep] = useState(2);

  return (
    <div className="space-y-8 pb-12">
      <DisclaimerBanner />

      <div>
        <h2 className="text-2xl font-bold text-navy-900 dark:text-white tracking-tight flex items-center gap-2">
          <GitBranch className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          Hybrid Quantum-Classical Methodology &amp; Circuit Architecture
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Interactive quantum circuit telemetry, Bloch sphere state encoding, and end-to-end experimental protocol.
        </p>
      </div>

      {/* Instructional Quantum Circuit & Bloch Sphere Visualizer */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Interactive Instructional Visualization
            </span>
            <h3 className="text-base font-bold text-navy-900 dark:text-white">
              4-Qubit Variational Quantum Classifier (VQC) Execution &amp; Bloch State Telemetry
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Use Play/Pause or click any qubit tab below to inspect its rotation angle and Pauli-Z expectation readout
          </span>
        </div>

        <QuantumVisualPlayer
          mode="methodology"
          featureNames={['HbA1c_level', 'blood_glucose_level', 'bmi', 'age']}
        />
      </div>

      {/* 6-Stage Interactive Pipeline Walkthrough */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-4">
        <div>
          <h3 className="text-base font-bold text-navy-900 dark:text-white">
            6-Stage Hybrid Screening Pipeline (Click any stage to expand technical details)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dataset → Preprocessing → Feature Encoding → Classical / Quantum ML → Prediction → Explainability
          </p>
        </div>

        <div className="space-y-3">
          {PIPELINE_STEPS.map((item, idx) => {
            const Icon = item.icon;
            const isOpen = expandedStep === idx;
            return (
              <div
                key={item.step}
                className={`rounded-xl border transition-all ${
                  isOpen
                    ? 'border-sky-500/60 bg-sky-50/30 dark:bg-slate-800/80'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedStep(isOpen ? -1 : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-navy-900 dark:bg-sky-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
                        <Icon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.summary}
                      </p>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.details}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Deep-Dive Comparison: Quantum VQC vs Classical Baselines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Quantum ML Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white">Quantum Machine Learning (VQC) Architecture</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <h5 className="font-bold text-navy-900 dark:text-white mb-1">1. Angle Feature Encoding</h5>
              <p>
                Continuous clinical biomarkers scaled to [0, π] rotate each qubit initialized at |0⟩ via Ry(θᵢ), mapping patient physiology onto a 2⁴ = 16-dimensional complex Hilbert space.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <h5 className="font-bold text-navy-900 dark:text-white mb-1">2. Entangling Variational Layers</h5>
              <p>
                Each layer applies trainable Ry(ω₁) and Rz(ω₂) single-qubit gates followed by a ring of CNOT gates connecting adjacent qubits to capture non-linear biomarker interactions.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <h5 className="font-bold text-navy-900 dark:text-white mb-1">3. 4-Wire Pauli-Z Readout &amp; Backprop</h5>
              <p>
                Expectation values ⟨Z₀⟩, ⟨Z₁⟩, ⟨Z₂⟩, ⟨Z₃⟩ are measured across all 4 wires and optimized end-to-end with Adam and binary cross-entropy loss.
              </p>
            </div>
          </div>
        </div>

        {/* Classical ML Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Binary className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white">Classical ML Benchmarks</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <h5 className="font-bold text-navy-900 dark:text-white mb-1">1. Logistic Regression Baseline</h5>
              <p>
                L2-regularized linear classifier (L-BFGS solver) trained on all 8 standardized clinical features, providing direct log-odds coefficient attribution.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <h5 className="font-bold text-navy-900 dark:text-white mb-1">2. Random Forest Ensemble</h5>
              <p>
                Non-linear ensemble of 100 depth-regularized decision trees (max_depth = 6) capturing multi-feature clinical decision thresholds.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <h5 className="font-bold text-navy-900 dark:text-white mb-1">3. Stratified Hold-Out Protocol</h5>
              <p>
                Preserves exact positive/negative class ratios across the 80% training and 20% test splits so imbalanced clinical cohorts are evaluated fairly.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Fair Comparison & Limitations Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-4">
        <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
          <Scale className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          Scientific Rigor, Limitations &amp; Roadmap
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
            <h5 className="font-bold text-navy-900 dark:text-white">Current Prototype Scope</h5>
            <ul className="list-disc list-inside space-y-1">
              <li>Executed on PennyLane&apos;s noise-free statevector simulator (<code>default.qubit</code>) on standard laptop hardware.</li>
              <li>Quantum circuit uses 4 qubits representing the 4 highest-signal metabolic biomarkers to keep simulation fast and responsive.</li>
              <li>Intended strictly for screening research and algorithmic benchmarking, not clinical diagnosis.</li>
            </ul>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
            <h5 className="font-bold text-navy-900 dark:text-white">Future Research Extensions</h5>
            <ul className="list-disc list-inside space-y-1">
              <li>Hardware execution on superconducting and trapped-ion QPUs with noise mitigation and shot-noise modeling.</li>
              <li>Quantum Kernel Alignment (QSVC) and data re-uploading circuits for higher-dimensional clinical cohorts.</li>
              <li>Multi-disease screening across cardiovascular, chronic kidney disease, and metabolic syndrome datasets.</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
};

export default MethodologyPage;
