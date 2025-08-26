import React, { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { Modal } from './common/Modal';
import { ConfirmationModal } from './common/ConfirmationModal';
import { EnhancedTable, Column } from './common/EnhancedTable';
import EntitySelector from './common/EntitySelector';
import JalaliDatePicker from './common/JalaliDatePicker';
import type { Document, Contact } from '../types';
import { PencilIcon, TrashIcon, EyeIcon } from '../constants';

const DocumentForm = ({ document, onSave, onCancel }: { document?: Partial<Document> | null, onSave: (doc: Omit<Document, 'id'>) => void, onCancel: () => void }) => {
    const { getFormattedDate, contacts } = useAppContext();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [entityId, setEntityId] = useState<string | undefined>(undefined);
    const [entityName, setEntityName] = useState('');
    const [file, setFile] = useState<{ name: string; dataUrl: string; type: string; } | null>(null);
    const [isEntitySelectorOpen, setIsEntitySelectorOpen] = useState(false);
    
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)]";

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setName(prev => prev || selectedFile.name.split('.').slice(0, -1).join('.'));
            const reader = new FileReader();
            reader.onload = (e) => {
                setFile({
                    name: selectedFile.name,
                    dataUrl: e.target?.result as string,
                    type: selectedFile.type,
                });
            };
            reader.readAsDataURL(selectedFile);
        }
    }, []);

    const handleSelectEntity = (contact: Contact) => {
        setEntityId(contact.id);
        setEntityName(contact.name);
        setIsEntitySelectorOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            alert('لطفا یک فایل را برای آپلود انتخاب کنید.');
            return;
        }
        onSave({
            name: name || file.name,
            description,
            uploadDate: getFormattedDate(),
            fileData: file.dataUrl,
            fileType: file.type,
            entityId,
            tags: []
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className={labelClasses}>انتخاب فایل</label>
                <input type="file" onChange={handleFileChange} className="form-input block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-900/50 file:text-blue-300 hover:file:bg-blue-900" required />
                {file && <p className="text-xs text-[var(--text-secondary)] mt-1">فایل انتخاب شده: {file.name}</p>}
            </div>
             <div>
                <label className={labelClasses}>نام یا عنوان سند</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="form-input" placeholder="در صورت خالی بودن، از نام فایل استفاده می‌شود."/>
            </div>
             <div>
                <label className={labelClasses}>توضیحات</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="form-textarea" />
            </div>
             <div>
                <label className={labelClasses}>اتصال به طرف حساب (اختیاری)</label>
                <button type="button" onClick={() => setIsEntitySelectorOpen(true)} className="form-input text-right justify-start mt-1">
                    {entityName || 'انتخاب شخص...'}
                </button>
            </div>

            <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
                <button type="button" onClick={onCancel} className="btn btn-secondary">لغو</button>
                <button type="submit" className="btn btn-primary">آپلود و ذخیره</button>
            </div>
            <EntitySelector isOpen={isEntitySelectorOpen} onClose={() => setIsEntitySelectorOpen(false)} onSelect={item => handleSelectEntity(item as Contact)} contactTypes={['patient', 'doctor', 'employee', 'supplier', 'custom']} />
        </form>
    )
};

const DocumentCenter = () => {
    const { documents, contacts, addDocument, deleteDocument } = useAppContext();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

    const columns: Column<Document>[] = [
        { header: 'نام سند', accessor: 'name', sortKey: 'name' },
        { header: 'تاریخ آپلود', accessor: 'uploadDate', sortKey: 'uploadDate' },
        { header: 'طرف حساب', accessor: item => contacts.find(c => c.id === item.entityId)?.name || '-', sortKey: 'entityId' },
        { header: 'نوع فایل', accessor: 'fileType' },
    ];
    
    const resetModals = () => {
        setIsFormModalOpen(false);
        setIsConfirmModalOpen(false);
        setSelectedDocument(null);
    }
    
    const handleSave = (doc: Omit<Document, 'id'>) => {
        addDocument(doc);
        resetModals();
    }
    
    const handleDelete = () => {
        if(selectedDocument) {
            deleteDocument(selectedDocument.id);
        }
        resetModals();
    }

    const actions = (doc: Document) => (
        <div className="flex space-x-2 space-x-reverse">
            <a href={doc.fileData} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary btn-icon" title="مشاهده/دانلود"><EyeIcon /></a>
            <button onClick={() => { setSelectedDocument(doc); setIsConfirmModalOpen(true); }} className="btn btn-sm btn-danger btn-icon" title="حذف"><TrashIcon /></button>
        </div>
    );
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">مرکز اسناد</h1>
                <button onClick={() => setIsFormModalOpen(true)} className="btn btn-primary">
                    آپلود سند جدید
                </button>
            </div>
             <EnhancedTable 
                columns={columns}
                data={documents}
                actions={actions}
                tableName="اسناد"
                entityType="document"
                enableDateFilter
                dateFilterKey="uploadDate"
            />
            <Modal isOpen={isFormModalOpen} onClose={resetModals} title="آپلود سند جدید">
                <DocumentForm onSave={handleSave} onCancel={resetModals} />
            </Modal>
            {selectedDocument && (
                <ConfirmationModal 
                    isOpen={isConfirmModalOpen}
                    onClose={resetModals}
                    onConfirm={handleDelete}
                    title="تایید حذف سند"
                    message={`آیا از حذف سند «${selectedDocument.name}» اطمینان دارید؟`}
                />
            )}
        </div>
    );
};

export default DocumentCenter;