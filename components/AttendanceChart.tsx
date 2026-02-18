
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { week: 'W1', attendance: 85 },
  { week: 'W2', attendance: 78 },
  { week: 'W3', attendance: 92 },
  { week: 'W4', attendance: 88 },
  { week: 'W5', attendance: 70 },
  { week: 'W6', attendance: 95 },
  { week: 'W7', attendance: 82 },
  { week: 'W8', attendance: 65 },
  { week: 'W9', attendance: 90 },
  { week: 'W10', attendance: 85 },
  { week: 'W11', attendance: 89 },
  { week: 'W12', attendance: 93 },
  { week: 'W13', attendance: 98 },
];

export const AttendanceChart: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const tickColor = isDark ? '#475569' : '#94a3b8';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const barPrimary = isDark ? '#f59e0b' : '#6366f1'; 
  const barSecondary = isDark ? '#334155' : '#e2e8f0';

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="6 6" stroke={gridColor} vertical={false} />
          <XAxis 
            dataKey="week" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: tickColor, fontSize: 10, fontWeight: 800 }} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: tickColor, fontSize: 10, fontWeight: 800 }} 
            unit="%"
          />
          <Tooltip 
            cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
            contentStyle={{ 
              borderRadius: '24px', 
              border: isDark ? '1px solid #1e293b' : '1px solid #f1f5f9', 
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              backgroundColor: tooltipBg,
              fontSize: '12px',
              fontWeight: 900,
              textTransform: 'uppercase'
            }}
          />
          <Bar dataKey="attendance" radius={[12, 12, 0, 0]} barSize={32}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.attendance > 80 ? barPrimary : barSecondary} 
                className="transition-all duration-500 hover:opacity-80"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
