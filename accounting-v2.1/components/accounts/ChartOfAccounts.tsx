import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import type { Account, MainAccountType } from '../../types';

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const MinusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-2.036a2.5 2.5 0 11-3.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>;

const AccountForm = ({
  account,
  parent,
  onSave,
  onCancel,
}: {
  account?: Account | null;
  parent?: Account | null;
  onSave: (data: Omit<Account, 'id' | 'parentId' | 'type'> & { parentId: number | null, type: MainAccountType, id?: number }) => void;
  onCancel: () => void;
}) => {
  const { mainAccountTypes } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: parent?.type || mainAccountTypes[0],
  });

  useEffect(() => {
    if (account) {
      setFormData({ name: account.name, code: account.code, type: account.type });
    } else if (parent) {
      setFormData({ name: '', code: '', type: parent.type });
    }
  }, [account, parent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ 
        ...formData, 
        parentId: parent?.id || null, 
        id: account?.id 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)]">نام حساب</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="form-input mt-1"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)]">کد حساب</label>
        <input
          type="text"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          className="form-input mt-1"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)]">نوع حساب اصلی</label>
        <select
            value={formData.type}
            onChange={e => setFormData({...formData, type: e.target.value as MainAccountType})}
            className="form-select mt-1"
            disabled={!!parent}
        >
            {mainAccountTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>
      <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          لغو
        </button>
        <button type="submit" className="btn btn-primary">
          ذخیره
        </button>
      </div>
    </form>
  );
};

const ChartOfAccounts: React.FC = () => {
  const { chartOfAccounts, addAccount, updateAccount, getAccountBalanceWithChildren, formatCurrency } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [parentAccount, setParentAccount] = useState<Account | null>(null);
  const [expanded, setExpanded] = useState<number[]>(chartOfAccounts.filter(a => a.parentId === null).map(a => a.id));

  const toggleExpand = (id: number) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  
  const handleOpenModal = (accountToEdit: Account | null, parentForNew: Account | null) => {
    setEditingAccount(accountToEdit);
    setParentAccount(parentForNew);
    setIsModalOpen(true);
  }

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setEditingAccount(null);
      setParentAccount(null);
  }
  
  const handleSave = (data: Omit<Account, 'id' | 'parentId' | 'type'> & { parentId: number | null, type: MainAccountType, id?: number }) => {
    if(data.id) {
        updateAccount({id: data.id, name: data.name, code: data.code });
    } else {
        addAccount({ name: data.name, code: data.code, type: data.type, parentId: data.parentId });
    }
    handleCloseModal();
  }

  const renderTree = (parentId: number | null) => {
    const children = chartOfAccounts.filter(acc => acc.parentId === parentId);
    if (children.length === 0) return null;

    return (
      <ul className={parentId !== null ? '' : 'coa-tree'}>
        {children.map(account => {
          const isExpanded = expanded.includes(account.id);
          const hasChildren = chartOfAccounts.some(a => a.parentId === account.id);
          const balance = getAccountBalanceWithChildren(account.id);
          
          return (
            <li key={account.id}>
              <div className="flex items-center p-2 rounded-md hover:bg-[var(--bg-tertiary)] group">
                {hasChildren && (
                   <button onClick={() => toggleExpand(account.id)} className="ml-2 p-1">
                        {isExpanded ? <MinusIcon/> : <PlusIcon/>}
                   </button>
                )}
                <div className={`flex-1 ${!hasChildren ? 'mr-[2.125rem]' : ''}`}>
                    <span className="font-mono text-sm text-[var(--text-secondary)]">{account.code}</span> - <span className={`${hasChildren ? 'font-bold' : ''}`}>{account.name}</span>
                    {hasChildren && <span className="text-xs text-blue-400 mr-2 font-mono">({formatCurrency(balance)})</span>}
                </div>
                <div className="flex space-x-1 space-x-reverse opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(null, account)} className="btn btn-sm btn-icon btn-secondary" title="افزودن زیرمجموعه"><PlusIcon /></button>
                    <button onClick={() => handleOpenModal(account, null)} className="btn btn-sm btn-icon btn-secondary" title="ویرایش"><EditIcon /></button>
                </div>
              </div>
              {isExpanded && renderTree(account.id)}
            </li>
          );
        })}
      </ul>
    );
  };
  
  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">کدینگ حسابداری</h1>
            <button onClick={() => handleOpenModal(null, null)} className="btn btn-primary">
                افزودن حساب اصلی
            </button>
        </div>
        <div className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow-sm">
            {renderTree(null)}
        </div>

        <Modal 
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title={editingAccount ? `ویرایش حساب: ${editingAccount.name}` : parentAccount ? `افزودن زیرمجموعه به: ${parentAccount.name}` : 'افزودن حساب اصلی جدید'}
        >
            <AccountForm
                account={editingAccount}
                parent={parentAccount}
                onSave={handleSave}
                onCancel={handleCloseModal}
            />
        </Modal>
    </div>
  );
};

export default ChartOfAccounts;