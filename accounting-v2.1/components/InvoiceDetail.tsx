import React from 'react';
import type { Invoice } from '../types';
import { useAppContext } from '../context/AppContext';
import { CURRENCY } from '../constants';

interface InvoiceDetailProps {
  invoice: Invoice;
}

const InvoiceDetail: React.FC<InvoiceDetailProps> = ({ invoice }) => {
  const { formatCurrency, clinicName, clinicAddress, clinicPhone, invoicePrefix, doctors } = useAppContext();
  const balanceDue = invoice.patientShare - invoice.paidAmount;

  const handlePrint = () => {
    const pageTitle = `صورتحساب-${invoice.recipientName.replace(/\s/g, '-')}`;
    (window as any).printContent('invoice-content', pageTitle);
  };


  return (
    <div>
      <div id="invoice-content" className="space-y-4 text-sm text-[var(--text-primary)]">
        <div className="text-center mb-4">
            <h2 className="text-xl font-bold">صورتحساب</h2>
            <p>{clinicName}</p>
            <p className="text-xs text-[var(--text-secondary)]">{clinicAddress} - تلفن: {clinicPhone}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border border-[var(--border-primary)] rounded-lg">
          <div>
            <p className="font-semibold">دریافت کننده:</p>
            <p>{invoice.recipientName}</p>
          </div>
          <div>
            <p className="font-semibold">تاریخ صدور:</p>
            <p>{invoice.date}</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">خدمات و کالاهای ارائه شده:</h4>
          <table className="min-w-full divide-y divide-[var(--border-primary)] border border-[var(--border-primary)] printable-table">
            <thead className="bg-[var(--bg-tertiary)]">
              <tr>
                <th className="px-4 py-2 text-right font-medium text-[var(--text-secondary)]">نوع</th>
                <th className="px-4 py-2 text-right font-medium text-[var(--text-secondary)]">شرح</th>
                <th className="px-4 py-2 text-center font-medium text-[var(--text-secondary)]">تعداد</th>
                <th className="px-4 py-2 text-left font-medium text-[var(--text-secondary)]">مبلغ ({CURRENCY})</th>
              </tr>
            </thead>
            <tbody className="bg-[var(--bg-secondary)] divide-y divide-[var(--border-primary)]">
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${item.type === 'service' ? 'bg-blue-900 text-blue-200' : 'bg-green-900 text-green-200'}`}>
                      {item.type === 'service' ? 'خدمت' : 'کالا'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {item.name}
                    {item.type === 'service' && item.doctorId && (
                      <div className="text-xs text-[var(--text-secondary)]">پزشک: {doctors.find(d => d.id === item.doctorId)?.name}</div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">{item.quantity}</td>
                  <td className="px-4 py-2 text-left font-mono">{formatCurrency(item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {invoice.attachments && invoice.attachments.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">فایل‌های ضمیمه:</h4>
            <ul className="list-disc list-inside">
              {invoice.attachments.map((file, index) => (
                <li key={index}>
                  <a href={file.dataUrl} download={file.name} className="text-blue-400 hover:underline">
                    {file.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t border-[var(--border-primary)] pt-4 mt-4 space-y-2">
          <div className="flex justify-between">
            <span>مبلغ کل:</span>
            <span className="font-semibold font-mono">{formatCurrency(invoice.totalAmount)} {CURRENCY}</span>
          </div>
          <div className="flex justify-between">
            <span>تخفیف:</span>
            <span className="font-mono">{formatCurrency(invoice.discount)} {CURRENCY}</span>
          </div>
           <div className="flex justify-between text-blue-400">
            <span>سهم بیمه:</span>
            <span className="font-mono">{formatCurrency(invoice.insuranceShare)} {CURRENCY}</span>
          </div>
          <hr className="my-1 border-[var(--border-secondary)]"/>
          <div className="flex justify-between text-lg font-bold">
            <span>قابل پرداخت:</span>
            <span className="font-mono">{formatCurrency(invoice.patientShare)} {CURRENCY}</span>
          </div>
          <div className="flex justify-between text-green-400">
            <span>پرداخت شده:</span>
            <span className="font-mono">{formatCurrency(invoice.paidAmount)} {CURRENCY}</span>
          </div>
          <div className={`flex justify-between font-bold ${balanceDue > 0 ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
            <span>مانده:</span>
            <span className="font-mono">{formatCurrency(balanceDue)} {CURRENCY}</span>
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

export default InvoiceDetail;