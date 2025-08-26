// This file acts as a complete, self-contained backend running in a separate thread.
// It handles all business logic and database interactions.

import * as db from './db';
import { User, UserRole, Account, Patient, Service, Invoice, Payment, InsuranceClaim, InventoryItem, Employee, InvoiceTemplate, LedgerEntry, Payslip, Supplier, Expense, PayableReceivable, Doctor, InsuranceCompany, IncomeRecord, Transfer, Budget, Document, MenuConfig, AlertSettings, ContactGroup } from '../types';

// --- HELPERS ---
const getFormattedDate = () => new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const mockHash = (password: string) => password.split('').reverse().join('');


// --- AUTHENTICATION API ---
const login = async (email: string, password_raw: string): Promise<{ user: User, token: string }> => {
    await db.initDB();
    const users = await db.getAll('users');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        throw new Error('کاربری با این ایمیل یافت نشد.');
    }

    if (user.passwordHash !== mockHash(password_raw)) {
        throw new Error('رمز عبور اشتباه است.');
    }
    
    const token = `mock-token:${user.id}:${user.email}:${Date.now()}`;
    const { passwordHash, ...userToReturn } = user;
    return { user: userToReturn, token };
};

const signup = async (name: string, email: string, password_raw: string): Promise<{ user: User, token: string }> => {
    await db.initDB();
    const users = await db.getAll('users');
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('این ایمیل قبلا ثبت نام شده است.');
    }

    const newUser: Omit<User, 'id'> = { name, email, passwordHash: mockHash(password_raw), role: UserRole.Accountant };
    const newId = await db.add('users', newUser);
    const createdUser = { ...newUser, id: newId };
    
    const token = `mock-token:${createdUser.id}:${createdUser.email}:${Date.now()}`;
    const { passwordHash, ...userToReturn } = createdUser;
    return { user: userToReturn, token };
};

const getUserFromToken = async (token: string): Promise<User | null> => {
    if (!token.startsWith('mock-token:')) return null;
    const parts = token.split(':');
    if (parts.length < 3) return null;
    const userId = parseInt(parts[1], 10);
    if (isNaN(userId)) return null;
    
    await db.initDB();
    const user = await db.get('users', userId);

    if (user) {
        const { passwordHash, ...userToReturn } = user;
        return userToReturn;
    }
    return null;
};

// --- DATA LOADING & MIGRATION ---
const getAllData = async () => {
    await db.initDB();
    
    const storesToFetch = db.STORE_NAMES.filter(s => s !== 'users');
    const dataPromises = storesToFetch.map(storeName => db.getAll(storeName));
    const allDataArrays = await Promise.all(dataPromises);

    const data: { [key: string]: any[] } = {};
    storesToFetch.forEach((storeName, index) => {
        data[storeName] = allDataArrays[index];
    });
    
    const settingsData = await db.get('settings', 'config');
    data.settings = settingsData ? [settingsData] : [];

    return data;
};

// --- GENERIC CRUD FACTORY ---
const createApiMethods = <T extends { id: any }>(storeName: db.StoreName) => ({
  getAll: async (): Promise<T[]> => db.getAll(storeName) as unknown as Promise<T[]>,
  add: async (item: Omit<T, 'id'>): Promise<T> => { const newId = await db.add(storeName, item); return { ...item, id: newId } as T; },
  update: async (item: T): Promise<T> => { await db.set(storeName, item); return item; },
  remove: async (id: any): Promise<void> => db.remove(storeName, id),
});

// --- API ENDPOINTS ---
const accounts = { ...createApiMethods<Account>('accounts'), update: async(item: Omit<Account, 'id' | 'parentId' | 'type'> & { id: number }) => { const existing = await db.get('accounts', item.id); if(existing) { const updated = {...existing, name: item.name, code: item.code }; await db.set('accounts', updated); return updated;} throw new Error("Account not found"); } };
const patients = createApiMethods<Patient>('patients');
const employees = createApiMethods<Employee>('employees');
const doctors = createApiMethods<Doctor>('doctors');
const suppliers = createApiMethods<Supplier>('suppliers');
const services = createApiMethods<Service>('services');
const invoiceTemplates = createApiMethods<InvoiceTemplate>('invoiceTemplates');
const budgets = createApiMethods<Budget>('budgets');
const documents = createApiMethods<Document>('documents');
const insuranceCompanies = createApiMethods<InsuranceCompany>('insuranceCompanies');
const ledger = createApiMethods<LedgerEntry>('ledger');
const claims = createApiMethods<InsuranceClaim>('claims');
const payslips = createApiMethods<Payslip>('payslips');
const payablesReceivables = createApiMethods<PayableReceivable>('payablesReceivables');

