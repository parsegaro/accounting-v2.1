import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { useAppContext } from '../../context/AppContext';
import type { Account, Contact, ContactType, MainAccountType } from '../../types';

interface EntitySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (entity: Account | Contact) => void;
  accountTypes?: MainAccountType[];
  contactTypes?: (ContactType | 'custom')[];
}

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const MinusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>;

const TreeItem: React.FC<{ item: Account | Contact, onSelect: (item: Account | Contact) => void, level?: number }> = ({ item, onSelect, level = 0 }) => (
    <li
        onClick={() => onSelect(item)}
        className="py-2 px-2 hover:bg-[var(--bg-tertiary)] rounded-md cursor-pointer"
        style={{ marginRight: `${level * 1.5}rem` }}
    >
        {'code' in item && <span className="text-[var(--text-secondary)] ml-2 font-mono">{item.code}</span>}
        {item.name}
    </li>
);

const EntitySelector: React.FC<EntitySelectorProps> = ({ isOpen, onClose, onSelect, accountTypes, contactTypes }) => {
    const { chartOfAccounts, contacts, contactGroups } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]);
    };

    const handleSelect = (item: Account | Contact) => {
        onSelect(item);
        setSearchTerm('');
    };

    const renderAccountTree = (parentId: number | null = null) => {
        return chartOfAccounts
            .filter(acc => acc.parentId === parentId)
            .map(acc => {
                const children = chartOfAccounts.filter(child => child.parentId === acc.id);
                const groupId = `account-${acc.id}`;
                const isExpanded = expandedGroups.includes(groupId);
                const canSelect = children.length === 0;

                const handleNodeClick = (e: React.MouseEvent) => {
                    // Prevent click from propagating to parent if it's an expandable node
                    if (!canSelect) e.stopPropagation();
                    else handleSelect(acc);
                };

                return (
                    <React.Fragment key={acc.id}>
                        <div className="flex items-center py-1 px-2 hover:bg-[var(--bg-tertiary)] rounded-md">
                           {children.length > 0 && (
                             <button type="button" onClick={() => toggleGroup(groupId)} className="p-1">
                                {isExpanded ? <MinusIcon/> : <PlusIcon/>}
                             </button>
                           )}
                           <div className={`flex-grow ${children.length === 0 ? 'mr-5' : ''}`} onClick={handleNodeClick}>
                                <span className={`cursor-pointer ${!canSelect ? 'font-bold' : ''}`}>
                                    {acc.name}
                                </span>
                           </div>
                        </div>
                        {isExpanded && <ul className="mr-4">{renderAccountTree(acc.id)}</ul>}
                    </React.Fragment>
                );
            });
    };
    
    const filteredContacts = useMemo(() => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        return contacts.filter(con => {
             const typeMatch = contactTypes?.includes(con.type) || (contactTypes?.includes('custom') && !['patient', 'employee', 'supplier'].includes(con.type));
             const searchMatch = con.name.toLowerCase().includes(lowerCaseSearch);
             return typeMatch && searchMatch;
        });
    }, [searchTerm, contacts, contactTypes]);


    return (
        <Modal isOpen={isOpen} onClose={onClose} title="انتخاب حساب / شخص">
            <div className="p-2">
                <input
                    type="text"
                    placeholder="جستجو..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input mb-4"
                />
                <div className="max-h-96 overflow-y-auto">
                    {accountTypes && accountTypes.length > 0 && (
                        <div className="mb-4">
                            {renderAccountTree()}
                        </div>
                    )}
                    
                    {contactTypes && contactGroups.filter(g => {
                        const type = g.id.startsWith('custom') ? 'custom' : g.id.slice(0, -1);
                        return contactTypes.includes(type as ContactType);
                    }).map(group => {
                        const groupContacts = filteredContacts.filter(c => c.group === group.name);
                        if (groupContacts.length === 0) return null;
                        
                        const isExpanded = expandedGroups.includes(group.id);
                        return (
                             <div key={group.id} className="mb-2">
                                <div onClick={() => toggleGroup(group.id)} className="flex items-center py-2 px-2 bg-[var(--bg-tertiary)] rounded-md cursor-pointer border-b-2 border-[var(--border-primary)]">
                                   <button type="button" className="p-1">{isExpanded ? <MinusIcon/> : <PlusIcon/>}</button>
                                   <h4 className="font-semibold text-[var(--text-primary)] flex-grow">{group.name}</h4>
                                </div>
                                {isExpanded && (
                                    <ul className="mt-1 mr-2">
                                        {groupContacts.map(c => <TreeItem key={c.id} item={c} onSelect={handleSelect} level={1} />)}
                                    </ul>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </Modal>
    );
};

export default EntitySelector;