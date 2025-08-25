import React, { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { EnhancedTable, Column } from './common/EnhancedTable';
import { Modal } from './common/Modal';
import { ConfirmationModal } from './common/ConfirmationModal';
import EntitySelector from './common/EntitySelector';
import CurrencyInput from './common/CurrencyInput';
import JalaliDatePicker from './common/JalaliDatePicker';
import FileUpload from './common/FileUpload';
import type { PayableReceivable, Contact, Account, ContactType } from '../types';
import { CURRENCY, PencilIcon, TrashIcon } from '../constants';

const PayablesForm = ({ item, onSave, onCancel }: { item?: PayableReceivable | null, onSave: (item: Omit<PayableReceivable, 'id'> | PayableReceivable) => void, onCancel: () => void }) => {
    const { getFormattedDate, contacts } = useAppContext();
    const [formData, setFormData] = useState<Partial<Omit<PayableReceivable, 'id'>>>({});
    const [isEntitySelectorOpen, setIsEntitySelectorOpen] = useState(false);
    const [entityName, setEntityName] = useState('');

    useEffect(() => {
        if (item) {
            setFormData(item);
            const entity = contacts.find(c => c.id === item.entityId);
            setEntityName(entity?.name || '');
        } else {
            setFormData({
                type: 'payable',
                status: 'در انتظار',
                issueDate: getFormattedDate(),
                amount: 0,
                attachments: []
            });
            setEntityName('');
        }
    }, [item, contacts, getFormattedDate]);

    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)]";

    const handleSelectEntity = (entity: Contact) => {
        setFormData(prev => ({ ...prev, entityId: entity.id }));
        setEntityName(entity.name);
        setIsEntitySelectorOpen(false);
    }
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    }
    const handleFilesChange = (files: { name: string, dataUrl: string }[]) => setFormData(prev => ({ ...prev, attachments: files }));
    const handleDueDateChange = useCallback((date: string) => setFormData(prev => ({...prev, dueDate: date})), []);
    const handleIssueDateChange = useCallback((date: string) => setFormData(prev => ({...prev, issueDate: date})), []);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.entityId || !formData.description || !formData.amount || !formData.dueDate) {
            alert('لطفا تمامی فیلدها را تکمیل نمایید.');
            return;
        }
        onSave(formData as PayableReceivable);
    }
    
    const entityTypes: (ContactType | 'custom')[] = ['patient', 'employee', 'supplier', 'doctor', 'custom'];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label className={labelClasses}>نوع</label>
                <select name="type" value={formData.type} onChange={handleChange} className="form-select">
                    <option value="payable">پرداختنی (بدهی)</option>
                    <option value="receivable">دریافتنی (طلب)</option>
                </select>
            </div>
             <div>
                <label className={labelClasses}>طرف حساب</label>
                <button type="button" onClick={() => setIsEntitySelectorOpen(true)} className="form-input text-right justify-start mt-1">
                    {entityName || 'انتخاب...'}
                </button>
            </div>
            <div>
                <label className={labelClasses}>شرح</label>
                <textarea name="description" value={formData.description || ''} onChange={handleChange} className="form-textarea" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>تاریخ صدور</label>
                    <JalaliDatePicker value={formData.issueDate || ''} onChange={handleIssueDateChange} />
                </div>
                <div>
                    <label className={labelClasses}>تاریخ سررسید</label>
                    <JalaliDatePicker value={formData.dueDate || ''} onChange={handleDueDateChange} />
                </div>
            </div>
             <div>
                <label className={labelClasses}>مبلغ ({CURRENCY})</label>
                <CurrencyInput value={formData.amount || 0} onValueChange={(v) => setFormData(p => ({...p, amount: v}))} />
            </div>
            <div>
                <label className={labelClasses}>ضمیمه کردن فایل</label>
                <FileUpload onFilesChange={handleFilesChange} />
            </div>
             <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
                <button type="button" onClick={onCancel} className="btn btn-secondary">لغو</button>
                <button type="submit" className="btn btn-primary">ذخیره</button>
            </div>
            <EntitySelector 
                isOpen={isEntitySelectorOpen}
                onClose={() => setIsEntitySelectorOpen(false)}
                onSelect={(entity) => handleSelectEntity(entity as Contact)}
                contactTypes={entityTypes}
            />
        </form>
    )
}

const MarkAsPaidForm = ({ item, onConfirm, onCancel }: { item: PayableReceivable, onConfirm: (id: number, method: string, accountId: number) => void, onCancel: () => void }) => {
    const { paymentMethods, formatCurrency } = useAppContext();
    const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0] || '');
    const [accountId, setAccountId] = useState<number | null>(null);
    const [accountName, setAccountName] = useState('');
    const [isAccountSelectorOpen, setIsAccountSelectorOpen] = useState(false);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!accountId) {
             alert('لطفا حساب پرداخت را انتخاب کنید.');
             return;
        }
        onConfirm(item.id, paymentMethod, accountId);
    }
    
    return (
         <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-[var(--text-secondary)]">آیا از تسویه حساب مورد <span className="font-bold text-[var(--text-primary)]">"{item.description}"</span> به مبلغ <span className="font-bold text-[var(--text-primary)]">{formatCurrency(item.amount)}</span> {CURRENCY} اطمینان دارید؟</p>
            <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)]">روش پرداخت</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="form-select mt-1">
                    {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)]">حساب پرداخت/دریافت</label>
                <button type="button" onClick={() => setIsAccountSelectorOpen(true)} className="form-input text-right justify-start mt-1">
                    {accountName || 'انتخاب حساب...'}
                </button>
            </div>
            <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
                <button type="button" onClick={onCancel} className="btn btn-secondary">لغو</button>
                <button type="submit" className="btn btn-success">تایید و تسویه</button>
            </div>
            <EntitySelector 
                isOpen={isAccountSelectorOpen}
                onClose={() => setIsAccountSelectorOpen(false)}
                onSelect={(acc) => { setAccountId((acc as Account).id); setAccountName((acc as Account).name); setIsAccountSelectorOpen(false); }}
                accountTypes={['دارایی‌ها']}
            />
        </form>
    );
};


