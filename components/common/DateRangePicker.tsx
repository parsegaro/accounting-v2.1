import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

interface DateRangePickerProps {
    onRangeChange: (range: { start: string; end: string }) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ onRangeChange }) => {
    const { getFormattedDate } = useAppContext();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [activePreset, setActivePreset] = useState<'week' | 'month' | 'year' | 'custom'>('month');
    
    const today = new Date();
    const todayFormatted = getFormattedDate();

    const formatDateForInput = (date: Date) => {
        return new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
    }
    
    const setPresetRange = (preset: 'week' | 'month' | 'year') => {
        setActivePreset(preset);
        let start = new Date(today);
        switch(preset) {
            case 'week':
                start.setDate(today.getDate() - 7);
                break;
            case 'month':
                start.setMonth(today.getMonth() - 1);
                break;
            case 'year':
                start.setFullYear(today.getFullYear() - 1);
                break;
        }
        const startFormatted = formatDateForInput(start);
        setStartDate(startFormatted);
        setEndDate(todayFormatted);
        onRangeChange({ start: startFormatted, end: todayFormatted });
    };
    
    const handleCustomChange = () => {
        setActivePreset('custom');
        if (startDate && endDate) {
            onRangeChange({ start: startDate, end: endDate });
        }
    };
    
    return (
        <div className="flex items-center space-x-2 space-x-reverse bg-[var(--bg-secondary)] p-2 rounded-lg border border-[var(--border-primary)]">
            <div className="flex items-center space-x-1 space-x-reverse border-l border-[var(--border-secondary)] pl-2">
                 <button onClick={() => setPresetRange('week')} className={`px-3 py-1 text-sm rounded-md ${activePreset === 'week' ? 'bg-[var(--accent-primary)] text-[var(--text-primary)]' : 'bg-[var(--bg-tertiary)]'}`}>هفتگی</button>
                 <button onClick={() => setPresetRange('month')} className={`px-3 py-1 text-sm rounded-md ${activePreset === 'month' ? 'bg-[var(--accent-primary)] text-[var(--text-primary)]' : 'bg-[var(--bg-tertiary)]'}`}>ماهانه</button>
                 <button onClick={() => setPresetRange('year')} className={`px-3 py-1 text-sm rounded-md ${activePreset === 'year' ? 'bg-[var(--accent-primary)] text-[var(--text-primary)]' : 'bg-[var(--bg-tertiary)]'}`}>سالانه</button>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
                <input 
                    type="text" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)}
                    onBlur={handleCustomChange}
                    placeholder="از تاریخ"
                    className="form-input w-32 text-sm !p-1 text-center"
                />
                 <span className="text-[var(--text-secondary)]">-</span>
                <input 
                    type="text" 
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    onBlur={handleCustomChange}
                    placeholder="تا تاریخ"
                    className="form-input w-32 text-sm !p-1 text-center"
                />
            </div>
        </div>
    );
};

export default DateRangePicker;