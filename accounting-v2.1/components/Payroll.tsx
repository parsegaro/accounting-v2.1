
import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { EnhancedTable, Column } from './common/EnhancedTable';
import { Modal } from './common/Modal';
import { ConfirmationModal } from './common/ConfirmationModal';
import CurrencyInput from './common/CurrencyInput';
import PayslipDetail from './PayslipDetail';
import JalaliDatePicker from './common/JalaliDatePicker';
import EntitySelector from './common/EntitySelector';
import type { Payslip, Employee, Account } from '../types';
import { CURRENCY, EyeIcon, PencilIcon, TrashIcon } from '../constants';

const PayslipForm = ({ payslip, onSave, onCancel }: { payslip?: Payslip | null, onSave: (p: Omit<Payslip, 'id'> | Payslip) => void, onCancel: () => void }) => {
    const { employees, getFormattedDate, formatCurrency } = useAppContext();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
    const [formData, setFormData] = useState<Partial<Omit<Payslip, 'id'>>>({});
    
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)]";
    const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

    useEffect(() => {
        if (payslip) {
            setFormData(payslip);
            setSelectedEmployeeId(payslip.employeeId);
        } else {
            setSelectedEmployeeId('');
            setFormData({ date: getFormattedDate() });
        }
    }, [payslip, getFormattedDate]);


    useEffect(() => {
        if (!selectedEmployeeId || payslip) return;

        const employee = employees.find(e => e.id === selectedEmployeeId);
        if (employee) {
            const initialTax = employee.salaryType === 'monthly' ? (employee.baseSalary + employee.housingAllowance + employee.childAllowance) * (employee.taxRate / 100) : 0;
            setFormData(prev => ({
                ...prev,
                employeeId: employee.id,
                employeeName: employee.name,
                payPeriod: ``, // User should fill this
                baseSalary: employee.salaryType === 'monthly' ? employee.baseSalary : 0,
                hoursWorked: employee.salaryType === 'hourly' ? 0 : undefined,
                housingAllowance: employee.housingAllowance || 0,
                childAllowance: employee.childAllowance || 0,
                taxDeduction: initialTax,
                insuranceDeduction: employee.insuranceDeduction || 0,
                otherAllowances: 0,
                advanceDeduction: 0,
                otherDeductions: 0
            }));
        }
    }, [selectedEmployeeId, employees, payslip]);

    useEffect(() => {
        if (!formData.employeeId || !selectedEmployee) return;
        
        const currentBaseSalary = selectedEmployee.salaryType === 'hourly' 
            ? selectedEmployee.baseSalary * (formData.hoursWorked || 0)
            : formData.baseSalary || 0;

        const totalEarnings = currentBaseSalary + (formData.housingAllowance || 0) + (formData.childAllowance || 0) + (formData.otherAllowances || 0);
        const calculatedTax = totalEarnings * (selectedEmployee.taxRate / 100);
        const totalDeductions = calculatedTax + (formData.insuranceDeduction || 0) + (formData.advanceDeduction || 0) + (formData.otherDeductions || 0);
        const netPayable = totalEarnings - totalDeductions;
        
        setFormData(prev => ({ 
            ...prev,
            baseSalary: currentBaseSalary,
            totalEarnings,
            taxDeduction: calculatedTax,
            totalDeductions,
            netPayable
        }));
    }, [
        formData.baseSalary, formData.housingAllowance, formData.childAllowance, formData.otherAllowances,
        formData.insuranceDeduction, formData.advanceDeduction, formData.otherDeductions,
        formData.hoursWorked, selectedEmployee
    ]);

    const handleAmountChange = (field: keyof Omit<Payslip, 'id'>, value: number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleDateChange = useCallback((date: string) => {
        setFormData(prev => ({...prev, date}));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'hoursWorked' ? Number(value) : value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.employeeId) {
            alert("لطفا یک کارمند را انتخاب کنید.");
            return;
        }
        onSave(formData as Payslip);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className={labelClasses}>انتخاب کارمند</label>
                <select value={selectedEmployeeId} onChange={e => setSelectedEmployeeId(Number(e.target.value))} className="form-select mt-1" required disabled={!!payslip}>
                    <option value="" disabled>یک کارمند را انتخاب کنید...</option>
                    {employees.map(e => <option key={e.id} value={String(e.id)}>{e.name}</option>)}
                </select>
            </div>
            {selectedEmployeeId && (<>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="payPeriod" className={labelClasses}>دوره حقوق</label>
                        <input type="text" name="payPeriod" id="payPeriod" value={formData.payPeriod || ''} onChange={handleChange} className="form-input mt-1" required placeholder="مثلا: مرداد 1403"/>
                    </div>
                    <div>
                        <label className={labelClasses}>تاریخ صدور</label>
                        <JalaliDatePicker value={formData.date || ''} onChange={handleDateChange} />
                    </div>
                </div>
                 {selectedEmployee?.salaryType === 'hourly' && (
                    <div>
                        <label htmlFor="hoursWorked" className={labelClasses}>ساعات کارکرد (نرخ: {formatCurrency(selectedEmployee.baseSalary)}/ساعت)</label>
                        <input type="number" name="hoursWorked" id="hoursWorked" value={formData.hoursWorked || ''} onChange={handleChange} className="form-input mt-1" required />
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 border-t border-[var(--border-primary)] pt-4 mt-4">
                    <fieldset className="border p-4 rounded-md border-[var(--border-secondary)]">
                        <legend className="text-base font-semibold text-green-400 px-2">مزایا</legend>
                        <div className="space-y-3">
                             <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)]">حقوق پایه</label>
                                <CurrencyInput value={formData.baseSalary || 0} onValueChange={(v) => handleAmountChange('baseSalary', v)} />
                            </div>
                             <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)]">حق مسکن</label>
                                <CurrencyInput value={formData.housingAllowance || 0} onValueChange={(v) => handleAmountChange('housingAllowance', v)} />
                            </div>
                             <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)]">حق اولاد</label>
                                <CurrencyInput value={formData.childAllowance || 0} onValueChange={(v) => handleAmountChange('childAllowance', v)} />
                            </div>
                             <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)]">سایر مزایا</label>
                                <CurrencyInput value={formData.otherAllowances || 0} onValueChange={(v) => handleAmountChange('otherAllowances', v)} />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className="border p-4 rounded-md border-[var(--border-secondary)]">
                        <legend className="text-base font-semibold text-red-400 px-2">کسورات</legend>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)]">مالیات ({selectedEmployee?.taxRate || 0}%)</label>
                                <input type="text" value={formatCurrency(formData.taxDeduction || 0)} className="form-input bg-[var(--bg-tertiary)]" readOnly />
                            </div>
                             <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)]">بیمه</label>
                                <CurrencyInput value={formData.insuranceDeduction || 0} onValueChange={(v) => handleAmountChange('insuranceDeduction', v)} />
                            </div>
                             <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)]">مساعده</label>
                                <CurrencyInput value={formData.advanceDeduction || 0} onValueChange={(v) => handleAmountChange('advanceDeduction', v)} />
                            </div>
                             <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)]">سایر کسورات</label>
                                <CurrencyInput value={formData.otherDeductions || 0} onValueChange={(v) => handleAmountChange('otherDeductions', v)} />
                            </div>
                        </div>
                    </fieldset>
                </div>
            </>)}
            
            <div className="border-t border-[var(--border-primary)] pt-4 mt-4 grid grid-cols-1 sm:grid-cols-3 text-center gap-y-4 sm:gap-y-0">
                 <div>
                    <p className="text-sm text-[var(--text-secondary)]">جمع درآمد</p>
                    <p className="font-bold text-green-400 font-mono">{formatCurrency(formData.totalEarnings || 0)}</p>
                </div>
                <div>
                    <p className="text-sm text-[var(--text-secondary)]">جمع کسورات</p>
                    <p className="font-bold text-red-400 font-mono">{formatCurrency(formData.totalDeductions || 0)}</p>
                </div>
                 <div>
                    <p className="text-sm text-[var(--text-secondary)]">خالص پرداختی</p>
                    <p className="font-bold text-blue-400 font-mono">{formatCurrency(formData.netPayable || 0)}</p>
                </div>
            </div>

            <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
                <button type="button" onClick={onCancel} className="btn btn-secondary">لغو</button>
                <button type="submit" className="btn btn-primary">{payslip ? 'ذخیره تغییرات' : 'صدور فیش'}</button>
            </div>
        </form>
    );
};

