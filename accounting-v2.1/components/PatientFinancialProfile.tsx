import React from 'react';
import { useAppContext } from '../context/AppContext';
import type { Patient, Invoice, Payment } from '../types';
import { CURRENCY } from '../constants';

interface PatientFinancialProfileProps {
  patient: Patient;
}

const getStatusBadge = (status: string) => {
    switch(status) {
        case 'پرداخت شده': return <span className="badge badge-green">{status}</span>;
        case 'در انتظار پرداخت': return <span className="badge badge-yellow">{status}</span>;
        case 'پرداخت ناقص': return <span className="badge badge-red">{status}</span>;
        default: return null;
    }
};

const PatientFinancialProfile: React.FC<PatientFinancialProfileProps> = ({ patient }) => {
  const { invoices, payments, formatCurrency } = useAppContext();

  const patientInvoices = invoices.filter(inv => inv.recipientName === patient.name);
  const patientPayments = payments.filter(p => p.entityId === `patient-${patient.id}`);

  const totalBilled = patientInvoices.reduce((sum, inv) => sum + inv.patientShare, 0);
  const totalPaid = patientPayments.reduce((sum, p) => sum + p.amount, 0);
  const outstandingBalance = totalBilled - totalPaid;

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">مجموع صورتحساب‌ها</p>
          <p className="text-xl font-bold text-[var(--text-primary)] font-mono">{formatCurrency(totalBilled)} {CURRENCY}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)]">مجموع پرداختی‌ها</p>
          <p className="text-xl font-bold text-green-400 font-mono">{formatCurrency(totalPaid)} {CURRENCY}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)]">مانده بدهی</p>
          <p className={`text-xl font-bold font-mono ${outstandingBalance > 0 ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
            {formatCurrency(outstandingBalance)} {CURRENCY}
          </p>
        </div>
      </div>

      {/* Invoice History */}
      <div>
        <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-2 border-t border-[var(--border-primary)] pt-4">تاریخچه فاکتورها</h4>
        <div className="max-h-48 overflow-y-auto rounded-md border border-[var(--border-primary)]">
            <table className="min-w-full divide-y divide-[var(--border-primary)]">
                <thead className="bg-[var(--bg-tertiary)] sticky top-0">
                    <tr>
                        <th className="px-4 py-2 text-right text-xs font-medium text-[var(--text-secondary)]">شماره</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-[var(--text-secondary)]">تاریخ</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-[var(--text-secondary)]">مبلغ (سهم بیمار)</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-[var(--text-secondary)]">وضعیت</th>
                    </tr>
                </thead>
                <tbody className="bg-[var(--bg-secondary)] divide-y divide-[var(--border-primary)]">
                    {patientInvoices.length > 0 ? patientInvoices.map(inv => (
                        <tr key={inv.id}>
                            <td className="px-4 py-2 text-sm text-[var(--text-primary)]">{inv.id}</td>
                            <td className="px-4 py-2 text-sm text-[var(--text-primary)]">{inv.date}</td>
                            <td className="px-4 py-2 text-sm text-[var(--text-primary)] font-mono">{formatCurrency(inv.patientShare)}</td>
                            <td className="px-4 py-2 text-sm text-[var(--text-primary)]">{getStatusBadge(inv.status)}</td>
                        </tr>
                    )) : <tr><td colSpan={4} className="p-4 text-center text-[var(--text-secondary)]">هیچ فاکتوری یافت نشد.</td></tr>}
                </tbody>
            </table>
        </div>
      </div>

      {/* Payment History */}
      <div>
        <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-2 border-t border-[var(--border-primary)] pt-4">تاریخچه پرداخت‌ها</h4>
        <div className="max-h-48 overflow-y-auto rounded-md border border-[var(--border-primary)]">
             <table className="min-w-full divide-y divide-[var(--border-primary)]">
                <thead className="bg-[var(--bg-tertiary)] sticky top-0">
                    <tr>
                        <th className="px-4 py-2 text-right text-xs font-medium text-[var(--text-secondary)]">تاریخ</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-[var(--text-secondary)]">مبلغ</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-[var(--text-secondary)]">روش</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-[var(--text-secondary)]">فاکتور مرتبط</th>
                    </tr>
                </thead>
                <tbody className="bg-[var(--bg-secondary)] divide-y divide-[var(--border-primary)]">
                    {patientPayments.length > 0 ? patientPayments.map(p => (
                        <tr key={p.id}>
                            <td className="px-4 py-2 text-sm text-[var(--text-primary)]">{p.date}</td>
                            <td className="px-4 py-2 text-sm text-[var(--text-primary)] font-mono">{formatCurrency(p.amount)}</td>
                            <td className="px-4 py-2 text-sm text-[var(--text-primary)]">{p.method}</td>
                            <td className="px-4 py-2 text-sm text-[var(--text-primary)]">{p.invoiceId || '-'}</td>
                        </tr>
                    )) : <tr><td colSpan={4} className="p-4 text-center text-[var(--text-secondary)]">هیچ پرداختی یافت نشد.</td></tr>}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default PatientFinancialProfile;