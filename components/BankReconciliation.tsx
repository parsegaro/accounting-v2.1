import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { UnifiedTransaction } from './Payments';

type BankTransaction = {
    id: number;
    date: string;
    description: string;
    amount: number;
    type: 'debit' | 'credit';
    isMatched: boolean;
};

// A simple but slightly more robust CSV parser
const parseCSV = (text: string): { headers: string[], data: { [key: string]: string }[] } => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index]?.trim() || '';
            return obj;
        }, {} as { [key: string]: string });
    });
    return { headers, data };
}

const BankReconciliation = () => {
    const { payments, expenses, contacts, chartOfAccounts, formatCurrency } = useAppContext();
    
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvData, setCsvData] = useState<{ [key: string]: string }[]>([]);
    const [columnMap, setColumnMap] = useState({ date: '', description: '', amount: '', debit: '', credit: '' });
    const [amountType, setAmountType] = useState<'single' | 'double'>('single');
    const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
    const [errorMessage, setErrorMessage] = useState('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string;
                    const { headers, data } = parseCSV(text);
                    setCsvHeaders(headers);
                    setCsvData(data);
                    setErrorMessage('');
                    // Auto-detect common column names
                    const dateCol = headers.find(h => h.toLowerCase().includes('date') || h.toLowerCase().includes('تاریخ'));
                    const descCol = headers.find(h => h.toLowerCase().includes('description') || h.toLowerCase().includes('شرح'));
                    const amountCol = headers.find(h => h.toLowerCase().includes('amount') || h.toLowerCase().includes('مبلغ'));
                    const debitCol = headers.find(h => h.toLowerCase().includes('debit') || h.toLowerCase().includes('بدهکار'));
                    const creditCol = headers.find(h => h.toLowerCase().includes('credit') || h.toLowerCase().includes('بستانکار'));
                    setColumnMap({
                        date: dateCol || '',
                        description: descCol || '',
                        amount: amountCol || '',
                        debit: debitCol || '',
                        credit: creditCol || '',
                    });
                     if (debitCol && creditCol) setAmountType('double'); else setAmountType('single');

                } catch (err) {
                    setErrorMessage('خطا در پردازش فایل CSV. لطفا از فرمت صحیح اطمینان حاصل کنید.');
                    console.error(err);
                }
            };
            reader.readAsText(file, 'UTF-8');
        }
    };
    
    const handleProcessFile = () => {
        if (!columnMap.date || !columnMap.description || (amountType === 'single' && !columnMap.amount) || (amountType === 'double' && (!columnMap.debit || !columnMap.credit))) {
            setErrorMessage('لطفا تمام ستون‌های لازم را مشخص کنید.');
            return;
        }

        const processedTxs: BankTransaction[] = csvData.map((row, index) => {
            let amount = 0;
            let type: 'debit' | 'credit' = 'debit';
            if (amountType === 'single') {
                amount = parseFloat(row[columnMap.amount].replace(/[^0-9.-]+/g, ''));
                type = amount >= 0 ? 'credit' : 'debit';
            } else {
                const debit = parseFloat(row[columnMap.debit].replace(/[^0-9.-]+/g, '')) || 0;
                const credit = parseFloat(row[columnMap.credit].replace(/[^0-9.-]+/g, '')) || 0;
                amount = Math.max(debit, credit);
                type = credit > debit ? 'credit' : 'debit';
            }
            return {
                id: index,
                date: row[columnMap.date],
                description: row[columnMap.description],
                amount: Math.abs(amount),
                type,
                isMatched: false
            };
        }).filter(tx => !isNaN(tx.amount));
        
        setBankTransactions(processedTxs);
        setErrorMessage('');
    };
    
    const appTransactions: UnifiedTransaction[] = useMemo(() => {
        // This is a simplified version; in a real scenario, you'd filter this by date range
        const paymentTxs: UnifiedTransaction[] = payments.map(p => ({
            id: `p-${p.id}`, originalId: p.id, originalType: 'payment', date: p.date, description: p.description, amount: p.amount,
            type: p.type === 'دریافت' ? 'درآمد' : 'هزینه',
            category: 'پرداخت/دریافت', entityName: contacts.find(c => c.id === p.entityId)?.name || p.entityId,
            tags: p.tags
        }));
        const expenseTxs: UnifiedTransaction[] = expenses.map(e => ({
            id: `e-${e.id}`, originalId: e.id, originalType: 'expense', date: e.date, description: e.description, amount: e.amount,
            type: 'هزینه',
            category: chartOfAccounts.find(a => a.id === e.expenseAccountId)?.name || 'هزینه', entityName: contacts.find(c => c.id === e.toEntityId)?.name || e.toEntityId,
            tags: e.tags
        }));
        return [...paymentTxs, ...expenseTxs].sort((a,b) => b.date.localeCompare(a.date));
    }, [payments, expenses, contacts, chartOfAccounts]);


    return (
        <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-6">تطبیق حساب بانکی</h1>

            {bankTransactions.length === 0 ? (
                <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-2">مرحله ۱: بارگذاری صورتحساب بانکی</h2>
                    <p className="text-[var(--text-secondary)] mb-4">
                        فایل صورتحساب خود را با فرمت CSV از سایت بانک دریافت کرده و در اینجا بارگذاری کنید.
                    </p>
                    <input type="file" accept=".csv" onChange={handleFileChange} className="form-input block w-full max-w-md text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-900/50 file:text-blue-300 hover:file:bg-blue-900" />
                
                    {csvHeaders.length > 0 && (
                        <div className="mt-6 border-t border-[var(--border-primary)] pt-6">
                            <h2 className="text-xl font-semibold mb-2">مرحله ۲: نگاشت ستون‌ها</h2>
                             <p className="text-[var(--text-secondary)] mb-4">
                                برای اینکه نرم‌افزار بتواند فایل شما را درک کند، مشخص کنید هر ستون در فایل CSV شما مربوط به کدام بخش از اطلاعات تراکنش است.
                             </p>

                             <div className="space-y-4 max-w-2xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <label className="block">
                                        <span className="text-[var(--text-secondary)]">ستون تاریخ*</span>
                                        <select value={columnMap.date} onChange={e => setColumnMap(p => ({...p, date: e.target.value}))} className="form-select mt-1">
                                            <option value="" disabled>انتخاب کنید...</option>
                                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                     </label>
                                     <label className="block">
                                        <span className="text-[var(--text-secondary)]">ستون شرح*</span>
                                        <select value={columnMap.description} onChange={e => setColumnMap(p => ({...p, description: e.target.value}))} className="form-select mt-1">
                                             <option value="" disabled>انتخاب کنید...</option>
                                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                     </label>
                                </div>

                                <div>
                                    <span className="text-[var(--text-secondary)]">فرمت مبلغ*</span>
                                    <div className="flex space-x-4 space-x-reverse mt-2">
                                        <label className="flex items-center"><input type="radio" value="single" checked={amountType === 'single'} onChange={() => setAmountType('single')} className="form-radio" /><span className="mr-2">یک ستون مبلغ (مثبت/منفی)</span></label>
                                        <label className="flex items-center"><input type="radio" value="double" checked={amountType === 'double'} onChange={() => setAmountType('double')} className="form-radio" /><span className="mr-2">دو ستون بدهکار/بستانکار</span></label>
                                    </div>
                                </div>
                                
                                {amountType === 'single' ? (
                                    <label className="block">
                                        <span className="text-[var(--text-secondary)]">ستون مبلغ*</span>
                                        <select value={columnMap.amount} onChange={e => setColumnMap(p => ({...p, amount: e.target.value}))} className="form-select mt-1">
                                             <option value="" disabled>انتخاب کنید...</option>
                                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </label>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="block">
                                            <span className="text-[var(--text-secondary)]">ستون بدهکار (برداشت)*</span>
                                            <select value={columnMap.debit} onChange={e => setColumnMap(p => ({...p, debit: e.target.value}))} className="form-select mt-1">
                                                 <option value="" disabled>انتخاب کنید...</option>
                                                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        </label>
                                        <label className="block">
                                            <span className="text-[var(--text-secondary)]">ستون بستانکار (واریز)*</span>
                                            <select value={columnMap.credit} onChange={e => setColumnMap(p => ({...p, credit: e.target.value}))} className="form-select mt-1">
                                                 <option value="" disabled>انتخاب کنید...</option>
                                                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        </label>
                                    </div>
                                )}
                             </div>

                            <button onClick={handleProcessFile} className="btn btn-primary mt-6">پردازش و شروع تطبیق</button>
                        </div>
                    )}
                    {errorMessage && <p className="text-red-400 mt-4">{errorMessage}</p>}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-[var(--bg-secondary)] p-4 rounded-lg shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">تراکنش‌های صورتحساب بانک</h2>
                         <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                             {bankTransactions.map(tx => (
                                 <div key={tx.id} className="p-2 border border-[var(--border-primary)] rounded-md flex justify-between items-center">
                                     <div>
                                         <p className="font-semibold">{tx.description}</p>
                                         <p className="text-xs text-[var(--text-secondary)]">{tx.date}</p>
                                     </div>
                                     <p className={`font-mono font-semibold ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                                         {formatCurrency(tx.amount)}
                                     </p>
                                 </div>
                             ))}
                         </div>
                    </div>
                     <div className="bg-[var(--bg-secondary)] p-4 rounded-lg shadow-sm">
                         <h2 className="text-lg font-semibold mb-4">تراکنش‌های ثبت شده در نرم‌افزار</h2>
                           <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                             {appTransactions.map(tx => (
                                 <div key={tx.id} className="p-2 border border-[var(--border-primary)] rounded-md flex justify-between items-center">
                                     <div>
                                         <p className="font-semibold">{tx.description}</p>
                                         <p className="text-xs text-[var(--text-secondary)]">{tx.date} | {tx.entityName}</p>
                                     </div>
                                     <p className={`font-mono font-semibold ${tx.type === 'درآمد' ? 'text-green-400' : 'text-red-400'}`}>
                                         {formatCurrency(tx.amount)}
                                     </p>
                                 </div>
                             ))}
                         </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default BankReconciliation;
