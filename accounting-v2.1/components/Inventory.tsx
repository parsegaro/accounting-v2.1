import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { EnhancedTable, Column } from './common/EnhancedTable';
import { Modal } from './common/Modal';
import { ConfirmationModal } from './common/ConfirmationModal';
import CurrencyInput from './common/CurrencyInput';
import type { InventoryItem } from '../types';
import { CURRENCY, PencilIcon, TrashIcon } from '../constants';

// Form for Adding/Editing an Inventory Item
const ItemForm = ({ item, onSave, onCancel }: { item: Partial<InventoryItem> | null, onSave: (data: Omit<InventoryItem, 'id'> | InventoryItem) => void, onCancel: () => void }) => {
    const [formData, setFormData] = useState<Partial<InventoryItem>>({});
    
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)]";
    const inputClasses = "form-input mt-1";


    useEffect(() => {
        setFormData(item || { name: '', quantity: 0, reorderPoint: 0, purchasePrice: 0, salePrice: 0 });
    }, [item]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'name' ? value : Number(value) }));
    };
    
    const handlePriceChange = (field: 'purchasePrice' | 'salePrice', value: number) => {
        setFormData(prev => ({...prev, [field]: value}));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as InventoryItem);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className={labelClasses}>نام کالا</label>
                <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} className={inputClasses} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="purchasePrice" className={labelClasses}>قیمت خرید ({CURRENCY})</label>
                    <CurrencyInput value={formData.purchasePrice || 0} onValueChange={(v) => handlePriceChange('purchasePrice', v)} />
                </div>
                 <div>
                    <label htmlFor="salePrice" className={labelClasses}>قیمت فروش ({CURRENCY})</label>
                    <CurrencyInput value={formData.salePrice || 0} onValueChange={(v) => handlePriceChange('salePrice', v)} />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="quantity" className={labelClasses}>تعداد اولیه</label>
                    <input type="number" name="quantity" id="quantity" value={formData.quantity === undefined ? '' : formData.quantity} onChange={handleChange} className={inputClasses} required disabled={!!item?.id} />
                </div>
                <div>
                    <label htmlFor="reorderPoint" className={labelClasses}>نقطه سفارش</label>
                    <input type="number" name="reorderPoint" id="reorderPoint" value={formData.reorderPoint  === undefined ? '' : formData.reorderPoint} onChange={handleChange} className={inputClasses} required />
                </div>
            </div>
            <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
                <button type="button" onClick={onCancel} className="btn btn-secondary">لغو</button>
                <button type="submit" className="btn btn-primary">ذخیره</button>
            </div>
        </form>
    );
};

// Form for Recording Stock In/Out Transactions
const TransactionForm = ({ item, onSave, onCancel }: { item: InventoryItem, onSave: (itemId: number, change: number, type: 'in' | 'out') => void, onCancel: () => void }) => {
    const [type, setType] = useState<'in' | 'out'>('out');
    const [quantity, setQuantity] = useState(1);
    
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)]";
    const inputClasses = "form-input mt-1";


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (quantity <= 0) {
            alert("تعداد باید بیشتر از صفر باشد.");
            return;
        }
        if (type === 'out' && quantity > item.quantity) {
            alert("تعداد خروجی نمی‌تواند بیشتر از موجودی انبار باشد.");
            return;
        }
        onSave(item.id, quantity, type);
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-[var(--text-primary)]">
            <h4 className="font-semibold text-lg">{item.name}</h4>
            <p>موجودی فعلی: <span className="font-bold">{item.quantity}</span></p>
            <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">نوع تراکنش</label>
                <div className="flex space-x-4 space-x-reverse">
                    <label className="flex items-center"><input type="radio" value="out" checked={type === 'out'} onChange={() => setType('out')} className="form-radio" /><span className="mr-2">خروج (حواله)</span></label>
                    <label className="flex items-center"><input type="radio" value="in" checked={type === 'in'} onChange={() => setType('in')} className="form-radio" /><span className="mr-2">ورود (رسید)</span></label>
                </div>
            </div>
            <div>
                <label htmlFor="quantity" className={labelClasses}>تعداد</label>
                <input type="number" id="quantity" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" className={inputClasses} required />
            </div>
             <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
                <button type="button" onClick={onCancel} className="btn btn-secondary">لغو</button>
                <button type="submit" className="btn btn-success">ثبت</button>
            </div>
        </form>
    )
}

