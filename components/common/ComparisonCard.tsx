import React from 'react';
import { useAppContext } from '../../context/AppContext';

interface ComparisonCardProps {
    title: string;
    data: {
        period: string;
        income: number;
        expense: number;
    }[];
}

const ComparisonCard: React.FC<ComparisonCardProps> = ({ title, data }) => {
    const { formatCurrency } = useAppContext();

    return (
        <div className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow-sm flex flex-col h-full transition-all hover:shadow-lg hover:-translate-y-1">
            <h3 className="text-md font-semibold text-[var(--text-primary)] mb-3">{title}</h3>
            <div className="space-y-2 flex-1">
                {data.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-[var(--text-secondary)] font-medium">{item.period}:</span>
                        <div className="flex items-center space-x-2 space-x-reverse font-mono">
                            <span className="text-green-400" title="درآمد">
                                +{formatCurrency(item.income)}
                            </span>
                            <span className="text-red-400" title="هزینه">
                                -{formatCurrency(item.expense)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ComparisonCard;
