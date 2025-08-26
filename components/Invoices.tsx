import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { EnhancedTable, Column } from './common/EnhancedTable';
import { Modal } from './common/Modal';
import { ConfirmationModal } from './common/ConfirmationModal';
import CurrencyInput from './common/CurrencyInput';
import InvoiceDetail from './InvoiceDetail';
import FileUpload from './common/FileUpload';
import JalaliDatePicker from './common/JalaliDatePicker';
import type { Invoice, InvoiceItem, Service, InventoryItem } from '../types';
import { CURRENCY, PencilIcon, TrashIcon, EyeIcon } from '../constants';

const InvoiceForm = ({ invoice, onSave, onCancel }: { invoice?: Invoice | null, onSave: (invoice: Omit<Invoice, 'id'> | Invoice) => void, onCancel: () => void }) => {
    const { services, inventory, doctors, invoiceTemplates, formatCurrency, getFormattedDate, insuranceCompanies } = useAppContext();
    const [recipientName, setRecipientName] = useState('');
    const [tariffType, setTariffType] = useState('آزاد');
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [discount, setDiscount] = useState(0);
    const [attachments, setAttachments] = useState<{ name: string; dataUrl: string }[]>([]);
    const [date, setDate] = useState(getFormattedDate());
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

    useEffect(() => {
        if (invoice) {
            setRecipientName(invoice.recipientName);
            setTariffType(invoice.tariffType);
            setItems(invoice.items);
            setDiscount(invoice.discount);
            setAttachments(invoice.attachments || []);
            setDate(invoice.date);
        } else {
            setRecipientName('');
            setTariffType('آزاد');
            setItems([]);
            setDiscount(0);
            setAttachments([]);
            setDate(getFormattedDate());
        }
    }, [invoice, getFormattedDate]);
    
    const handleApplyTemplate = (templateId: string) => {
        if (!templateId) return;
        const template = invoiceTemplates.find(t => t.id === Number(templateId));
        if (!template) return;
        
        const newItems: InvoiceItem[] = template.items.flatMap((templateItem): InvoiceItem[] => {
            if (templateItem.type === 'service') {
                const service = services.find(s => s.id === templateItem.id);
                if (!service) return [];
                const unitPrice = service.tariffs[tariffType] || service.tariffs['آزاد'];
                return [{ type: 'service' as const, id: service.id, name: service.name, quantity: templateItem.quantity, price: unitPrice * templateItem.quantity, doctorId: undefined }];
            } else {
                const invItem = inventory.find(i => i.id === templateItem.id);
                if (!invItem) return [];
                return [{ type: 'inventory' as const, id: invItem.id, name: invItem.name, quantity: templateItem.quantity, price: invItem.salePrice * templateItem.quantity }];
            }
        });
        setItems(currentItems => [...currentItems, ...newItems]);
        setIsTemplateModalOpen(false);
    }
    
    const handleAddItem = (type: 'service' | 'inventory') => {
        let newItem: InvoiceItem | null = null;
        if(type === 'service'){
            const service = services[0];
            if(!service) return;
            const unitPrice = service.tariffs[tariffType] || service.tariffs['آزاد'];
            newItem = { type: 'service', id: service.id, name: service.name, quantity: 1, price: unitPrice, doctorId: doctors[0]?.id };
        } else {
            const invItem = inventory[0];
            if(!invItem) return;
             newItem = { type: 'inventory', id: invItem.id, name: invItem.name, quantity: 1, price: invItem.salePrice };
        }
        if(newItem) setItems([...items, newItem]);
    }

    const handleItemChange = (index: number, field: 'id' | 'doctorId', value: number) => {
        const newItems = [...items];
        const currentItem = newItems[index];
        if (currentItem.type === 'service' && field === 'id') {
            const service = services.find(s => s.id === value);
            if(service){
                const unitPrice = service.tariffs[tariffType] || service.tariffs['آزاد'];
                newItems[index] = { ...currentItem, id: service.id, name: service.name, price: unitPrice * currentItem.quantity };
            }
        } else if (currentItem.type === 'inventory' && field === 'id') {
             const invItem = inventory.find(i => i.id === value);
            if(invItem) {
                newItems[index] = { ...currentItem, id: invItem.id, name: invItem.name, price: invItem.salePrice * currentItem.quantity };
            }
        } else if (currentItem.type === 'service' && field === 'doctorId') {
            newItems[index] = { ...currentItem, doctorId: value };
        }
        setItems(newItems);
    }
    
    const handleQuantityChange = (index: number, quantity: number) => {
        const newItems = [...items];
        const currentItem = newItems[index];
        
        let unitPrice = currentItem.price / currentItem.quantity;
        newItems[index].quantity = quantity;
        newItems[index].price = unitPrice * quantity;
        setItems(newItems);
    };

    const handleRemoveItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const { totalAmount, insuranceShare } = useMemo(() => {
        const total = items.reduce((sum, item) => sum + item.price, 0);
        const insuranceTotal = items.reduce((sum, item) => {
            if(item.type !== 'service' || tariffType === 'آزاد') return sum;
            const service = services.find(s => s.id === item.id);
            if(!service) return sum;
            const freePrice = (service.tariffs['آزاد'] || 0) * item.quantity;
            return sum + (freePrice - item.price);
        }, 0);
        return { totalAmount: total, insuranceShare: insuranceTotal };
    }, [items, services, tariffType]);
    
    const patientShare = totalAmount - discount;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!recipientName || items.length === 0) return;
        
        const commonData = {
            recipientName, date, items, totalAmount,
            patientShare, insuranceShare, discount, attachments, tariffType
        };
        
        if (invoice) {
            const updatedInvoice = { ...invoice, ...commonData };
            const newPaidAmount = updatedInvoice.paidAmount || 0;
            const isFullyPaid = newPaidAmount >= updatedInvoice.patientShare;
            updatedInvoice.status = newPaidAmount === 0 ? 'در انتظار پرداخت' : isFullyPaid ? 'پرداخت شده' : 'پرداخت ناقص';
            onSave(updatedInvoice);
        } else {
            onSave({ ...commonData, paidAmount: 0, status: 'در انتظار پرداخت' });
        }
    };
    
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)]";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className={labelClasses}>نام دریافت‌کننده</label>
                    <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} className="form-input" required disabled={!!invoice}/>
                </div>
                 <div>
                    <label className={labelClasses}>تاریخ صدور</label>
                    <JalaliDatePicker label="تاریخ صدور" value={date} onChange={(newDate) => { if (newDate) setDate(newDate); }} />
                </div>
            </div>

            <div>
                <label className={labelClasses}>نوع تعرفه</label>
                 <select value={tariffType} onChange={e => setTariffType(e.target.value)} className="form-select" required>
                    <option value="آزاد">آزاد</option>
                    {insuranceCompanies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
            </div>
            
            <div className="border-t border-[var(--border-primary)] pt-4 mt-4">
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">لیست آیتم‌ها</h3>
                {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-2 mt-2 p-2 border border-[var(--border-primary)] rounded-md items-center">
                       <select value={item.id} onChange={e => handleItemChange(index, 'id', Number(e.target.value))} className="form-select flex-grow">
                         {item.type === 'service' ? 
                            services.map(s => <option key={s.id} value={s.id}>{s.name}</option>) :
                            inventory.map(i => <option key={i.id} value={i.id}>{i.name} (موجودی: {i.quantity})</option>)
                         }
                       </select>
                       <input type="number" value={item.quantity} onChange={e => handleQuantityChange(index, Number(e.target.value))} min="1" className="form-input w-24" />
                       <span className="w-32 text-center text-[var(--text-primary)] font-mono">{formatCurrency(item.price)}</span>
                       <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 p-1 rounded-full hover:bg-red-900/50 font-bold text-xl">&times;</button>
                       {item.type === 'service' && (
                           <div className="md:col-span-4 mt-2 md:mt-0">
                               <label className="text-xs text-[var(--text-secondary)] mr-2">پزشک:</label>
                               <select value={item.doctorId || ''} onChange={e => handleItemChange(index, 'doctorId', Number(e.target.value))} className="form-select w-auto inline-block text-sm h-auto py-1">
                                    <option value="">انتخاب پزشک...</option>
                                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                               </select>
                           </div>
                       )}
                    </div>
                ))}
                 <div className="flex space-x-2 space-x-reverse mt-2">
                    <button type="button" onClick={() => handleAddItem('service')} className="btn btn-sm btn-secondary">+ افزودن خدمت</button>
                    <button type="button" onClick={() => handleAddItem('inventory')} className="btn btn-sm btn-secondary">+ افزودن کالا</button>
                    <button type="button" onClick={() => setIsTemplateModalOpen(true)} className="btn btn-sm btn-secondary">+ افزودن پکیج</button>
                </div>
            </div>
            
            <div className="border-t border-[var(--border-primary)] pt-4 mt-4 space-y-2 text-[var(--text-primary)]">
                 <div>
                    <label className={labelClasses}>تخفیف ({CURRENCY})</label>
                    <CurrencyInput value={discount} onValueChange={setDiscount} />
                </div>
                <div className="flex justify-between font-semibold"><span>مبلغ کل:</span><span className="font-mono">{formatCurrency(totalAmount)} {CURRENCY}</span></div>
                <div className="flex justify-between text-blue-400"><span>سهم بیمه:</span><span className="font-mono">{formatCurrency(insuranceShare)} {CURRENCY}</span></div>
                <div className="flex justify-between text-green-400 font-bold text-lg"><span>مبلغ قابل پرداخت:</span><span className="font-mono">{formatCurrency(patientShare)} {CURRENCY}</span></div>
            </div>
            <div>
              <label className={labelClasses}>ضمیمه کردن فایل</label>
              <FileUpload onFilesChange={setAttachments} />
            </div>
            <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
                <button type="button" onClick={onCancel} className="btn btn-secondary">لغو</button>
                <button type="submit" className="btn btn-primary">ذخیره صورتحساب</button>
            </div>
            <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title="انتخاب پکیج آماده">
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {invoiceTemplates.map(template => (
                        <li key={template.id}>
                            <button
                                onClick={() => handleApplyTemplate(String(template.id))}
                                className="w-full text-right p-3 rounded-md hover:bg-[var(--bg-tertiary)]"
                            >
                                {template.name}
                            </button>
                        </li>
                    ))}
                </ul>
            </Modal>
        </form>
    )
}