const PayPayslipForm = ({ payslip, onConfirm, onCancel }: { payslip: Payslip, onConfirm: (payslipId: number, accountId: number, method: string) => void, onCancel: () => void }) => {
    const { paymentMethods, formatCurrency } = useAppContext();
    const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0] || '');
    const [accountId, setAccountId] = useState<number | null>(null);
    const [accountName, setAccountName] = useState('');
    const [isAccountSelectorOpen, setIsAccountSelectorOpen] = useState(false);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!accountId) {
             alert('لطفا حساب پرداخت را انتخاب کنید.');
             return;
        }
        onConfirm(payslip.id, accountId, paymentMethod);
    }
    
    return (
         <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-[var(--text-secondary)]">پرداخت حقوق دوره <span className="font-bold text-[var(--text-primary)]">"{payslip.payPeriod}"</span> به <span className="font-bold text-[var(--text-primary)]">{payslip.employeeName}</span> به مبلغ <span className="font-bold text-[var(--text-primary)]">{formatCurrency(payslip.netPayable)}</span> {CURRENCY}.</p>
            <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)]">روش پرداخت</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="form-select mt-1">
                    {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)]">پرداخت از حساب</label>
                <button type="button" onClick={() => setIsAccountSelectorOpen(true)} className="form-input text-right justify-start mt-1">
                    {accountName || 'انتخاب حساب...'}
                </button>
            </div>
            <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
                <button type="button" onClick={onCancel} className="btn btn-secondary">لغو</button>
                <button type="submit" className="btn btn-success">تایید پرداخت</button>
            </div>
            <EntitySelector 
                isOpen={isAccountSelectorOpen}
                onClose={() => setIsAccountSelectorOpen(false)}
                onSelect={(acc) => { setAccountId((acc as Account).id); setAccountName((acc as Account).name); setIsAccountSelectorOpen(false); }}
                accountTypes={['دارایی‌ها']}
            />
        </form>
    );
}

