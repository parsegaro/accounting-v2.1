import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { EnhancedTable, Column } from '../common/EnhancedTable';
import { Modal } from '../common/Modal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import ContactFinancialProfile from '../common/ContactFinancialProfile';
import type { Patient, Employee, Supplier, ContactGroup, Doctor } from '../../types';
import { CURRENCY, EyeIcon, PencilIcon, TrashIcon } from '../../constants';

const SupplierForm = ({ supplier, onSave, onCancel }: { supplier: Partial<Supplier> | null, onSave: (s: Omit<Supplier, 'id'> | Supplier) => void, onCancel: () => void }) => {
    const [formData, setFormData] = useState<Partial<Supplier>>({});
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)]";
    
    useEffect(() => { setFormData(supplier || {}); }, [supplier]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value } = e.target;
        if (name === 'phone' || name === 'bankAccountNumber' || name === 'iban') {
            value = value.replace(/\D/g, '');
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData as Supplier); };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <fieldset className="border p-4 rounded-md border-[var(--border-secondary)]">
                <legend className="text-sm font-medium px-2 text-[var(--text-secondary)]">اطلاعات پایه</legend>
                 <div className="space-y-4">
                    <div>
                        <label className={labelClasses}>نام تامین‌کننده</label>
                        <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="form-input mt-1" required />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>فرد رابط</label>
                            <input type="text" name="contactPerson" value={formData.contactPerson || ''} onChange={handleChange} className="form-input mt-1" />
                        </div>
                        <div>
                            <label className={labelClasses}>شماره تماس</label>
                            <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className="form-input mt-1" />
                        </div>
                    </div>
                </div>
            </fieldset>

             <fieldset className="border p-4 rounded-md border-[var(--border-secondary)]">
                <legend className="text-sm font-medium px-2 text-[var(--text-secondary)]">اطلاعات مالی (اختیاری)</legend>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="bankAccountNumber" className={labelClasses}>شماره حساب</label>
                        <input type="text" name="bankAccountNumber" id="bankAccountNumber" value={formData.bankAccountNumber || ''} onChange={handleChange} className="form-input mt-1" />
                    </div>
                     <div>
                        <label htmlFor="iban" className={labelClasses}>شماره شبا (بدون IR)</label>
                        <input type="text" name="iban" id="iban" value={formData.iban || ''} onChange={handleChange} className="form-input mt-1" pattern="\d{24}" title="شماره شبا باید ۲۴ رقم باشد"/>
                    </div>
                </div>
            </fieldset>

            <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
                <button type="button" onClick={onCancel} className="btn btn-secondary">لغو</button>
                <button type="submit" className="btn btn-primary">ذخیره</button>
            </div>
        </form>
    );
};

type ContactWithFinancials = (Patient | Employee | Doctor | Supplier) & {
    totalPaid: number;
    totalReceived: number;
    contactId: string;
};

