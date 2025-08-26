import React, { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import CurrencyInput from './common/CurrencyInput';
import EntitySelector from './common/EntitySelector';
import JalaliDatePicker from './common/JalaliDatePicker';
import type { Payment, Expense, Account, Contact, ContactType } from '../types';
import type { UnifiedTransaction } from './Payments'; // Importing the type from the main page

const TagInput = ({ tags, onTagsChange }: { tags: string[], onTagsChange: (tags: string[]) => void }) => {
    const { allTags } = useAppContext();
    const [newTag, setNewTag] = useState('');

    const handleAddTag = (tag: string) => {
        const t = tag.trim();
        if (t && !tags.includes(t)) {
            onTagsChange([...tags, t]);
        }
    };
    
    const handleRemoveTag = (tagToRemove: string) => {
        onTagsChange(tags.filter(t => t !== tagToRemove));
    };

    const handleNewTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddTag(newTag);
            setNewTag('');
        }
    };

    return (
        <div>
             <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                    <span key={tag} className="flex items-center bg-[var(--bg-tertiary)] text-sm rounded-full px-3 py-1">
                        {tag}
                        <button type="button" onClick={() => handleRemoveTag(tag)} className="mr-2 font-bold text-red-400 hover:text-red-300">&times;</button>
                    </span>
                ))}
            </div>
            <input 
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={handleNewTagKeyDown}
                placeholder="افزودن تگ جدید..."
                className="form-input"
            />
            <div className="flex flex-wrap gap-1 mt-2">
                {allTags.filter(t => !tags.includes(t)).map(tag => (
                     <button key={tag} type="button" onClick={() => handleAddTag(tag)} className="text-xs bg-[var(--bg-tertiary)] px-2 py-1 rounded-full hover:bg-[var(--accent-primary)]">
                        + {tag}
                    </button>
                ))}
            </div>
        </div>
    );
}


const PaymentForm = ({ itemToEdit, onSave, onCancel, type }: { itemToEdit: Partial<Payment> | null, onSave: () => void, onCancel: () => void, type: 'دریافت' | 'پرداخت' }) => {
    const { addPayment, updatePayment, getFormattedDate, paymentMethods, contacts, chartOfAccounts } = useAppContext();
    const [formData, setFormData] = useState<Partial<Payment>>({});
    
    const [isEntitySelectorOpen, setIsEntitySelectorOpen] = useState(false);
    const [isAccountSelectorOpen, setIsAccountSelectorOpen] = useState(false);
    const [entityName, setEntityName] = useState('');
    const [accountName, setAccountName] = useState('');

     useEffect(() => {
        if (itemToEdit && 'id' in itemToEdit) {
            setFormData(itemToEdit);
            setEntityName(contacts.find(c => c.id === itemToEdit.entityId)?.name || '');
            setAccountName(chartOfAccounts.find(a => a.id === itemToEdit.accountId)?.name || '');
        } else {
            setFormData({
                date: getFormattedDate(), method: paymentMethods[0], amount: 0, type: type, attachments: [], tags: []
            });
            setEntityName('');
            setAccountName('');
        }
    }, [itemToEdit, contacts, chartOfAccounts, getFormattedDate, paymentMethods, type]);

    const isReceipt = type === 'دریافت';
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)]";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.amount || !formData.description || !formData.entityId || !formData.accountId) {
            alert('لطفا تمام فیلدهای ستاره‌دار را تکمیل کنید.'); return;
        }
        if (formData.id) {
            updatePayment(formData as Payment);
        } else {
            addPayment(formData as Omit<Payment, 'id'>);
        }
        onSave();
    };

    return (
         <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>{isReceipt ? 'دریافت از' : 'پرداخت به'}*</label>
                    <button type="button" onClick={() => setIsEntitySelectorOpen(true)} className="form-input text-right justify-start mt-1">{entityName || 'انتخاب...'}</button>
                </div>
                <div>
                     <label className={labelClasses}>{isReceipt ? 'واریز به حساب' : 'برداشت از حساب'}*</label>
                    <button type="button" onClick={() => setIsAccountSelectorOpen(true)} className="form-input text-right justify-start mt-1">{accountName || 'انتخاب...'}</button>
                </div>
            </div>
            <div>
                <label htmlFor="description" className={labelClasses}>شرح تراکنش*</label>
                <textarea name="description" value={formData.description || ''} onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} rows={2} className="form-textarea mt-1" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>مبلغ*</label>
                    <CurrencyInput value={formData.amount || 0} onValueChange={(v) => setFormData(p => ({...p, amount: v}))} />
                </div>
                <div>
                    <label className={labelClasses}>تاریخ*</label>
                    <JalaliDatePicker label="تاریخ*" value={formData.date || null} onChange={(date) => setFormData(p => ({...p, date}))} />
                </div>
            </div>
             <div>
                <label className={labelClasses}>تگ‌ها</label>
                <TagInput tags={formData.tags || []} onTagsChange={(tags) => setFormData(p => ({ ...p, tags }))} />
            </div>
             <div className="flex justify-end pt-4 space-x-2 space-x-reverse border-t border-[var(--border-primary)]">
                <button type="button" onClick={onCancel} className="btn btn-secondary">لغو</button>
                <button type="submit" className="btn btn-primary">ذخیره {isReceipt ? 'دریافت' : 'پرداخت'}</button>
            </div>
             <EntitySelector isOpen={isEntitySelectorOpen} onClose={() => setIsEntitySelectorOpen(false)} onSelect={(item) => { setFormData(p => ({ ...p, entityId: (item as Contact).id })); setEntityName(item.name); setIsEntitySelectorOpen(false); }} contactTypes={['patient', 'doctor', 'custom', 'supplier', 'employee']} />
             <EntitySelector isOpen={isAccountSelectorOpen} onClose={() => setIsAccountSelectorOpen(false)} onSelect={(item) => { setFormData(p => ({ ...p, accountId: (item as Account).id })); setAccountName(item.name); setIsAccountSelectorOpen(false); }} accountTypes={['دارایی‌ها']} />
        </form>
    )
}

