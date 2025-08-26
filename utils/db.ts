import { openDB, DBSchema, IDBPDatabase, IDBPTransaction } from 'https://esm.sh/idb@8.0.0';
import { Account, Patient, Service, Invoice, Payment, InsuranceClaim, InventoryItem, Employee, InvoiceTemplate, LedgerEntry, Payslip, Supplier, Expense, PayableReceivable, Doctor, InsuranceCompany, IncomeRecord, Transfer, Budget, MenuConfig, UserRole, ContactGroup, AlertSettings, Document, User } from '../types';
import { mockUsers, mockChartOfAccounts, mockPatients, mockServices, mockInvoices, mockPayments, mockClaims, mockInventory, mockEmployees, mockInvoiceTemplates, mockLedger, mockPayslips, mockExpenses, mockSuppliers, mockPayablesReceivables, mockDoctors, mockInsuranceCompanies, mockIncomeRecords, mockTransfers, mockBudgets, mockDocuments } from '../data/mockData';

const DB_NAME = 'ClinicAccountingDB';
const DB_VERSION = 3;

export const STORE_NAMES = [
  'users', 'accounts', 'patients', 'services', 'invoices', 'payments', 'claims',
  'inventory', 'employees', 'invoiceTemplates', 'ledger', 'payslips',
  'suppliers', 'expenses', 'payablesReceivables', 'doctors',
  'insuranceCompanies', 'incomeRecords', 'transfers', 'budgets', 'settings',
  'documents'
] as const;

export type StoreName = typeof STORE_NAMES[number];

interface ClinicDB extends DBSchema {
  users: { key: number; value: User & { id: number } };
  accounts: { key: number; value: Account & { id: number } };
  patients: { key: number; value: Patient & { id: number } };
  services: { key: number; value: Service & { id: number } };
  invoices: { key: string; value: Invoice & { id: string } };
  payments: { key: number; value: Payment & { id: number } };
  claims: { key: number; value: InsuranceClaim & { id: number } };
  inventory: { key: number; value: InventoryItem & { id: number } };
  employees: { key: number; value: Employee & { id: number } };
  invoiceTemplates: { key: number; value: InvoiceTemplate & { id: number } };
  ledger: { key: number; value: LedgerEntry & { id: number } };
  payslips: { key: number; value: Payslip & { id: number } };
  suppliers: { key: number; value: Supplier & { id: number } };
  expenses: { key: number; value: Expense & { id: number } };
  payablesReceivables: { key: number; value: PayableReceivable & { id: number } };
  doctors: { key: number; value: Doctor & { id: number } };
  insuranceCompanies: { key: number; value: InsuranceCompany & { id: number } };
  incomeRecords: { key: number; value: IncomeRecord & { id: number } };
  transfers: { key: number; value: Transfer & { id: number } };
  budgets: { key: number; value: Budget & { id: number } };
  documents: { key: number; value: Document & { id: number } };
  settings: { 
    key: string; 
    value: {
        id: string; 
        clinicName: string; clinicAddress: string; clinicPhone: string; clinicLogo: string;
        invoicePrefix: string; menuConfig: MenuConfig[]; paymentMethods: string[];
        contactGroups: ContactGroup[]; alertSettings: AlertSettings; userRole: UserRole | null;
    } 
  };
}

let db: IDBPDatabase<ClinicDB>;

const getMockDataForStore = (storeName: StoreName) => {
    const mockDataMap: { [key in StoreName]?: any[] } = {
        users: mockUsers, accounts: mockChartOfAccounts, ledger: mockLedger, patients: mockPatients, employees: mockEmployees, doctors: mockDoctors,
        suppliers: mockSuppliers, services: mockServices, inventory: mockInventory, invoices: mockInvoices, payments: mockPayments, expenses: mockExpenses,
        claims: mockClaims, invoiceTemplates: mockInvoiceTemplates, payslips: mockPayslips, payablesReceivables: mockPayablesReceivables,
        insuranceCompanies: mockInsuranceCompanies, incomeRecords: mockIncomeRecords, transfers: mockTransfers, budgets: mockBudgets, documents: mockDocuments
    };
    return mockDataMap[storeName];
}

const seedDatabase = (transaction: IDBPTransaction<ClinicDB, StoreName[], "versionchange">) => {
    console.log("Seeding database with initial mock data...");
    STORE_NAMES.forEach(storeName => {
        const mockData = getMockDataForStore(storeName);
        if (mockData) {
            const store = transaction.objectStore(storeName);
            mockData.forEach(item => {
                store.add(item);
            });
        }
    });
    console.log("Database seeding complete.");
};


export async function initDB() {
  if (db) return;

  db = await openDB<ClinicDB>(DB_NAME, DB_VERSION, {
    upgrade(database, oldVersion, newVersion, transaction) {
      console.log(`Upgrading database from version ${oldVersion} to ${newVersion}...`);
      
      // Create stores that may not exist
      STORE_NAMES.forEach(storeName => {
        if (!database.objectStoreNames.contains(storeName)) {
           console.log(`Creating store: ${storeName}`);
           if(storeName === 'settings' || storeName === 'invoices') {
                database.createObjectStore(storeName, { keyPath: 'id' });
           } else {
                database.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
           }
        }
      });

      // This logic now guarantees that if the database is being created for the first time (oldVersion is 0),
      // it gets populated with the essential starting data, including the admin user.
      // This prevents login issues on the first run or after clearing browser data.
      if (oldVersion === 0) {
        seedDatabase(transaction);
      }
    },
  });
}

// Generic CRUD operations

export async function getAll<T extends StoreName>(storeName: T): Promise<ClinicDB[T]['value'][]> {
  return db.getAll(storeName);
}

export async function get<T extends StoreName>(storeName: T, key: any): Promise<ClinicDB[T]['value'] | undefined> {
  return db.get(storeName, key);
}

export async function add<T extends StoreName>(storeName: T, value: any): Promise<any> {
  return db.add(storeName, value);
}

export async function set<T extends StoreName>(storeName: T, value: any, key?: any): Promise<any> {
    return db.put(storeName, value, key);
}


export async function remove<T extends StoreName>(storeName: T, key: any): Promise<void> {
  return db.delete(storeName, key);
}

export async function clear(storeName: StoreName): Promise<void> {
    return db.clear(storeName);
}