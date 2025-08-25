import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { CURRENCY } from '../../constants';
import type { Payment, Expense } from '../../types';

interface ContactFinancialProfileProps {
  contactId: string; // e.g., 'patient-1', 'employee-2'
  contactName: string;
}

const ContactFinancialProfile: React.FC<ContactFinancialProfileProps> = ({ contactId, contactName }) => {
  const { payments, expenses, invoices, formatCurrency } = useAppContext();

  const financialData = useMemo(() => {
    const relevantPayments = payments.filter(p => p.entityId === contactId);
    const relevantExpenses = expenses.filter(e => e.toEntityId === contactId);
    
    const contactType = contactId.split('-')[0];
    const rawId = parseInt(contactId.split('-')[1]);
    
    const relevantInvoices = contactType === 'patient' 
      ? invoices.filter(inv => inv.recipientName === contactName) // A loose match for non-patient invoices
      : [];

    const totalBilled = relevantInvoices.reduce((sum, inv) => sum + inv.patientShare, 0);
    const totalPaidTo = relevantPayments.filter(p => p.type === 'پرداخت').reduce((sum, p) => sum + p.amount, 0);
    const totalReceivedFrom = relevantPayments.filter(p => p.type === 'دریافت').reduce((sum, p) => sum + p.amount, 0);
    
    // Total expense is where this contact was the recipient of a payment/expense
    const totalExpenseAmount = relevantExpenses.reduce((sum, e) => sum + e.amount, 0);

    const balance = totalReceivedFrom - (totalPaidTo + totalExpenseAmount);

    return {
      payments: relevantPayments,
      expenses: relevantExpenses,
      invoices: relevantInvoices,
      totalBilled,
      totalPaidTo,
      totalReceivedFrom,
      balance,
    };
  }, [contactId, contactName, payments, expenses, invoices]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">مجموع پرداختی به شخص</p>
          <p className="text-xl font-bold text-red-400 font-mono">{formatCurrency(financialData.totalPaidTo)} {CURRENCY}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)]">مجموع دریافتی از شخص</p>
          <p className="text-xl font-bold text-green-400 font-mono">{formatCurrency(financialData.totalReceivedFrom)} {CURRENCY}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)]">مانده حساب</p>
          <p className={`text-xl font-bold font-mono ${financialData.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(financialData.balance)} {CURRENCY}
          </p>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-2 border-t border-[var(--border-primary)] pt-4">تاریخچه تراکنش‌ها (پرداخت/دریافت)</h4>
        <div className="max-h-48 overflow-y-auto rounded-md border border-[var(--border-primary)]">
             <table className="min-w-full divide-y divide-[var(--border-primary)]">
                <thead className="bg-[var(--bg-tertiary)] sticky top-0">
                    <tr>
                        <th className="px-4 py-2 text-right text-xs font-medium text-[var(--text-secondary)]">تاریخ</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-[var(--text-secondary)]">شرح</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-[var(--text-secondary)]">مبلغ</th>
                    </tr>
                </thead>
                <tbody className="bg-[var(--bg-secondary)] divide-y divide-[var(--border-primary)]">
                    {financialData.payments.length > 0 ? financialData.payments.map(p => (
                        <tr key={`pay-${p.id}`}>
                            <td className="px-4 py-2 text-sm text-[var(--text-primary)]">{p.date}</td>
                            <td className="px-4 py-2 text-sm text-[var(--text-primary)]">{p.description}</td>
                            <td className={`px-4 py-2 text-sm font-mono ${p.type === 'پرداخت' ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(p.amount)}</td>
                        </tr>
                    )) : <tr><td colSpan={3} className="p-4 text-center text-[var(--text-secondary)]">هیچ پرداختی یافت نشد.</td></tr>}
                </tbody>
            </table>
        </div>
      </div>
       <div>
        <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-2 border-t border-[var(--border-primary)] pt-4">تاریخچه هزینه‌ها</h4>
        <div className="max-h-48 overflow-y-auto rounded-md border border-[var(--border-primary)]">
             <table className="min-w-full divide-y divide-[var(--border-primary)]">
                <thead className="bg-[var(--bg-tertiary)] sticky top-0">
                    <tr>
                        <th className="px-4 py-2 text-right text-xs font-medium text-[var(--text-secondary)]">تاریخ</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-[var(--text-secondary)]">شرح</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-[var(--text-secondary)]">مبلغ</th>
                    </tr>
                </thead>
                <tbody className="bg-[var(--bg-secondary)] divide-y divide-[var(--border-primary)]">
                    {financialData.expenses.length > 0 ? financialData.expenses.map(e => (
                        <tr key={`exp-${e.id}`}>
                            <td className="px-4 py-2 text-sm text-[var(--text-primary)]">{e.date}</td>
                            <td className="px-4 py-2 text-sm text-[var(--text-primary)]">{e.description}</td>
                            <td className="px-4 py-2 text-sm font-mono text-red-400">{formatCurrency(e.amount)}</td>
                        </tr>
                    )) : <tr><td colSpan={3} className="p-4 text-center text-[var(--text-secondary)]">هیچ هزینه‌ای یافت نشد.</td></tr>}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default ContactFinancialProfile;