const ExpenseForm = ({ itemToEdit, onSave, onCancel }: { itemToEdit: Partial<Expense> | null, onSave: () => void, onCancel: () => void }) => {
    const { addExpense, updateExpense, chartOfAccounts, getFormattedDate, contacts } = useAppContext();
    const [formData, setFormData] = useState<Partial<Expense>>({});
    
    const [isFromSelectorOpen, setIsFromSelectorOpen] = useState(false);
    const [isToSelectorOpen, setIsToSelectorOpen] = useState(false);
    const [fromAccountName, setFromAccountName] = useState('');
    const [toEntityName, setToEntityName] = useState('');
    
    useEffect(() => {
        if(itemToEdit && 'id' in itemToEdit) {
            setFormData(itemToEdit);
            setFromAccountName(chartOfAccounts.find(a => a.id === itemToEdit.fromAccountId)?.name || '');
            setToEntityName(contacts.find(c => c.id === itemToEdit.toEntityId)?.name || '');
        } else {
            setFormData({ date: getFormattedDate(), attachments: [], tags: [] });
            setFromAccountName('');
            setToEntityName('');
        }
    }, [itemToEdit, chartOfAccounts, contacts, getFormattedDate]);

    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)]";
    const expenseAccounts = chartOfAccounts.filter(a => a.parentId !== null && a.type === 'هزینه');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.description || !formData.amount || !formData.expenseAccountId || !formData.fromAccountId || !formData.toEntityId || !formData.date) {
            alert('لطفا تمام فیلدهای لازم را تکمیل کنید.'); return;
        }
        if (formData.id) {
            updateExpense(formData as Expense);
        } else {
            addExpense(formData as Omit<Expense, 'id'>);
        }
        onSave();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className={labelClasses}>شرح هزینه*</label>
                <textarea name="description" value={formData.description || ''} onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} rows={2} className="form-textarea mt-1" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className={labelClasses}>دسته‌بندی (حساب هزینه)*</label>
                    <select name="expenseAccountId" value={formData.expenseAccountId || ''} onChange={(e) => setFormData(p => ({...p, expenseAccountId: Number(e.target.value)}))} className="form-select mt-1" required>
                        <option value="" disabled>انتخاب کنید...</option>
                        {expenseAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label className={labelClasses}>تاریخ*</label>
                     <JalaliDatePicker label="تاریخ*" value={formData.date || null} onChange={(date) => setFormData(p => ({...p, date}))} />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>از حساب*</label>
                    <button type="button" onClick={() => setIsFromSelectorOpen(true)} className="form-input text-right justify-start mt-1">{fromAccountName || 'انتخاب حساب مبدا...'}</button>
                </div>
                <div>
                    <label className={labelClasses}>پرداخت به (دریافت کننده)*</label>
                    <button type="button" onClick={() => setIsToSelectorOpen(true)} className="form-input text-right justify-start mt-1">{toEntityName || 'انتخاب طرف حساب...'}</button>
                </div>
            </div>
             <div>
                <label className={labelClasses}>مبلغ*</label>
                <CurrencyInput value={formData.amount || 0} onValueChange={(v) => setFormData(p => ({...p, amount: v}))} />
            </div>
             <div>
                <label className={labelClasses}>تگ‌ها</label>
                <TagInput tags={formData.tags || []} onTagsChange={(tags) => setFormData(p => ({ ...p, tags }))} />
            </div>
             <div className="flex justify-end pt-4 space-x-2 space-x-reverse border-t border-[var(--border-primary)]">
                <button type="button" onClick={onCancel} className="btn btn-secondary">لغو</button>
                <button type="submit" className="btn btn-primary">ذخیره هزینه</button>
            </div>
            <EntitySelector isOpen={isFromSelectorOpen} onClose={() => setIsFromSelectorOpen(false)} onSelect={(item) => { setFormData(p => ({...p, fromAccountId: (item as Account).id})); setFromAccountName(item.name); setIsFromSelectorOpen(false);}} accountTypes={['دارایی‌ها']} />
            <EntitySelector isOpen={isToSelectorOpen} onClose={() => setIsToSelectorOpen(false)} onSelect={(item) => { setFormData(p => ({...p, toEntityId: (item as Contact).id})); setToEntityName(item.name); setIsToSelectorOpen(false);}} contactTypes={['employee', 'supplier', 'patient', 'doctor', 'custom']} />
        </form>
    )
}