const PayablesReceivables: React.FC = () => {
    const { payablesReceivables, addPayableReceivable, updatePayableReceivable, deletePayableReceivable, markAsPaid, contacts, formatCurrency } = useAppContext();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isPaidModalOpen, setIsPaidModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<PayableReceivable | null>(null);

    const getStatusBadge = (status: string) => {
        return status === 'پرداخت شده' ? <span className="badge badge-green">{status}</span> : <span className="badge badge-yellow">{status}</span>;
    };
    
    const columns: Column<PayableReceivable>[] = [
        { header: 'نوع', accessor: (item) => item.type === 'payable' ? <span className="text-red-400">پرداختنی</span> : <span className="text-green-400">دریافتنی</span>, sortKey: 'type' },
        { header: 'طرف حساب', accessor: (item) => contacts.find(c => c.id === item.entityId)?.name || 'N/A' },
        { header: 'شرح', accessor: 'description' },
        { header: 'تاریخ سررسید', accessor: 'dueDate', sortKey: 'dueDate' },
        { header: `مبلغ (${CURRENCY})`, accessor: (item) => formatCurrency(item.amount), sortKey: 'amount' },
        { header: 'وضعیت', accessor: (item) => getStatusBadge(item.status), sortKey: 'status' },
    ];

    const resetModals = () => {
        setIsFormModalOpen(false);
        setIsPaidModalOpen(false);
        setIsConfirmModalOpen(false);
        setSelectedItem(null);
    };

    const handleOpenFormModal = (item: PayableReceivable | null = null) => {
        setSelectedItem(item);
        setIsFormModalOpen(true);
    };

    const handleOpenPaidModal = (item: PayableReceivable) => {
        setSelectedItem(item);
        setIsPaidModalOpen(true);
    };
    
    const handleOpenConfirmModal = (item: PayableReceivable) => {
        setSelectedItem(item);
        setIsConfirmModalOpen(true);
    };

    const handleSave = (data: Omit<PayableReceivable, 'id'> | PayableReceivable) => {
        if ('id' in data) {
            updatePayableReceivable(data);
        } else {
            addPayableReceivable(data);
        }
        resetModals();
    };

    const handleMarkAsPaid = (id: number, method: string, accountId: number) => {
        markAsPaid(id, method, accountId);
        resetModals();
    };

    const handleDelete = () => {
        if (selectedItem) {
            deletePayableReceivable(selectedItem.id);
        }
        resetModals();
    };

    const itemActions = (item: PayableReceivable) => (
        <div className="flex space-x-2 space-x-reverse">
            {item.status === 'در انتظار' && (
                <button onClick={() => handleOpenPaidModal(item)} className="btn btn-sm btn-success">تسویه</button>
            )}
            <button onClick={() => handleOpenFormModal(item)} className="btn btn-sm btn-secondary btn-icon" title="ویرایش"><PencilIcon/></button>
            <button onClick={() => handleOpenConfirmModal(item)} className="btn btn-sm btn-danger btn-icon" title="حذف"><TrashIcon/></button>
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">مدیریت بدهی و مطالبات</h1>
                <button onClick={() => handleOpenFormModal()} className="btn btn-primary">
                    افزودن مورد جدید
                </button>
            </div>
            <EnhancedTable<PayableReceivable>
                columns={columns}
                data={payablesReceivables}
                actions={itemActions}
                tableName="بدهی-و-مطالبات"
                entityType="payableReceivable"
                enableDateFilter
                dateFilterKey="dueDate"
            />
             <Modal isOpen={isFormModalOpen} onClose={resetModals} title={selectedItem ? 'ویرایش' : 'افزودن بدهی/طلب'}>
                <PayablesForm item={selectedItem} onSave={handleSave} onCancel={resetModals} />
            </Modal>
            {selectedItem && (
                <Modal isOpen={isPaidModalOpen} onClose={resetModals} title="تسویه حساب">
                    <MarkAsPaidForm item={selectedItem} onConfirm={handleMarkAsPaid} onCancel={resetModals} />
                </Modal>
            )}
            {selectedItem && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={resetModals}
                    onConfirm={handleDelete}
                    title="تایید حذف"
                    message={`آیا از حذف «${selectedItem.description}» اطمینان دارید؟`}
                />
            )}
        </div>
    );
};

export default PayablesReceivables;