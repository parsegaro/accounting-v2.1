import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Modal } from './common/Modal';
import { ConfirmationModal } from './common/ConfirmationModal';
import CurrencyInput from './common/CurrencyInput';
import type { Budget } from '../types';
import { CURRENCY, PencilIcon, TrashIcon } from '../constants';

const BudgetForm = ({ budget, onSave, onCancel }: { budget?: Budget | null, onSave: (b: Omit<Budget, 'id'> | Budget) => void, onCancel: () => void }) => {
    const { chartOfAccounts } = useAppContext();
    const [formData, setFormData] = useState<Partial<Budget>>({});
    
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)]";
    const expenseAccounts = useMemo(() => chartOfAccounts.filter(a => a.type === 'هزینه' && a.parentId !== null), [chartOfAccounts]);

    React.useEffect(() => {
        setFormData(budget || { name: '', period: 'monthly', limit: 0, expenseAccountId: expenseAccounts[0]?.id });
    }, [budget, expenseAccounts]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'expenseAccountId' ? Number(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.name || !formData.expenseAccountId || !formData.limit) {
            alert("لطفا تمام فیلدها را کامل کنید.");
            return;
        }
        onSave(formData as Budget);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className={labelClasses}>نام بودجه</label>
                <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="form-input" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>دسته‌بندی هزینه</label>
                    <select name="expenseAccountId" value={formData.expenseAccountId || ''} onChange={handleChange} className="form-select" required>
                        {expenseAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label className={labelClasses}>دوره</label>
                    <select name="period" value={formData.period || 'monthly'} onChange={handleChange} className="form-select">
                        <option value="monthly">ماهانه</option>
                        <option value="yearly">سالانه</option>
                    </select>
                </div>
            </div>
            <div>
                <label className={labelClasses}>سقف بودجه ({CURRENCY})</label>
                <CurrencyInput value={formData.limit || 0} onValueChange={val => setFormData(p => ({...p, limit: val}))} />
            </div>
            <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
                <button type="button" onClick={onCancel} className="btn btn-secondary">لغو</button>
                <button type="submit" className="btn btn-primary">ذخیره</button>
            </div>
        </form>
    );
};

const BudgetCard = ({ budget, onEdit, onDelete }: { budget: Budget, onEdit: () => void, onDelete: () => void }) => {
    const { expenses, chartOfAccounts, formatCurrency, getFormattedDate } = useAppContext();

    const spending = useMemo(() => {
        const today = getFormattedDate();
        const [currentYear, currentMonth] = today.split('/').map(Number);
        
        return expenses
            .filter(e => {
                if (e.expenseAccountId !== budget.expenseAccountId) return false;
                const [expenseYear, expenseMonth] = e.date.split('/').map(Number);
                if (budget.period === 'yearly') {
                    return expenseYear === currentYear;
                } else { // monthly
                    return expenseYear === currentYear && expenseMonth === currentMonth;
                }
            })
            .reduce((sum, e) => sum + e.amount, 0);
    }, [expenses, budget, getFormattedDate]);
    
    const remaining = budget.limit - spending;
    const percentage = budget.limit > 0 ? (spending / budget.limit) * 100 : 0;
    
    const progressBarColor = percentage > 95 ? 'bg-red-500' : percentage > 75 ? 'bg-yellow-500' : 'bg-green-500';

    return (
        <div className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow-sm flex flex-col justify-between transition-all hover:shadow-lg hover:-translate-y-1">
            <div>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg text-[var(--text-primary)]">{budget.name}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">{chartOfAccounts.find(a => a.id === budget.expenseAccountId)?.name}</p>
                    </div>
                     <div className="flex space-x-1 space-x-reverse">
                        <button onClick={onEdit} className="btn btn-sm btn-icon btn-secondary"><PencilIcon/></button>
                        <button onClick={onDelete} className="btn btn-sm btn-icon btn-danger"><TrashIcon/></button>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">مصرف شده</span>
                        <span>{formatCurrency(spending)} / {formatCurrency(budget.limit)}</span>
                    </div>
                    <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2.5">
                        <div className={`${progressBarColor} h-2.5 rounded-full`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                    </div>
                </div>
            </div>
            <div className={`mt-3 text-center text-lg font-semibold ${remaining >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                {remaining >= 0 ? `${formatCurrency(remaining)} باقی‌مانده` : `${formatCurrency(Math.abs(remaining))} اضافه مصرف`}
            </div>
        </div>
    );
};


const Budget = () => {
    const { budgets, addBudget, updateBudget, deleteBudget } = useAppContext();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

    const resetModals = () => {
        setIsFormModalOpen(false);
        setIsConfirmModalOpen(false);
        setSelectedBudget(null);
    };

    const handleOpenFormModal = (budget: Budget | null = null) => {
        setSelectedBudget(budget);
        setIsFormModalOpen(true);
    };
    
    const handleOpenConfirmModal = (budget: Budget) => {
        setSelectedBudget(budget);
        setIsConfirmModalOpen(true);
    };

    const handleSave = (data: Omit<Budget, 'id'> | Budget) => {
        if ('id' in data) {
            updateBudget(data as Budget);
        } else {
            addBudget(data as Omit<Budget, 'id'>);
        }
        resetModals();
    };

    const handleDelete = () => {
        if (selectedBudget) {
            deleteBudget(selectedBudget.id);
        }
        resetModals();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">مدیریت بودجه</h1>
                <button onClick={() => handleOpenFormModal()} className="btn btn-primary">
                    افزودن بودجه جدید
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {budgets.map(budget => (
                    <BudgetCard 
                        key={budget.id} 
                        budget={budget}
                        onEdit={() => handleOpenFormModal(budget)}
                        onDelete={() => handleOpenConfirmModal(budget)}
                    />
                ))}
            </div>
            
            {budgets.length === 0 && (
                <div className="text-center py-16 bg-[var(--bg-secondary)] rounded-lg">
                    <p className="text-[var(--text-secondary)]">هنوز هیچ بودجه‌ای تعریف نشده است.</p>
                    <p className="text-[var(--text-secondary)] text-sm mt-2">با کلیک روی دکمه "افزودن بودجه جدید" شروع کنید.</p>
                </div>
            )}

            <Modal isOpen={isFormModalOpen} onClose={resetModals} title={selectedBudget ? 'ویرایش بودجه' : 'افزودن بودجه جدید'}>
                <BudgetForm budget={selectedBudget} onSave={handleSave} onCancel={resetModals} />
            </Modal>
            
            {selectedBudget && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={resetModals}
                    onConfirm={handleDelete}
                    title="تایید حذف بودجه"
                    message={`آیا از حذف بودجه «${selectedBudget.name}» اطمینان دارید؟`}
                />
            )}
        </div>
    );
};

export default Budget;
