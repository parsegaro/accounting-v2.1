import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Modal } from './common/Modal';
import JalaliDatePicker from './common/JalaliDatePicker';
import CurrencyInput from './common/CurrencyInput';
import EntitySelector from './common/EntitySelector';
import type { InvoiceItem, Service, InventoryItem, InvoiceTemplate, Account, IncomeRecord } from '../types';
import { CURRENCY, EyeIcon } from '../constants';
import { EnhancedTable, Column } from './common/EnhancedTable';
import IncomeRecordDetail from './common/IncomeRecordDetail';


const Income = () => {
    const { 
        getFormattedDate, 
        formatCurrency,
        services,
        inventory,
        invoiceTemplates,
        paymentMethods,
        addIncomeRecord,
        incomeRecords,
        clinicName,
        clinicAddress,
        clinicPhone,
    } = useAppContext();
    
    const [date, setDate] = useState(getFormattedDate());
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0] || '');
    const [paymentAccountId, setPaymentAccountId] = useState<number | null>(null);
    const [accountName, setAccountName] = useState('');
    const [isAccountSelectorOpen, setIsAccountSelectorOpen] = useState(false);
    const [description, setDescription] = useState('ثبت درآمد روزانه');
    const [lastRecord, setLastRecord] = useState<IncomeRecord | null>(null);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [viewingRecord, setViewingRecord] = useState<IncomeRecord | null>(null);


    const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.price, 0), [items]);

    const handleApplyTemplate = (templateId: string) => {
        if (!templateId) return;
        const template = invoiceTemplates.find(t => t.id === Number(templateId));
        if (!template) return;
        
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
        
        const newItem: InvoiceItem = {
            type: 'template',
            id: template.id,
            name: template.name,
            quantity: 1,
            price: templatePrice,
        };

        setItems(currentItems => [...currentItems, newItem]);
        setIsTemplateModalOpen(false);
    };
    
    const handleAddItem = (type: 'service' | 'inventory') => {
        let newItem: InvoiceItem | null = null;
        if(type === 'service'){
            const service = services[0];
            if(!service) return;
            newItem = { type: 'service', id: service.id, name: service.name, quantity: 1, price: service.tariffs['آزاد'] };
        } else {
            const invItem = inventory[0];
            if(!invItem) return;
             newItem = { type: 'inventory', id: invItem.id, name: invItem.name, quantity: 1, price: invItem.salePrice };
        }
        if(newItem) setItems([...items, newItem]);
    };

    const handleItemChange = (index: number, newId: number) => {
        const newItems = [...items];
        const currentItem = newItems[index];
        if (currentItem.type === 'service') {
            const service = services.find(s => s.id === newId);
            if(service){
                newItems[index] = { ...currentItem, id: service.id, name: service.name, price: service.tariffs['آزاد'] * currentItem.quantity };
            }
        } else if (currentItem.type === 'inventory') { // inventory
             const invItem = inventory.find(i => i.id === newId);
            if(invItem) {
                newItems[index] = { ...currentItem, id: invItem.id, name: invItem.name, price: invItem.salePrice * currentItem.quantity };
            }
        }
        setItems(newItems);
    };

    const handleQuantityChange = (index: number, quantity: number) => {
        const newItems = [...items];
        const currentItem = newItems[index];
        const unitPrice = currentItem.price / currentItem.quantity;
        newItems[index].quantity = quantity;
        newItems[index].price = unitPrice * quantity;
        setItems(newItems);
    };

    const handleRemoveItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const resetForm = () => {
        setItems([]);
        setPaymentMethod(paymentMethods[0] || '');
        setPaymentAccountId(null);
        setAccountName('');
        setDescription('ثبت درآمد روزانه');
    };
    
    const handleSave = () => {
        if (items.length === 0 || !paymentAccountId) {
            alert('لطفا حداقل یک آیتم و حساب واریز را مشخص کنید.');
            return;
        }
        const newRecord : Omit<IncomeRecord, 'id' | 'paymentId'> = { date, items, totalAmount, paymentMethod, paymentAccountId, description };
        addIncomeRecord(newRecord);
        setLastRecord({ ...newRecord, id: Date.now(), paymentId: 0 }); // Create a temporary record for printing
        resetForm();
        alert('درآمد با موفقیت ثبت شد.');
    };
    
    const handlePrint = () => {
        if (!lastRecord) return;
        const pageTitle = `رسید-درآمد-${lastRecord.date}`;
        (window as any).printContent(`income-receipt-${lastRecord.id}`, pageTitle);
    };
    
    const columns: Column<IncomeRecord>[] = [
        { header: 'تاریخ', accessor: 'date', sortKey: 'date' },
        { header: 'شرح', accessor: 'description' },
        { header: 'روش پرداخت', accessor: 'paymentMethod' },
        { header: `مبلغ کل (${CURRENCY})`, accessor: (item) => formatCurrency(item.totalAmount), sortKey: 'totalAmount' },
    ];
    
    const recordActions = (record: IncomeRecord) => (
        <button onClick={() => setViewingRecord(record)} className="btn btn-sm btn-secondary btn-icon" title="مشاهده و چاپ"><EyeIcon/></button>
    );


    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)]";

    return (
        <div>
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">ثبت درآمد مستقیم</h1>
                <button onClick={handlePrint} className="btn btn-secondary" disabled={!lastRecord}>
                    چاپ آخرین رسید
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[var(--bg-secondary)] p-6 rounded-lg shadow-sm">
                    <div className="space-y-4">
                         <div>
                            <label className={labelClasses}>تاریخ</label>
                            <JalaliDatePicker value={date} onChange={setDate} />
                        </div>

                        <fieldset className="border p-4 rounded-md border-[var(--border-secondary)]">
                            <legend className="text-sm font-medium px-2 text-[var(--text-secondary)]">آیتم‌های درآمد</legend>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {items.map((item, index) => {
                                    const isTemplate = item.type === 'template';
                                    const template = isTemplate ? invoiceTemplates.find(t => t.id === item.id) : null;
            
                                    return (
                                         <div key={index} className="p-2 border border-[var(--border-secondary)] rounded-md">
                                            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                                               {isTemplate ? (
                                                    <input type="text" value={item.name} className="form-input bg-[var(--bg-tertiary)]" readOnly />
                                               ) : (
                                                   <select value={item.id} onChange={e => handleItemChange(index, Number(e.target.value))} className="form-select flex-grow">
                                                     {item.type === 'service' ? 
                                                        services.map(s => <option key={s.id} value={s.id}>{s.name}</option>) :
                                                        inventory.map(i => <option key={i.id} value={i.id}>{i.name} (موجودی: {i.quantity})</option>)
                                                     }
                                                   </select>
                                               )}
                                               <input type="number" value={item.quantity} onChange={e => handleQuantityChange(index, Number(e.target.value))} min="1" className="form-input w-24" />
                                               <span className="w-32 text-center text-[var(--text-primary)] font-mono">{formatCurrency(item.price)}</span>
                                               <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 p-1 rounded-full hover:bg-red-900/50 font-bold text-xl">&times;</button>
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
                            <div className="flex space-x-2 space-x-reverse mt-3 border-t border-[var(--border-primary)] pt-3">
                                <button type="button" onClick={() => handleAddItem('service')} className="btn btn-sm btn-secondary">+ افزودن خدمت</button>
                                <button type="button" onClick={() => handleAddItem('inventory')} className="btn btn-sm btn-secondary">+ افزودن کالا</button>
                                <button type="button" onClick={() => setIsTemplateModalOpen(true)} className="btn btn-sm btn-secondary">+ افزودن پکیج</button>
                            </div>
                        </fieldset>
                    </div>
                </div>

                <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-sm">
                    <div className="space-y-4">
                        <div className="text-center">
                            <p className="text-lg text-[var(--text-secondary)]">مبلغ کل</p>
                            <p className="text-4xl font-bold text-[var(--text-primary)] font-mono">{formatCurrency(totalAmount)}</p>
                            <p className="text-lg text-[var(--text-secondary)]">{CURRENCY}</p>
                        </div>
                        <div>
                            <label className={labelClasses}>شرح</label>
                            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="form-input" />
                        </div>
                        <div>
                            <label className={labelClasses}>روش دریافت</label>
                            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="form-select">
                                {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>واریز به حساب</label>
                             <button type="button" onClick={() => setIsAccountSelectorOpen(true)} className="form-input text-right justify-start mt-1">
                                {accountName || 'انتخاب حساب...'}
                            </button>
                        </div>
                         <button onClick={handleSave} className="btn btn-primary w-full !mt-6 py-3">
                            ثبت نهایی درآمد
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">درآمدهای ثبت شده اخیر</h2>
                <EnhancedTable 
                    columns={columns} 
                    data={[...incomeRecords].reverse()} 
                    actions={recordActions} 
                    tableName="درآمدهای-ثبت-شده"
                />
            </div>
            
             <div className="hidden">
                {lastRecord && <IncomeRecordDetail record={lastRecord} />}
            </div>

            <EntitySelector 
                isOpen={isAccountSelectorOpen}
                onClose={() => setIsAccountSelectorOpen(false)}
                onSelect={(acc) => { setPaymentAccountId((acc as Account).id); setAccountName((acc as Account).name); setIsAccountSelectorOpen(false); }}
                accountTypes={['دارایی‌ها']}
            />
            
            {isTemplateModalOpen && (
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
            )}

            <Modal
                isOpen={!!viewingRecord}
                onClose={() => setViewingRecord(null)}
                title={`جزئیات رسید درآمد - ${viewingRecord?.date || ''}`}
            >
                {viewingRecord && <IncomeRecordDetail record={viewingRecord} />}
            </Modal>

        </div>
    );
};

export default Income;