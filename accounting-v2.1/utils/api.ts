import type { User, Account, Patient, Service, Invoice, Payment, InsuranceClaim, InventoryItem, Employee, InvoiceTemplate, LedgerEntry, Payslip, Supplier, Expense, PayableReceivable, Doctor, InsuranceCompany, IncomeRecord, Transfer, Budget, Document, MenuConfig, AlertSettings, ContactGroup } from '../types';
import workerUrl from '/utils/backend.worker.ts?url';

// This type definition is duplicated from the backend worker for convenience.
// In a real project with a shared codebase, it would come from a shared types package.
export type SettingsPayload = Partial<{
    clinicName: string; clinicAddress: string; clinicPhone: string; clinicLogo: string;
    invoicePrefix: string; menuConfig: MenuConfig[]; paymentMethods: string[];
    contactGroups: ContactGroup[]; alertSettings: AlertSettings;
}>;


// --- STAGE 1: WEB WORKER (OFFLINE MODE) ---
// The application is currently using a Web Worker to simulate a backend.
// This allows for a fully functional offline experience.
const worker = new Worker(workerUrl, {
  type: 'module',
});

const pendingRequests = new Map<number, { resolve: (value: any) => void; reject: (reason?: any) => void }>();
let requestIdCounter = 0;

worker.onmessage = (event: MessageEvent) => {
    const { id, payload, error } = event.data;
    const request = pendingRequests.get(id);

    if (request) {
        if (error) {
            request.reject(new Error(error));
        } else {
            request.resolve(payload);
        }
        pendingRequests.delete(id);
    }
};

worker.onerror = (error) => {
    console.error("Critical Worker Error:", error);
    for (const [id, request] of pendingRequests.entries()) {
        request.reject(new Error("Worker terminated unexpectedly."));
        pendingRequests.delete(id);
    }
};

function callWorker<T>(action: string, args: any[]): Promise<T> {
    const id = requestIdCounter++;
    return new Promise((resolve, reject) => {
        pendingRequests.set(id, { resolve, reject });
        worker.postMessage({ action, payload: args, id });
    });
}


// --- STAGE 2: REAL HTTP API (ONLINE MODE) ---
// To take the application online, you will switch from `callWorker` to `callApi`.
// 1. Build your backend server (e.g., using Node.js/Express).
// 2. Host it somewhere to get a base URL.
// 3. Replace the `API_BASE_URL` with your server's address.
// 4. In each function below, comment out the `callWorker` line and uncomment the `callApi` line.

const API_BASE_URL = 'http://localhost:3001/api'; // Replace with your actual backend URL