// --- CUSTOM API METHODS ---
const inventory = {
    ...createApiMethods<InventoryItem>('inventory'),
    updateQuantity: async (itemId: number, change: number, type: 'in' | 'out'): Promise<InventoryItem> => {
        const item = await db.get('inventory', itemId);
        if(!item) throw new Error("Inventory item not found");
        const updatedItem = { ...item, quantity: item.quantity + (type === 'in' ? change : -change) };
        await db.set('inventory', updatedItem);
        return updatedItem;
    }
};

const addInvoice = async (invoice: Omit<Invoice, 'id'>) => {
    const newId = `F-${Date.now()}`; // Use default prefix for now
    const newInvoice = { ...invoice, id: newId };
    await db.add('invoices', newInvoice);
    let updatedInventory: InventoryItem[] = [];
    for (const item of newInvoice.items) {
        if (item.type === 'inventory') {
            const updated = await inventory.updateQuantity(item.id, item.quantity, 'out');
            updatedInventory.push(updated);
        }
    }
    return { newInvoice, updatedInventory };
};
const updateInvoice = async (invoice: Invoice) => {
    const originalInvoice = await db.get('invoices', invoice.id);
    const inventoryToUpdate: { [id: number]: { change: number, type: 'in' | 'out' } } = {};

    if (originalInvoice) {
        for (const item of originalInvoice.items) {
            if (item.type === 'inventory') {
                inventoryToUpdate[item.id] = { change: item.quantity, type: 'in' };
            }
        }
    }
    for (const item of invoice.items) {
        if (item.type === 'inventory') {
            const existing = inventoryToUpdate[item.id] || { change: 0, type: 'out' };
            existing.change -= item.quantity;
            if(existing.change > 0) existing.type = 'in'; else { existing.type = 'out'; existing.change = Math.abs(existing.change); }
        }
    }
    let updatedInventory: InventoryItem[] = [];
    for(const [id, op] of Object.entries(inventoryToUpdate)) {
        if (op.change !== 0) {
            const updated = await inventory.updateQuantity(Number(id), op.change, op.type);
            updatedInventory.push(updated);
        }
    }
    await db.set('invoices', invoice);
    return { updatedInvoice: invoice, updatedInventory };
};

const deleteInvoice = async (id: string) => {
    const invoiceToDelete = await db.get('invoices', id);
    if (!invoiceToDelete) return { updatedInventory: [], deletedPaymentIds: [] };

    // 1. Find and delete all related payments and their ledger entries (Cascading Delete)
    const allPayments = await db.getAll('payments');
    const relatedPayments = allPayments.filter(p => p.invoiceId === id);
    const deletedPaymentIds = relatedPayments.map(p => p.id);

    const ledgerDeletePromises = relatedPayments.map(async (payment) => {
        const relatedLedger = (await db.getAll('ledger')).filter(l => l.referenceId === `payment-${payment.id}`);
        await Promise.all(relatedLedger.map(l => db.remove('ledger', l.id)));
    });
    await Promise.all(ledgerDeletePromises);
    await Promise.all(relatedPayments.map(p => db.remove('payments', p.id)));

    // 2. Revert inventory stock levels
    const inventoryUpdatePromises = invoiceToDelete.items
        .filter(item => item.type === 'inventory')
        .map(item => inventory.updateQuantity(item.id, item.quantity, 'in'));
    const updatedInventory = await Promise.all(inventoryUpdatePromises);

    // 3. Delete the invoice itself
    await db.remove('invoices', id);

    return { updatedInventory, deletedPaymentIds };
};


