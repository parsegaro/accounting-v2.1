import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { TrendingUpIcon, TrendingDownIcon, MinusIcon } from '../../constants';

interface KPICardProps {
    title: string;
    value: string;
    trend: 'up' | 'down' | 'neutral';
    comparisonText: string;
    gaugePercentage: number; // 0 to 100
    description: string;
    invertTrendColor?: boolean; // If true, 'up' is bad (red) and 'down' is good (green)
}

const KPICard: React.FC<KPICardProps> = ({ title, value, trend, comparisonText, gaugePercentage, description, invertTrendColor = false }) => {
    const { formatCurrency } = useAppContext();

    const getTrendColor = () => {
        if (trend === 'up') return invertTrendColor ? 'text-red-400' : 'text-green-400';
        if (trend === 'down') return invertTrendColor ? 'text-green-400' : 'text-red-400';
        return 'text-gray-400';
    };
    
    const getGaugeColor = () => {
        if (gaugePercentage >= 80) return invertTrendColor ? 'bg-red-500' : 'bg-green-500';
        if (gaugePercentage >= 50) return 'bg-yellow-500';
        return invertTrendColor ? 'bg-green-500' : 'bg-red-500';
    }

    const TrendIcon = trend === 'up' ? TrendingUpIcon : trend === 'down' ? TrendingDownIcon : MinusIcon;

    return (
        <div className="bg-[var(--bg-secondary)] p-5 rounded-xl shadow-sm flex flex-col justify-between h-full animated-card">
            <div>
                <p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{value}</p>
                <div className={`flex items-center text-xs mt-1 ${getTrendColor()}`}>
                    <TrendIcon />
                    <span className="mr-1">{comparisonText}</span>
                </div>
            </div>
            <div className="mt-4">
                <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
                    <div className={`${getGaugeColor()} h-1.5 rounded-full`} style={{ width: `${Math.min(gaugePercentage, 100)}%` }}></div>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{description}</p>
            </div>
        </div>
    );
};

export default KPICard;
