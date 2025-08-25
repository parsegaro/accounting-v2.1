import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { TransactionList } from './transactions/TransactionList';
import { CURRENCY } from '../constants';
import type { Transaction, PayableReceivable, Payslip, Invoice } from '../types';
import { StatCard } from './common/StatCard';
import KPICard from './common/KPICard';
import ComparisonCard from './common/ComparisonCard';
import { IncomeIcon, CreditCardIcon, CollectionIcon, ArchiveIcon } from '../constants';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DashboardCalendar from './DashboardCalendar';

// A robust function to convert 'YYYY/MM/DD' Jalali strings to a sortable number.
const toSortableJalali = (dateStr: string): number => {
    if (!dateStr || typeof dateStr !== 'string') return 0;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return 0;
    if (isNaN(parseInt(parts[0])) || isNaN(parseInt(parts[1])) || isNaN(parseInt(parts[2]))) return 0;
    const [y, m, d] = parts.map(p => p.padStart(2, '0'));
    const sortableString = `${y}${m}${d}`;
    return parseInt(sortableString, 10);
};

const formatDate = (date: Date) => new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);

const AlertItem = ({ message, level, href }: { message: string, level: 'warning' | 'danger', href: string }) => {
    const bgColor = level === 'danger' ? 'bg-red-900/50 border-red-700' : 'bg-yellow-900/50 border-yellow-700';
    const textColor = level === 'danger' ? 'text-red-300' : 'text-yellow-300';
    return (
        <a href={href} className={`block p-3 rounded-lg border-r-4 transition-colors hover:bg-opacity-75 ${bgColor} ${textColor}`}>
            <p className="text-sm font-medium">{message}</p>
        </a>
    );
};

