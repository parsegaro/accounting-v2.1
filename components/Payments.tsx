import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { EnhancedTable, Column } from './common/EnhancedTable';
import { Modal } from './common/Modal';
import { ConfirmationModal } from './common/ConfirmationModal';
import TransactionForm from './Expenses';
import TagManager from './common/TagManager';
import { CURRENCY, PencilIcon, TrashIcon, TagIcon } from '../constants';
import type { Payment, Expense } from '../types';


export type UnifiedTransaction = {
    id: string; // Composite ID like 'p-1' or 'e-1'
    date: string;
    description: string;
    amount: number;
    type: 'درآمد' | 'هزینه';
    category: string;
    entityName?: string;
    originalId: number;
    originalType: 'payment' | 'expense';
    tags?: string[];
};


const Transactions = () => {
  const { payments, expenses, contacts, chartOfAccounts, formatCurrency, deletePayment, deleteExpense } = useAppContext();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<UnifiedTransaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<UnifiedTransaction | null>(null);
  const [taggedTransaction, setTaggedTransaction] = useState<UnifiedTransaction | null>(null);


  const unifiedTransactions = useMemo((): UnifiedTransaction[] => {
    const paymentTxs: UnifiedTransaction[] = payments.map(p => ({
        id: `p-${p.id}`,
        originalId: p.id,
        originalType: 'payment',
        date: p.date,
        description: p.description,
        amount: p.amount,
        type: p.type === 'دریافت' ? 'درآمد' : 'هزینه',
        category: p.type === 'دریافت' ? 'دریافت وجه' : `پرداخت: ${p.method}`,
        entityName: contacts.find(c => c.id === p.entityId)?.name || p.entityId,
        tags: p.tags,
    }));

    const expenseTxs: UnifiedTransaction[] = expenses.map(e => ({
        id: `e-${e.id}`,
        originalId: e.id,
        originalType: 'expense',
        date: e.date,
        description: e.description,
        amount: e.amount,
        type: 'هزینه',
        category: chartOfAccounts.find(a => a.id === e.expenseAccountId)?.name || 'هزینه',
        entityName: contacts.find(c => c.id === e.toEntityId)?.name || e.toEntityId,
        tags: e.tags,
    }));
    
    const allTxs = [...paymentTxs, ...expenseTxs];
    allTxs.sort((a, b) => {
        // Sort by date descending, then by ID descending as a tie-breaker
        const dateComparison = b.date.localeCompare(a.date);
        if (dateComparison !== 0) return dateComparison;
        return b.originalId - a.originalId;
    });
    return allTxs;

  }, [payments, expenses, chartOfAccounts, contacts]);

  const columns: Column<UnifiedTransaction>[] = [
    {
        header: 'نوع',
        accessor: (item) => item.type === 'درآمد' ? 
            <span className="badge badge-green">درآمد</span> : 
            <span className="badge badge-red">هزینه</span>,
        sortKey: 'type'
    },
    { header: 'تاریخ', accessor: 'date', sortKey: 'date' },
    { header: 'شرح', accessor: 'description', sortKey: 'description'},
    { header: 'دسته‌بندی', accessor: 'category', sortKey: 'category' },
    { header: 'طرف حساب', accessor: 'entityName', sortKey: 'entityName' },
    { header: `مبلغ (${CURRENCY})`, accessor: (item) => formatCurrency(item.amount), sortKey: 'amount' },
    { header: 'تگ‌ها', accessor: (item) => item.tags?.join(', ') || '-', searchable: false },
  ];

  const resetModals = () => {
      setIsFormModalOpen(false);
      setIsConfirmModalOpen(false);
      setEditingTransaction(null);
      setDeletingTransaction(null);
      setTaggedTransaction(null);
  }

  const handleOpenEditModal = (tx: UnifiedTransaction | null) => {
      setEditingTransaction(tx);
      setIsFormModalOpen(true);
  }
  
  const handleOpenDeleteModal = (tx: UnifiedTransaction) => {
      setDeletingTransaction(tx);
      setIsConfirmModalOpen(true);
  }
  
  const handleOpenTagModal = (tx: UnifiedTransaction) => {
      setTaggedTransaction(tx);
  }

  const handleConfirmDelete = () => {
    if (!deletingTransaction) return;
    if (deletingTransaction.originalType === 'payment') {
        deletePayment(deletingTransaction.originalId);
    } else {
        deleteExpense(deletingTransaction.originalId);
    }
    resetModals();
  }
  
  const transactionActions = (tx: UnifiedTransaction) => (
    <div className="flex space-x-2 space-x-reverse">
        <button onClick={() => handleOpenTagModal(tx)} className="btn btn-sm btn-secondary btn-icon" title="مدیریت تگ‌ها"><TagIcon/></button>
        <button onClick={() => handleOpenEditModal(tx)} className="btn btn-sm btn-secondary btn-icon" title="ویرایش"><PencilIcon/></button>
        <button onClick={() => handleOpenDeleteModal(tx)} className="btn btn-sm btn-danger btn-icon" title="حذف"><TrashIcon/></button>
    </div>
  );

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">تراکنش‌ها</h1>
            <button onClick={() => handleOpenEditModal(null)} className="btn btn-primary">
                ثبت تراکنش جدید
            </button>
        </div>
        <EnhancedTable<UnifiedTransaction> 
            columns={columns} 
            data={unifiedTransactions} 
            actions={transactionActions}
            tableName="تراکنش‌ها"
            enableDateFilter
            dateFilterKey="date"
        />
        <Modal
            isOpen={isFormModalOpen}
            onClose={resetModals}
            title={editingTransaction ? "ویرایش تراکنش" : "ثبت تراکنش جدید"}
        >
            <TransactionForm
                transactionToEdit={editingTransaction}
                onSave={resetModals}
                onCancel={resetModals}
            />
        </Modal>
        {deletingTransaction && (
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={resetModals}
                onConfirm={handleConfirmDelete}
                title="تایید حذف تراکنش"
                message={`آیا از حذف تراکنش «${deletingTransaction.description}» اطمینان دارید؟`}
            />
        )}
        {taggedTransaction && (
            <TagManager
                isOpen={!!taggedTransaction}
                onClose={resetModals}
                entityType={taggedTransaction.originalType}
                entityId={taggedTransaction.originalId}
                currentTags={taggedTransaction.tags || []}
            />
        )}
    </div>
  );
};

export default Transactions;