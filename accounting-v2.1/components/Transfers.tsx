import React, { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { EnhancedTable, Column } from './common/EnhancedTable';
import { Modal } from './common/Modal';
import { ConfirmationModal } from './common/ConfirmationModal';
import EntitySelector from './common/EntitySelector';
import CurrencyInput from './common/CurrencyInput';
import JalaliDatePicker from './common/JalaliDatePicker';
import type { Transfer, Account } from '../types';
import { CURRENCY, PencilIcon, TrashIcon } from '../constants';

const TransferForm = ({ transfer, onSave, onCancel }: { transfer?: Transfer | null, onSave: (item: Omit<Transfer, 'id'> | Transfer) => void, onCancel: () => void }) => {
    const { getFormattedDate, chartOfAccounts } = useAppContext();
    const [formData, setFormData] = useState<Partial<Omit<Transfer, 'id'>>>(
        transfer || { date: getFormattedDate(), amount: 0 }
    );
    
    const [fromAccountName, setFromAccountName] = useState(transfer ? chartOfAccounts.find(a => a.id === transfer.fromAccountId)?.name || '' : '');
    const [toAccountName, setToAccountName] = useState(transfer ? chartOfAccounts.find(a => a.id === transfer.toAccountId)?.name || '' : '');

    const [isFromSelectorOpen, setIsFromSelectorOpen] = useState(false);
    const [isToSelectorOpen, setIsToSelectorOpen] = useState(false);
    
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)]";

    const handleSelectAccount = (type: 'from' | 'to', account: Account) => {
        if (type === 'from') {
            setFormData(prev => ({ ...prev, fromAccountId: account.id }));
            setFromAccountName(account.name);
            setIsFromSelectorOpen(false);
        } else {
            setFormData(prev => ({ ...prev, toAccountId: account.id }));
            setToAccountName(account.name);
            setIsToSelectorOpen(false);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.fromAccountId || !formData.toAccountId || !formData.amount) {
            alert('لطفا تمامی فیلدها را تکمیل نمایید.');
            return;
        }
        if(formData.fromAccountId === formData.toAccountId) {
            alert('حساب مبدا و مقصد نمی‌توانند یکسان باشند.');
            return;
        }
        onSave(formData as Transfer);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>از حساب (مبدا)</label>
                    <button type="button" onClick={() => setIsFromSelectorOpen(true)} className="form-input text-right justify-start mt-1">
                        {fromAccountName || 'انتخاب...'}
                    </button>
                </div>
                <div>
                    <label className={labelClasses}>به حساب (مقصد)</label>
                    <button type="button" onClick={() => setIsToSelectorOpen(true)} className="form-input text-right justify-start mt-1">
                        {toAccountName || 'انتخاب...'}
                    </button>
                </div>
            </div>
             <div>
                <label className={labelClasses}>مبلغ انتقال ({CURRENCY})</label>
                <CurrencyInput value={formData.amount || 0} onValueChange={(v) => setFormData(p => ({...p, amount: v}))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>تاریخ</label>
                    <JalaliDatePicker value={formData.date || ''} onChange={(date) => setFormData(p => ({...p, date}))} />
                </div>
                 <div>
                    <label className={labelClasses}>شرح</label>
                    <input type="text" value={formData.description || ''} onChange={e => setFormData(p => ({...p, description: e.target.value}))} className="form-input"/>
                </div>
            </div>
             <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
                <button type="button" onClick={onCancel} className="btn btn-secondary">لغو</button>
                <button type="submit" className="btn btn-primary">ثبت انتقال</button>
            </div>
            
            <EntitySelector 
                isOpen={isFromSelectorOpen}
                onClose={() => setIsFromSelectorOpen(false)}
                onSelect={(acc) => handleSelectAccount('from', acc as Account)}
                accountTypes={['دارایی‌ها']}
            />
             <EntitySelector 
                isOpen={isToSelectorOpen}
                onClose={() => setIsToSelectorOpen(false)}
                onSelect={(acc) => handleSelectAccount('to', acc as Account)}
                accountTypes={['دارایی‌ها']}
            />
        </form>
    );
};


const Transfers: React.FC = () => {
    const { transfers, chartOfAccounts, addTransfer, updateTransfer, deleteTransfer, formatCurrency } = useAppContext();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Transfer | null>(null);

    const getAccountName = (id: number) => chartOfAccounts.find(a => a.id === id)?.name || 'نامشخص';

    const columns: Column<Transfer>[] = [
        { header: 'تاریخ', accessor: 'date', sortKey: 'date' },
        { header: 'از حساب', accessor: (item) => getAccountName(item.fromAccountId), sortKey: 'fromAccountId' },
        { header: 'به حساب', accessor: (item) => getAccountName(item.toAccountId), sortKey: 'toAccountId' },
        { header: `مبلغ (${CURRENCY})`, accessor: (item) => formatCurrency(item.amount), sortKey: 'amount' },
        { header: 'شرح', accessor: 'description' },
    ];

    const resetModals = () => {
        setIsFormModalOpen(false);
        setIsConfirmModalOpen(false);
        setSelectedItem(null);
    };

    const handleOpenFormModal = (item: Transfer | null = null) => {
        setSelectedItem(item);
        setIsFormModalOpen(true);
    };
    
    const handleOpenConfirmModal = (item: Transfer) => {
        setSelectedItem(item);
        setIsConfirmModalOpen(true);
    };

    const handleSave = (data: Omit<Transfer, 'id'> | Transfer) => {
        if ('id' in data) {
            updateTransfer(data);
        } else {
            addTransfer(data);
        }
        resetModals();
    };

    const handleDelete = () => {
        if (selectedItem) {
            deleteTransfer(selectedItem.id);
        }
        resetModals();
    };

    const itemActions = (item: Transfer) => (
        <div className="flex space-x-2 space-x-reverse">
            <button onClick={() => handleOpenFormModal(item)} className="btn btn-sm btn-secondary btn-icon" title="ویرایش"><PencilIcon/></button>
            <button onClick={() => handleOpenConfirmModal(item)} className="btn btn-sm btn-danger btn-icon" title="حذف"><TrashIcon/></button>
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">انتقال وجه بین حساب‌ها</h1>
                <button onClick={() => handleOpenFormModal()} className="btn btn-primary">
                    انتقال وجه جدید
                </button>
            </div>
            <EnhancedTable<Transfer>
                columns={columns}
                data={transfers}
                actions={itemActions}
                tableName="انتقال-وجه"
                enableDateFilter
                dateFilterKey="date"
            />
             <Modal isOpen={isFormModalOpen} onClose={resetModals} title={selectedItem ? 'ویرایش انتقال' : 'انتقال وجه جدید'}>
                <TransferForm transfer={selectedItem} onSave={handleSave} onCancel={resetModals} />
            </Modal>
            {selectedItem && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={resetModals}
                    onConfirm={handleDelete}
                    title="تایید حذف"
                    message={`آیا از حذف انتقال وجه به مبلغ ${formatCurrency(selectedItem.amount)} از حساب ${getAccountName(selectedItem.fromAccountId)} به ${getAccountName(selectedItem.toAccountId)} اطمینان دارید؟`}
                />
            )}
        </div>
    );
};

export default Transfers;