const Dashboard = () => {
  const { chartOfAccounts, payments, expenses, contacts, formatCurrency, payablesReceivables, inventory, payslips, invoices, alertSettings } = useAppContext();
  const [chartConfig, setChartConfig] = useState({ count: 52, period: 'week' as 'day' | 'week' | 'month' });

  const allTransactions = useMemo(() => {
    return [
      ...payments.filter(p => p.type === 'دریافت').map(p => ({ type: 'income' as const, date: p.date, amount: p.amount })),
      ...expenses.map(e => ({ type: 'expense' as const, date: e.date, amount: e.amount }))
    ];
  }, [payments, expenses]);

  const recentTxsForList = useMemo(() => {
     const incomeTxs: Transaction[] = payments
      .filter(p => p.type === 'دریافت')
      .map(p => ({
        id: p.id, date: p.date, description: p.description, amount: p.amount, type: 'درآمد',
        category: 'دریافت وجه', accountId: p.accountId, entityName: contacts.find(c => c.id === p.entityId)?.name || p.entityId
      }));

    const expenseTxs: Transaction[] = expenses.map(e => ({
      id: e.id, date: e.date, description: e.description, amount: e.amount, type: 'هزینه',
      category: chartOfAccounts.find(a => a.id === e.expenseAccountId)?.name || 'هزینه', accountId: e.fromAccountId, entityName: contacts.find(c => c.id === e.toEntityId)?.name || e.toEntityId
    }));
    
    return [...incomeTxs, ...expenseTxs].sort((a, b) => toSortableJalali(b.date) - toSortableJalali(a.date));
  }, [payments, expenses, chartOfAccounts, contacts]);


  const today = useMemo(() => formatDate(new Date()), []);
  
  const getIncomeExpenseForDate = (date: string) => {
    const txs = allTransactions.filter(t => t.date === date);
    return {
        income: txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        expense: txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    };
  };

  const comparisonData = useMemo(() => {
    const todayDate = new Date();
    const yesterdayDate = new Date(); yesterdayDate.setDate(todayDate.getDate() - 1);
    const twoDaysAgoDate = new Date(); twoDaysAgoDate.setDate(todayDate.getDate() - 2);

    const daily = [
        { period: 'امروز', ...getIncomeExpenseForDate(formatDate(todayDate)) },
        { period: 'دیروز', ...getIncomeExpenseForDate(formatDate(yesterdayDate)) },
        { period: '۲ روز پیش', ...getIncomeExpenseForDate(formatDate(twoDaysAgoDate)) },
    ];
    
    const getRangeData = (days: number, offset: number = 0) => {
        const end = new Date(); end.setDate(end.getDate() - offset);
        const start = new Date(); start.setDate(start.getDate() - (offset + days - 1));
        const startNum = toSortableJalali(formatDate(start));
        const endNum = toSortableJalali(formatDate(end));
        const txs = allTransactions.filter(t => {
            const tNum = toSortableJalali(t.date);
            return tNum >= startNum && tNum <= endNum;
        });
        const relevantInvoices = invoices.filter(inv => {
            const invNum = toSortableJalali(inv.date);
            return invNum >= startNum && invNum <= endNum;
        });
        return {
            income: txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
            expense: txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
            invoices: relevantInvoices
        };
    };

    const weekly = [
        { period: 'این هفته', ...getRangeData(7) },
        { period: 'هفته قبل', ...getRangeData(7, 7) },
        { period: '۲ هفته قبل', ...getRangeData(7, 14) },
    ];

    const monthly = [
        { period: 'این ماه', ...getRangeData(30) },
        { period: 'ماه قبل', ...getRangeData(30, 30) },
        { period: '۲ ماه قبل', ...getRangeData(30, 60) },
    ];
    
    return { daily, weekly, monthly };
  }, [allTransactions, invoices]);

  const financialHealthData = useMemo(() => {
    const currentPeriodData = comparisonData.monthly[0];
    const previousPeriodData = comparisonData.monthly[1];

    // Net Profit Margin
    const currentProfit = currentPeriodData.income - currentPeriodData.expense;
    const currentMargin = currentPeriodData.income > 0 ? (currentProfit / currentPeriodData.income) * 100 : 0;
    const previousProfit = previousPeriodData.income - previousPeriodData.expense;
    const previousMargin = previousPeriodData.income > 0 ? (previousProfit / previousPeriodData.income) * 100 : 0;

    // Average Revenue per Invoice
    const currentAvgInvoice = currentPeriodData.invoices.length > 0 ? currentPeriodData.income / currentPeriodData.invoices.length : 0;
    const previousAvgInvoice = previousPeriodData.invoices.length > 0 ? previousPeriodData.income / previousPeriodData.invoices.length : 0;
    
    // Daily Break-even
    const dailyBreakEven = currentPeriodData.expense / 30;

    return {
        netProfitMargin: {
            value: currentMargin,
            previousValue: previousMargin
        },
        avgRevenuePerInvoice: {
            value: currentAvgInvoice,
            previousValue: previousAvgInvoice
        },
        totalExpenses: {
            value: currentPeriodData.expense,
            previousValue: previousPeriodData.expense
        },
        dailyBreakEven: {
            value: dailyBreakEven,
            previousValue: (previousPeriodData.expense / 30)
        }
    };
  }, [comparisonData.monthly]);

  const getTrend = (current: number, previous: number): { trend: 'up' | 'down' | 'neutral', text: string } => {
    if (previous === 0) {
        return current > 0 ? { trend: 'up', text: 'افزایش' } : { trend: 'neutral', text: 'بدون تغییر' };
    }
    const change = ((current - previous) / Math.abs(previous)) * 100;
    if (Math.abs(change) < 1) return { trend: 'neutral', text: 'بدون تغییر' };
    if (change > 0) return { trend: 'up', text: `${Math.round(change)}% افزایش` };
    return { trend: 'down', text: `${Math.round(Math.abs(change))}% کاهش` };
  };

  const incomeExpenseChartData = useMemo(() => {
    const data = new Map<string, { income: number; expense: number }>();
    const today = new Date();
    const { count, period } = chartConfig;

    for (let i = 0; i < count; i++) {
        const d = new Date();
        let key = '';
        if (period === 'day') {
            d.setDate(today.getDate() - i);
            key = formatDate(d);
        } else if (period === 'week') {
            const startOfWeek = new Date(d.setDate(d.getDate() - d.getDay() - 7 * i));
            key = formatDate(startOfWeek);
        } else { // month
            const startOfMonth = new Date(d.getFullYear(), d.getMonth() - i, 1);
            key = new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit' }).format(startOfMonth);
        }
        if (!data.has(key)) {
            data.set(key, { income: 0, expense: 0 });
        }
    }

    allTransactions.forEach(tx => {
        const txDate = new Date(parseInt(tx.date.split('/')[0]), parseInt(tx.date.split('/')[1]) - 1, parseInt(tx.date.split('/')[2]));
        let key = '';
        if (period === 'day') {
            key = tx.date;
        } else if (period === 'week') {
            const startOfWeek = new Date(txDate.setDate(txDate.getDate() - txDate.getDay()));
            key = formatDate(startOfWeek);
        } else { // month
            key = new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit' }).format(txDate);
        }

        if (data.has(key)) {
            const current = data.get(key)!;
            if (tx.type === 'income') current.income += tx.amount;
            else current.expense += tx.amount;
        }
    });
    
    return Array.from(data.entries())
        .map(([dateKey, values]) => {
            const dateParts = dateKey.split('/').map(Number);
            let name = dateKey;
            if (period === 'day' || period === 'week') {
                 name = new Intl.DateTimeFormat('fa-IR-u-nu-latn', { month: 'short', day: 'numeric' }).format(new Date(dateParts[0], dateParts[1]-1, dateParts[2]));
            } else {
                 name = new Intl.DateTimeFormat('fa-IR-u-nu-latn', { month: 'long', year: 'numeric' }).format(new Date(dateParts[0], dateParts[1]-1, 1));
            }
            return { name, ...values, sortKey: toSortableJalali(dateKey.length > 7 ? dateKey : `${dateKey}/01`) };
        })
        .sort((a,b) => a.sortKey - b.sortKey)
        .slice(-count);

}, [chartConfig, allTransactions]);
    
  const totalReceivables = useMemo(() => payablesReceivables.filter(pr => pr.type === 'receivable' && pr.status === 'در انتظار').reduce((sum, pr) => sum + pr.amount, 0), [payablesReceivables]);
  const totalPayables = useMemo(() => payablesReceivables.filter(pr => pr.type === 'payable' && pr.status === 'در انتظار').reduce((sum, pr) => sum + pr.amount, 0), [payablesReceivables]);
  
  const upcomingDues = useMemo(() => {
    const todaySortable = toSortableJalali(today);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekSortable = toSortableJalali(formatDate(nextWeek));
    return payablesReceivables.filter(item => {
        const itemDueDateSortable = toSortableJalali(item.dueDate);
        return item.status === 'در انتظار' && itemDueDateSortable >= todaySortable && itemDueDateSortable <= nextWeekSortable;
    }).sort((a,b) => toSortableJalali(a.dueDate) - toSortableJalali(b.dueDate));
  }, [payablesReceivables, today]);

  const alerts = useMemo(() => {
    const allAlerts: { message: string, level: 'warning' | 'danger', href: string }[] = [];
    
    if (alertSettings.lowInventory) {
        inventory.forEach(item => {
            if (item.quantity <= item.reorderPoint) {
                allAlerts.push({ 
                    message: `موجودی کالای "${item.name}" کم است (${item.quantity} عدد باقی مانده).`, 
                    level: item.quantity === 0 ? 'danger' : 'warning',
                    href: '#/inventory'
                });
            }
        });
    }

    const todaySortable = toSortableJalali(today);
    if (alertSettings.upcomingDues) {
        payablesReceivables.forEach(item => {
            if(item.status === 'در انتظار' && toSortableJalali(item.dueDate) <= todaySortable) {
                allAlerts.push({
                    message: `سررسید ${item.type === 'payable' ? 'بدهی' : 'طلب'} «${item.description}» گذشته است.`,
                    level: 'danger',
                    href: '#/payables-receivables'
                })
            }
        });
    }
    
    if (alertSettings.pendingPayslips) {
        payslips.forEach((payslip: Payslip) => {
            if (payslip.status === 'در انتظار پرداخت') {
                 allAlerts.push({ 
                    message: `فیش حقوقی ${payslip.employeeName} (${payslip.payPeriod}) در انتظار پرداخت است.`,
                    level: 'warning',
                    href: '#/payroll'
                });
            }
        });
    }
    
    if (alertSettings.overdueInvoices) {
        const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoSortable = toSortableJalali(formatDate(thirtyDaysAgo));
        invoices.forEach(inv => {
            if (inv.status !== 'پرداخت شده' && toSortableJalali(inv.date) < thirtyDaysAgoSortable) {
                 allAlerts.push({ 
                    message: `صورتحساب شماره ${inv.id} برای ${inv.recipientName} بیش از 30 روز است که پرداخت نشده.`,
                    level: 'danger',
                    href: '#/invoices'
                });
            }
        });
    }
    
    return allAlerts;
}, [inventory, invoices, payablesReceivables, today, payslips, alertSettings]);

  const recentTransactions = recentTxsForList.slice(0, 5);

  const DueDateItem = ({ item }: { item: PayableReceivable }) => (
    <div className="flex justify-between items-center py-2 border-b border-[var(--border-primary)] last:border-b-0">
        <div>
            <p className="font-semibold text-sm">{item.description}</p>
            <p className="text-xs text-[var(--text-secondary)]">{contacts.find(c => c.id === item.entityId)?.name}</p>
        </div>
        <div className="text-left">
            <p className={`font-bold text-sm ${item.type === 'payable' ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(item.amount)}</p>
            <p className="text-xs text-[var(--text-secondary)]">سررسید: {item.dueDate}</p>
        </div>
    </div>
  );

  return (
    <div className="space-y-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-0">داشبورد</h1>
        
         <div className="pb-6">
            <h2 className="text-xl font-semibold text-[var(--text-secondary)] mb-4">بررسی اجمالی سلامت مالی (۳۰ روز گذشته)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <KPICard 
                    title="حاشیه سود خالص"
                    value={`${financialHealthData.netProfitMargin.value.toFixed(1)}%`}
                    trend={getTrend(financialHealthData.netProfitMargin.value, financialHealthData.netProfitMargin.previousValue).trend}
                    comparisonText={`${getTrend(financialHealthData.netProfitMargin.value, financialHealthData.netProfitMargin.previousValue).text} نسبت به دوره قبل`}
                    gaugePercentage={Math.max(0, financialHealthData.netProfitMargin.value)}
                    description="درصد درآمد که به سود خالص تبدیل شده است."
                />
                 <KPICard 
                    title="متوسط درآمد هر فاکتور"
                    value={`${formatCurrency(Math.round(financialHealthData.avgRevenuePerInvoice.value))}`}
                    trend={getTrend(financialHealthData.avgRevenuePerInvoice.value, financialHealthData.avgRevenuePerInvoice.previousValue).trend}
                    comparisonText={`${getTrend(financialHealthData.avgRevenuePerInvoice.value, financialHealthData.avgRevenuePerInvoice.previousValue).text} نسبت به دوره قبل`}
                    gaugePercentage={Math.min(100, (financialHealthData.avgRevenuePerInvoice.value / 500000) * 100)} // Assume 500,000 is a good target
                    description="میانگین ارزش هر تراکنش موفق با مشتریان."
                />
                <KPICard 
                    title="کل هزینه‌ها"
                    value={`${formatCurrency(Math.round(financialHealthData.totalExpenses.value))}`}
                    trend={getTrend(financialHealthData.totalExpenses.value, financialHealthData.totalExpenses.previousValue).trend}
                    comparisonText={`${getTrend(financialHealthData.totalExpenses.value, financialHealthData.totalExpenses.previousValue).text} نسبت به دوره قبل`}
                    gaugePercentage={Math.min(100, (financialHealthData.totalExpenses.value / 50000000) * 100)} // Assume 50M is the budget
                    description="مجموع تمام هزینه‌های ثبت شده در دوره."
                    invertTrendColor
                />
                 <KPICard 
                    title="نقطه سر به سر روزانه"
                    value={`${formatCurrency(Math.round(financialHealthData.dailyBreakEven.value))}`}
                    trend={getTrend(financialHealthData.dailyBreakEven.value, financialHealthData.dailyBreakEven.previousValue).trend}
                    comparisonText={`${getTrend(financialHealthData.dailyBreakEven.value, financialHealthData.dailyBreakEven.previousValue).text} نسبت به دوره قبل`}
                    gaugePercentage={comparisonData.daily[0].income > financialHealthData.dailyBreakEven.value ? 100 : (comparisonData.daily[0].income / financialHealthData.dailyBreakEven.value) * 100}
                    description="حداقل درآمد روزانه برای پوشش هزینه‌ها."
                    invertTrendColor
                />
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-t border-[var(--border-primary)] pt-8">
            <StatCard title="درآمد امروز" value={comparisonData.daily[0].income} data={incomeExpenseChartData.slice(-15).map(d => ({name: d.name, value: d.income}))} color="#22c55e" icon={<IncomeIcon />} />
            <StatCard title="هزینه امروز" value={comparisonData.daily[0].expense} data={incomeExpenseChartData.slice(-15).map(d => ({name: d.name, value: d.expense}))} color="#ef4444" icon={<CreditCardIcon />} />
            <StatCard title="کل مطالبات" value={totalReceivables} data={[]} color="#3b82f6" icon={<CollectionIcon />} />
            <StatCard title="کل بدهی‌ها" value={totalPayables} data={[]} color="#f97316" icon={<ArchiveIcon />} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ComparisonCard title="مقایسه روزانه" data={comparisonData.daily} />
            <ComparisonCard title="مقایسه هفتگی" data={comparisonData.weekly} />
            <ComparisonCard title="مقایسه ماهانه" data={comparisonData.monthly} />
        </div>
        
        <DashboardCalendar />

        <div className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow-sm animated-card">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                 <h2 className="text-xl font-semibold text-[var(--text-primary)]">نمودار درآمد و هزینه</h2>
                 <div className="flex items-center space-x-2 space-x-reverse rounded-lg bg-[var(--bg-tertiary)] p-2">
                    <span className='text-sm text-[var(--text-secondary)]'>نمایش</span>
                    <input 
                        type="number" 
                        value={chartConfig.count} 
                        onChange={(e) => setChartConfig(prev => ({...prev, count: parseInt(e.target.value) || 1}))}
                        className="form-input w-20 text-center"
                    />
                    <select 
                        value={chartConfig.period} 
                        onChange={(e) => setChartConfig(prev => ({...prev, period: e.target.value as any}))}
                        className="form-select"
                    >
                        <option value="day">روز</option>
                        <option value="week">هفته</option>
                        <option value="month">ماه</option>
                    </select>
                    <span className='text-sm text-[var(--text-secondary)]'>اخیر</span>
                 </div>
            </div>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <ComposedChart data={incomeExpenseChartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                        <XAxis dataKey="name" stroke="var(--text-secondary)" />
                        <YAxis stroke="var(--text-secondary)" tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}
                            labelStyle={{ color: 'var(--text-primary)' }}
                            formatter={(value: number, name: string) => [formatCurrency(value as number), name === 'income' ? 'درآمد' : 'هزینه']}
                        />
                        <Legend formatter={(value) => value === 'income' ? 'درآمد' : 'هزینه'} />
                        <Bar dataKey="income" fill="#22c55e" name="درآمد" barSize={20} />
                        <Bar dataKey="expense" fill="#ef4444" name="هزینه" barSize={20} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>

        {alerts.length > 0 && (
            <div className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow-sm animated-card">
                 <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center">
                    <span className="text-yellow-400">⚠️</span>
                    <span className="mr-2">هشدارها و یادآوری‌ها</span>
                </h2>
                <div className="space-y-3">
                    {alerts.map((alert, index) => (
                        <AlertItem key={index} message={alert.message} level={alert.level} href={alert.href} />
                    ))}
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow-sm animated-card">
                 <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center">
                    <CollectionIcon />
                    <span className="mr-2">سررسیدهای هفته جاری</span>
                </h2>
                {upcomingDues.length > 0 ? (
                    upcomingDues.map(item => <DueDateItem key={item.id} item={item} />)
                ) : (
                    <p className="text-center text-[var(--text-secondary)] py-8">موردی برای نمایش در هفته جاری وجود ندارد.</p>
                )}
            </div>
            <div className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow-sm animated-card">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">تراکنش‌های اخیر</h2>
                {recentTransactions.length > 0 ? (
                    <TransactionList transactions={recentTransactions} />
                ) : (
                    <p className="text-center text-[var(--text-secondary)] py-8">هیچ تراکنشی برای نمایش وجود ندارد.</p>
                )}
            </div>
        </div>
    </div>
  );
};

export default Dashboard;