const ChangeStatusForm = ({ invoice, onSave, onCancel }: { invoice: Invoice, onSave: (invoice: Invoice) => void, onCancel: () => void }) => {
    const [status, setStatus] = useState(invoice.status);

    const handleSave = () => {
        onSave({ ...invoice, status });
    };

    return (
        <div className="space-y-4">
            <p>وضعیت جدید را برای صورتحساب مربوط به {invoice.recipientName} انتخاب کنید.</p>
             <select value={status} onChange={e => setStatus(e.target.value as Invoice['status'])} className="form-select">
                <option value="در انتظار پرداخت">در انتظار پرداخت</option>
                <option value="پرداخت ناقص">پرداخت ناقص</option>
                <option value="پرداخت شده">پرداخت شده</option>
            </select>
            <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
                <button type="button" onClick={onCancel} className="btn btn-secondary">لغو</button>
                <button type="button" onClick={handleSave} className="btn btn-primary">ذخیره</button>
            </div>
        </div>
    );
};


const Invoices = () => {
  const { invoices, addInvoice, updateInvoice, deleteInvoice, formatCurrency } = useAppContext();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  const getStatusBadge = (status: string) => {
    switch(status) {
        case 'پرداخت شده': return <span className="badge badge-green">{status}</span>;
        case 'در انتظار پرداخت': return <span className="badge badge-yellow">{status}</span>;
        case 'پرداخت ناقص': return <span className="badge badge-red">{status}</span>;
        default: return <span className="badge badge-gray">{status}</span>;
    }
  };

  const columns: Column<Invoice>[] = [
    { header: 'نام دریافت‌کننده', accessor: 'recipientName', sortKey: 'recipientName' },
    { header: 'تاریخ', accessor: 'date', sortKey: 'date' },
    { header: `مبلغ کل (${CURRENCY})`, accessor: (item: Invoice) => formatCurrency(item.totalAmount), sortKey: 'totalAmount' },
    { header: 'تگ‌ها', accessor: (item) => item.tags?.join('، ') || '-' },
    { header: 'وضعیت', accessor: (item: Invoice) => getStatusBadge(item.status), sortKey: 'status' },
  ];
  
  const resetModals = () => {
      setIsFormModalOpen(false);
      setIsDetailModalOpen(false);
      setIsConfirmModalOpen(false);
      setIsStatusModalOpen(false);
      setEditingInvoice(null);
      setSelectedInvoice(null);
  };
  
  const handleOpenFormModal = (invoice: Invoice | null = null) => {
    setEditingInvoice(invoice);
    setIsFormModalOpen(true);
  };

  const handleOpenDetailModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailModalOpen(true);
  }
  
  const handleOpenStatusModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsStatusModalOpen(true);
  }

  const handleOpenConfirmModal = (invoice: Invoice) => {
      setSelectedInvoice(invoice);
      setIsConfirmModalOpen(true);
  }

  const handleSaveInvoice = (invoiceData: Omit<Invoice, 'id'> | Invoice) => {
      if ('id' in invoiceData) {
          updateInvoice(invoiceData as Invoice);
      } else {
          addInvoice(invoiceData as Omit<Invoice, 'id'>);
      }
      resetModals();
  };
  
  const handleDelete = () => {
      if (selectedInvoice) {
          deleteInvoice(selectedInvoice.id);
      }
      resetModals();
  };

  const invoiceActions = (invoice: Invoice) => (
    <div className="flex space-x-2 space-x-reverse">
        <button onClick={() => handleOpenDetailModal(invoice)} className="btn btn-sm btn-secondary btn-icon" title="مشاهده"><EyeIcon/></button>
        <button onClick={() => handleOpenStatusModal(invoice)} className="btn btn-sm btn-secondary">تغییر وضعیت</button>
        <button onClick={() => handleOpenFormModal(invoice)} className="btn btn-sm btn-secondary btn-icon" title="ویرایش"><PencilIcon/></button>
        <button onClick={() => handleOpenConfirmModal(invoice)} className="btn btn-sm btn-danger btn-icon" title="حذف"><TrashIcon/></button>
    </div>
  );

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">صورتحساب</h1>
            <button onClick={() => handleOpenFormModal(null)} className="btn btn-primary">
                صدور صورتحساب جدید
            </button>
        </div>
        <EnhancedTable<Invoice> 
            columns={columns} 
            data={invoices} 
            actions={invoiceActions} 
            tableName="لیست-صورتحساب-ها"
            entityType="invoice"
            enableDateFilter
            dateFilterKey="date"
        />
        <Modal 
            isOpen={isFormModalOpen} 
            onClose={resetModals} 
            title={editingInvoice ? `ویرایش صورتحساب برای ${editingInvoice.recipientName}`: "صدور صورتحساب جدید"}
        >
            <InvoiceForm
                invoice={editingInvoice}
                onSave={handleSaveInvoice}
                onCancel={resetModals}
            />
        </Modal>

        {selectedInvoice && (
             <Modal 
                isOpen={isDetailModalOpen} 
                onClose={resetModals} 
                title={`جزئیات صورتحساب برای ${selectedInvoice.recipientName}`}
            >
                <InvoiceDetail invoice={selectedInvoice} />
            </Modal>
        )}
        
        {selectedInvoice && (
             <Modal 
                isOpen={isStatusModalOpen} 
                onClose={resetModals} 
                title={`تغییر وضعیت صورتحساب برای ${selectedInvoice.recipientName}`}
            >
                <ChangeStatusForm invoice={selectedInvoice} onSave={handleSaveInvoice} onCancel={resetModals} />
            </Modal>
        )}

        {selectedInvoice && (
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={resetModals}
                onConfirm={handleDelete}
                title="تایید حذف صورتحساب"
                message={`آیا از حذف صورتحساب برای «${selectedInvoice.recipientName}» مورخ «${selectedInvoice.date}» اطمینان دارید؟`}
            />
        )}
    </div>
  );
};

export default Invoices;