import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Award,
  BookOpen,
  Code
} from 'lucide-react';
import DisclaimerBanner from '../components/DisclaimerBanner';

export const AboutPage = () => {
  return (
    <div className="space-y-8 pb-12">
      <DisclaimerBanner />

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-card">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-semibold mb-4">
          <Award className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          Smart India Hackathon Software Edition
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight mb-3">
          Hybrid Quantum Machine Learning Platform for Early Disease Detection
        </h2>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
          An interactive scientific research and clinical screening-support prototype that benchmarks Classical Machine Learning baselines against Variational Quantum Circuits (VQC) for early Type 2 Diabetes risk detection across both the 100,000-record Comprehensive Clinical Diabetes Dataset and the 768-record Pima Indians Diabetes benchmark.
        </p>
      </div>

      {/* Problem Statement & Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-3">
          <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            Problem Statement &amp; Clinical Context
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Type 2 diabetes often progresses silently for years before clinical diagnosis. Early risk identification using routine biomarkers—such as HbA1c, blood glucose, BMI, age, and cardiovascular history—enables timely preventive lifestyle and clinical follow-up.
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            This platform investigates how parameterized quantum circuits compare against established classical algorithms in accuracy, sensitivity, precision, ROC-AUC, interpretability, and inference speed on real clinical datasets.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-3">
          <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Core Research Objectives
          </h3>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
              <span><strong>Unified Hybrid Benchmark:</strong> Compare Scikit-Learn Logistic Regression and Random Forest models against a 4-qubit PennyLane VQC on identical stratified 80/20 splits.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
              <span><strong>Multi-Cohort Scalability:</strong> Seamlessly switch between a 768-patient benchmark and a 100,000-patient clinical cohort with backend-aggregated distribution analytics.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
              <span><strong>Explainable Screening:</strong> Provide patient-specific biomarker attribution and explicit clinical disclaimers on every screening result.</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Implemented Features vs Future Scope */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Implemented Features */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800/70 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100 dark:border-emerald-800/60">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">Implemented in Prototype</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Active &amp; Verified
            </span>
          </div>

          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
              <span><strong>Dual Preloaded Datasets:</strong> 100,000-row Comprehensive Clinical Diabetes Dataset and 768-row Pima Indians Dataset, plus 50 MB CSV upload.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
              <span><strong>Classical ML Engine:</strong> Scikit-Learn Logistic Regression and Random Forest with categorical encoding, median zero-imputation, and StandardScaler.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
              <span><strong>Quantum VQC Engine:</strong> PennyLane 4-qubit circuit with Bloch sphere AngleEmbedding, circular CNOT entanglement, and 4-wire Pauli-Z readout.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
              <span><strong>Interactive Screening &amp; Explainability:</strong> Grouped clinical inputs, binary toggles, sample presets, and per-patient attribution bar charts.</span>
            </li>
          </ul>
        </div>

        {/* Future Scope */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-sky-200 dark:border-sky-800/70 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-sky-100 dark:border-sky-800/60">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">Planned Future Development</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              Research Roadmap
            </span>
          </div>

          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 flex-shrink-0"></span>
              <span><strong>Physical QPU Cloud Integration:</strong> Execution on real quantum hardware via PennyLane IBM Quantum and Amazon Braket plugins.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 flex-shrink-0"></span>
              <span><strong>Multi-Disease Modalities:</strong> Extension to cardiovascular disease, chronic kidney disease (CKD), and hepatic screening cohorts.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 flex-shrink-0"></span>
              <span><strong>Quantum Kernel Methods:</strong> Quantum Support Vector Classifiers (QSVC) with fidelity kernel matrices.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 flex-shrink-0"></span>
              <span><strong>Clinical Validation Studies:</strong> Prospective multi-center evaluation in partnership with clinical researchers.</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Tech Stack Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-4">
        <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
          <Code className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          Technology Stack Specifications
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Frontend UI</span>
            <span className="font-semibold text-navy-900 dark:text-white">React 18 + Vite</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Tailwind CSS + Recharts + Lucide</p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Backend API</span>
            <span className="font-semibold text-navy-900 dark:text-white">Python FastAPI</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Uvicorn + Pydantic v2 + REST</p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Quantum Engine</span>
            <span className="font-semibold text-teal-700 dark:text-teal-300">PennyLane</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">default.qubit + backprop gradients</p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Classical ML</span>
            <span className="font-semibold text-navy-900 dark:text-white">Scikit-Learn</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Pandas + NumPy + Joblib</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AboutPage;
