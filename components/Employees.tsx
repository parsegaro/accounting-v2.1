import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { EnhancedTable, Column } from './common/EnhancedTable';
import { Modal } from './common/Modal';
import { ConfirmationModal } from './common/ConfirmationModal';
import CurrencyInput from './common/CurrencyInput';
import ContactFinancialProfile from './common/ContactFinancialProfile';
import type { Employee } from '../types';
import { CURRENCY, PencilIcon, TrashIcon, EyeIcon } from '../constants';

const EmployeeForm = ({ employee, onSave, onCancel }: { employee: Partial<Employee> | null, onSave: (data: Omit<Employee, 'id'> | Employee) => void, onCancel: () => void }) => {
    const [formData, setFormData] = useState<Partial<Employee>>({});
    
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)]";

    useEffect(() => {
        setFormData(employee || { salaryType: 'monthly', baseSalary: 0, housingAllowance: 0, childAllowance: 0, taxRate: 10, insuranceDeduction: 0 });
    }, [employee]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        let { name, value } = e.target;
        if (name === 'phone' || name === 'bankAccountNumber' || name === 'iban' || name === 'taxRate') {
            value = value.replace(/\D/g, '');
        }
        setFormData(prev => ({ ...prev, [name]: name === 'taxRate' ? Number(value) : value }));
    };
    
    const handleAmountChange = (field: keyof Employee, value: number) => {
        setFormData(prev => ({...prev, [field]: value}));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.name || !formData.role) {
            alert("لطفا نام و نقش کارمند را وارد کنید.");
            return;
        }
        onSave(formData as Employee);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset className="border p-4 rounded-md border-[var(--border-secondary)]">
                <legend className="text-sm font-medium px-2 text-[var(--text-secondary)]">اطلاعات پایه</legend>
                <div className="space-y-4">
                     <div>
                        <label htmlFor="name" className={labelClasses}>نام و نام خانوادگی</label>
                        <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} className="form-input mt-1" required />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="role" className={labelClasses}>نقش / سمت</label>
                            <input type="text" name="role" id="role" value={formData.role || ''} onChange={handleChange} className="form-input mt-1" required />
                        </div>
                        <div>
                            <label htmlFor="phone" className={labelClasses}>شماره تماس</label>
                            <input type="tel" name="phone" id="phone" value={formData.phone || ''} onChange={handleChange} className="form-input mt-1" />
                        </div>
                    </div>
                </div>
            </fieldset>

            <fieldset className="border p-4 rounded-md border-[var(--border-secondary)]">
                 <legend className="text-sm font-medium px-2 text-[var(--text-secondary)]">اطلاعات حقوقی</legend>
                 <div className="space-y-4">
                    <div>
                        <label className={labelClasses}>نوع محاسبه حقوق</label>
                        <div className="flex space-x-4 space-x-reverse mt-2">
                             <label className="flex items-center">
                                <input type="radio" name="salaryType" value="monthly" checked={formData.salaryType === 'monthly'} onChange={handleChange} className="form-radio" />
                                <span className="mr-2">ماهانه ثابت</span>
                             </label>
                              <label className="flex items-center">
                                <input type="radio" name="salaryType" value="hourly" checked={formData.salaryType === 'hourly'} onChange={handleChange} className="form-radio" />
                                <span className="mr-2">ساعتی</span>
                             </label>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="baseSalary" className={labelClasses}>
                            {formData.salaryType === 'hourly' ? `نرخ ساعتی (${CURRENCY})` : `حقوق پایه ماهانه (${CURRENCY})`}
                        </label>
                        <CurrencyInput value={formData.baseSalary || 0} onValueChange={(v) => handleAmountChange('baseSalary', v)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>حق مسکن</label>
                            <CurrencyInput value={formData.housingAllowance || 0} onValueChange={(v) => handleAmountChange('housingAllowance', v)} />
                        </div>
                         <div>
                            <label className={labelClasses}>حق اولاد</label>
                            <CurrencyInput value={formData.childAllowance || 0} onValueChange={(v) => handleAmountChange('childAllowance', v)} />
                        </div>
                         <div>
                            <label htmlFor="taxRate" className={labelClasses}>درصد مالیات</label>
                            <div className="relative mt-1">
                                <input type="number" name="taxRate" id="taxRate" value={formData.taxRate ?? ''} onChange={handleChange} className="form-input pl-8" required min="0" max="100" />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-[var(--text-secondary)] sm:text-sm">%</span>
                                </div>
                            </div>
                        </div>
                         <div>
                            <label className={labelClasses}>بیمه (کسر ماهانه)</label>
                            <CurrencyInput value={formData.insuranceDeduction || 0} onValueChange={(v) => handleAmountChange('insuranceDeduction', v)} />
                        </div>
                    </div>
                 </div>
            </fieldset>
             <fieldset className="border p-4 rounded-md border-[var(--border-secondary)]">
                <legend className="text-sm font-medium px-2 text-[var(--text-secondary)]">اطلاعات مالی (اختیاری)</legend>
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
            </fieldset>
           
            <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
                <button type="button" onClick={onCancel} className="btn btn-secondary">لغو</button>
                <button type="submit" className="btn btn-primary">ذخیره</button>
            </div>
        </form>
    );
};