const addPayment = async (payment: Omit<Payment, 'id'>) => {
    const newPaymentId = await db.add('payments', payment);
    const newPayment = { ...payment, id: newPaymentId };
    let newLedgerEntries: LedgerEntry[] = [];
    let updatedInvoice: Invoice | null = null;
    
    const desc = payment.description || (payment.type === 'دریافت' ? 'دریافت وجه' : 'پرداخت وجه');
    const entry1: Omit<LedgerEntry, 'id'> = { date: payment.date, description: desc, accountId: payment.accountId, debit: payment.type === 'دریافت' ? payment.amount : 0, credit: payment.type === 'پرداخت' ? payment.amount : 0, referenceId: `payment-${newPaymentId}` };
    const entry1Id = await db.add('ledger', entry1);
    newLedgerEntries.push({ ...entry1, id: entry1Id });
    
    if(payment.invoiceId) {
        const inv = await db.get('invoices', payment.invoiceId);
        if(inv) {
            const newPaidAmount = inv.paidAmount + payment.amount;
            const isFullyPaid = newPaidAmount >= inv.patientShare;
            const newStatus = isFullyPaid ? 'پرداخت شده' : 'پرداخت ناقص';
            updatedInvoice = { ...inv, paidAmount: newPaidAmount, status: newStatus as Invoice['status'] };
            await db.set('invoices', updatedInvoice);
            
            const entry2: Omit<LedgerEntry, 'id'> = { date: payment.date, description: `تسویه فاکتور: ${payment.invoiceId}`, accountId: 1030, debit: 0, credit: payment.amount, referenceId: `payment-${newPaymentId}` };
            const entry2Id = await db.add('ledger', entry2);
            newLedgerEntries.push({ ...entry2, id: entry2Id });
        }
    }
    
    return { newPayment, newLedgerEntries, updatedInvoice };
};

const updatePayment = async (payment: Payment) => {
    // 1. Get the original state of the payment
    const originalPayment = await db.get('payments', payment.id);
    if (!originalPayment) throw new Error("Payment not found for update.");

    // 2. Reverse the financial effects of the ORIGINAL payment
    let invoiceBeforeUpdate: Invoice | null = null;
    if (originalPayment.invoiceId) {
        const inv = await db.get('invoices', originalPayment.invoiceId);
        if (inv) {
            const newPaidAmount = inv.paidAmount - originalPayment.amount;
            const newStatus = newPaidAmount <= 0 ? 'در انتظار پرداخت' : 'پرداخت ناقص';
            invoiceBeforeUpdate = { ...inv, paidAmount: newPaidAmount, status: newStatus as Invoice['status'] };
            await db.set('invoices', invoiceBeforeUpdate);
        }
    }

    // Delete old ledger entries linked to this payment
    const oldLedgerEntries = (await db.getAll('ledger')).filter(l => l.referenceId === `payment-${payment.id}`);
    const deletedLedgerEntryIds = oldLedgerEntries.map(e => e.id);
    await Promise.all(oldLedgerEntries.map(entry => db.remove('ledger', entry.id)));

    // 3. Apply the financial effects of the NEW payment
    // First, save the new payment data
    await db.set('payments', payment);
    
    // Create new ledger entries for the new payment
    let newLedgerEntries: LedgerEntry[] = [];
    const desc = payment.description || (payment.type === 'دریافت' ? 'دریافت وجه' : 'پرداخت وجه');
    const entry1Id = await db.add('ledger', { date: payment.date, description: desc, accountId: payment.accountId, debit: payment.type === 'دریافت' ? payment.amount : 0, credit: payment.type === 'پرداخت' ? payment.amount : 0, referenceId: `payment-${payment.id}` });
    newLedgerEntries.push({ ...(await db.get('ledger', entry1Id))! });

    // Update the associated invoice with the new payment amount
    let updatedInvoice: Invoice | null = null;
    if(payment.invoiceId) {
        // Use the already-adjusted invoice state if possible, otherwise refetch
        const invToUpdate = (invoiceBeforeUpdate && invoiceBeforeUpdate.id === payment.invoiceId) ? invoiceBeforeUpdate : await db.get('invoices', payment.invoiceId);
        if(invToUpdate) {
            const newPaidAmount = invToUpdate.paidAmount + payment.amount;
            const newStatus = newPaidAmount >= invToUpdate.patientShare ? 'پرداخت شده' : 'پرداخت ناقص';
            updatedInvoice = { ...invToUpdate, paidAmount: newPaidAmount, status: newStatus as Invoice['status'] };
            await db.set('invoices', updatedInvoice);
            
            const entry2Id = await db.add('ledger', { date: payment.date, description: `تسویه فاکتور: ${payment.invoiceId}`, accountId: 1030, debit: 0, credit: payment.amount, referenceId: `payment-${payment.id}` });
            newLedgerEntries.push({ ...(await db.get('ledger', entry2Id))! });
        }
    }

    return { updatedPayment: payment, updatedInvoice, newLedgerEntries, deletedLedgerEntryIds };
};