const Inventory = () => {
  const { inventory, addInventoryItem, updateInventoryItem, updateInventoryQuantity, deleteInventoryItem, formatCurrency } = useAppContext();
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const columns: Column<InventoryItem>[] = [
    { header: 'نام کالا', accessor: 'name', sortKey: 'name' },
    { header: `قیمت خرید (${CURRENCY})`, accessor: (item) => formatCurrency(item.purchasePrice), sortKey: 'purchasePrice' },
    { header: `قیمت فروش (${CURRENCY})`, accessor: (item) => formatCurrency(item.salePrice), sortKey: 'salePrice' },
    { 
      header: 'تعداد موجودی', 
      accessor: (item: InventoryItem) => (
        <span className={item.quantity <= item.reorderPoint ? 'text-red-400 font-bold' : ''}>
          {item.quantity}
        </span>
      ),
      sortKey: 'quantity'
    },
    { header: 'نقطه سفارش', accessor: 'reorderPoint', sortKey: 'reorderPoint' },
  ];
  
  const handleOpenItemModal = (item: InventoryItem | null = null) => {
    setSelectedItem(item);
    setIsItemModalOpen(true);
  };

  const handleOpenTransactionModal = (item: InventoryItem) => {
      setSelectedItem(item);
      setIsTransactionModalOpen(true);
  }

  const handleOpenConfirmModal = (item: InventoryItem) => {
      setSelectedItem(item);
      setIsConfirmModalOpen(true);
  }

  const handleCloseModals = () => {
      setIsItemModalOpen(false);
      setIsTransactionModalOpen(false);
      setIsConfirmModalOpen(false);
      setSelectedItem(null);
  };

  const handleSaveItem = (data: Omit<InventoryItem, 'id'> | InventoryItem) => {
      if ('id' in data) {
          updateInventoryItem(data);
      } else {
          addInventoryItem(data);
      }
      handleCloseModals();
  };

  const handleSaveTransaction = (itemId: number, change: number, type: 'in' | 'out') => {
      updateInventoryQuantity(itemId, change, type);
      handleCloseModals();
  };

  const handleDelete = () => {
    if (selectedItem) {
        deleteInventoryItem(selectedItem.id);
    }
    handleCloseModals();
  }

  const inventoryActions = (item: InventoryItem) => (
    <div className="flex space-x-2 space-x-reverse">
      <button onClick={() => handleOpenTransactionModal(item)} className="btn btn-sm btn-success">ثبت ورود/خروج</button>
      <button onClick={() => handleOpenItemModal(item)} className="btn btn-sm btn-secondary btn-icon" title="ویرایش"><PencilIcon/></button>
      <button onClick={() => handleOpenConfirmModal(item)} className="btn btn-sm btn-danger btn-icon" title="حذف"><TrashIcon/></button>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">انبارداری (مواد مصرفی)</h1>
        <button onClick={() => handleOpenItemModal()} className="btn btn-primary">
          افزودن کالای جدید
        </button>
      </div>
      <EnhancedTable<InventoryItem> 
        columns={columns} 
        data={inventory} 
        actions={inventoryActions}
        tableName="موجودی-انبار"
      />

      <Modal 
        isOpen={isItemModalOpen} 
        onClose={handleCloseModals} 
        title={selectedItem ? 'ویرایش کالا' : 'افزودن کالای جدید'}
      >
        <ItemForm
            item={selectedItem}
            onSave={handleSaveItem}
            onCancel={handleCloseModals}
        />
      </Modal>

      {selectedItem && (
        <Modal
            isOpen={isTransactionModalOpen}
            onClose={handleCloseModals}
            title="ثبت تراکنش انبار"
        >
            <TransactionForm
                item={selectedItem}
                onSave={handleSaveTransaction}
                onCancel={handleCloseModals}
            />
        </Modal>
      )}

      {selectedItem && (
        <ConfirmationModal
            isOpen={isConfirmModalOpen}
            onClose={handleCloseModals}
            onConfirm={handleDelete}
            title="تایید حذف کالا"
            message={`آیا از حذف کالای «${selectedItem.name}» از انبار اطمینان دارید؟`}
        />
      )}
    </div>
  );
};

export default Inventory;