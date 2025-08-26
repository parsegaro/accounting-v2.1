import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { EnhancedTable, Column } from './common/EnhancedTable';
import type { LedgerEntry, Invoice, Service, InventoryItem, Expense, Doctor, InvoiceItem, Contact, Account } from '../../types';
import { CURRENCY } from '../constants';
import JalaliDatePicker from './common/JalaliDatePicker';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// A robust function to convert 'YYYY/MM/DD' Jalali strings to a sortable number.
// Handles potential malformed strings gracefully to prevent crashes.
const toSortableJalali = (dateStr: string): number => {
    if (!dateStr || typeof dateStr !== 'string') {
        return 0; // Return 0 for invalid input
    }
    const parts = dateStr.split('/');
    if (parts.length !== 3) {
        return 0; // Expects exactly 3 parts
    }
    // Ensure parts are numeric before creating the sortable string
    if (isNaN(parseInt(parts[0])) || isNaN(parseInt(parts[1])) || isNaN(parseInt(parts[2]))) {
        return 0;
    }
    const [y, m, d] = parts;
    const sortableString = `${y}${m.padStart(2, '0')}${d.padStart(2, '0')}`;
    const num = parseInt(sortableString, 10);
    
    // Final check to ensure we are not returning NaN, which can break sort/filter
    return isNaN(num) ? 0 : num;
};

const getStartDateOfMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(firstDay);
}

const FilterDropdown = ({ label, value, onChange, options, defaultOption }: { label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: { value: string, label: string }[], defaultOption: string }) => (
    <div>
        <label className="text-xs text-[var(--text-secondary)] mr-2">{label}:</label>
        <select value={value} onChange={onChange} className="form-select form-select-sm w-48 !py-1 text-sm h-auto">
            <option value="">{defaultOption}</option>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

// Sub-component for Profit & Loss Report
const ProfitAndLoss = ({ startDate, endDate }: { startDate: string, endDate: string }) => {
    const { ledger, chartOfAccounts, formatCurrency } = useAppContext();
    const { totalIncome, totalExpense } = useMemo(() => {
        const incomeAccountIds = chartOfAccounts.filter(acc => acc.type === 'درآمد' && acc.parentId !== null).map(acc => acc.id);
        const expenseAccountIds = chartOfAccounts.filter(acc => acc.type === 'هزینه' && acc.parentId !== null).map(acc => acc.id);

        let income = 0;
        let expense = 0;

        const start = toSortableJalali(startDate);
        const end = toSortableJalali(endDate);

        ledger.filter(e => {
            const entryDate = toSortableJalali(e.date);
            return entryDate >= start && entryDate <= end;
        }).forEach(entry => {
            if (incomeAccountIds.includes(entry.accountId)) income += entry.credit - entry.debit;
            if (expenseAccountIds.includes(entry.accountId)) expense += entry.debit - entry.credit;
        });
        return { totalIncome: income, totalExpense: expense };
    }, [ledger, chartOfAccounts, startDate, endDate]);

    const netProfit = totalIncome - totalExpense;
    const chartData = [{ name: 'خلاصه', income: totalIncome, expense: totalExpense, profit: netProfit }];

    return (
        <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-sm animated-card">
            <h3 className="text-xl font-bold mb-4">صورت سود و زیان</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border-primary)]">
                        <span className="font-semibold text-green-400">درآمد کل</span>
                        <span className="font-mono text-lg font-bold text-green-300">{formatCurrency(totalIncome)} {CURRENCY}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border-primary)]">
                        <span className="font-semibold text-red-400">هزینه کل</span>
                        <span className="font-mono text-lg font-bold text-red-300">{formatCurrency(totalExpense)} {CURRENCY}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 bg-[var(--bg-tertiary)] rounded-md px-4 mt-2">
                        <span className="font-bold text-blue-300 text-lg">سود (زیان) خالص</span>
                        <span className={`font-mono text-xl font-extrabold ${netProfit >= 0 ? 'text-blue-300' : 'text-orange-400'}`}>
                            {formatCurrency(netProfit)} {CURRENCY}
                        </span>
                    </div>
                </div>
                 <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                        <BarChart data={chartData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                            <XAxis type="number" stroke="var(--text-secondary)" tickFormatter={formatCurrency} />
                            <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" width={10}/>
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }} formatter={(value:number, name:string) => [formatCurrency(value), name === 'income' ? 'درآمد' : 'هزینه']} />
                            <Legend formatter={(value) => value === 'income' ? 'درآمد' : 'هزینه'}/>
                            <Bar dataKey="income" fill="#22c55e" name="درآمد" />
                            <Bar dataKey="expense" fill="#ef4444" name="هزینه" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// Sub-component for Sales Report
