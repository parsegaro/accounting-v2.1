import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import faLocale from '@fullcalendar/core/locales/fa';
import { useAppContext } from '../context/AppContext';
import { CURRENCY } from '../constants';

// Accurate Jalali to Gregorian conversion function
function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
    let sal_a, gy, gm, gd, days;
    jy += 1595;
    days = -355668 + (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
    gy = 400 * Math.floor(days / 146097);
    days %= 146097;
    if (days > 36524) {
      gy += 100 * Math.floor(--days / 36524);
      days %= 36524;
      if (days >= 365) days++;
    }
    gy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
      gy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }
    gd = days + 1;
    sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    for (gm = 1; gm < 13 && gd > sal_a[gm]; gm++) {
        gd -= sal_a[gm];
    }
    return [gy, gm, gd];
}


const DashboardCalendar: React.FC = () => {
    const { invoices, expenses, payments, payablesReceivables, formatCurrency } = useAppContext();

    const calendarEvents = useMemo(() => {
        const toFcDate = (jalaliDate: string) => {
            if (!jalaliDate || typeof jalaliDate !== 'string' || !/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(jalaliDate)) {
                return null;
            }
            const [y, m, d] = jalaliDate.split('/').map(Number);
            if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    
            const [gy, gm, gd] = jalaliToGregorian(y, m, d);
            return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
        };

        const events = [];

        // Incomes
        payments.filter(p => p.type === 'دریافت').forEach(p => {
            const date = toFcDate(p.date);
            if (date) {
                events.push({
                    title: `+${formatCurrency(p.amount)}`,
                    date,
                    color: '#22c55e', // green
                    textColor: '#f0fdf4'
                });
            }
        });

        // Expenses
        expenses.forEach(e => {
            const date = toFcDate(e.date);
            if(date) {
                events.push({
                    title: `-${formatCurrency(e.amount)}`,
                    date,
                    color: '#ef4444', // red
                    textColor: '#fef2f2'
                });
            }
        });

        // Dues
        payablesReceivables.filter(pr => pr.status === 'در انتظار').forEach(pr => {
            const date = toFcDate(pr.dueDate);
            if(date) {
                events.push({
                    title: `سررسید: ${pr.description}`,
                    date,
                    color: pr.type === 'payable' ? '#f97316' : '#3b82f6', // orange / blue
                    textColor: '#fff'
                });
            }
        });

        return events;
    }, [invoices, expenses, payments, payablesReceivables, formatCurrency]);

    return (
        <div className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow-sm fc-theme">
             <style>{`
                .fc-theme .fc-daygrid-day-number, .fc-theme .fc-col-header-cell-cushion {
                    color: var(--text-secondary);
                }
                .fc-theme .fc-day-today {
                    background: rgba(99, 102, 241, 0.2) !important;
                }
                .fc-theme .fc-toolbar-title {
                    color: var(--text-primary);
                }
                .fc-theme .fc-button {
                    background: var(--bg-tertiary) !important;
                    border-color: var(--border-secondary) !important;
                    color: var(--text-primary) !important;
                }
                .fc-theme .fc-button-primary:not(:disabled).fc-button-active, .fc-theme .fc-button-primary:not(:disabled):active {
                    background-color: var(--accent-primary) !important;
                }
                .fc-theme .fc-event {
                    border: 1px solid rgba(0,0,0,0.3) !important;
                    padding: 2px 4px;
                    font-size: 0.75rem;
                }
             `}</style>
            <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                locale={faLocale}
                events={calendarEvents}
                headerToolbar={{
                    start: 'title',
                    center: '',
                    end: 'today prev,next'
                }}
                height="auto"
                eventDisplay="block"
            />
        </div>
    );
};

export default DashboardCalendar;