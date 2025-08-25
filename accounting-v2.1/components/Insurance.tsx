import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { EnhancedTable, Column } from './common/EnhancedTable';
import { Modal } from './common/Modal';
import { ConfirmationModal } from './common/ConfirmationModal';
import type { InsuranceClaim, InsuranceClaimItem, Service, InventoryItem, InvoiceTemplate } from '../types';
import { CURRENCY, TrashIcon, PencilIcon } from '../constants';
import JalaliDatePicker from './common/JalaliDatePicker';
import CurrencyInput from './common/CurrencyInput';


const ItemSelectionModal = ({ onSave, onCancel }: { onSave: (items: InsuranceClaimItem[]) => void, onCancel: () => void }) => {
    const { services, inventory, invoiceTemplates } = useAppContext();
    const [selectedItems, setSelectedItems] = useState<{type: 'service' | 'inventory' | 'template', id: number}[]>([]);

    const handleToggleItem = (type: 'service' | 'inventory' | 'template', id: number) => {
        setSelectedItems(prev => {
            const exists = prev.some(item => item.type === type && item.id === id);
            if(exists) {
                return prev.filter(item => !(item.type === type && item.id === id));
            } else {
                return [...prev, {type, id}];
            }
        })
    }

    const handleSave = () => {
        const newClaimItems: InsuranceClaimItem[] = [];
        selectedItems.forEach(item => {
            if (item.type === 'service') {
                const service = services.find(s => s.id === item.id);
                if (service) {
                    const price = service.tariffs['آزاد'] || 0; // Assuming 'آزاد' tariff for insurance claims
                    newClaimItems.push({ type: 'service', itemId: service.id, description: service.name, quantity: 1, unitPrice: price, totalPrice: price });
                }
            } else if (item.type === 'inventory') {
                const invItem = inventory.find(i => i.id === item.id);
                if (invItem) {
                    newClaimItems.push({ type: 'inventory', itemId: invItem.id, description: invItem.name, quantity: 1, unitPrice: invItem.salePrice, totalPrice: invItem.salePrice });
                }
            } else if (item.type === 'template') {
                const template = invoiceTemplates.find(t => t.id === item.id);
                if (template) {
                     let templatePrice = 0;
                    template.items.forEach(tItem => {
                        if (tItem.type === 'service') {
                            const service = services.find(s => s.id === tItem.id);
                            if (service) {
                                templatePrice += (service.tariffs['آزاد'] || 0) * tItem.quantity;
                            }
                        } else {
                            const invItem = inventory.find(i => i.id === tItem.id);
                            if (invItem) {
                                templatePrice += invItem.salePrice * tItem.quantity;
                            }
                        }
                    });
                    newClaimItems.push({
                        type: 'template',
                        templateId: template.id,
                        description: template.name,
                        quantity: 1,
                        unitPrice: templatePrice,
                        totalPrice: templatePrice
                    });
                }
            }
        });
        onSave(newClaimItems);
    }
    
    const renderList = (items: (Service | InventoryItem | InvoiceTemplate)[], type: 'service' | 'inventory' | 'template') => (
         <ul className="space-y-2">
            {items.map(item => (
                 <li key={item.id}>
                    <label className="flex items-center p-2 rounded-md hover:bg-[var(--bg-tertiary)] cursor-pointer">
                        <input type="checkbox" className="form-checkbox" checked={selectedItems.some(i => i.type === type && i.id === item.id)} onChange={() => handleToggleItem(type, item.id)} />
                        <span className="mr-3">{item.name}</span>
                    </label>
                </li>
            ))}
        </ul>
    );

    return (
        <Modal isOpen={true} onClose={onCancel} title="انتخاب آیتم‌ها برای پرونده بیمه">
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                <div>
                    <h3 className="font-bold text-lg text-[var(--text-primary)] mb-2">قالب‌ها</h3>
                    {renderList(invoiceTemplates, 'template')}
                </div>
                <div>
                    <h3 className="font-bold text-lg text-[var(--text-primary)] mb-2">خدمات</h3>
                    {renderList(services, 'service')}
                </div>
                <div>
                    <h3 className="font-bold text-lg text-[var(--text-primary)] mb-2">کالاها</h3>
                    {renderList(inventory, 'inventory')}
                </div>
            </div>
            <div className="flex justify-end pt-4 space-x-2 space-x-reverse border-t border-[var(--border-primary)] mt-4">
                <button type="button" onClick={onCancel} className="btn btn-secondary">لغو</button>
                <button type="button" onClick={handleSave} className="btn btn-primary">افزودن آیتم‌های انتخاب شده</button>
            </div>
        </Modal>
    );
};