const Payroll: React.FC = () => {
    const { payslips, addPayslip, updatePayslip, deletePayslip, payPayslip, generateDueEmployeePayslips, formatCurrency } = useAppContext();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
    
    const handleGeneratePayslips = async () => {
        const count = await generateDueEmployeePayslips();
        if (count > 0) {
            alert(`${count} فیش حقوقی جدید با موفقیت صادر شد.`);
        } else {
            alert('هیچ کارمندی برای صدور فیش حقوقی در موعد مقرر یافت نشد.');
        }
    };
    
    const getStatusBadge = (status: Payslip['status']) => {
        switch (status) {
          case 'پرداخت شده': return <span className="badge badge-green">{status}</span>;
          case 'در انتظار پرداخت': return <span className="badge badge-yellow">{status}</span>;
          default: return <span className="badge badge-gray">{status}</span>;
        }
    };

    const columns: Column<Payslip>[] = [
        { header: 'کارمند', accessor: 'employeeName', sortKey: 'employeeName' },
        { header: 'دوره', accessor: 'payPeriod', sortKey: 'payPeriod' },
        { header: 'تاریخ صدور', accessor: 'date', sortKey: 'date' },
        { header: `خالص پرداختی (${CURRENCY})`, accessor: (item: Payslip) => formatCurrency(item.netPayable), sortKey: 'netPayable' },
        { header: 'وضعیت', accessor: item => getStatusBadge(item.status), sortKey: 'status' }
    ];

    const resetModals = () => {
        setIsFormModalOpen(false);
        setIsDetailModalOpen(false);
        setIsConfirmModalOpen(false);
        setIsPayModalOpen(false);
        setSelectedPayslip(null);
    };

    const handleOpenFormModal = (payslip: Payslip | null = null) => {
        setSelectedPayslip(payslip);
        setIsFormModalOpen(true);
    };

    const handleOpenDetailModal = (payslip: Payslip) => {
        setSelectedPayslip(payslip);
        setIsDetailModalOpen(true);
    };
    
    const handleOpenPayModal = (payslip: Payslip) => {
        setSelectedPayslip(payslip);
        setIsPayModalOpen(true);
    };

    const handleOpenConfirmModal = (payslip: Payslip) => {
        setSelectedPayslip(payslip);
        setIsConfirmModalOpen(true);
    };

    const handleSave = (data: Omit<Payslip, 'id'> | Payslip) => {
        if ('id' in data) {
            updatePayslip(data);
        } else {
            addPayslip(data);
        }
        resetModals();
    };
    
    const handleConfirmPayment = (payslipId: number, accountId: number, method: string) => {
        payPayslip(payslipId, accountId, method);
        resetModals();
    };

    const handleDelete = () => {
        if (selectedPayslip) {
            deletePayslip(selectedPayslip.id);
        }
        resetModals();
    };
    
    const actions = (payslip: Payslip) => (
        <div className="flex space-x-2 space-x-reverse">
            {payslip.status === 'در انتظار پرداخت' && (
                <button onClick={() => handleOpenPayModal(payslip)} className="btn btn-sm btn-success">پرداخت</button>
            )}
            <button onClick={() => handleOpenDetailModal(payslip)} className="btn btn-sm btn-secondary btn-icon" title="مشاهده"><EyeIcon/></button>
            <button onClick={() => handleOpenFormModal(payslip)} className="btn btn-sm btn-secondary btn-icon" title="ویرایش"><PencilIcon/></button>
            <button onClick={() => handleOpenConfirmModal(payslip)} className="btn btn-sm btn-danger btn-icon" title="حذف"><TrashIcon/></button>
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">حقوق و دستمزد</h1>
                <div className="flex space-x-2 space-x-reverse">
                    <button onClick={handleGeneratePayslips} className="btn btn-indigo">صدور خودکار فیش‌های سررسید شده</button>
                    <button onClick={() => handleOpenFormModal()} className="btn btn-primary">صدور فیش حقوقی جدید</button>
                </div>
            </div>
            <EnhancedTable<Payslip> 
                columns={columns} 
                data={payslips} 
                actions={actions}
                tableName="لیست-حقوق-و-دستمزد"
                enableDateFilter
                dateFilterKey="date"
            />
            <Modal
                isOpen={isFormModalOpen}
                onClose={resetModals}
                title={selectedPayslip ? 'ویرایش فیش حقوقی' : 'صدور فیش حقوقی'}
            >
                <PayslipForm
                    payslip={selectedPayslip}
                    onSave={handleSave}
                    onCancel={resetModals}
                />
            </Modal>
            {selectedPayslip && (
                <Modal
                    isOpen={isDetailModalOpen}
                    onClose={resetModals}
                    title={`فیش حقوقی: ${selectedPayslip.employeeName} - ${selectedPayslip.payPeriod}`}
                >
                    <PayslipDetail payslip={selectedPayslip} />
                </Modal>
            )}
            {selectedPayslip && (
                 <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={resetModals}
                    onConfirm={handleDelete}
                    title="تایید حذف فیش حقوقی"
                    message={`آیا از حذف فیش حقوقی برای «${selectedPayslip.employeeName}» مربوط به دوره «${selectedPayslip.payPeriod}» اطمینان دارید؟`}
                />
            )}
             {selectedPayslip && (
                <Modal
                    isOpen={isPayModalOpen}
                    onClose={resetModals}
                    title={`پرداخت حقوق: ${selectedPayslip.employeeName}`}
                >
                    <PayPayslipForm
                        payslip={selectedPayslip}
                        onConfirm={handleConfirmPayment}
                        onCancel={resetModals}
                    />
                </Modal>
            )}
        </div>
    );
};

export default Payroll;
