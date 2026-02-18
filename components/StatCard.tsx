
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  return (
    <div className="relative group overflow-hidden bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-5 md:p-7 rounded-4xl border border-white/50 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl active:scale-[0.98]">
      <div className="flex items-start justify-between mb-4">
        <div className={`${color} p-3 md:p-4 rounded-2xl md:rounded-3xl text-white shadow-lg relative z-10 shrink-0 transform group-hover:scale-110 transition-transform duration-500`}>
          {/* Fix: cast icon to ReactElement with explicit generic to allow 'size' prop in cloneElement */}
          {React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 20 })}
        </div>
        <div className="opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity duration-700 absolute -right-6 -top-6">
           {/* Fix: cast icon to ReactElement with explicit generic to allow 'size' prop in cloneElement */}
           {React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 100 })}
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-slate-400 dark:text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] mb-1">{label}</p>
        <p className="text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">{value}</p>
      </div>
    </div>
  );
};
