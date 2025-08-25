import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { EnhancedTable, Column } from './common/EnhancedTable';
import { Modal } from './common/Modal';
import { ConfirmationModal } from './common/ConfirmationModal';
import ContactFinancialProfile from './common/ContactFinancialProfile';
import type { Doctor } from '../types';
import { CURRENCY, EyeIcon, PencilIcon, TrashIcon } from '../constants';

const DoctorForm = ({ doctor, onSave, onCancel }: { doctor: Partial<Doctor> | null, onSave: (data: Omit<Doctor, 'id'> | Doctor) => void, onCancel: () => void }) => {
    const [formData, setFormData] = useState<Partial<Doctor>>({});
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)]";

    useEffect(() => {
        setFormData(doctor || { name: '', specialty: '', taxRate: 10 });
    }, [doctor]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value } = e.target;
        if (name === 'phone' || name === 'bankAccountNumber' || name === 'iban' || name === 'taxRate') {
            value = value.replace(/\D/g, '');
        }
        setFormData(prev => ({ ...prev, [name]: name === 'taxRate' ? Number(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Doctor);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <fieldset className="border p-4 rounded-md border-[var(--border-secondary)]">
                <legend className="text-sm font-medium px-2 text-[var(--text-secondary)]">اطلاعات پایه</legend>
                 <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className={labelClasses}>نام پزشک</label>
                        <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} className="form-input mt-1" required />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="specialty" className={labelClasses}>تخصص</label>
                            <input type="text" name="specialty" id="specialty" value={formData.specialty || ''} onChange={handleChange} className="form-input mt-1" required />
                        </div>
                        <div>
                           <label htmlFor="phone" className={labelClasses}>شماره تماس</label>
                           <input type="tel" name="phone" id="phone" value={formData.phone || ''} onChange={handleChange} className="form-input mt-1" />
                       </div>
                    </div>
                </div>
            </fieldset>

             <fieldset className="border p-4 rounded-md border-[var(--border-secondary)]">
                <legend className="text-sm font-medium px-2 text-[var(--text-secondary)]">اطلاعات مالی</legend>
                 <div className="space-y-4">
                    <div>
                        <label htmlFor="taxRate" className={labelClasses}>درصد مالیات</label>
                        <div className="relative mt-1">
                            <input type="number" name="taxRate" id="taxRate" value={formData.taxRate ?? ''} onChange={handleChange} className="form-input pl-8" required min="0" max="100" />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-[var(--text-secondary)] sm:text-sm">%</span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="bankAccountNumber" className={labelClasses}>شماره حساب</label>
                            <input type="text" name="bankAccountNumber" id="bankAccountNumber" value={formData.bankAccountNumber || ''} onChange={handleChange} className="form-input mt-1" />
                        </div>
                         <div>
                            <label htmlFor="iban" className={labelClasses}>شماره شبا (بدون IR)</label>
                            <input type="text" name="iban" id="iban" value={formData.iban || ''} onChange={handleChange} className="form-input mt-1" pattern="\d{24}" title="شماره شبا باید ۲۴ رقم باشد"/>
                        </div>
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

const Doctors: React.FC = () => {
    const { doctors, addDoctor, updateDoctor, deleteDoctor, payments, formatCurrency } = useAppContext();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

    type DoctorWithFinancials = Doctor & { totalPaid: number; totalReceived: number; };

    const doctorsWithFinancials = useMemo((): DoctorWithFinancials[] => {
        return doctors.map(doc => {
          const contactId = `doctor-${doc.id}`;
          const relevantPayments = payments.filter(p => p.entityId === contactId);
          const totalPaid = relevantPayments.filter(p => p.type === 'پرداخت').reduce((sum, p) => sum + p.amount, 0);
          const totalReceived = relevantPayments.filter(p => p.type === 'دریافت').reduce((sum, p) => sum + p.amount, 0);
          return { ...doc, totalPaid, totalReceived };
        });
    }, [doctors, payments]);

    const columns: Column<DoctorWithFinancials>[] = [
        { header: 'نام پزشک', accessor: 'name', sortKey: 'name' },
        { header: 'تخصص', accessor: 'specialty', sortKey: 'specialty' },
        { header: 'درصد مالیات', accessor: (item) => `${item.taxRate}%`, sortKey: 'taxRate' },
        { header: `مجموع پرداختی (${CURRENCY})`, accessor: (item) => formatCurrency(item.totalPaid), sortKey: 'totalPaid' },
        { header: `مجموع دریافتی (${CURRENCY})`, accessor: (item) => formatCurrency(item.totalReceived), sortKey: 'totalReceived' },
    ];
    
    const resetModals = () => {
        setIsFormModalOpen(false);
        setIsConfirmModalOpen(false);
        setIsProfileModalOpen(false);
        setSelectedDoctor(null);
    };

    const handleOpenFormModal = (doctor: Doctor | null = null) => {
        setSelectedDoctor(doctor);
        setIsFormModalOpen(true);
    };

    const handleOpenProfileModal = (doctor: Doctor) => {
        setSelectedDoctor(doctor);
        setIsProfileModalOpen(true);
    };

    const handleOpenConfirmModal = (doctor: Doctor) => {
        setSelectedDoctor(doctor);
        setIsConfirmModalOpen(true);
    };

    const handleSave = (data: Omit<Doctor, 'id'> | Doctor) => {
        if ('id' in data) {
            updateDoctor(data as Doctor);
        } else {
            addDoctor(data as Omit<Doctor, 'id'>);
        }
        resetModals();
    };

    const handleDelete = () => {
        if (selectedDoctor) {
            deleteDoctor(selectedDoctor.id);
        }
        resetModals();
    };
    
    const actions = (doctor: Doctor) => (
        <div className="flex space-x-2 space-x-reverse">
             <button onClick={() => handleOpenProfileModal(doctor)} className="btn btn-sm btn-secondary btn-icon" title="مشاهده تاریخچه مالی"><EyeIcon/></button>
            <button onClick={() => handleOpenFormModal(doctor)} className="btn btn-sm btn-secondary btn-icon" title="ویرایش"><PencilIcon/></button>
            <button onClick={() => handleOpenConfirmModal(doctor)} className="btn btn-sm btn-danger btn-icon" title="حذف"><TrashIcon/></button>
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">مدیریت پزشکان</h1>
                <button onClick={() => handleOpenFormModal()} className="btn btn-primary">
                    افزودن پزشک جدید
                </button>
            </div>
            <EnhancedTable<DoctorWithFinancials> 
                columns={columns} 
                data={doctorsWithFinancials} 
                actions={actions}
                tableName="لیست-پزشکان"
                entityType="doctor"
            />
            <Modal
                isOpen={isFormModalOpen}
                onClose={resetModals}
                title={selectedDoctor ? 'ویرایش پزشک' : 'افزودن پزشک جدید'}
            >
                <DoctorForm
                    doctor={selectedDoctor}
                    onSave={handleSave}
                    onCancel={resetModals}
                />
            </Modal>
            {selectedDoctor && (
                <Modal
                    isOpen={isProfileModalOpen}
                    onClose={resetModals}
                    title={`پرونده مالی: ${selectedDoctor.name}`}
                >
                    <ContactFinancialProfile contactId={`doctor-${selectedDoctor.id}`} contactName={selectedDoctor.name} />
                </Modal>
            )}
            {selectedDoctor && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={resetModals}
                    onConfirm={handleDelete}
                    title="تایید حذف پزشک"
                    message={`آیا از حذف پزشک «${selectedDoctor.name}» اطمینان دارید؟`}
                />
            )}
        </div>
    );
};

export default Doctors;