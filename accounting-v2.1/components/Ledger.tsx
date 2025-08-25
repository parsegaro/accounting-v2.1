import React, { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { EnhancedTable, Column } from './common/EnhancedTable';
import { Modal } from './common/Modal';
import { ConfirmationModal } from './common/ConfirmationModal';
import CurrencyInput from './common/CurrencyInput';
import JalaliDatePicker from './common/JalaliDatePicker';
import type { LedgerEntry } from '../types';
import { CURRENCY, TrashIcon } from '../constants';

const LedgerForm = ({ onSave, onCancel }: { onSave: (entry: Omit<LedgerEntry, 'id'>) => void, onCancel: () => void }) => {
    const { getFormattedDate, chartOfAccounts } = useAppContext();
    const detailAccounts = chartOfAccounts.filter(a => a.parentId !== null);
    const [formData, setFormData] = useState<Partial<Omit<LedgerEntry, 'id'>>>(() => ({
        date: getFormattedDate(),
        debit: 0,
        credit: 0,
        accountId: detailAccounts[0]?.id
    }));
    
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)]";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'accountId' ? Number(value) : value }));
    };
    
    const handleAmountChange = (field: 'debit' | 'credit', value: number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
            [field === 'debit' ? 'credit' : 'debit']: 0 // Ensure only one has value
        }));
    };
    
    const handleDateChange = useCallback((date: string) => setFormData(prev => ({ ...prev, date })), []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.accountId || !formData.description || ((formData.debit || 0) <= 0 && (formData.credit || 0) <= 0)) {
            alert("لطفا تمام فیلدها را تکمیل کرده و یک مبلغ بدهکار یا بستانکار وارد کنید.");
            return;
        }
        onSave(formData as Omit<LedgerEntry, 'id'>);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="accountId" className={labelClasses}>انتخاب حساب</label>
                <select name="accountId" id="accountId" value={formData.accountId || ''} onChange={handleChange} className="form-select mt-1" required>
                    {detailAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                    ))}
                </select>
            </div>
             <div>
                <label htmlFor="description" className={labelClasses}>شرح</label>
                <textarea name="description" id="description" value={formData.description || ''} onChange={handleChange} rows={2} className="form-textarea mt-1" required />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>بدهکار ({CURRENCY})</label>
                    <CurrencyInput value={formData.debit || 0} onValueChange={v => handleAmountChange('debit', v)} />
                </div>
                 <div>
                    <label className={labelClasses}>بستانکار ({CURRENCY})</label>
                    <CurrencyInput value={formData.credit || 0} onValueChange={v => handleAmountChange('credit', v)} />
                </div>
             </div>
              <div>
                <label htmlFor="date" className={labelClasses}>تاریخ</label>
                <JalaliDatePicker value={formData.date || getFormattedDate()} onChange={handleDateChange} />
            </div>
             <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
                <button type="button" onClick={onCancel} className="btn btn-secondary">لغو</button>
                <button type="submit" className="btn btn-primary">ثبت سند</button>
            </div>
        </form>
    );
};

const Ledger: React.FC = () => {
    const { ledger, addSingleLedgerEntry, deleteLedgerEntry, formatCurrency, chartOfAccounts } = useAppContext();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);

    const columns: Column<LedgerEntry>[] = [
        { header: 'تاریخ', accessor: 'date', sortKey: 'date' },
        { header: 'حساب', accessor: (item: LedgerEntry) => chartOfAccounts.find(a => a.id === item.accountId)?.name || 'نامشخص', sortKey: 'accountId' },
        { header: 'شرح', accessor: 'description' },
        { header: `بدهکار (${CURRENCY})`, accessor: (item: LedgerEntry) => item.debit > 0 ? formatCurrency(item.debit) : '-', sortKey: 'debit' },
        { header: `بستانکار (${CURRENCY})`, accessor: (item: LedgerEntry) => item.credit > 0 ? formatCurrency(item.credit) : '-', sortKey: 'credit' },
    ];
    
    const resetModals = () => {
        setIsFormModalOpen(false);
        setIsConfirmModalOpen(false);
        setSelectedEntry(null);
    };

    const handleSave = (data: Omit<LedgerEntry, 'id'>) => {
        addSingleLedgerEntry(data);
        resetModals();
    };

    const handleOpenConfirmModal = (entry: LedgerEntry) => {
        setSelectedEntry(entry);
        setIsConfirmModalOpen(true);
    };

    const handleDelete = () => {
        if (selectedEntry) {
            deleteLedgerEntry(selectedEntry.id);
        }
        resetModals();
    };
    
    const actions = (entry: LedgerEntry) => {
        // Only allow deleting entries that were manually created (don't have a referenceId)
        if (!entry.referenceId) {
            return <button onClick={() => handleOpenConfirmModal(entry)} className="btn btn-sm btn-danger btn-icon" title="حذف"><TrashIcon/></button>;
        }
        return null;
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">دفتر کل (ریز تراکنش‌ها)</h1>
                <button onClick={() => setIsFormModalOpen(true)} className="btn btn-primary">
                    ثبت سند دستی
                </button>
            </div>
            <EnhancedTable<LedgerEntry> 
                columns={columns} 
                data={ledger} 
                actions={actions}
                tableName="دفتر-کل"
                enableDateFilter
                dateFilterKey="date"
            />
            <Modal
                isOpen={isFormModalOpen}
                onClose={resetModals}
                title="ثبت سند حسابداری دستی"
            >
                <LedgerForm onSave={handleSave} onCancel={resetModals} />
            </Modal>
             {selectedEntry && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={resetModals}
                    onConfirm={handleDelete}
                    title="تایید حذف سند"
                    message={`آیا از حذف سند «${selectedEntry.description}» اطمینان دارید؟ این عمل قابل بازگشت نیست.`}
                />
            )}
        </div>
    );
};

export default Ledger;