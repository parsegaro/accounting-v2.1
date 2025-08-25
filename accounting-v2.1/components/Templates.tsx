import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { EnhancedTable, Column } from './common/EnhancedTable';
import { Modal } from './common/Modal';
import { ConfirmationModal } from './common/ConfirmationModal';
import type { InvoiceTemplate, TemplateItem } from '../types';
import { CURRENCY, PencilIcon, TrashIcon } from '../constants';

const TemplateForm = ({ template, onSave, onCancel }: { template: Partial<InvoiceTemplate> | null, onSave: (data: Omit<InvoiceTemplate, 'id'> | InvoiceTemplate) => void, onCancel: () => void }) => {
    const { services, inventory } = useAppContext();
    const [name, setName] = useState('');
    const [items, setItems] = useState<TemplateItem[]>([]);
    
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)]";

    useEffect(() => {
        if (template) {
            setName(template.name || '');
            setItems(template.items || []);
        } else {
            setName('');
            setItems([]);
        }
    }, [template]);

    const handleAddItem = (type: 'service' | 'inventory') => {
        const firstItemId = type === 'service' ? services[0]?.id : inventory[0]?.id;
        if (firstItemId) {
            setItems([...items, { type, id: firstItemId, quantity: 1 }]);
        }
    };
    
    const handleItemChange = (index: number, id: number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], id };
        setItems(newItems);
    };

    const handleQuantityChange = (index: number, quantity: number) => {
        const newItems = [...items];
        newItems[index].quantity = quantity;
        setItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!name || items.length === 0) {
            alert("لطفا نام قالب و حداقل یک آیتم را مشخص کنید.");
            return;
        }
        const data = { name, items };
        if (template && 'id' in template) {
            onSave({ ...template, ...data, id: template.id! });
        } else {
            onSave(data);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className={labelClasses}>نام قالب</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="form-input" required />
            </div>
            <div>
                <h3 className="text-lg font-medium text-[var(--text-primary)] border-t border-[var(--border-primary)] pt-4 mt-4">آیتم‌های موجود در قالب</h3>
                {items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 space-x-reverse mt-2 p-2 border border-[var(--border-secondary)] rounded-md">
                       <span className={`px-2 py-1 rounded-full text-xs ${item.type === 'service' ? 'bg-blue-900 text-blue-200' : 'bg-green-900 text-green-200'}`}>{item.type === 'service' ? 'خدمت' : 'کالا'}</span>
                       <select value={item.id} onChange={e => handleItemChange(index, Number(e.target.value))} className="form-select flex-grow" required>
                            {item.type === 'service' ? 
                                services.map(s => <option key={s.id} value={s.id}>{s.name}</option>) :
                                inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)
                            }
                       </select>
                       <input type="number" value={item.quantity} onChange={e => handleQuantityChange(index, Number(e.target.value))} min="1" className="form-input w-24" />
                       <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 p-1 rounded-full hover:bg-red-900/50 font-bold text-xl">&times;</button>
                    </div>
                ))}
                <div className="flex space-x-2 space-x-reverse mt-2">
                    <button type="button" onClick={() => handleAddItem('service')} className="btn btn-sm btn-secondary">+ افزودن خدمت</button>
                    <button type="button" onClick={() => handleAddItem('inventory')} className="btn btn-sm btn-secondary">+ افزودن کالا</button>
                </div>
            </div>
             <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
                <button type="button" onClick={onCancel} className="btn btn-secondary">لغو</button>
                <button type="submit" className="btn btn-primary">ذخیره قالب</button>
            </div>
        </form>
    );
}

const Templates: React.FC = () => {
    const { invoiceTemplates, services, inventory, addInvoiceTemplate, updateInvoiceTemplate, deleteInvoiceTemplate, formatCurrency } = useAppContext();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);

    const templateDetails = useMemo(() => {
        return invoiceTemplates.map(template => {
            let totalPrice = 0;
            const itemsWithDetails = template.items.map(item => {
                if (item.type === 'service') {
                    const service = services.find(s => s.id === item.id);
                    if (service) {
                        const price = (service.tariffs['آزاد'] || 0) * item.quantity;
                        totalPrice += price;
                        return { name: service.name, quantity: item.quantity };
                    }
                } else {
                    const invItem = inventory.find(i => i.id === item.id);
                    if (invItem) {
                        const price = invItem.salePrice * item.quantity;
                        totalPrice += price;
                        return { name: invItem.name, quantity: item.quantity };
                    }
                }
                return null;
            }).filter(Boolean);

            return {
                ...template,
                itemsWithDetails,
                totalPrice,
            };
        });
    }, [invoiceTemplates, services, inventory]);


    const columns: Column<typeof templateDetails[0]>[] = [
        { header: 'نام قالب', accessor: 'name', sortKey: 'name' },
        { 
            header: 'محتویات',
            accessor: (item) => (
                <ul className="list-disc list-inside text-xs space-y-1">
                    {item.itemsWithDetails.map((detail, index) => (
                        <li key={index}>{detail?.name} (x{detail?.quantity})</li>
                    ))}
                </ul>
            )
        },
        {
            header: `قیمت کل (آزاد) (${CURRENCY})`,
            accessor: (item) => formatCurrency(item.totalPrice),
            sortKey: 'totalPrice'
        }
    ];
    
     const resetModals = () => {
        setIsFormModalOpen(false);
        setIsConfirmModalOpen(false);
        setSelectedTemplate(null);
    };

    const handleOpenFormModal = (template: InvoiceTemplate | null = null) => {
        setSelectedTemplate(template);
        setIsFormModalOpen(true);
    };

    const handleOpenConfirmModal = (template: InvoiceTemplate) => {
        setSelectedTemplate(template);
        setIsConfirmModalOpen(true);
    };

    const handleSave = (data: Omit<InvoiceTemplate, 'id'> | InvoiceTemplate) => {
        if ('id' in data) {
            updateInvoiceTemplate(data as InvoiceTemplate);
        } else {
            addInvoiceTemplate(data as Omit<InvoiceTemplate, 'id'>);
        }
        resetModals();
    };

    const handleDelete = () => {
        if (selectedTemplate) {
            deleteInvoiceTemplate(selectedTemplate.id);
        }
        resetModals();
    };
    
    const actions = (template: InvoiceTemplate) => (
        <div className="flex space-x-2 space-x-reverse">
            <button onClick={() => handleOpenFormModal(template)} className="btn btn-sm btn-secondary btn-icon" title="ویرایش"><PencilIcon/></button>
            <button onClick={() => handleOpenConfirmModal(template)} className="btn btn-sm btn-danger btn-icon" title="حذف"><TrashIcon/></button>
        </div>
    );
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">قالب‌های آماده فاکتور</h1>
                <button onClick={() => handleOpenFormModal()} className="btn btn-primary">
                    ایجاد قالب جدید
                </button>
            </div>
            <EnhancedTable 
                columns={columns} 
                data={templateDetails} 
                actions={actions}
                tableName="قالب‌های-فاکتور"
             />
            <Modal
                isOpen={isFormModalOpen}
                onClose={resetModals}
                title={selectedTemplate ? 'ویرایش قالب' : 'ایجاد قالب جدید'}
            >
                <TemplateForm
                    template={selectedTemplate}
                    onSave={handleSave}
                    onCancel={resetModals}
                />
            </Modal>
             {selectedTemplate && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={resetModals}
                    onConfirm={handleDelete}
                    title="تایید حذف قالب"
                    message={`آیا از حذف قالب «${selectedTemplate.name}» اطمینان دارید؟`}
                />
            )}
        </div>
    );
};

export default Templates;