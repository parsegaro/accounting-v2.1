import React from 'react';
import type { Payslip } from '../types';
import { useAppContext } from '../context/AppContext';
import { CURRENCY } from '../constants';

interface PayslipDetailProps {
  payslip: Payslip;
}

const PayslipDetail: React.FC<PayslipDetailProps> = ({ payslip }) => {
  const { formatCurrency, clinicName, clinicAddress, clinicPhone } = useAppContext();

  const handlePrint = () => {
    const pageTitle = `فیش-حقوقی-${payslip.employeeName.replace(/\s/g, '-')}-${payslip.payPeriod.replace(/\s/g, '-')}`;
    (window as any).printContent('payslip-content', pageTitle);
  };

  const DetailRow = ({ label, value }: { label: string, value: number }) => (
    <div className="flex justify-between py-1.5 border-b border-[var(--border-primary)]">
      <span>{label}:</span>
      <span className="font-mono">{formatCurrency(value)}</span>
    </div>
  );

  return (
    <div>
        <div id="payslip-content" className="space-y-4 text-sm">
             <div className="text-center mb-4">
                <h2 className="text-xl font-bold">فیش حقوقی</h2>
                <p>{clinicName}</p>
                <p className="text-xs text-[var(--text-secondary)]">{clinicAddress} - تلفن: {clinicPhone}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center p-2 bg-[var(--bg-tertiary)] rounded">
                <div>
                    <p className="font-semibold">{payslip.employeeName}</p>
                    <p className="text-xs text-[var(--text-secondary)]">کارمند</p>
                </div>
                <div>
                    <p className="font-semibold">{payslip.payPeriod}</p>
                    <p className="text-xs text-[var(--text-secondary)]">دوره حقوق</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Earnings */}
                <div className="space-y-1">
                    <h4 className="font-bold text-green-400 text-base border-b-2 border-green-800 pb-1 mb-2">درآمد و مزایا</h4>
                    <DetailRow label="حقوق پایه" value={payslip.baseSalary} />
                    {payslip.hoursWorked && <DetailRow label={`ساعات کار (${payslip.hoursWorked} ساعت)`} value={payslip.baseSalary} />}
                    <DetailRow label="حق مسکن" value={payslip.housingAllowance} />
                    <DetailRow label="حق اولاد" value={payslip.childAllowance} />
                    <DetailRow label="پورسانت" value={payslip.commissionTotal} />
                    <DetailRow label="سایر مزایا" value={payslip.otherAllowances} />
                    <div className="flex justify-between pt-2 font-bold text-base">
                      <span>جمع درآمد:</span>
                      <span className="font-mono">{formatCurrency(payslip.totalEarnings)}</span>
                    </div>
                </div>
                 {/* Deductions */}
                 <div className="space-y-1">
                    <h4 className="font-bold text-red-400 text-base border-b-2 border-red-800 pb-1 mb-2">کسورات</h4>
                    <DetailRow label="مالیات" value={payslip.taxDeduction} />
                    <DetailRow label="بیمه" value={payslip.insuranceDeduction} />
                    <DetailRow label="مساعده" value={payslip.advanceDeduction} />
                    <DetailRow label="سایر کسورات" value={payslip.otherDeductions} />
                    <div className="flex justify-between pt-2 font-bold text-base">
                      <span>جمع کسورات:</span>
                      <span className="font-mono">{formatCurrency(payslip.totalDeductions)}</span>
                    </div>
                </div>
            </div>

            <div className="text-center bg-blue-900/50 text-blue-300 p-3 rounded-md mt-4">
                <span className="font-bold text-lg">خالص قابل پرداخت: </span>
                <span className="font-bold text-xl font-mono">{formatCurrency(payslip.netPayable)} {CURRENCY}</span>
            </div>
        </div>
        <div className="flex justify-end pt-6 space-x-2 space-x-reverse print-hidden">
            <button onClick={handlePrint} className="btn btn-primary">چاپ فیش</button>
        </div>
    </div>
  );
};

export default PayslipDetail;