import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { EnhancedTable, Column } from './common/EnhancedTable';
import { Modal } from './common/Modal';
import { ConfirmationModal } from './common/ConfirmationModal';
import PatientFinancialProfile from './PatientFinancialProfile';
import JalaliDatePicker from './common/JalaliDatePicker';
import type { Patient } from '../types';
import { EyeIcon, PencilIcon, TrashIcon, CURRENCY } from '../constants';

export const PatientForm = ({ patient, onSave, onCancel }: { patient: Partial<Patient> | null, onSave: (patient: Omit<Patient, 'id'> | Patient) => void, onCancel: () => void }) => {
    const { insuranceCompanies } = useAppContext();
    const [formData, setFormData] = useState<Partial<Patient>>({});

    useEffect(() => {
        setFormData(patient || {});
    }, [patient]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        let { name, value } = e.target;
        if (name === 'nationalId' || name === 'phone' || name === 'bankAccountNumber' || name === 'iban') {
            value = value.replace(/\D/g, ''); // Allow only digits
            if (name === 'nationalId') {
                value = value.slice(0, 10); // Limit to 10 digits
            }
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = useCallback((date: string) => {
        setFormData(prev => ({ ...prev, birthDate: date }));
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Patient);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset className="border p-4 rounded-md border-[var(--border-secondary)]">
                <legend className="text-sm font-medium px-2 text-[var(--text-secondary)]">اطلاعات هویتی</legend>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-[var(--text-secondary)]">نام بیمار</label>
                        <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} className="form-input mt-1" required />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="nationalId" className="block text-sm font-medium text-[var(--text-secondary)]">کد ملی</label>
                            <input type="text" name="nationalId" id="nationalId" value={formData.nationalId || ''} onChange={handleChange} className="form-input mt-1" required pattern="\d{10}" title="کد ملی باید ۱۰ رقم باشد" />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-[var(--text-secondary)]">شماره تماس</label>
                            <input type="tel" name="phone" id="phone" value={formData.phone || ''} onChange={handleChange} className="form-input mt-1" required />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="birthDate" className="block text-sm font-medium text-[var(--text-secondary)]">تاریخ تولد</label>
                        <JalaliDatePicker value={formData.birthDate || ''} onChange={handleDateChange} />
                    </div>
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-[var(--text-secondary)]">آدرس</label>
                        <textarea name="address" id="address" value={formData.address || ''} onChange={handleChange} className="form-textarea mt-1" rows={2}/>
                    </div>
                </div>
            </fieldset>

            <fieldset className="border p-4 rounded-md border-[var(--border-secondary)]">
                <legend className="text-sm font-medium px-2 text-[var(--text-secondary)]">اطلاعات بیمه</legend>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="insuranceCompany" className="block text-sm font-medium text-[var(--text-secondary)]">نوع بیمه</label>
                        <select name="insuranceCompany" id="insuranceCompany" value={formData.insuranceCompany || 'آزاد'} onChange={handleChange} className="form-select mt-1" required>
                            <option value="آزاد">آزاد</option>
                            {insuranceCompanies.map(company => (
                                <option key={company.id} value={company.name}>{company.name}</option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="insuranceId" className="block text-sm font-medium text-[var(--text-secondary)]">شماره بیمه</label>
                        <input type="text" name="insuranceId" id="insuranceId" value={formData.insuranceId || ''} onChange={handleChange} className="form-input mt-1" />
                    </div>
                </div>
            </fieldset>

            <fieldset className="border p-4 rounded-md border-[var(--border-secondary)]">
                <legend className="text-sm font-medium px-2 text-[var(--text-secondary)]">اطلاعات مالی (اختیاری)</legend>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="bankAccountNumber" className="block text-sm font-medium text-[var(--text-secondary)]">شماره حساب</label>
                        <input type="text" name="bankAccountNumber" id="bankAccountNumber" value={formData.bankAccountNumber || ''} onChange={handleChange} className="form-input mt-1" />
                    </div>
                     <div>
                        <label htmlFor="iban" className="block text-sm font-medium text-[var(--text-secondary)]">شماره شبا (بدون IR)</label>
                        <input type="text" name="iban" id="iban" value={formData.iban || ''} onChange={handleChange} className="form-input mt-1" pattern="\d{24}" title="شماره شبا باید ۲۴ رقم باشد"/>
                    </div>
                </div>
            </fieldset>

            <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
                <button type="button" onClick={onCancel} className="btn btn-secondary">لغو</button>
                <button type="submit" className="btn btn-primary">ذخیره</button>
            </div>
        </form>
    )
}


const Patients = () => {
  const { patients, addPatient, updatePatient, deletePatient, payments, formatCurrency } = useAppContext();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  type PatientWithFinancials = Patient & { totalPaid: number; totalReceived: number; };
  
  const patientsWithFinancials = useMemo((): PatientWithFinancials[] => {
    return patients.map(patient => {
      const patientId = `patient-${patient.id}`;
      const relevantPayments = payments.filter(p => p.entityId === patientId);
      
      const totalPaid = relevantPayments
        .filter(p => p.type === 'پرداخت')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const totalReceived = relevantPayments
        .filter(p => p.type === 'دریافت')
        .reduce((sum, p) => sum + p.amount, 0);
        
      return { ...patient, totalPaid, totalReceived };
    });
  }, [patients, payments]);

  const columns: Column<PatientWithFinancials>[] = [
    { header: 'نام بیمار', accessor: 'name', sortKey: 'name' },
    { header: 'کد ملی', accessor: 'nationalId', sortKey: 'nationalId' },
    { header: 'شماره تماس', accessor: 'phone' },
    { header: 'نوع بیمه', accessor: 'insuranceCompany', sortKey: 'insuranceCompany' },
    { header: `مجموع دریافتی (${CURRENCY})`, accessor: (item) => formatCurrency(item.totalReceived), sortKey: 'totalReceived' },
  ];

  const handleOpenFormModal = (patient: Patient | null = null) => {
      setEditingPatient(patient);
      setIsFormModalOpen(true);
  }

  const handleOpenProfileModal = (patient: Patient) => {
      setSelectedPatient(patient);
      setIsProfileModalOpen(true);
  }
  
  const handleOpenConfirmModal = (patient: Patient) => {
      setSelectedPatient(patient);
      setIsConfirmModalOpen(true);
  }

  const resetModals = () => {
      setIsFormModalOpen(false);
      setIsProfileModalOpen(false);
      setIsConfirmModalOpen(false);
      setEditingPatient(null);
      setSelectedPatient(null);
  }

  const handleSavePatient = (patientData: Omit<Patient, 'id'> | Patient) => {
      if ('id' in patientData) {
          updatePatient(patientData);
      } else {
          addPatient(patientData);
      }
      resetModals();
  };

  const handleDelete = () => {
    if (selectedPatient) {
        deletePatient(selectedPatient.id);
    }
    resetModals();
  }
  
  const patientActions = (patient: Patient) => (
    <div className="flex space-x-2 space-x-reverse">
        <button onClick={() => handleOpenProfileModal(patient)} className="btn btn-sm btn-secondary btn-icon" title="مشاهده پرونده مالی"><EyeIcon/></button>
        <button onClick={() => handleOpenFormModal(patient)} className="btn btn-sm btn-secondary btn-icon" title="ویرایش"><PencilIcon/></button>
        <button onClick={() => handleOpenConfirmModal(patient)} className="btn btn-sm btn-danger btn-icon" title="حذف"><TrashIcon/></button>
    </div>
  );
  
  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">مدیریت بیماران</h1>
            <button onClick={() => handleOpenFormModal()} className="btn btn-primary">
                افزودن بیمار جدید
            </button>
        </div>
        <EnhancedTable<PatientWithFinancials> 
            columns={columns} 
            data={patientsWithFinancials} 
            actions={patientActions}
            tableName="لیست-بیماران"
            entityType="patient"
        />
        <Modal 
            isOpen={isFormModalOpen} 
            onClose={resetModals} 
            title={editingPatient ? 'ویرایش اطلاعات بیمار' : 'افزودن بیمار جدید'}
        >
            <PatientForm 
                patient={editingPatient}
                onSave={handleSavePatient}
                onCancel={resetModals}
            />
        </Modal>
        {selectedPatient && (
            <Modal
                isOpen={isProfileModalOpen}
                onClose={resetModals}
                title={`پرونده مالی: ${selectedPatient.name}`}
            >
                <PatientFinancialProfile patient={selectedPatient} />
            </Modal>
        )}
        {selectedPatient && (
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={resetModals}
                onConfirm={handleDelete}
                title="تایید حذف بیمار"
                message={`آیا از حذف بیمار «${selectedPatient.name}» اطمینان دارید؟ این عمل قابل بازگشت نیست.`}
            />
        )}
    </div>
  );
};

export default Patients;