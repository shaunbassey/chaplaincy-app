
import React, { useEffect, useState } from 'react';
import { 
  ComposedChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Area,
  Line
} from 'recharts';

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

  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const tickColor = isDark ? '#475569' : '#94a3b8';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const barPrimary = isDark ? '#f59e0b' : '#6366f1'; 
  const areaColor = isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(99, 102, 241, 0.1)';
  const lineColor = isDark ? '#fbbf24' : '#818cf8';

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={barPrimary} stopOpacity={1} />
              <stop offset="100%" stopColor={barPrimary} stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={barPrimary} stopOpacity={0.3} />
              <stop offset="100%" stopColor={barPrimary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="8 8" stroke={gridColor} vertical={false} />
          <XAxis 
            dataKey="week" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: tickColor, fontSize: 11, fontWeight: 900 }} 
            dy={15}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: tickColor, fontSize: 11, fontWeight: 900 }} 
            unit="%"
            domain={[0, 100]}
          />
          <Tooltip 
            cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
            contentStyle={{ 
              borderRadius: '24px', 
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)', 
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              backgroundColor: tooltipBg,
              fontSize: '11px',
              fontWeight: 900,
              textTransform: 'uppercase',
              padding: '12px 16px'
            }}
            labelStyle={{ color: tickColor, marginBottom: '4px' }}
          />
          <Area 
            type="monotone" 
            dataKey="attendance" 
            stroke="none" 
            fill="url(#areaGradient)" 
            animationDuration={1500}
          />
          <Bar dataKey="attendance" radius={[8, 8, 0, 0]} barSize={24}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill="url(#barGradient)" 
                className="transition-all duration-500 hover:opacity-80"
              />
            ))}
          </Bar>
          <Line 
            type="monotone" 
            dataKey="attendance" 
            stroke={lineColor} 
            strokeWidth={3} 
            dot={{ r: 4, fill: lineColor, strokeWidth: 2, stroke: tooltipBg }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            animationDuration={2000}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
