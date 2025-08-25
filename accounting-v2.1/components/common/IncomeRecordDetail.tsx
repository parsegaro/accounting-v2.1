import React from 'react';
import type { IncomeRecord } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { CURRENCY } from '../../constants';

interface IncomeRecordDetailProps {
  record: IncomeRecord;
}

const IncomeRecordDetail: React.FC<IncomeRecordDetailProps> = ({ record }) => {
  const { formatCurrency, clinicName, clinicAddress, clinicPhone } = useAppContext();

  const handlePrint = () => {
    const pageTitle = `رسید-درآمد-${record.date}`;
    (window as any).printContent(`income-receipt-${record.id}`, pageTitle);
  };

  return (
    <div>
      <div id={`income-receipt-${record.id}`} className="space-y-4 text-sm text-[var(--text-primary)]">
        <div className="text-center mb-4">
            <h2 className="text-xl font-bold">رسید درآمد شماره {record.id}</h2>
            <p>{clinicName}</p>
            <p className="text-xs text-[var(--text-secondary)]">{clinicAddress} - تلفن: {clinicPhone}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border border-[var(--border-primary)] rounded-lg">
          <div>
            <p className="font-semibold">تاریخ:</p>
            <p>{record.date}</p>
          </div>
           <div>
            <p className="font-semibold">روش پرداخت:</p>
            <p>{record.paymentMethod}</p>
          </div>
        </div>
         <div>
            <p className="font-semibold">شرح:</p>
            <p>{record.description}</p>
          </div>

        <div>
          <h4 className="font-semibold mb-2">آیتم‌ها:</h4>
          <table className="min-w-full divide-y divide-[var(--border-primary)] border border-[var(--border-primary)] printable-table">
            <thead className="bg-[var(--bg-tertiary)]">
              <tr>
                <th className="px-4 py-2 text-right font-medium text-[var(--text-secondary)]">شرح</th>
                <th className="px-4 py-2 text-center font-medium text-[var(--text-secondary)]">تعداد</th>
                <th className="px-4 py-2 text-left font-medium text-[var(--text-secondary)]">مبلغ ({CURRENCY})</th>
              </tr>
            </thead>
            <tbody className="bg-[var(--bg-secondary)] divide-y divide-[var(--border-primary)]">
              {record.items.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2 text-center">{item.quantity}</td>
                  <td className="px-4 py-2 text-left font-mono">{formatCurrency(item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[var(--border-primary)] pt-4 mt-4 space-y-2">
          <div className="flex justify-end text-lg font-bold">
            <span>مبلغ کل:</span>
            <span className="font-mono mr-4">{formatCurrency(record.totalAmount)} {CURRENCY}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 print-hidden space-x-2 space-x-reverse">
        <button
          onClick={handlePrint}
          className="btn btn-primary"
        >
          چاپ
        </button>
      </div>
    </div>
  );
};

export default IncomeRecordDetail;