const deletePayment = async (id: number) => {
    const payment = await db.get('payments', id);
    let updatedInvoice: Invoice | null = null;
    if(payment) {
        if (payment.invoiceId) {
            const inv = await db.get('invoices', payment.invoiceId);
            if(inv) {
                 const newPaidAmount = inv.paidAmount - payment.amount;
                 const newStatus = newPaidAmount <= 0 ? 'در انتظار پرداخت' : newPaidAmount >= inv.patientShare ? 'پرداخت شده' : 'پرداخت ناقص';
                 updatedInvoice = { ...inv, paidAmount: newPaidAmount, status: newStatus as Invoice['status'] };
                 await db.set('invoices', updatedInvoice);
            }
        }
        await db.remove('payments', id);
        const relatedLedger = (await db.getAll('ledger')).filter(l => l.referenceId === `payment-${id}`);
        for (const l of relatedLedger) await db.remove('ledger', l.id);
    }
    return { updatedInvoice };
};

const addExpense = async (expense: Omit<Expense, 'id'>) => {
    const newId = await db.add('expenses', expense);
    const newExpense = { ...expense, id: newId };
    let newLedgerEntries: LedgerEntry[] = [];
    
    const entry1: Omit<LedgerEntry, 'id'> = { date: expense.date, description: expense.description, accountId: expense.expenseAccountId, debit: expense.amount, credit: 0, referenceId: `expense-${newId}`};
    const entry1Id = await db.add('ledger', entry1);
    newLedgerEntries.push({...entry1, id: entry1Id});

    const entry2: Omit<LedgerEntry, 'id'> = { date: expense.date, description: `پرداخت بابت: ${expense.description}`, accountId: expense.fromAccountId, debit: 0, credit: expense.amount, referenceId: `expense-${newId}`};
    const entry2Id = await db.add('ledger', entry2);
    newLedgerEntries.push({...entry2, id: entry2Id});

    return { newExpense, newLedgerEntries };
};
const updateExpense = async (expense: Expense) => {
    const relatedLedger = (await db.getAll('ledger')).filter(l => l.referenceId === `expense-${expense.id}`);
    for (const l of relatedLedger) await db.remove('ledger', l.id);
    // Re-create ledger entries
    await db.add('ledger', { date: expense.date, description: expense.description, accountId: expense.expenseAccountId, debit: expense.amount, credit: 0, referenceId: `expense-${expense.id}`});
    await db.add('ledger', { date: expense.date, description: `پرداخت بابت: ${expense.description}`, accountId: expense.fromAccountId, debit: 0, credit: expense.amount, referenceId: `expense-${expense.id}`});
    await db.set('expenses', expense);
    return expense;
};
const deleteExpense = async (id: number) => {
    await db.remove('expenses', id);
    const relatedLedger = (await db.getAll('ledger')).filter(l => l.referenceId === `expense-${id}`);
    for (const l of relatedLedger) await db.remove('ledger', l.id);
};