async function callApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                // You would also include an authorization header here
                // 'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            ...options
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error: ${response.status}`);
        }
        
        // Handle responses that might not have a body (e.g., DELETE requests)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
        } else {
            return undefined as T; 
        }

    } catch (error) {
        console.error(`API call to ${endpoint} failed:`, error);
        throw error;
    }
}


// --- API Client Implementation ---
// Each function is now set up to be easily switched to online mode.

// --- AUTHENTICATION API ---
export const login = (email: string, pass: string) => {
    return callWorker<{ user: User, token: string }>('login', [email, pass]);
    // return callApi<{ user: User, token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, pass }) });
};
export const signup = (name: string, email: string, pass: string) => {
    return callWorker<{ user: User, token: string }>('signup', [name, email, pass]);
    // return callApi<{ user: User, token: string }>('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, pass }) });
};
export const getUserFromToken = (token: string) => {
    return callWorker<User | null>('getUserFromToken', [token]);
    // The real implementation would be handled by your backend based on the Authorization header.
    // This function might change to `getProfile()` or similar.
    // return callApi<User | null>('/auth/me', { method: 'GET' });
};

// --- DATA LOADING ---
export const getAllData = () => {
    return callWorker<any>('getAllData', []);
    // In online mode, you'd fetch each data type individually in your context or have a dedicated endpoint.
    // return callApi<any>('/data/all', { method: 'GET' });
};

// --- API ENDPOINTS (structured to match the backend) ---
export const accounts = {
    getAll: () => callWorker<Account[]>('accounts.getAll', []), // callApi<Account[]>('/accounts'),
    add: (item: Omit<Account, 'id'>) => callWorker<Account>('accounts.add', [item]), // callApi<Account>('/accounts', { method: 'POST', body: JSON.stringify(item) }),
    update: (item: Omit<Account, 'id' | 'parentId' | 'type'> & { id: number }) => callWorker<Account>('accounts.update', [item]), // callApi<Account>(`/accounts/${item.id}`, { method: 'PUT', body: JSON.stringify(item) }),
    remove: (id: any) => callWorker<void>('accounts.remove', [id]), // callApi<void>(`/accounts/${id}`, { method: 'DELETE' }),
};

export const patients = {
    getAll: () => callWorker<Patient[]>('patients.getAll', []), // callApi<Patient[]>('/patients'),
    add: (item: Omit<Patient, 'id'>) => callWorker<Patient>('patients.add', [item]), // callApi<Patient>('/patients', { method: 'POST', body: JSON.stringify(item) }),
    update: (item: Patient) => callWorker<Patient>('patients.update', [item]), // callApi<Patient>(`/patients/${item.id}`, { method: 'PUT', body: JSON.stringify(item) }),
    remove: (id: number) => callWorker<void>('patients.remove', [id]), // callApi<void>(`/patients/${id}`, { method: 'DELETE' }),
};
// ... Repeat this pattern for all other simple CRUD operations ...
export const employees = {
    getAll: () => callWorker<Employee[]>('employees.getAll', []),
    add: (item: Omit<Employee, 'id'>) => callWorker<Employee>('employees.add', [item]),
    update: (item: Employee) => callWorker<Employee>('employees.update', [item]),
    remove: (id: number) => callWorker<void>('employees.remove', [id]),
};

export const doctors = {
    getAll: () => callWorker<Doctor[]>('doctors.getAll', []),
    add: (item: Omit<Doctor, 'id'>) => callWorker<Doctor>('doctors.add', [item]),
    update: (item: Doctor) => callWorker<Doctor>('doctors.update', [item]),
    remove: (id: number) => callWorker<void>('doctors.remove', [id]),
};

export const suppliers = {
    getAll: () => callWorker<Supplier[]>('suppliers.getAll', []),
    add: (item: Omit<Supplier, 'id'>) => callWorker<Supplier>('suppliers.add', [item]),
    update: (item: Supplier) => callWorker<Supplier>('suppliers.update', [item]),
    remove: (id: number) => callWorker<void>('suppliers.remove', [id]),
};

export const services = {
    getAll: () => callWorker<Service[]>('services.getAll', []),
    add: (item: Omit<Service, 'id'>) => callWorker<Service>('services.add', [item]),
    update: (item: Service) => callWorker<Service>('services.update', [item]),
    remove: (id: number) => callWorker<void>('services.remove', [id]),
};

export const invoiceTemplates = {
    getAll: () => callWorker<InvoiceTemplate[]>('invoiceTemplates.getAll', []),
    add: (item: Omit<InvoiceTemplate, 'id'>) => callWorker<InvoiceTemplate>('invoiceTemplates.add', [item]),
    update: (item: InvoiceTemplate) => callWorker<InvoiceTemplate>('invoiceTemplates.update', [item]),
    remove: (id: number) => callWorker<void>('invoiceTemplates.remove', [id]),
};

export const budgets = {
    getAll: () => callWorker<Budget[]>('budgets.getAll', []),
    add: (item: Omit<Budget, 'id'>) => callWorker<Budget>('budgets.add', [item]),
    update: (item: Budget) => callWorker<Budget>('budgets.update', [item]),
    remove: (id: number) => callWorker<void>('budgets.remove', [id]),
};

export const documents = {
    getAll: () => callWorker<Document[]>('documents.getAll', []),
    add: (item: Omit<Document, 'id'>) => callWorker<Document>('documents.add', [item]),
    update: (item: Document) => callWorker<Document>('documents.update', [item]),
    remove: (id: number) => callWorker<void>('documents.remove', [id]),
};

export const insuranceCompanies = {
    getAll: () => callWorker<InsuranceCompany[]>('insuranceCompanies.getAll', []),
    add: (item: Omit<InsuranceCompany, 'id'>) => callWorker<InsuranceCompany>('insuranceCompanies.add', [item]),
    update: (item: InsuranceCompany) => callWorker<InsuranceCompany>('insuranceCompanies.update', [item]),
    remove: (id: number) => callWorker<void>('insuranceCompanies.remove', [id]),
};

export const ledger = {
    getAll: () => callWorker<LedgerEntry[]>('ledger.getAll', []),
    add: (item: Omit<LedgerEntry, 'id'>) => callWorker<LedgerEntry>('ledger.add', [item]),
    remove: (id: number) => callWorker<void>('ledger.remove', [id]),
};

export const claims = {
    getAll: () => callWorker<InsuranceClaim[]>('claims.getAll', []),
    add: (item: Omit<InsuranceClaim, 'id'>) => callWorker<InsuranceClaim>('claims.add', [item]),
    remove: (id: number) => callWorker<void>('claims.remove', [id]),
};

export const payslips = {
    getAll: () => callWorker<Payslip[]>('payslips.getAll', []),
    add: (item: Omit<Payslip, 'id'>) => callWorker<Payslip>('payslips.add', [item]),
    update: (item: Payslip) => callWorker<Payslip>('payslips.update', [item]),
    remove: (id: number) => callWorker<void>('payslips.remove', [id]),
};

export const payablesReceivables = {
    getAll: () => callWorker<PayableReceivable[]>('payablesReceivables.getAll', []),
    add: (item: Omit<PayableReceivable, 'id'>) => callWorker<PayableReceivable>('payablesReceivables.add', [item]),
    update: (item: PayableReceivable) => callWorker<PayableReceivable>('payablesReceivables.update', [item]),
    remove: (id: number) => callWorker<void>('payablesReceivables.remove', [id]),
};


// --- CUSTOM/COMPLEX API METHODS ---
export const inventory = {
    getAll: () => callWorker<InventoryItem[]>('inventory.getAll', []), // callApi<InventoryItem[]>('/inventory'),
    add: (item: Omit<InventoryItem, 'id'>) => callWorker<InventoryItem>('inventory.add', [item]), // callApi<InventoryItem>('/inventory', { method: 'POST', body: JSON.stringify(item) }),
    update: (item: InventoryItem) => callWorker<InventoryItem>('inventory.update', [item]), // callApi<InventoryItem>(`/inventory/${item.id}`, { method: 'PUT', body: JSON.stringify(item) }),
    remove: (id: number) => callWorker<void>('inventory.remove', [id]), // callApi<void>(`/inventory/${id}`, { method: 'DELETE' }),
    updateQuantity: (itemId: number, change: number, type: 'in' | 'out') => callWorker<InventoryItem>('inventory.updateQuantity', [itemId, change, type]), // callApi<InventoryItem>(`/inventory/${itemId}/quantity`, { method: 'POST', body: JSON.stringify({ change, type }) }),
};

export const addInvoice = (invoice: Omit<Invoice, 'id'>) => callWorker<any>('addInvoice', [invoice]); // callApi<any>('/invoices', { method: 'POST', body: JSON.stringify(invoice) });
export const updateInvoice = (invoice: Invoice) => callWorker<any>('updateInvoice', [invoice]); // callApi<any>(`/invoices/${invoice.id}`, { method: 'PUT', body: JSON.stringify(invoice) });
export const deleteInvoice = (id: string) => callWorker<any>('deleteInvoice', [id]); // callApi<any>(`/invoices/${id}`, { method: 'DELETE' });

export const addPayment = (payment: Omit<Payment, 'id'>) => callWorker<any>('addPayment', [payment]);
export const updatePayment = (payment: Payment) => callWorker<any>('updatePayment', [payment]);
export const deletePayment = (id: number) => callWorker<any>('deletePayment', [id]);

export const addExpense = (expense: Omit<Expense, 'id'>) => callWorker<any>('addExpense', [expense]);
export const updateExpense = (expense: Expense) => callWorker<any>('updateExpense', [expense]);
export const deleteExpense = (id: number) => callWorker<void>('deleteExpense', [id]);

export const addTransfer = (transfer: Omit<Transfer, 'id'>) => callWorker<any>('addTransfer', [transfer]);
export const updateTransfer = (transfer: Transfer) => callWorker<Transfer>('updateTransfer', [transfer]);
export const deleteTransfer = (id: number) => callWorker<void>('deleteTransfer', [id]);

export const addIncomeRecord = (record: Omit<IncomeRecord, 'id' | 'paymentId'>) => callWorker<any>('addIncomeRecord', [record]);
export const updateClaim = (claim: InsuranceClaim) => callWorker<any>('updateClaim', [claim]);
export const payPayslip = (payslipId: number, paymentAccountId: number, paymentMethod: string) => callWorker<any>('payPayslip', [payslipId, paymentAccountId, paymentMethod]);
export const markAsPaid = (id: number, paymentMethod: string, paymentAccountId: number) => callWorker<any>('markAsPaid', [id, paymentMethod, paymentAccountId]);
export const generateDueEmployeePayslips = () => callWorker<Payslip[]>('generateDueEmployeePayslips', []);

// --- SETTINGS API ---
export const updateSettings = (payload: SettingsPayload) => callWorker<any>('updateSettings', [payload]); // callApi<any>('/settings', { method: 'POST', body: JSON.stringify(payload) });

// --- DATA MANAGEMENT & TAGGING ---
export const backupData = () => callWorker<string>('backupData', []); // This would be a backend-only function in online mode.
export const restoreData = (jsonData: string) => callWorker<void>('restoreData', [jsonData]); // This would be a backend-only function in online mode.
export const updateTags = (entityType: string, entityId: number | string, tags: string[]) => callWorker<any>('updateTags', [entityType, entityId, tags]); // callApi<any>(`/${entityType}/${entityId}/tags`, { method: 'PUT', body: JSON.stringify({ tags }) });