// --- Form for creating/editing an aggregate claim ---
const ClaimForm = ({ claim, onSave, onCancel }: { claim?: InsuranceClaim | null, onSave: (claim: Omit<InsuranceClaim, 'id'> | InsuranceClaim) => void, onCancel: () => void }) => {
    const { getFormattedDate, insuranceCompanies, services, inventory, invoiceTemplates, formatCurrency } = useAppContext();
    const [formData, setFormData] = useState<Partial<InsuranceClaim>>({});
    const [isItemSelectorOpen, setIsItemSelectorOpen] = useState(false);

    useEffect(() => {
        if (claim) {
            setFormData(claim);
        } else {
            setFormData({
                insuranceCompanyId: insuranceCompanies[0]?.id,
                submissionDate: getFormattedDate(),
                status: 'آماده ارسال',
                items: [],
                expectedAmount: 0,
                notes: ''
            });
        }
    }, [claim, getFormattedDate, insuranceCompanies]);

    useEffect(() => {
        const total = (formData.items || []).reduce((sum, item) => sum + item.totalPrice, 0);
        setFormData(prev => ({ ...prev, expectedAmount: total }));
    }, [formData.items]);
    
    const handleItemChange = (index: number, field: 'quantity' | 'unitPrice' | 'description', value: string | number) => {
        const newItems = [...(formData.items || [])];
        const currentItem = newItems[index];
        
        if (field === 'description') {
            (currentItem as any).description = String(value);
        } else {
             (currentItem as any)[field] = Number(value);
            const qty = Number(currentItem.quantity);
            const price = Number(currentItem.unitPrice);
            currentItem.totalPrice = qty * price;
        }
        setFormData(prev => ({...prev, items: newItems}));
    };
    
    const handleAddItems = (newItems: InsuranceClaimItem[]) => {
        setFormData(prev => ({...prev, items: [...(prev.items || []), ...newItems]}));
        setIsItemSelectorOpen(false);
    }
    
    const removeItem = (index: number) => {
        setFormData(prev => ({...prev, items: (prev.items || []).filter((_, i) => i !== index)}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.insuranceCompanyId || !formData.items || formData.items.length === 0) {
            alert("لطفا شرکت بیمه را انتخاب کرده و حداقل یک آیتم اضافه کنید.");
            return;
        }
        onSave(formData as Omit<InsuranceClaim, 'id'> | InsuranceClaim);
    };

    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)]";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {isItemSelectorOpen && <ItemSelectionModal onSave={handleAddItems} onCancel={() => setIsItemSelectorOpen(false)} />}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className={labelClasses}>شرکت بیمه</label>
                    <select value={formData.insuranceCompanyId || ''} onChange={e => setFormData(p => ({...p, insuranceCompanyId: Number(e.target.value)}))} className="form-select" required>
                         {insuranceCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label className={labelClasses}>تاریخ ارسال</label>
                    <JalaliDatePicker value={formData.submissionDate || ''} onChange={d => setFormData(p => ({...p, submissionDate: d}))} />
                </div>
                 <div>
                    <label className={labelClasses}>وضعیت</label>
                    <select value={formData.status || ''} onChange={e => setFormData(p => ({...p, status: e.target.value as InsuranceClaim['status']}))} className="form-select">
                        <option value="آماده ارسال">آماده ارسال</option>
                        <option value="ارسال شده">ارسال شده</option>
                        <option value="در حال بررسی">در حال بررسی</option>
                        <option value="پرداخت شده">پرداخت شده</option>
                        <option value="رد شده">رد شده</option>
                    </select>
                </div>
            </div>
            
            <fieldset className="border p-4 rounded-md border-[var(--border-secondary)]">
                <legend className="text-sm font-medium text-[var(--text-secondary)] px-2">آیتم‌های پرونده</legend>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {(formData.items || []).map((item, index) => {
                        const isTemplate = item.type === 'template';
                        const template = isTemplate ? invoiceTemplates.find(t => t.id === (item as any).templateId) : null;
                        
                        return (
                             <div key={index} className="p-2 border border-[var(--border-secondary)] rounded-md">
                                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-center">
                                    <input type="text" placeholder="شرح" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} className={`form-input ${isTemplate ? 'bg-[var(--bg-tertiary)]' : ''}`} required readOnly={isTemplate} />
                                    <CurrencyInput value={item.unitPrice} onValueChange={v => handleItemChange(index, 'unitPrice', v)} className={isTemplate ? 'bg-[var(--bg-tertiary)]' : ''} readOnly={isTemplate}/>
                                    <input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} min="1" className="form-input" />
                                    <span className="text-center font-mono">{formatCurrency(item.totalPrice)}</span>
                                    <button type="button" onClick={() => removeItem(index)} className="btn btn-sm btn-danger btn-icon justify-self-end">&times;</button>
                                </div>
                                {isTemplate && template && (
                                    <div className="mt-2 pt-2 border-t border-[var(--border-primary)] text-xs text-[var(--text-secondary)]">
                                        <p className="font-semibold">محتویات پکیج:</p>
                                        <ul className="list-disc list-inside mr-4">
                                            {template.items.map((subItem, subIndex) => {
                                                const detail = subItem.type === 'service' 
                                                    ? services.find(s => s.id === subItem.id)
                                                    : inventory.find(i => i.id === subItem.id);
                                                return <li key={subIndex}>{detail?.name} (x{subItem.quantity})</li>
                                            })}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
                <button type="button" onClick={() => setIsItemSelectorOpen(true)} className="btn btn-sm btn-secondary mt-3">+ افزودن آیتم</button>
            </fieldset>

             <div className="font-bold text-lg text-center">
                مبلغ مورد انتظار: {useAppContext().formatCurrency(formData.expectedAmount || 0)} {CURRENCY}
            </div>
            
            <div>
                <label className={labelClasses}>یادداشت</label>
                <textarea value={formData.notes || ''} onChange={e => setFormData(p => ({...p, notes: e.target.value}))} className="form-textarea" rows={3}/>
            </div>


            <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
                <button type="button" onClick={onCancel} className="btn btn-secondary">لغو</button>
                <button type="submit" className="btn btn-primary">ذخیره پرونده</button>
            </div>
        </form>
    )
}

const RecordPaymentForm = ({ claim, onSave, onCancel }: { claim: InsuranceClaim, onSave: (updatedClaim: InsuranceClaim) => void, onCancel: () => void }) => {
    const { getFormattedDate, formatCurrency } = useAppContext();
    const [receivedAmount, setReceivedAmount] = useState(claim.expectedAmount);
    const [receivedDate, setReceivedDate] = useState(getFormattedDate());
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedClaim = {
            ...claim,
            receivedAmount,
            receivedDate,
            status: 'پرداخت شده' as const
        };
        onSave(updatedClaim);
    }
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-[var(--text-secondary)]">ثبت مبلغ دریافتی برای پرونده شماره <span className="font-bold text-[var(--text-primary)]">#{claim.id}</span></p>
            <div className="text-center bg-[var(--bg-tertiary)] p-3 rounded-md">
                مبلغ مورد انتظار: <span className="font-bold font-mono text-lg">{formatCurrency(claim.expectedAmount)} {CURRENCY}</span>
            </div>
            <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)]">مبلغ دریافتی</label>
                <CurrencyInput value={receivedAmount} onValueChange={setReceivedAmount} />
            </div>
            <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)]">تاریخ دریافت</label>
                <JalaliDatePicker value={receivedDate} onChange={setReceivedDate} />
            </div>
             <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
                <button type="button" onClick={onCancel} className="btn btn-secondary">لغو</button>
                <button type="submit" className="btn btn-success">ثبت دریافتی</button>
            </div>
        </form>
    )
}


