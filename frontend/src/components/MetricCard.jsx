import React, { useState, useEffect } from 'react';

export const MetricCard = ({ title, value, subtitle, icon: Icon, badge, color = 'blue' }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (typeof value === 'number' && !Number.isNaN(value)) {
      const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      if (mq?.matches) {
        setDisplayValue(value.toLocaleString());
        return;
      }
      let start = 0;
      const duration = 420;
      const startTime = performance.now();
      let raf;
      const step = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (value - start) * eased);
        setDisplayValue(current.toLocaleString());
        if (progress < 1) {
          raf = requestAnimationFrame(step);
        }
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  const iconBg = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300',
    teal: 'bg-teal-100 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300',
    slate: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg ${iconBg[color] || iconBg.blue}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold text-navy-900 dark:text-white tracking-tight">
          {displayValue !== null && displayValue !== undefined ? displayValue : '--'}
        </div>
        {badge && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default MetricCard;