const TransactionForm = ({ transactionToEdit, onSave, onCancel }: { transactionToEdit?: UnifiedTransaction | null, onSave: () => void, onCancel: () => void }) => {
    const { payments, expenses } = useAppContext();
    const [mode, setMode] = useState<'receipt' | 'payment' | 'expense'>('receipt');

    // Logic for EDITING an existing transaction
    if (transactionToEdit) {
        if (transactionToEdit.originalType === 'payment') {
            const payment = payments.find(p => p.id === transactionToEdit.originalId);
            // The `type` prop tells PaymentForm whether to render as a receipt or an outgoing payment form.
            return <PaymentForm itemToEdit={payment || null} onSave={onSave} onCancel={onCancel} type={payment?.type || 'دریافت'} />;
        }
        
        if (transactionToEdit.originalType === 'expense') {
            const expense = expenses.find(e => e.id === transactionToEdit.originalId);
            return <ExpenseForm itemToEdit={expense || null} onSave={onSave} onCancel={onCancel} />;
        }

        // Fallback for safety, though it should not be reached.
        return <div className="p-4 text-red-400">خطا: نوع تراکنش برای ویرایش قابل تشخیص نیست.</div>;
    }

    // Logic for CREATING a new transaction
    return (
        <div>
            <div className="flex items-center space-x-1 space-x-reverse border-b-2 border-[var(--border-primary)] mb-4 pb-3">
                 <button 
                    onClick={() => setMode('receipt')}
                    className={`btn ${mode === 'receipt' ? 'btn-primary' : 'btn-secondary'}`}
                >
                    ثبت دریافت
                </button>
                <button 
                    onClick={() => setMode('payment')}
                    className={`btn ${mode === 'payment' ? 'btn-indigo' : 'btn-secondary'}`}
                >
                    ثبت پرداخت
                </button>
                 <button 
                    onClick={() => setMode('expense')}
                    className={`btn ${mode === 'expense' ? 'btn-danger' : 'btn-secondary'}`}
                >
                    ثبت هزینه
                </button>
            </div>

            {mode === 'receipt' && <PaymentForm itemToEdit={null} onSave={onSave} onCancel={onCancel} type="دریافت" />}
            {mode === 'payment' && <PaymentForm itemToEdit={null} onSave={onSave} onCancel={onCancel} type="پرداخت" />}
            {mode === 'expense' && <ExpenseForm itemToEdit={null} onSave={onSave} onCancel={onCancel} />}
        </div>
    );
};

export default TransactionForm;