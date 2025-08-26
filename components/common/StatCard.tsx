import React from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useAppContext } from '../../context/AppContext';
import { CURRENCY } from '../../constants';

interface StatCardProps {
  title: string;
  value: number;
  data: { name: string; value: number }[];
  color: string; // e.g., '#8884d8'
  icon: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, data, color, icon }) => {
    const { formatCurrency } = useAppContext();

  return (
    <div className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow-sm flex flex-col justify-between h-full transition-all hover:shadow-lg hover:-translate-y-1">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-[var(--text-secondary)] font-medium">{title}</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{formatCurrency(value)} <span className="text-base font-normal">{CURRENCY}</span></p>
        </div>
        <div className="p-2 bg-[var(--bg-tertiary)] rounded-full text-white">
            {icon}
        </div>
      </div>
      <div className="h-20 -mx-4 -mb-4 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: 'var(--text-secondary)' }}
              itemStyle={{ color: color }}
              formatter={(value: number) => [formatCurrency(value), 'مبلغ']}
            />
            <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.2} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