const addTransfer = async (transfer: Omit<Transfer, 'id'>) => {
    const newId = await db.add('transfers', transfer);
    const newTransfer = { ...transfer, id: newId };
    let newLedgerEntries: LedgerEntry[] = [];
    const desc = transfer.description || `انتقال وجه`;
    
    const entry1Id = await db.add('ledger', { date: transfer.date, description: `برداشت: ${desc}`, accountId: transfer.fromAccountId, debit: 0, credit: transfer.amount, referenceId: `transfer-${newId}`});
    newLedgerEntries.push({...(await db.get('ledger', entry1Id))!});

    const entry2Id = await db.add('ledger', { date: transfer.date, description: `واریز: ${desc}`, accountId: transfer.toAccountId, debit: transfer.amount, credit: 0, referenceId: `transfer-${newId}`});
    newLedgerEntries.push({...(await db.get('ledger', entry2Id))!});

    return { newTransfer, newLedgerEntries };
};
const updateTransfer = async (transfer: Transfer) => {
    const relatedLedger = (await db.getAll('ledger')).filter(l => l.referenceId === `transfer-${transfer.id}`);
    for (const l of relatedLedger) await db.remove('ledger', l.id);
    const desc = transfer.description || `انتقال وجه`;
    await db.add('ledger', { date: transfer.date, description: `برداشت: ${desc}`, accountId: transfer.fromAccountId, debit: 0, credit: transfer.amount, referenceId: `transfer-${transfer.id}`});
    await db.add('ledger', { date: transfer.date, description: `واریز: ${desc}`, accountId: transfer.toAccountId, debit: transfer.amount, credit: 0, referenceId: `transfer-${transfer.id}`});
    await db.set('transfers', transfer);
    return transfer;
};
const deleteTransfer = async (id: number) => {
    await db.remove('transfers', id);
    const relatedLedger = (await db.getAll('ledger')).filter(l => l.referenceId === `transfer-${id}`);
    for (const l of relatedLedger) await db.remove('ledger', l.id);
};

const addIncomeRecord = async (record: Omit<IncomeRecord, 'id' | 'paymentId'>) => {
    const { newPayment, newLedgerEntries } = await addPayment({
        date: record.date, amount: record.totalAmount, method: record.paymentMethod, type: 'دریافت',
        description: record.description || 'ثبت درآمد روزانه', entityId: 'custom-income', accountId: record.paymentAccountId,
    });
    
    const newId = await db.add('incomeRecords', { ...record, paymentId: newPayment.id });
    const newRecord = { ...record, paymentId: newPayment.id, id: newId };
    
    let updatedInventory: InventoryItem[] = [];
    for (const item of record.items) {
        if (item.type === 'inventory') {
            const updated = await inventory.updateQuantity(item.id, item.quantity, 'out');
            updatedInventory.push(updated);
        }
    }
    return { newRecord, newPayment, newLedgerEntries, updatedInventory };
};
const updateClaim = async(claim: InsuranceClaim) => {
    const originalClaim = await db.get('claims', claim.id);
    let newLedgerEntries: LedgerEntry[] | null = null;
    if (originalClaim?.status !== 'پرداخت شده' && claim.status === 'پرداخت شده' && claim.receivedAmount) {
        newLedgerEntries = [];
        const entry1Id = await db.add('ledger', { date: claim.receivedDate || getFormattedDate(), description: `دریافت وجه از بیمه #${claim.id}`, accountId: 1020, debit: claim.receivedAmount, credit: 0, referenceId: `claim-${claim.id}`});
        newLedgerEntries.push((await db.get('ledger', entry1Id))!);
        const entry2Id = await db.add('ledger', { date: claim.receivedDate || getFormattedDate(), description: `تسویه مطالبات بیمه #${claim.id}`, accountId: 1030, debit: 0, credit: claim.receivedAmount, referenceId: `claim-${claim.id}`});
        newLedgerEntries.push((await db.get('ledger', entry2Id))!);
    }
    await db.set('claims', claim);
    return { updatedClaim: claim, newLedgerEntries };
};

