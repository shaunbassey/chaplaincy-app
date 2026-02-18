
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  return (
    <div className="relative group bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 md:p-8 rounded-[24px] md:rounded-[40px] shadow-xl border border-white dark:border-slate-800 flex items-center gap-3 md:gap-6 transition-all duration-500 hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-2xl overflow-hidden active:scale-95">
      <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform duration-700 hidden md:block`}>
        {icon}
      </div>
      <div className={`${color} p-2.5 md:p-5 rounded-xl md:rounded-[24px] text-white shadow-2xl relative z-10 shrink-0`}>
        {React.cloneElement(icon as React.ReactElement, { size: 16 })}
      </div>
      <div className="relative z-10 overflow-hidden">
        <p className="text-slate-400 dark:text-slate-500 text-[7px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 md:mb-1 truncate">{label}</p>
        <p className="text-lg md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter truncate leading-tight">{value}</p>
      </div>
    </div>
  );
};