const Employees: React.FC = () => {
    const { employees, addEmployee, updateEmployee, deleteEmployee, formatCurrency, payments } = useAppContext();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    type EmployeeWithFinancials = Employee & { totalPaid: number; totalReceived: number; };

    const employeesWithFinancials = useMemo((): EmployeeWithFinancials[] => {
        return employees.map(emp => {
          const contactId = `employee-${emp.id}`;
          const relevantPayments = payments.filter(p => p.entityId === contactId);
          const totalPaid = relevantPayments.filter(p => p.type === 'پرداخت').reduce((sum, p) => sum + p.amount, 0);
          const totalReceived = relevantPayments.filter(p => p.type === 'دریافت').reduce((sum, p) => sum + p.amount, 0);
          return { ...emp, totalPaid, totalReceived };
        });
    }, [employees, payments]);


    const columns: Column<EmployeeWithFinancials>[] = [
        { header: 'نام کارمند', accessor: 'name', sortKey: 'name' },
        { header: 'نقش', accessor: 'role', sortKey: 'role' },
        { header: `حقوق پایه (${CURRENCY})`, accessor: (item: Employee) => formatCurrency(item.baseSalary), sortKey: 'baseSalary' },
        { header: `مجموع پرداختی (${CURRENCY})`, accessor: (item) => formatCurrency(item.totalPaid), sortKey: 'totalPaid' },
        { header: `مجموع دریافتی (${CURRENCY})`, accessor: (item) => formatCurrency(item.totalReceived), sortKey: 'totalReceived' },
    ];
    
    const resetModals = () => {
        setIsFormModalOpen(false);
        setIsConfirmModalOpen(false);
        setIsProfileModalOpen(false);
        setSelectedEmployee(null);
    };

    const handleOpenFormModal = (employee: Employee | null = null) => {
        setSelectedEmployee(employee);
        setIsFormModalOpen(true);
    };
    
    const handleOpenProfileModal = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsProfileModalOpen(true);
    };

    const handleOpenConfirmModal = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsConfirmModalOpen(true);
    };

    const handleSave = (data: Omit<Employee, 'id'> | Employee) => {
        if ('id' in data) {
            updateEmployee(data as Employee);
        } else {
            addEmployee(data as Omit<Employee, 'id'>);
        }
        resetModals();
    };

    const handleDelete = () => {
        if (selectedEmployee) {
            deleteEmployee(selectedEmployee.id);
        }
        resetModals();
    };
    
    const actions = (employee: Employee) => (
        <div className="flex space-x-2 space-x-reverse">
            <button onClick={() => handleOpenProfileModal(employee)} className="btn btn-sm btn-secondary btn-icon" title="مشاهده تاریخچه مالی"><EyeIcon/></button>
            <button onClick={() => handleOpenFormModal(employee)} className="btn btn-sm btn-secondary btn-icon" title="ویرایش"><PencilIcon/></button>
            <button onClick={() => handleOpenConfirmModal(employee)} className="btn btn-sm btn-danger btn-icon" title="حذف"><TrashIcon/></button>
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">مدیریت کارمندان</h1>
                <button onClick={() => handleOpenFormModal()} className="btn btn-primary">
                    افزودن کارمند جدید
                </button>
            </div>
            <EnhancedTable<EmployeeWithFinancials> 
                columns={columns} 
                data={employeesWithFinancials} 
                actions={actions}
                tableName="لیست-کارمندان"
                entityType="employee"
            />
            <Modal
                isOpen={isFormModalOpen}
                onClose={resetModals}
                title={selectedEmployee ? 'ویرایش کارمند' : 'افزودن کارمند جدید'}
            >
                <EmployeeForm
                    employee={selectedEmployee}
                    onSave={handleSave}
                    onCancel={resetModals}
                />
            </Modal>
             {selectedEmployee && (
                <Modal
                    isOpen={isProfileModalOpen}
                    onClose={resetModals}
                    title={`پرونده مالی: ${selectedEmployee.name}`}
                >
                    <ContactFinancialProfile contactId={`employee-${selectedEmployee.id}`} contactName={selectedEmployee.name} />
                </Modal>
            )}
            {selectedEmployee && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={resetModals}
                    onConfirm={handleDelete}
                    title="تایید حذف کارمند"
                    message={`آیا از حذف کارمند «${selectedEmployee.name}» اطمینان دارید؟`}
                />
            )}
        </div>
    );
};

export default Employees;