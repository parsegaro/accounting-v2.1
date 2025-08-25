
import React from 'react';

interface CardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  color?: string; // e.g. 'bg-blue-500'
}

export const Card: React.FC<CardProps> = ({ title, value, subtext, icon, color = 'bg-gray-500' }) => {
  return (
    <div className="bg-[var(--bg-secondary)] p-5 rounded-xl shadow-sm flex items-center space-x-4 space-x-reverse transition-all hover:shadow-lg hover:-translate-y-1">
        <div className={`flex-shrink-0 h-16 w-16 flex items-center justify-center rounded-lg text-white ${color} shadow-lg`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-[var(--text-secondary)] font-medium">{title}</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
            {subtext && <p className="text-xs text-[var(--text-secondary)] opacity-80">{subtext}</p>}
        </div>
    </div>
  );
};