const payPayslip = async (payslipId: number, paymentAccountId: number, paymentMethod: string) => {
    const payslip = await db.get('payslips', payslipId);
    if (!payslip || payslip.status === 'پرداخت شده') throw new Error("Payslip not found or already paid");
    
    const { newPayment, newLedgerEntries } = await addPayment({
        date: getFormattedDate(), amount: payslip.netPayable, method: paymentMethod, type: 'پرداخت',
        description: `پرداخت حقوق ${payslip.payPeriod} به ${payslip.employeeName}`,
        entityId: `employee-${payslip.employeeId}`, accountId: paymentAccountId,
    });
    const updatedPayslip = { ...payslip, status: 'پرداخت شده' as const, paymentId: newPayment.id };
    await db.set('payslips', updatedPayslip);
    
    return { updatedPayslip, newPayment, newLedgerEntries };
};

const generateDueEmployeePayslips = async (): Promise<Payslip[]> => {
    const today = getFormattedDate();
    const todaySortable = parseInt(today.replace(/\//g, ''), 10);

    const employees = await db.getAll('employees');
    const allPayslips = await db.getAll('payslips');
    const newPayslips: Payslip[] = [];

    for (const employee of employees) {
        if (!employee.nextPaymentDate) continue;

        const dueDateSortable = parseInt(employee.nextPaymentDate.replace(/\//g, ''), 10);

        if (dueDateSortable <= todaySortable) {
            const [year, month, day] = employee.nextPaymentDate.split('/').map(Number);
            const payPeriod = `${new Intl.DateTimeFormat('fa-IR', { month: 'long' }).format(new Date(year, month - 1, day))} ${year}`;
            
            const existingPayslip = allPayslips.find(p => p.employeeId === employee.id && p.payPeriod === payPeriod);

            if (!existingPayslip) {
                const baseSalary = employee.salaryType === 'hourly' 
                    ? (employee.defaultMonthlyHours || 160) * employee.baseSalary 
                    : employee.baseSalary;
                
                const totalEarnings = baseSalary + (employee.housingAllowance || 0) + (employee.childAllowance || 0);
                const taxDeduction = totalEarnings * (employee.taxRate / 100);
                const totalDeductions = taxDeduction + (employee.insuranceDeduction || 0);
                const netPayable = totalEarnings - totalDeductions;
                
                const newPayslipData: Omit<Payslip, 'id'> = {
                    employeeId: employee.id, employeeName: employee.name, date: today, payPeriod,
                    baseSalary,
                    hoursWorked: employee.salaryType === 'hourly' ? employee.defaultMonthlyHours || 160 : undefined,
                    housingAllowance: employee.housingAllowance || 0, childAllowance: employee.childAllowance || 0,
                    commissionTotal: 0, otherAllowances: 0, totalEarnings, taxDeduction,
                    insuranceDeduction: employee.insuranceDeduction || 0, otherDeductions: 0, advanceDeduction: 0,
                    totalDeductions, netPayable, status: 'در انتظار پرداخت',
                };
                const newId = await db.add('payslips', newPayslipData);
                newPayslips.push({ ...newPayslipData, id: newId });

                const nextDate = new Date(year, month, day); // JS Date month is 0-indexed
                const nextMonthDate = new Date(nextDate.setMonth(nextDate.getMonth() + 1));
                employee.nextPaymentDate = new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(nextMonthDate);
                await db.set('employees', employee);
            }
        }
    }
    return newPayslips;
};

const markAsPaid = async (id: number, paymentMethod: string, paymentAccountId: number) => {
    const item = await db.get('payablesReceivables', id);
    if (!item) throw new Error("Item not found");
    const { newPayment, newLedgerEntries } = await addPayment({
        date: getFormattedDate(), amount: item.amount, method: paymentMethod, type: item.type === 'payable' ? 'پرداخت' : 'دریافت',
        description: `تسویه حساب: ${item.description}`, entityId: item.entityId, accountId: paymentAccountId, payableReceivableId: item.id
    });
    const updatedPR = { ...item, status: 'پرداخت شده' as const, paymentId: newPayment.id };
    await db.set('payablesReceivables', updatedPR);
    return { updatedPR, newPayment, newLedgerEntries };
};


// --- SETTINGS API ---
export type SettingsPayload = Partial<{
    clinicName: string; clinicAddress: string; clinicPhone: string; clinicLogo: string;
    invoicePrefix: string; menuConfig: MenuConfig[]; paymentMethods: string[];
    contactGroups: ContactGroup[]; alertSettings: AlertSettings;
}>
const updateSettings = async (payload: SettingsPayload) => {
    const currentSettings = await db.get('settings', 'config') || { id: 'config' };
    const newSettings = { ...currentSettings, ...payload };
    await db.set('settings', newSettings, 'config');
    return newSettings;
};


// --- DATA MANAGEMENT & TAGGING ---
const backupData = async (): Promise<string> => {
    const backup: { [key: string]: any } = {};
    for (const storeName of db.STORE_NAMES) {
      backup[storeName] = await db.getAll(storeName);
    }
    return JSON.stringify(backup, null, 2);
};

const restoreData = async (jsonData: string) => {
    const data = JSON.parse(jsonData);
    for (const storeName of db.STORE_NAMES) {
      await db.clear(storeName);
      if (data[storeName]) {
        for (const item of data[storeName]) {
           await db.set(storeName, item);
        }
      }
    }
};

const updateTags = async (entityType: string, entityId: number | string, tags: string[]) => {
    const storeMap: { [key: string]: { store: db.StoreName, api: any } } = {
        patient: { store: 'patients', api: patients },
        employee: { store: 'employees', api: employees },
        doctor: { store: 'doctors', api: doctors },
        supplier: { store: 'suppliers', api: suppliers },
        invoice: { store: 'invoices', api: { update: updateInvoice } },
        expense: { store: 'expenses', api: {update: updateExpense} },
        payment: { store: 'payments', api: { update: updatePayment } },
        transfer: { store: 'transfers', api: { update: updateTransfer } },
        payableReceivable: { store: 'payablesReceivables', api: payablesReceivables },
        document: { store: 'documents', api: documents },
    };
    const entityInfo = storeMap[entityType];
    if(entityInfo){
        const item = await db.get(entityInfo.store, entityId);
        if(item) {
            const updatedItem = { ...item, tags };
            const result = await entityInfo.api.update(updatedItem);
            // Handle complex return types from update functions
            const mainUpdatedItem = result.updatedInvoice || result.updatedPayment || result;
            return mainUpdatedItem;
        }
    }
    throw new Error(`Invalid entity type for tagging: ${entityType}`);
};


// --- API Function Map ---
// This object maps string keys (sent from the API client) to the actual functions.
const serverApi = {
    login, signup, getUserFromToken, getAllData,
    accounts, patients, employees, doctors, suppliers, services,
    invoiceTemplates, budgets, documents, insuranceCompanies, ledger, claims,
    payslips, payablesReceivables, inventory,
    addInvoice, updateInvoice, deleteInvoice,
    addPayment, updatePayment, deletePayment,
    addExpense, updateExpense, deleteExpense,
    addTransfer, updateTransfer, deleteTransfer,
    addIncomeRecord, updateClaim, payPayslip,
    generateDueEmployeePayslips, markAsPaid,
    updateSettings, backupData, restoreData, updateTags
};


// --- WORKER MESSAGE HANDLER ---
// This is the entry point for all requests from the main thread (api.ts).
self.onmessage = async (event: MessageEvent) => {
    const { action, payload, id } = event.data;

    try {
        // Resolve the function to be called based on the action string (e.g., 'accounts.add')
        const actionParts = action.split('.');
        let func: any = serverApi;
        for (const part of actionParts) {
            if (func && typeof func === 'object' && part in func) {
                func = func[part];
            } else {
                throw new Error(`Action part "${part}" not found in action "${action}".`);
            }
        }

        if (typeof func !== 'function') {
            throw new Error(`Action "${action}" is not a function.`);
        }
        
        // Call the resolved function with the provided arguments
        const result = await func(...payload);
        
        // Post the successful result back to the main thread
        self.postMessage({ id, payload: result });
    } catch (error: any) {
        // If an error occurs, post the error message back to the main thread
        self.postMessage({ id, error: error.message || 'An unknown error occurred in the worker.' });
    }
};