// --- Main Component ---
const Insurance = () => {
  const { claims, addClaim, updateClaim, deleteClaim, insuranceCompanies, formatCurrency } = useAppContext();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null);

  const getStatusBadge = (status: InsuranceClaim['status']) => {
    switch (status) {
      case 'پرداخت شده': return <span className="badge badge-green">{status}</span>;
      case 'ارسال شده': return <span className="badge badge-blue">{status}</span>;
      case 'در حال بررسی': return <span className="badge badge-yellow">{status}</span>;
      case 'رد شده': return <span className="badge badge-red">{status}</span>;
      case 'آماده ارسال':
      default: return <span className="badge badge-gray">{status}</span>;
    }
  };

  const columns: Column<InsuranceClaim>[] = [
    { header: 'شناسه پرونده', accessor: 'id', sortKey: 'id' },
    { header: 'شرکت بیمه', accessor: (item) => insuranceCompanies.find(c => c.id === item.insuranceCompanyId)?.name || 'N/A', sortKey: 'insuranceCompanyId' },
    { header: 'تاریخ ارسال', accessor: 'submissionDate', sortKey: 'submissionDate' },
    { header: `مبلغ مورد انتظار (${CURRENCY})`, accessor: (item) => formatCurrency(item.expectedAmount), sortKey: 'expectedAmount' },
    { header: `مبلغ دریافتی (${CURRENCY})`, accessor: (item) => item.receivedAmount ? formatCurrency(item.receivedAmount) : '-', sortKey: 'receivedAmount' },
    { header: 'وضعیت', accessor: (item) => getStatusBadge(item.status), sortKey: 'status' },
  ];
  
  const resetModals = () => {
    setIsFormModalOpen(false);
    setIsConfirmModalOpen(false);
    setIsPaymentModalOpen(false);
    setSelectedClaim(null);
  }

  const handleOpenFormModal = (claim: InsuranceClaim | null = null) => {
    setSelectedClaim(claim);
    setIsFormModalOpen(true);
  };
  
  const handleOpenConfirmModal = (claim: InsuranceClaim) => {
    setSelectedClaim(claim);
    setIsConfirmModalOpen(true);
  }
  
  const handleOpenPaymentModal = (claim: InsuranceClaim) => {
    setSelectedClaim(claim);
    setIsPaymentModalOpen(true);
  }
  
  const handleSaveClaim = (claimData: Omit<InsuranceClaim, 'id'> | InsuranceClaim) => {
      if ('id' in claimData) {
          updateClaim(claimData);
      } else {
          addClaim(claimData);
      }
      resetModals();
  }
  
  const handleDelete = () => {
      if (selectedClaim) {
          deleteClaim(selectedClaim.id);
      }
      resetModals();
  }
  
  const claimActions = (claim: InsuranceClaim) => (
    <div className="flex space-x-2 space-x-reverse">
         {claim.status !== 'پرداخت شده' && (
            <button onClick={() => handleOpenPaymentModal(claim)} className="btn btn-sm btn-success">ثبت دریافتی</button>
        )}
        <button onClick={() => handleOpenFormModal(claim)} className="btn btn-sm btn-secondary btn-icon" title="ویرایش">
            <PencilIcon/>
        </button>
        <button onClick={() => handleOpenConfirmModal(claim)} className="btn btn-sm btn-danger btn-icon" title="حذف">
            <TrashIcon/>
        </button>
    </div>
  );


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">مدیریت بیمه و ارسال نسخ</h1>
        <button onClick={() => handleOpenFormModal()} className="btn btn-primary">
          ایجاد پرونده ارسال جدید
        </button>
      </div>
      <EnhancedTable<InsuranceClaim> 
        columns={columns} 
        data={claims} 
        actions={claimActions}
        tableName="پرونده‌های-ارسالی-بیمه"
        enableDateFilter
        dateFilterKey="submissionDate"
      />
      <Modal 
        isOpen={isFormModalOpen} 
        onClose={resetModals} 
        title={selectedClaim ? `ویرایش پرونده #${selectedClaim.id}` : "ایجاد پرونده ارسال جدید"}
      >
          <ClaimForm claim={selectedClaim} onSave={handleSaveClaim} onCancel={resetModals} />
      </Modal>
       {selectedClaim && (
        <ConfirmationModal
            isOpen={isConfirmModalOpen}
            onClose={resetModals}
            onConfirm={handleDelete}
            title="تایید حذف پرونده"
            message={`آیا از حذف پرونده ارسالی به بیمه به شناسه #${selectedClaim.id} اطمینان دارید؟`}
        />
      )}
      {selectedClaim && (
          <Modal isOpen={isPaymentModalOpen} onClose={resetModals} title={`ثبت دریافتی برای پرونده #${selectedClaim.id}`}>
              <RecordPaymentForm claim={selectedClaim} onSave={handleSaveClaim} onCancel={resetModals} />
          </Modal>
      )}
    </div>
  );
};

export default Insurance;