const SalesReport = ({ startDate, endDate, doctorFilter, tariffFilter, serviceFilter, onDoctorChange, onTariffChange, onServiceChange }: any) => {
    const { invoices, formatCurrency, doctors, insuranceCompanies, services } = useAppContext();
    type SalesData = { id: number; name: string; type: 'خدمت' | 'کالا'; quantity: number; total: number; }
    
    const salesData = useMemo(() => {
        const salesMap = new Map<string, Omit<SalesData, 'id'>>();
        const start = toSortableJalali(startDate);
        const end = toSortableJalali(endDate);

        invoices.filter(inv => {
            const invDate = toSortableJalali(inv.date);
            const dateMatch = invDate >= start && invDate <= end;
            const tariffMatch = !tariffFilter || inv.tariffType === tariffFilter;
            return dateMatch && tariffMatch;
        }).forEach(inv => {
            inv.items.forEach(item => {
                const doctorMatch = !doctorFilter || (item.type === 'service' && item.doctorId === parseInt(doctorFilter));
                const serviceMatch = !serviceFilter || item.id === parseInt(serviceFilter);

                if (doctorMatch && serviceMatch) {
                    const key = `${item.type}-${item.id}`;
                    const existing = salesMap.get(key);
                    if (existing) {
                        existing.quantity += item.quantity;
                        existing.total += item.price;
                    } else {
                        salesMap.set(key, {
                            name: item.name,
                            type: item.type === 'service' ? 'خدمت' : 'کالا',
                            quantity: item.quantity,
                            total: item.price
                        });
                    }
                }
            });
        });
        return Array.from(salesMap.values()).map((item, index) => ({...item, id: index}));
    }, [invoices, startDate, endDate, doctorFilter, tariffFilter, serviceFilter]);
    
    const salesByType = useMemo(() => {
        const serviceTotal = salesData.filter(d => d.type === 'خدمت').reduce((sum, d) => sum + d.total, 0);
        const inventoryTotal = salesData.filter(d => d.type === 'کالا').reduce((sum, d) => sum + d.total, 0);
        return [{ name: 'خدمات', value: serviceTotal }, { name: 'کالاها', value: inventoryTotal }];
    }, [salesData]);

    const columns: Column<SalesData>[] = [
        { header: 'نوع', accessor: 'type', sortKey: 'type' },
        { header: 'نام آیتم', accessor: 'name', sortKey: 'name' },
        { header: 'تعداد فروش', accessor: 'quantity', sortKey: 'quantity' },
        { header: `مجموع فروش (${CURRENCY})`, accessor: (item) => formatCurrency(item.total), sortKey: 'total' }
    ];
    
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 p-2 bg-[var(--bg-tertiary)] rounded-md">
                <FilterDropdown label="پزشک" value={doctorFilter} onChange={onDoctorChange} options={doctors.map(d => ({ value: String(d.id), label: d.name }))} defaultOption="همه پزشکان" />
                <FilterDropdown label="نوع تعرفه" value={tariffFilter} onChange={onTariffChange} options={[{ value: 'آزاد', label: 'آزاد' }, ...insuranceCompanies.map(ic => ({ value: ic.name, label: ic.name }))]} defaultOption="همه تعرفه‌ها" />
                <FilterDropdown label="خدمت" value={serviceFilter} onChange={onServiceChange} options={services.map(s => ({ value: String(s.id), label: s.name }))} defaultOption="همه خدمات" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <EnhancedTable columns={columns} data={salesData} tableName="گزارش-فروش" />
                </div>
                 <div className="bg-[var(--bg-secondary)] p-4 rounded-lg shadow-sm animated-card" style={{ width: '100%', height: 400 }}>
                     <h4 className="font-semibold text-center mb-4">فروش بر اساس نوع</h4>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie data={salesByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {salesByType.map((entry, index) => <Cell key={`cell-${index}`} fill={['#6366f1', '#22c55e'][index % 2]} />)}
                            </Pie>
                            <Tooltip formatter={(value: number) => [formatCurrency(value), 'مبلغ']} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// Sub-component for Expense Report
const ExpenseReport = ({ startDate, endDate, payeeFilter, onPayeeChange }: any) => {
    const { expenses, chartOfAccounts, formatCurrency, contacts } = useAppContext();
    type ExpenseData = { id: number; category: string; total: number; count: number };
    const expenseData = useMemo(() => {
        const expenseMap = new Map<number, ExpenseData>();
        const start = toSortableJalali(startDate);
        const end = toSortableJalali(endDate);

        expenses.filter(exp => {
            const expDate = toSortableJalali(exp.date);
            const dateMatch = expDate >= start && expDate <= end;
            const payeeMatch = !payeeFilter || exp.toEntityId === payeeFilter;
            return dateMatch && payeeMatch;
        }).forEach(exp => {
            const categoryName = chartOfAccounts.find(a => a.id === exp.expenseAccountId)?.name || 'نامشخص';
            const existing = expenseMap.get(exp.expenseAccountId);
            if(existing){
                existing.total += exp.amount;
                existing.count += 1;
            } else {
                expenseMap.set(exp.expenseAccountId, { id: exp.expenseAccountId, category: categoryName, total: exp.amount, count: 1});
            }
        });
        return Array.from(expenseMap.values());
    }, [expenses, chartOfAccounts, startDate, endDate, payeeFilter]);

    const columns: Column<ExpenseData>[] = [
        { header: 'دسته‌بندی هزینه', accessor: 'category', sortKey: 'category' },
        { header: 'تعداد تراکنش', accessor: 'count', sortKey: 'count' },
        { header: `مجموع هزینه (${CURRENCY})`, accessor: (item) => formatCurrency(item.total), sortKey: 'total' },
    ];
    
    const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

    return (
         <div className="space-y-4">
             <div className="flex flex-wrap items-center gap-4 p-2 bg-[var(--bg-tertiary)] rounded-md">
                <FilterDropdown label="پرداخت به" value={payeeFilter} onChange={onPayeeChange} options={contacts.map(c => ({ value: c.id, label: `${c.name} (${c.group})` }))} defaultOption="همه" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                   <EnhancedTable columns={columns} data={expenseData} tableName="گزارش-هزینه‌ها" />
                </div>
                 <div className="bg-[var(--bg-secondary)] p-4 rounded-lg shadow-sm animated-card" style={{ width: '100%', height: 400 }}>
                     <h4 className="font-semibold text-center mb-4">هزینه‌ها بر اساس دسته‌بندی</h4>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie data={expenseData.map(e => ({ name: e.category, value: e.total }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {expenseData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value: number) => [formatCurrency(value), 'مبلغ']} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// Sub-component for Commission Report
const CommissionReport = ({ startDate, endDate, personFilter, onPersonChange }: any) => {
    const { invoices, contacts, services, formatCurrency } = useAppContext();

    type CommissionData = { id: string; personName: string; serviceTotal: number; commissionTotal: number; serviceCount: number };
    
    const commissionData = useMemo(() => {
        const commissionMap = new Map<string, Omit<CommissionData, 'id' | 'personName'>>();
        const start = toSortableJalali(startDate);
        const end = toSortableJalali(endDate);

        invoices.filter(inv => {
            const invDate = toSortableJalali(inv.date);
            return invDate >= start && invDate <= end && inv.status === 'پرداخت شده';
        }).forEach(inv => {
            inv.items.forEach(item => {
                if (item.type !== 'service') return;
                
                const service = services.find(s => s.id === item.id);
                if (!service || !service.commissions) return;

                service.commissions.forEach(commissionRule => {
                    let shouldApply = false;
                    
                    if (item.doctorId && commissionRule.personId === `doctor-${item.doctorId}`) {
                        shouldApply = true;
                    } 
                    else if (!item.doctorId && commissionRule.personId.startsWith('employee-')) {
                         shouldApply = true;
                    }
                    
                    const personMatch = !personFilter || commissionRule.personId === personFilter;

                    if (!shouldApply || !personMatch) return;

                    let commissionAmount = 0;
                    if (commissionRule.type === 'percentage') {
                        commissionAmount = item.price * (commissionRule.value / 100);
                    } else { // fixed
                        commissionAmount = commissionRule.value * item.quantity;
                    }

                    const existing = commissionMap.get(commissionRule.personId);
                    if (existing) {
                        existing.serviceTotal += item.price;
                        existing.commissionTotal += commissionAmount;
                        existing.serviceCount += item.quantity;
                    } else {
                        commissionMap.set(commissionRule.personId, {
                            serviceTotal: item.price,
                            commissionTotal: commissionAmount,
                            serviceCount: item.quantity,
                        });
                    }
                });
            });
        });

        const finalData: CommissionData[] = [];
        commissionMap.forEach((data, personId) => {
            const contact = contacts.find(c => c.id === personId);
            if(contact){
                finalData.push({ id: personId, personName: contact.name, ...data });
            }
        });

        return finalData;

    }, [invoices, contacts, services, startDate, endDate, personFilter]);

    const columns: Column<CommissionData>[] = [
        { header: 'نام شخص', accessor: 'personName', sortKey: 'personName' },
        { header: 'تعداد خدمات', accessor: 'serviceCount', sortKey: 'serviceCount' },
        { header: `مجموع مبلغ خدمات (${CURRENCY})`, accessor: (item) => formatCurrency(item.serviceTotal), sortKey: 'serviceTotal' },
        { header: `مجموع پورسانت (${CURRENCY})`, accessor: (item) => formatCurrency(item.commissionTotal), sortKey: 'commissionTotal' },
    ];
    
     return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 p-2 bg-[var(--bg-tertiary)] rounded-md">
                <FilterDropdown label="شخص" value={personFilter} onChange={onPersonChange} options={contacts.filter(c => c.type === 'doctor' || c.type === 'employee').map(c => ({ value: c.id, label: `${c.name} (${c.group})` }))} defaultOption="همه افراد" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <EnhancedTable columns={columns} data={commissionData} tableName="گزارش-پورسانت" />
                </div>
                 <div className="bg-[var(--bg-secondary)] p-4 rounded-lg shadow-sm animated-card" style={{ width: '100%', height: 400 }}>
                     <h4 className="font-semibold text-center mb-4">مقایسه پورسانت‌ها</h4>
                    <ResponsiveContainer>
                        <BarChart data={commissionData}>
                             <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                            <XAxis dataKey="personName" stroke="var(--text-secondary)" />
                            <YAxis stroke="var(--text-secondary)" tickFormatter={formatCurrency} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }} formatter={(value:number) => [formatCurrency(value), 'پورسانت']} />
                            <Bar dataKey="commissionTotal" fill="#8884d8" name="پورسانت" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// Sub-component for General Ledger Report
const GeneralLedgerReport = ({ startDate, endDate }: { startDate: string, endDate: string }) => {
    const { ledger, chartOfAccounts, formatCurrency } = useAppContext();
    const filteredLedger = useMemo(() => {
        const start = toSortableJalali(startDate);
        const end = toSortableJalali(endDate);
        return ledger.filter(e => {
            const entryDate = toSortableJalali(e.date);
            return entryDate >= start && entryDate <= end;
        });
    }, [ledger, startDate, endDate]);

    const ledgerColumns: Column<LedgerEntry>[] = [
        { header: 'تاریخ', accessor: 'date', sortKey: 'date' },
        { header: 'شرح', accessor: 'description' },
        { header: 'حساب', accessor: (item) => chartOfAccounts.find(acc => acc.id === item.accountId)?.name || 'N/A', sortKey: 'accountId' },
        { header: `بدهکار (${CURRENCY})`, accessor: (item) => item.debit > 0 ? formatCurrency(item.debit) : '-' },
        { header: `بستانکار (${CURRENCY})`, accessor: (item) => item.credit > 0 ? formatCurrency(item.credit) : '-' },
    ];

    return <EnhancedTable columns={ledgerColumns} data={filteredLedger} tableName="دفتر-کل" />;
};

// Sub-component for Invoice Aging Report
const InvoiceAgingReport = () => {
    const { invoices, formatCurrency, getFormattedDate } = useAppContext();
    
    const getDaysPastDue = (dateStr: string) => {
        const todayStr = getFormattedDate();
        const [ty, tm, td] = todayStr.split('/').map(Number);
        const [iy, im, id] = dateStr.split('/').map(Number);
        const days = (ty - iy) * 365 + (tm - im) * 30.44 + (td - id);
        return Math.max(0, Math.floor(days));
    };

    const agingData = useMemo(() => {
        const agingMap = new Map<string, { id: string, name: string, '0-30': number, '31-60': number, '61-90': number, '>90': number, total: number }>();
        invoices
            .filter(inv => inv.status !== 'پرداخت شده')
            .forEach(inv => {
                const amountDue = inv.patientShare - inv.paidAmount;
                if (amountDue <= 0) return;

                const daysPastDue = getDaysPastDue(inv.date);
                let bucket: '0-30' | '31-60' | '61-90' | '>90';
                if (daysPastDue <= 30) bucket = '0-30';
                else if (daysPastDue <= 60) bucket = '31-60';
                else if (daysPastDue <= 90) bucket = '61-90';
                else bucket = '>90';

                let entry = agingMap.get(inv.recipientName);
                if (!entry) {
                    entry = { id: inv.recipientName, name: inv.recipientName, '0-30': 0, '31-60': 0, '61-90': 0, '>90': 0, total: 0 };
                }
                entry[bucket] += amountDue;
                entry.total += amountDue;
                agingMap.set(inv.recipientName, entry);
            });
        return Array.from(agingMap.values());
    }, [invoices]);

    const columns: Column<typeof agingData[0]>[] = [
        { header: 'نام مشتری', accessor: 'name' },
        { header: `جاری (۰-۳۰ روز)`, accessor: item => formatCurrency(item['0-30']) },
        { header: `۳۱-۶۰ روز`, accessor: item => formatCurrency(item['31-60']) },
        { header: `۶۱-۹۰ روز`, accessor: item => formatCurrency(item['61-90']) },
        { header: `بیش از ۹۰ روز`, accessor: item => formatCurrency(item['>90']) },
        { header: `مجموع بدهی`, accessor: item => formatCurrency(item.total) },
    ];

    const totals = useMemo(() => {
        return agingData.reduce((acc, curr) => {
            acc['0-30'] += curr['0-30'];
            acc['31-60'] += curr['31-60'];
            acc['61-90'] += curr['61-90'];
            acc['>90'] += curr['>90'];
            acc.total += curr.total;
            return acc;
        }, { '0-30': 0, '31-60': 0, '61-90': 0, '>90': 0, total: 0 });
    }, [agingData]);
    
    const chartData = [
        { name: '۰-۳۰', 'مبلغ': totals['0-30'] },
        { name: '۳۱-۶۰', 'مبلغ': totals['31-60'] },
        { name: '۶۱-۹۰', 'مبلغ': totals['61-90'] },
        { name: '>۹۰', 'مبلغ': totals['>90'] },
    ];
    
    return (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <EnhancedTable columns={columns} data={agingData} tableName="گزارش-عمر-بدهی" />
            </div>
            <div className="bg-[var(--bg-secondary)] p-4 rounded-lg shadow-sm animated-card" style={{ width: '100%', height: 400 }}>
                <h4 className="font-semibold text-center mb-4">خلاصه عمر بدهی‌ها</h4>
                <ResponsiveContainer>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                        <XAxis dataKey="name" stroke="var(--text-secondary)" />
                        <YAxis stroke="var(--text-secondary)" tickFormatter={formatCurrency} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }} formatter={(value:number) => [formatCurrency(value), 'مبلغ']} />
                        <Bar dataKey="مبلغ" fill="#f97316" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// Sub-component for Balance Sheet Report
const BalanceSheet = ({ asOfDate }: { asOfDate: string }) => {
    const { chartOfAccounts, ledger, formatCurrency } = useAppContext();

    const accountBalances = useMemo(() => {
        const balances = new Map<number, number>();
        const asOfSortable = toSortableJalali(asOfDate);

        ledger.forEach(entry => {
            if (toSortableJalali(entry.date) <= asOfSortable) {
                const account = chartOfAccounts.find(a => a.id === entry.accountId);
                if (account) {
                    const balanceChange = (account.type === 'دارایی‌ها' || account.type === 'هزینه') 
                        ? entry.debit - entry.credit 
                        : entry.credit - entry.debit;
                    balances.set(entry.accountId, (balances.get(entry.accountId) || 0) + balanceChange);
                }
            }
        });

        // Calculate retained earnings (net income up to date)
        let retainedEarnings = 0;
        balances.forEach((balance, accountId) => {
            const account = chartOfAccounts.find(a => a.id === accountId);
            if (account) {
                if (account.type === 'درآمد') retainedEarnings += balance;
                if (account.type === 'هزینه') retainedEarnings -= balance;
            }
        });

        const getBalanceWithChildren = (accountId: number): number => {
            let total = balances.get(accountId) || 0;
            chartOfAccounts.filter(a => a.parentId === accountId).forEach(child => {
                total += getBalanceWithChildren(child.id);
            });
            return total;
        };

        return { getBalance: getBalanceWithChildren, retainedEarnings };
    }, [chartOfAccounts, ledger, asOfDate]);

    const renderAccountList = (accounts: Account[]) => (
        <ul className="space-y-2">
            {accounts.map(acc => {
                const balance = accountBalances.getBalance(acc.id);
                if (balance === 0 && !chartOfAccounts.some(c => c.parentId === acc.id)) return null;
                return (
                    <li key={acc.id} className="flex justify-between items-center text-sm py-1 border-b border-dashed border-[var(--border-secondary)]">
                        <span>{acc.name}</span>
                        <span className="font-mono">{formatCurrency(balance)}</span>
                    </li>
                );
            })}
        </ul>
    );
    
    const assets = chartOfAccounts.filter(a => a.type === 'دارایی‌ها' && a.parentId === null);
    const liabilities = chartOfAccounts.filter(a => a.type === 'بدهی‌ها' && a.parentId === null);
    const equity = chartOfAccounts.filter(a => a.type === 'سرمایه' && a.parentId === null);

    const totalAssets = assets.reduce((sum, acc) => sum + accountBalances.getBalance(acc.id), 0);
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + accountBalances.getBalance(acc.id), 0);
    const totalEquity = equity.reduce((sum, acc) => sum + accountBalances.getBalance(acc.id), 0) + accountBalances.retainedEarnings;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return (
        <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-sm animated-card">
            <h3 className="text-xl font-bold mb-4">ترازنامه تا تاریخ {asOfDate}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Assets */}
                <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-green-400 border-b-2 border-green-800 pb-2">دارایی‌ها</h4>
                    {renderAccountList(assets)}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t-2 border-[var(--border-primary)]">
                        <span>جمع دارایی‌ها</span>
                        <span className="font-mono">{formatCurrency(totalAssets)}</span>
                    </div>
                </div>
                {/* Liabilities & Equity */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-red-400 border-b-2 border-red-800 pb-2">بدهی‌ها</h4>
                        {renderAccountList(liabilities)}
                         <div className="flex justify-between font-bold pt-2 border-t border-[var(--border-primary)]">
                            <span>جمع بدهی‌ها</span>
                            <span className="font-mono">{formatCurrency(totalLiabilities)}</span>
                        </div>
                    </div>
                     <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-blue-400 border-b-2 border-blue-800 pb-2">سرمایه</h4>
                        {renderAccountList(equity)}
                         <li className="flex justify-between items-center text-sm py-1 border-b border-dashed border-[var(--border-secondary)]">
                            <span>سود انباشته</span>
                            <span className="font-mono">{formatCurrency(accountBalances.retainedEarnings)}</span>
                        </li>
                         <div className="flex justify-between font-bold pt-2 border-t border-[var(--border-primary)]">
                            <span>جمع سرمایه</span>
                            <span className="font-mono">{formatCurrency(totalEquity)}</span>
                        </div>
                    </div>
                     <div className="flex justify-between font-bold text-lg pt-2 border-t-2 border-[var(--border-primary)]">
                        <span>جمع بدهی و سرمایه</span>
                        <span className="font-mono">{formatCurrency(totalLiabilitiesAndEquity)}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}


const Reports = () => {
    const { getFormattedDate } = useAppContext();
    const [activeReport, setActiveReport] = useState('pnl');
    const [startDate, setStartDate] = useState(getStartDateOfMonth());
    const [endDate, setEndDate] = useState(getFormattedDate());
    const [balanceSheetDate, setBalanceSheetDate] = useState(getFormattedDate());
    
    // Filters state
    const [salesDoctorFilter, setSalesDoctorFilter] = useState('');
    const [salesTariffFilter, setSalesTariffFilter] = useState('');
    const [salesServiceFilter, setSalesServiceFilter] = useState('');
    const [expensePayeeFilter, setExpensePayeeFilter] = useState('');
    const [commissionPersonFilter, setCommissionPersonFilter] = useState('');


    const reportTypes = [
        { id: 'pnl', name: 'سود و زیان' },
        { id: 'balance-sheet', name: 'ترازنامه' },
        { id: 'sales', name: 'فروش' },
        { id: 'expenses', name: 'هزینه‌ها' },
        { id: 'aging', name: 'عمر بدهی' },
        { id: 'commission', name: 'پورسانت‌ها' },
        { id: 'ledger', name: 'دفتر کل' },
    ];

    const renderActiveReport = () => {
        // Invoice Aging doesn't need a date range as it's always "as of today"
        if (activeReport === 'aging') return <InvoiceAgingReport />;
        if (activeReport === 'balance-sheet') return <BalanceSheet asOfDate={balanceSheetDate} />;

        switch (activeReport) {
            case 'pnl': return <ProfitAndLoss startDate={startDate} endDate={endDate} />;
            case 'sales': return <SalesReport 
                startDate={startDate} endDate={endDate} 
                doctorFilter={salesDoctorFilter} onDoctorChange={(e: any) => setSalesDoctorFilter(e.target.value)}
                tariffFilter={salesTariffFilter} onTariffChange={(e: any) => setSalesTariffFilter(e.target.value)}
                serviceFilter={salesServiceFilter} onServiceChange={(e: any) => setSalesServiceFilter(e.target.value)}
                />;
            case 'expenses': return <ExpenseReport 
                startDate={startDate} endDate={endDate} 
                payeeFilter={expensePayeeFilter} onPayeeChange={(e: any) => setExpensePayeeFilter(e.target.value)}
                />;
            case 'commission': return <CommissionReport 
                startDate={startDate} endDate={endDate}
                personFilter={commissionPersonFilter} onPersonChange={(e: any) => setCommissionPersonFilter(e.target.value)}
                 />;
            case 'ledger': return <GeneralLedgerReport startDate={startDate} endDate={endDate} />;
            default: return null;
        }
    };
  
  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">گزارشات</h1>
        </div>
        
        <div className="bg-[var(--bg-secondary)] p-4 rounded-lg shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-1 space-x-reverse border-b-2 border-[var(--border-primary)] pb-2 flex-wrap">
                {reportTypes.map(report => (
                    <button 
                        key={report.id}
                        onClick={() => setActiveReport(report.id)}
                        className={`btn btn-sm ${activeReport === report.id ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        {report.name}
                    </button>
                ))}
            </div>
            {activeReport !== 'aging' && activeReport !== 'balance-sheet' && (
                <div className="flex items-center space-x-2 space-x-reverse">
                    <JalaliDatePicker label="تاریخ شروع" value={startDate} onChange={(newDate) => { if (newDate) setStartDate(newDate); }} />
                    <span>تا</span>
                    <JalaliDatePicker label="تاریخ پایان" value={endDate} onChange={(newDate) => { if (newDate) setEndDate(newDate); }} />
                </div>
            )}
            {activeReport === 'balance-sheet' && (
                 <div className="flex items-center space-x-2 space-x-reverse">
                    <span>برای تاریخ:</span>
                    <JalaliDatePicker label="برای تاریخ:" value={balanceSheetDate} onChange={(newDate) => { if (newDate) setBalanceSheetDate(newDate); }} />
                </div>
            )}
        </div>

        <div className="mt-8">
            {renderActiveReport()}
        </div>
    </div>
  );
};

export default Reports;