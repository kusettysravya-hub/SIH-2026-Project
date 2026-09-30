import React from 'react';

export const ConfusionMatrixCard = ({ matrix, title = "Confusion Matrix", testSamples = 154 }) => {
  if (!matrix) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-center text-slate-400 text-sm">
        No evaluation data available. Train model to generate confusion matrix.
      </div>
    );
  }

  const { tn = 0, fp = 0, fn = 0, tp = 0, sensitivity_recall = 0, specificity = 0, precision = 0 } = matrix;
  const total = (tn + fp + fn + tp) || 1;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-navy-900 dark:text-white">{title}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Held-Out Test Set (N = {total.toLocaleString()})</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800/60">
            Correct: {(tn + tp).toLocaleString()} ({Math.round(((tn + tp) / total) * 100)}%)
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-medium border border-rose-200 dark:border-rose-800/60">
            Errors: {(fp + fn).toLocaleString()} ({Math.round(((fp + fn) / total) * 100)}%)
          </span>
        </div>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* True Negative */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-lg p-3 text-center transition-transform hover:scale-[1.01]">
          <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
            True Negative (TN)
          </span>
          <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">{tn.toLocaleString()}</div>
          <span className="text-xs text-emerald-700/90 dark:text-emerald-400 font-medium">
            {Math.round((tn / total) * 100)}% of test cohort
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Correctly screened Low Risk</span>
        </div>

        {/* False Positive */}
        <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-lg p-3 text-center transition-transform hover:scale-[1.01]">
          <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
            False Positive (FP)
          </span>
          <div className="text-2xl font-bold text-amber-900 dark:text-amber-200 mt-1">{fp.toLocaleString()}</div>
          <span className="text-xs text-amber-700/90 dark:text-amber-400 font-medium">
            {Math.round((fp / total) * 100)}% of test cohort
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">False Alarm (Type I error)</span>
        </div>

        {/* False Negative */}
        <div className="bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 rounded-lg p-3 text-center transition-transform hover:scale-[1.01]">
          <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider block">
            False Negative (FN)
          </span>
          <div className="text-2xl font-bold text-rose-900 dark:text-rose-200 mt-1">{fn.toLocaleString()}</div>
          <span className="text-xs text-rose-700/90 dark:text-rose-400 font-medium">
            {Math.round((fn / total) * 100)}% of test cohort
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Missed Risk (Type II error)</span>
        </div>

        {/* True Positive */}
        <div className="bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 rounded-lg p-3 text-center transition-transform hover:scale-[1.01]">
          <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-300 uppercase tracking-wider block">
            True Positive (TP)
          </span>
          <div className="text-2xl font-bold text-teal-900 dark:text-teal-200 mt-1">{tp.toLocaleString()}</div>
          <span className="text-xs text-teal-700/90 dark:text-teal-400 font-medium">
            {Math.round((tp / total) * 100)}% of test cohort
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Correctly screened High Risk</span>
        </div>
      </div>

      {/* Clinical Diagnostic Performance Indicators */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
        <div>
          <span className="text-slate-400 block text-[11px]">Sensitivity / Recall</span>
          <span className="font-semibold text-navy-900 dark:text-white">{Math.round(sensitivity_recall * 100)}%</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Specificity</span>
          <span className="font-semibold text-navy-900 dark:text-white">{Math.round(specificity * 100)}%</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Precision (PPV)</span>
          <span className="font-semibold text-navy-900 dark:text-white">{Math.round(precision * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

export default ConfusionMatrixCard;

