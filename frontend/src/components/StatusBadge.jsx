import React from 'react';
import { CheckCircle2, Loader2, AlertCircle, Clock, Sparkles } from 'lucide-react';

export const StatusBadge = ({ status, text }) => {
  const normStatus = (status || '').toLowerCase();

  if (normStatus === 'trained') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        {text || 'Trained'}
      </span>
    );
  }

  if (normStatus === 'training') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 animate-pulse">
        <Loader2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
        {text || 'Training...'}
      </span>
    );
  }

  if (normStatus === 'demo_mode' || normStatus === 'demo') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
        <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
        {text || 'Demo Mode'}
      </span>
    );
  }

  if (normStatus === 'unavailable' || normStatus === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
        <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        {text || 'Unavailable'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
      <Clock className="w-3.5 h-3.5 text-slate-400" />
      {text || 'Not Trained'}
    </span>
  );
};

export default StatusBadge;