const Contacts: React.FC = () => {
    const { 
        patients, employees, suppliers, doctors, contactGroups, payments, formatCurrency,
        addSupplier, updateSupplier, deleteSupplier
    } = useAppContext();

    const [activeTabId, setActiveTabId] = useState<string>('patients');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<ContactWithFinancials | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    const dataWithFinancials = useMemo(() => {
        const augmentWithFinancials = (items: any[], type: string) => {
            return items.map(item => {
                const contactId = `${type}-${item.id}`;
                const relevantPayments = payments.filter(p => p.entityId === contactId);
                const totalPaid = relevantPayments.filter(p => p.type === 'پرداخت').reduce((sum, p) => sum + p.amount, 0);
                const totalReceived = relevantPayments.filter(p => p.type === 'دریافت').reduce((sum, p) => sum + p.amount, 0);
                return { ...item, totalPaid, totalReceived, contactId };
            });
        };

        return {
            patients: augmentWithFinancials(patients, 'patient'),
            employees: augmentWithFinancials(employees, 'employee'),
            doctors: augmentWithFinancials(doctors, 'doctor'),
            suppliers: augmentWithFinancials(suppliers, 'supplier'),
        };
    }, [patients, employees, doctors, suppliers, payments]);

    const handleOpenProfileModal = (contact: ContactWithFinancials) => {
        setSelectedContact(contact);
        setIsProfileModalOpen(true);
    };

    const financialColumns: Column<ContactWithFinancials>[] = [
        { header: `مجموع پرداختی (${CURRENCY})`, accessor: item => formatCurrency(item.totalPaid), sortKey: 'totalPaid' },
        { header: `مجموع دریافتی (${CURRENCY})`, accessor: item => formatCurrency(item.totalReceived), sortKey: 'totalReceived' },
    ];

    const tabs = useMemo(() => {
        const basePatientCols: Column<any>[] = [{header: 'نام', accessor: 'name', sortKey: 'name'}, {header: 'کدملی', accessor: 'nationalId', sortKey: 'nationalId'}];
        const baseEmployeeCols: Column<any>[] = [{header: 'نام', accessor: 'name', sortKey: 'name'}, {header: 'نقش', accessor: 'role', sortKey: 'role'}];
        const baseDoctorCols: Column<any>[] = [{header: 'نام', accessor: 'name', sortKey: 'name'}, {header: 'تخصص', accessor: 'specialty'}];
        const baseSupplierCols: Column<any>[] = [{header: 'نام', accessor: 'name', sortKey: 'name'}, {header: 'فرد رابط', accessor: 'contactPerson'}];
        
        const supplierActions = (s: Supplier) => (
            <div className="flex space-x-2 space-x-reverse">
                <button onClick={() => handleOpenProfileModal(dataWithFinancials.suppliers.find(i => i.id === s.id)!)} className="btn btn-sm btn-secondary btn-icon" title="مشاهده تاریخچه مالی"><EyeIcon /></button>
                <button onClick={() => { setSelectedSupplier(s); setIsModalOpen(true); }} className="btn btn-sm btn-secondary btn-icon" title="ویرایش"><PencilIcon /></button>
                <button onClick={() => { setSelectedSupplier(s); setIsConfirmModalOpen(true); }} className="btn btn-sm btn-danger btn-icon" title="حذف"><TrashIcon /></button>
            </div>
        );
        const genericActions = (item: ContactWithFinancials) => (
            <button onClick={() => handleOpenProfileModal(item)} className="btn btn-sm btn-secondary btn-icon" title="مشاهده تاریخچه مالی"><EyeIcon /></button>
        )

        const tabData: { [id: string]: { label: string; data: any[]; columns: Column<any>[]; actions?: (item: any) => React.ReactNode; tableName: string; isCustom: boolean; entityType?: string; } } = {
            patients: { label: 'بیماران', data: dataWithFinancials.patients, tableName: 'بیماران', columns: [...basePatientCols, ...financialColumns], actions: genericActions, isCustom: false, entityType: 'patient' },
            employees: { label: 'کارمندان', data: dataWithFinancials.employees, tableName: 'کارمندان', columns: [...baseEmployeeCols, ...financialColumns], actions: genericActions, isCustom: false, entityType: 'employee' },
            doctors: { label: 'پزشکان', data: dataWithFinancials.doctors, tableName: 'پزشکان', columns: [...baseDoctorCols, ...financialColumns], actions: genericActions, isCustom: false, entityType: 'doctor' },
            suppliers: { label: 'تامین‌کنندگان', data: dataWithFinancials.suppliers, tableName: 'تامین‌کنندگان', columns: [...baseSupplierCols, ...financialColumns], actions: supplierActions, isCustom: false, entityType: 'supplier' },
        };
        
        contactGroups.filter(g => !tabData[g.id]).forEach(g => {
            tabData[g.id] = { label: g.name, data: [], tableName: g.name, columns: [{header: 'نام', accessor: 'name'}], isCustom: true }
        });
        
        return tabData;
    }, [contactGroups, dataWithFinancials]);


    const resetModals = () => {
        setIsModalOpen(false);
        setIsConfirmModalOpen(false);
        setIsProfileModalOpen(false);
        setSelectedSupplier(null);
        setSelectedContact(null);
    };

    const handleSaveSupplier = (data: Omit<Supplier, 'id'> | Supplier) => {
        if ('id' in data) updateSupplier(data); else addSupplier(data);
        resetModals();
    };
    
    const handleDeleteSupplier = () => {
        if(selectedSupplier) deleteSupplier(selectedSupplier.id);
        resetModals();
    }
    
    const currentTab = tabs[activeTabId];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">مدیریت طرف حساب‌ها</h1>
                <div className="flex space-x-2 space-x-reverse">
                    {activeTabId === 'suppliers' && (
                        <button onClick={() => { setSelectedSupplier(null); setIsModalOpen(true); }} className="btn btn-primary">افزودن تامین‌کننده</button>
                    )}
                    {currentTab?.isCustom && (
                        <button className="btn btn-primary">افزودن به گروه {currentTab.label}</button>
                    )}
                </div>
            </div>
            
            <div className="border-b border-[var(--border-primary)]">
                <nav className="-mb-px flex space-x-4 space-x-reverse" aria-label="Tabs">
                    {Object.entries(tabs).map(([id, tab]) => (
                        <button
                            key={id}
                            onClick={() => setActiveTabId(id)}
                            className={`${activeTabId === id ? 'border-blue-500 text-blue-400' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)]'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-6">
                 {['patients', 'employees', 'doctors'].includes(activeTabId) && (
                    <div className="bg-blue-900/50 border-l-4 border-blue-500 text-blue-200 p-4 rounded-md mb-6" role="alert">
                        <p>برای مدیریت کامل {currentTab.label}، لطفا به صفحه اختصاصی آنها (<a href={`#/${activeTabId}`} className="font-semibold hover:underline">اینجا</a>) مراجعه کنید.</p>
                    </div>
                )}
                <EnhancedTable 
                    columns={currentTab.columns}
                    data={currentTab.data}
                    actions={currentTab.actions}
                    tableName={currentTab.tableName}
                    entityType={currentTab.entityType}
                />
            </div>
            <Modal isOpen={isModalOpen} onClose={resetModals} title={selectedSupplier ? 'ویرایش تامین‌کننده' : 'افزودن تامین‌کننده'}>
                <SupplierForm supplier={selectedSupplier} onSave={handleSaveSupplier} onCancel={resetModals} />
            </Modal>
             {selectedContact && (
                <Modal
                    isOpen={isProfileModalOpen}
                    onClose={resetModals}
                    title={`پرونده مالی: ${selectedContact.name}`}
                >
                    <ContactFinancialProfile contactId={selectedContact.contactId} contactName={selectedContact.name} />
                </Modal>
            )}
            {selectedSupplier && (
                <ConfirmationModal isOpen={isConfirmModalOpen} onClose={resetModals} onConfirm={handleDeleteSupplier} title="تایید حذف" message={`آیا از حذف «${selectedSupplier.name}» اطمینان دارید؟`} />
            )}
        </div>
    );
};

export default Contacts;