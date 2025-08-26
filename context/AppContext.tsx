
import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { Account, AlertSettings, Expense, Patient, Service, Invoice, Payment, InsuranceClaim, InventoryItem, Employee, InvoiceTemplate, LedgerEntry, Payslip, Supplier, Contact, ContactType, PayableReceivable, ContactGroup, MainAccountType, Doctor, MenuConfig, User, IncomeRecord, Transfer, Budget, Document, InsuranceCompany } from '../types';
import { NAV_LINKS } from '../constants';
import * as api from '../utils/api';

// --- HELPERS ---
const getFormattedDate = () => new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const formatCurrency = (value: number) => value.toLocaleString('fa-IR');

// --- CONTEXT TYPE ---
interface AppContextType {
  getFormattedDate: () => string;
  formatCurrency: (value: number) => string;

  // Auth
  currentUser: User | null;
  isAuthLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  
  // Settings
  clinicName: string;
  setClinicName: (name: string) => Promise<void>;
  clinicAddress: string;
  setClinicAddress: (address: string) => Promise<void>;
  clinicPhone: string;
  setClinicPhone: (phone: string) => Promise<void>;
  clinicLogo: string;
  setClinicLogo: (logoUrl: string) => Promise<void>;
  invoicePrefix: string;
  setInvoicePrefix: (prefix: string) => Promise<void>;
  menuConfig: MenuConfig[];
  updateMenuConfig: (config: MenuConfig[]) => Promise<void>;
  paymentMethods: string[];
  addPaymentMethod: (method: string) => Promise<void>;
  deletePaymentMethod: (method: string) => Promise<void>;
  insuranceCompanies: InsuranceCompany[];
  addInsuranceCompany: (name: string) => Promise<void>;
  deleteInsuranceCompany: (id: number) => Promise<void>;
  contactGroups: ContactGroup[];
  addContactGroup: (groupName: string) => Promise<void>;
  deleteContactGroup: (groupId: string) => Promise<void>;
  mainAccountTypes: MainAccountType[];
  backupData: () => Promise<string>;
  restoreData: (jsonData: string) => Promise<void>;

  // Core Finance
  chartOfAccounts: Account[];
  getAccountBalance: (accountId: number) => number;
  getAccountBalanceWithChildren: (accountId: number) => number;
  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  updateAccount: (account: Omit<Account, 'id' | 'parentId' | 'type'> & { id: number }) => Promise<void>;
  ledger: LedgerEntry[];
  addSingleLedgerEntry: (entry: Omit<LedgerEntry, 'id'>) => Promise<void>;
  deleteLedgerEntry: (id: number) => Promise<void>;

  // Entities
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id'>) => Promise<void>;
  updatePatient: (patient: Patient) => Promise<void>;
  deletePatient: (id: number) => Promise<void>;

  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (employee: Employee) => Promise<void>;
  deleteEmployee: (id: number) => Promise<void>;

  doctors: Doctor[];
  addDoctor: (doctor: Omit<Doctor, 'id'>) => Promise<void>;
  updateDoctor: (doctor: Doctor) => Promise<void>;
  deleteDoctor: (id: number) => Promise<void>;

  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (id: number) => Promise<void>;

  contacts: Contact[];
  
  // Services & Inventory
  services: Service[];
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (service: Service) => Promise<void>;
  deleteService: (id: number) => Promise<void>;
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateInventoryItem: (item: InventoryItem) => Promise<void>;
  updateInventoryQuantity: (itemId: number, change: number, type: 'in' | 'out') => Promise<void>;
  deleteInventoryItem: (id: number) => Promise<void>;

  // Operations
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id'>) => Promise<void>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  payments: Payment[];
  addPayment: (payment: Omit<Payment, 'id'>) => Promise<void>;
  updatePayment: (payment: Payment) => Promise<void>;
  deletePayment: (id: number) => Promise<void>;
  incomeRecords: IncomeRecord[];
  addIncomeRecord: (record: Omit<IncomeRecord, 'id' | 'paymentId'>) => Promise<void>;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
  transfers: Transfer[];
  addTransfer: (transfer: Omit<Transfer, 'id'>) => Promise<void>;
  updateTransfer: (transfer: Transfer) => Promise<void>;
  deleteTransfer: (id: number) => Promise<void>;
  payablesReceivables: PayableReceivable[];
  addPayableReceivable: (item: Omit<PayableReceivable, 'id'>) => Promise<void>;
  updatePayableReceivable: (item: PayableReceivable) => Promise<void>;
  markAsPaid: (id: number, paymentMethod: string, paymentAccountId: number) => Promise<void>;
  deletePayableReceivable: (id: number) => Promise<void>;
  claims: InsuranceClaim[];
  addClaim: (claim: Omit<InsuranceClaim, 'id'>) => Promise<void>;
  updateClaim: (claim: InsuranceClaim) => Promise<void>;
  deleteClaim: (id: number) => Promise<void>;
  invoiceTemplates: InvoiceTemplate[];
  addInvoiceTemplate: (template: Omit<InvoiceTemplate, 'id'>) => Promise<void>;
  updateInvoiceTemplate: (template: InvoiceTemplate) => Promise<void>;
  deleteInvoiceTemplate: (id: number) => Promise<void>;
  payslips: Payslip[];
  addPayslip: (payslip: Omit<Payslip, 'id'>) => Promise<void>;
  updatePayslip: (payslip: Payslip) => Promise<void>;
  deletePayslip: (id: number) => Promise<void>;
  payPayslip: (payslipId: number, paymentAccountId: number, paymentMethod: string) => Promise<void>;
  generateDueEmployeePayslips: () => Promise<number>;
  budgets: Budget[];
  addBudget: (budget: Omit<Budget, 'id'>) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: number) => Promise<void>;

  // Documents
  documents: Document[];
  addDocument: (doc: Omit<Document, 'id'>) => Promise<void>;
  updateDocument: (doc: Document) => Promise<void>;
  deleteDocument: (id: number) => Promise<void>;

  // Tagging
  updateTags: (entityType: string, entityId: number | string, tags: string[]) => Promise<void>;
  allTags: string[];
  alertSettings: AlertSettings;
  updateAlertSettings: (settings: Partial<AlertSettings>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Data states
  const [chartOfAccounts, setChartOfAccounts] = useState<Account[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [invoiceTemplates, setInvoiceTemplates] = useState<InvoiceTemplate[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [payablesReceivables, setPayablesReceivables] = useState<PayableReceivable[]>([]);
  const [insuranceCompanies, setInsuranceCompanies] = useState<InsuranceCompany[]>([]);
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  
  // Settings states
  const [clinicName, setClinicName] = useState('کلینیک کاوس');
  const [clinicAddress, setClinicAddress] = useState('تهران، خیابان ولیعصر، پلاک ۱۲۳');
  const [clinicPhone, setClinicPhone] = useState('021-88884444');
  const [clinicLogo, setClinicLogo] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('F-');
  const [menuConfig, setMenuConfig] = useState<MenuConfig[]>(() => NAV_LINKS.map((link, index) => ({ ...link, isVisible: true, order: index })));
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['کارت‌خوان', 'نقدی', 'انتقال بانکی']);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([
      { id: 'patients', name: 'بیماران' },
      { id: 'employees', name: 'کارمندان' },
      { id: 'doctors', name: 'پزشکان' },
      { id: 'suppliers', name: 'تامین‌کنندگان' },
  ]);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    lowInventory: true,
    overdueInvoices: true,
    upcomingDues: true,
    pendingPayslips: true,
  });

  // --- AUTHENTICATION & SESSION ---
  useEffect(() => {
    const checkSession = async () => {
      setIsAuthLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          const user = await api.getUserFromToken(token);
          if (user) {
            setCurrentUser(user);
          }
        }
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        setIsAuthLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email: string, pass: string) => {
    const { user, token } = await api.login(email, pass);
    localStorage.setItem('authToken', token);
    setCurrentUser(user);
  };
  
  const signup = async (name: string, email: string, pass: string) => {
      const { user, token } = await api.signup(name, email, pass);
      localStorage.setItem('authToken', token);
      setCurrentUser(user);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setCurrentUser(null);
  };
  
  // --- DATA LOADING ---
  useEffect(() => {
    const loadData = async () => {
        if (!currentUser) return;
        
        setIsDataLoading(true);
        try {
            const data = await api.getAllData();
            
            setChartOfAccounts(data.accounts || []);
            setLedger(data.ledger || []);
            setPatients(data.patients || []);
            setEmployees(data.employees || []);
            setDoctors(data.doctors || []);
            setSuppliers(data.suppliers || []);
            setServices(data.services || []);
            setInventory(data.inventory || []);
            setInvoices(data.invoices || []);
            setPayments(data.payments || []);
            setExpenses(data.expenses || []);
            setClaims(data.claims || []);
            setInvoiceTemplates(data.invoiceTemplates || []);
            setPayslips(data.payslips || []);
            setPayablesReceivables(data.payablesReceivables || []);
            setInsuranceCompanies(data.insuranceCompanies || []);
            setIncomeRecords(data.incomeRecords || []);
            setTransfers(data.transfers || []);
            setBudgets(data.budgets || []);
            setDocuments(data.documents || []);

            const settingsData = data.settings?.[0];
            if (settingsData) {
                setClinicName(settingsData.clinicName || 'کلینیک کاوس');
                setClinicAddress(settingsData.clinicAddress || 'تهران، خیابان ولیعصر، پلاک ۱۲۳');
                setClinicPhone(settingsData.clinicPhone || '021-88884444');
                setClinicLogo(settingsData.clinicLogo || '');
                setInvoicePrefix(settingsData.invoicePrefix || 'F-');
                setMenuConfig(settingsData.menuConfig || NAV_LINKS.map((link, index) => ({ ...link, isVisible: true, order: index })));
                setPaymentMethods(settingsData.paymentMethods || ['کارت‌خوان', 'نقدی', 'انتقال بانکی']);
                setContactGroups(settingsData.contactGroups || [
                    { id: 'patients', name: 'بیماران' }, { id: 'employees', name: 'کارمندان' },
                    { id: 'doctors', name: 'پزشکان' }, { id: 'suppliers', name: 'تامین‌کنندگان' },
                ]);
                setAlertSettings(settingsData.alertSettings || { lowInventory: true, overdueInvoices: true, upcomingDues: true, pendingPayslips: true });
            }

        } catch (error) {
            console.error("Failed to load data from API", error);
        } finally {
            setIsDataLoading(false);
        }
    };
    loadData();
  }, [currentUser]);
  
  
   // --- DERIVED STATE & MEMOS ---
  const contacts = useMemo((): Contact[] => [
    ...patients.map(p => ({ id: `patient-${p.id}`, name: p.name, type: 'patient' as ContactType, group: 'بیماران', rawId: p.id })),
    ...employees.map(e => ({ id: `employee-${e.id}`, name: e.name, type: 'employee' as ContactType, group: 'کارمندان', rawId: e.id })),
    ...doctors.map(d => ({ id: `doctor-${d.id}`, name: d.name, type: 'doctor' as ContactType, group: 'پزشکان', rawId: d.id })),
    ...suppliers.map(s => ({ id: `supplier-${s.id}`, name: s.name, type: 'supplier' as ContactType, group: 'تامین‌کنندگان', rawId: s.id })),
  ], [patients, employees, suppliers, doctors]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    [...patients, ...invoices, ...expenses, ...doctors, ...employees, ...payablesReceivables, ...payments, ...suppliers, ...transfers, ...documents].forEach(entity => {
      entity.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [patients, invoices, expenses, doctors, employees, payablesReceivables, payments, suppliers, transfers, documents]);
  
  
  // --- SETTINGS ---
  const createSettingsUpdater = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, key: keyof api.SettingsPayload) => async (value: T) => {
      setter(value);
      await api.updateSettings({ [key]: value });
  };
  
  const setClinicNameDB = createSettingsUpdater(setClinicName, 'clinicName');
  const setClinicAddressDB = createSettingsUpdater(setClinicAddress, 'clinicAddress');
  const setClinicPhoneDB = createSettingsUpdater(setClinicPhone, 'clinicPhone');
  const setClinicLogoDB = createSettingsUpdater(setClinicLogo, 'clinicLogo');
  const setInvoicePrefixDB = createSettingsUpdater(setInvoicePrefix, 'invoicePrefix');
  const updateMenuConfigDB = createSettingsUpdater(setMenuConfig, 'menuConfig');

  const addPaymentMethodDB = async (method: string) => {
      if (!paymentMethods.includes(method)) {
          const newMethods = [...paymentMethods, method];
          setPaymentMethods(newMethods);
          await api.updateSettings({ paymentMethods: newMethods });
      }
  };
  const deletePaymentMethodDB = async (method: string) => {
      const newMethods = paymentMethods.filter(m => m !== method);
      setPaymentMethods(newMethods);
      await api.updateSettings({ paymentMethods: newMethods });
  };
   const addInsuranceCompanyDB = async (name: string) => {
      const newCompany = await api.insuranceCompanies.add({ name });
      setInsuranceCompanies(prev => [...prev, newCompany]);
  };
  const deleteInsuranceCompanyDB = async (id: number) => {
      await api.insuranceCompanies.remove(id);
      setInsuranceCompanies(prev => prev.filter(item => item.id !== id));
  }
  const addContactGroupDB = async (groupName: string) => {
      const newGroup: ContactGroup = { id: `custom-${Date.now()}`, name: groupName };
      const newGroups = [...contactGroups, newGroup];
      setContactGroups(newGroups);
      await api.updateSettings({ contactGroups: newGroups });
  };
  const deleteContactGroupDB = async (groupId: string) => {
      const newGroups = contactGroups.filter(g => g.id !== groupId);
      setContactGroups(newGroups);
      await api.updateSettings({ contactGroups: newGroups });
  };
  const updateAlertSettingsDB = async (settings: Partial<AlertSettings>) => {
    const newSettings = { ...alertSettings, ...settings };
    setAlertSettings(newSettings);
    await api.updateSettings({ alertSettings: newSettings });
  };
  
  // --- ASYNC CRUD HELPERS ---
  const createAdder = <T extends { id: any }>(setter: React.Dispatch<React.SetStateAction<T[]>>, apiMethod: (item: Omit<T, 'id'>) => Promise<T>) => 
    async (item: Omit<T, 'id'>) => {
      const newItem = await apiMethod(item);
      setter(prev => [...prev, newItem]);
    };
  
  const createUpdater = <T extends { id: any }>(setter: React.Dispatch<React.SetStateAction<T[]>>, apiMethod: (item: T) => Promise<T>) => 
    async (item: T) => {
        const updatedItem = await apiMethod(item);
        setter(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
    };

  const createDeleter = <T extends { id: any }>(setter: React.Dispatch<React.SetStateAction<T[]>>, apiMethod: (id: any) => Promise<void>) => 
    async (id: any) => {
        await apiMethod(id);
        setter(prev => prev.filter(item => item.id !== id));
    };
    
  // --- CORE & ENTITIES ---
  const addAccount = createAdder(setChartOfAccounts, api.accounts.add);
  const updateAccount = async (account: Omit<Account, 'id' | 'parentId' | 'type'> & { id: number }) => {
      const updated = await api.accounts.update(account);
      setChartOfAccounts(prev => prev.map(a => a.id === updated.id ? {...a, ...updated} : a));
  };
  
  const addPatient = createAdder(setPatients, api.patients.add);
  const updatePatient = createUpdater(setPatients, api.patients.update);
  const deletePatient = createDeleter(setPatients, api.patients.remove);
  
  const addEmployee = createAdder(setEmployees, api.employees.add);
  const updateEmployee = createUpdater(setEmployees, api.employees.update);
  const deleteEmployee = createDeleter(setEmployees, api.employees.remove);
  
  const addDoctor = createAdder(setDoctors, api.doctors.add);
  const updateDoctor = createUpdater(setDoctors, api.doctors.update);
  const deleteDoctor = createDeleter(setDoctors, api.doctors.remove);

  const addSupplier = createAdder(setSuppliers, api.suppliers.add);
  const updateSupplier = createUpdater(setSuppliers, api.suppliers.update);
  const deleteSupplier = createDeleter(setSuppliers, api.suppliers.remove);

  const addService = createAdder(setServices, api.services.add);
  const updateService = createUpdater(setServices, api.services.update);
  const deleteService = createDeleter(setServices, api.services.remove);

  const addInventoryItem = createAdder(setInventory, api.inventory.add);
  const updateInventoryItem = createUpdater(setInventory, api.inventory.update);
  const deleteInventoryItem = createDeleter(setInventory, api.inventory.remove);
  const updateInventoryQuantity = async (itemId: number, change: number, type: 'in' | 'out') => {
      const updatedItem = await api.inventory.updateQuantity(itemId, change, type);
      setInventory(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
  };
  
  const addInvoiceTemplate = createAdder(setInvoiceTemplates, api.invoiceTemplates.add);
  const updateInvoiceTemplate = createUpdater(setInvoiceTemplates, api.invoiceTemplates.update);
  const deleteInvoiceTemplate = createDeleter(setInvoiceTemplates, api.invoiceTemplates.remove);

  const addBudget = createAdder(setBudgets, api.budgets.add);
  const updateBudget = createUpdater(setBudgets, api.budgets.update);
  const deleteBudget = createDeleter(setBudgets, api.budgets.remove);

  const addDocument = createAdder(setDocuments, api.documents.add);
  const updateDocument = createUpdater(setDocuments, api.documents.update);
  const deleteDocument = createDeleter(setDocuments, api.documents.remove);
  
  const addSingleLedgerEntry = createAdder(setLedger, api.ledger.add);
  const deleteLedgerEntry = createDeleter(setLedger, api.ledger.remove);

  const getAccountBalance = (accountId: number): number => {
    return ledger.reduce((balance, entry) => {
      if (entry.accountId === accountId) {
        return balance + entry.debit - entry.credit;
      }
      return balance;
    }, 0);
  };
   const getAccountBalanceWithChildren = (accountId: number): number => {
      let totalBalance = getAccountBalance(accountId);
      const children = chartOfAccounts.filter(acc => acc.parentId === accountId);
      children.forEach(child => {
          totalBalance += getAccountBalanceWithChildren(child.id);
      });
      return totalBalance;
  };
  
  // --- OPERATIONS (with complex state updates) ---
  const addIncomeRecord = async (record: Omit<IncomeRecord, 'id' | 'paymentId'>) => {
      const { newRecord, newPayment, newLedgerEntries, updatedInventory } = await api.addIncomeRecord(record);
      setIncomeRecords(prev => [...prev, newRecord]);
      setPayments(prev => [...prev, newPayment]);
      setLedger(prev => [...prev, ...newLedgerEntries]);
      setInventory(prev => prev.map(inv => updatedInventory.find(u => u.id === inv.id) || inv));
  };

  const addInvoice = async (invoice: Omit<Invoice, 'id'>) => {
      const { newInvoice, updatedInventory } = await api.addInvoice(invoice);
      setInvoices(prev => [...prev, newInvoice]);
      setInventory(prev => prev.map(inv => updatedInventory.find(u => u.id === inv.id) || inv));
  };
  const updateInvoice = async (invoice: Invoice) => {
      const { updatedInvoice, updatedInventory } = await api.updateInvoice(invoice);
      setInvoices(prev => prev.map(i => i.id === updatedInvoice.id ? updatedInvoice : i));
      setInventory(prev => prev.map(inv => updatedInventory.find(u => u.id === inv.id) || inv));
  };
  const deleteInvoice = async (id: string) => {
      const { updatedInventory, deletedPaymentIds } = await api.deleteInvoice(id);
      setInvoices(prev => prev.filter(i => i.id !== id));
      setPayments(prev => prev.filter(p => !deletedPaymentIds.includes(p.id)));
      setLedger(prev => prev.filter(l => !deletedPaymentIds.some(pid => l.referenceId === `payment-${pid}`)));
      setInventory(prev => prev.map(inv => updatedInventory.find(u => u.id === inv.id) || inv));
  };
  
  const addPayment = async (payment: Omit<Payment, 'id'>) => {
      const { newPayment, newLedgerEntries, updatedInvoice } = await api.addPayment(payment);
      setPayments(prev => [...prev, newPayment]);
      setLedger(prev => [...prev, ...newLedgerEntries]);
      if (updatedInvoice) {
          setInvoices(prev => prev.map(i => i.id === updatedInvoice.id ? updatedInvoice : i));
      }
  };
  const updatePayment = async (payment: Payment) => {
      const { updatedPayment, updatedInvoice, newLedgerEntries, deletedLedgerEntryIds } = await api.updatePayment(payment);
      setPayments(prev => prev.map(p => p.id === updatedPayment.id ? updatedPayment : p));
      if (updatedInvoice) {
          setInvoices(prev => prev.map(i => i.id === updatedInvoice.id ? updatedInvoice : i));
      }
      setLedger(prev => [
          ...prev.filter(l => !deletedLedgerEntryIds.includes(l.id)), // remove old
          ...newLedgerEntries // add new
      ]);
  };
  const deletePayment = async (id: number) => {
      const { updatedInvoice } = await api.deletePayment(id);
      setPayments(prev => prev.filter(p => p.id !== id));
      setLedger(prev => prev.filter(l => l.referenceId !== `payment-${id}`));
      if(updatedInvoice) {
          setInvoices(prev => prev.map(i => i.id === updatedInvoice.id ? updatedInvoice : i));
      }
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
      const { newExpense, newLedgerEntries } = await api.addExpense(expense);
      setExpenses(prev => [...prev, newExpense]);
      setLedger(prev => [...prev, ...newLedgerEntries]);
  };
  const updateExpense = async (expense: Expense) => {
      await api.updateExpense(expense);
      setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
      setLedger(await api.ledger.getAll()); // a bit heavy, but ensures consistency
  };
  const deleteExpense = async (id: number) => {
      await api.deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      setLedger(prev => prev.filter(l => l.referenceId !== `expense-${id}`));
  };
  
  const addTransfer = async (transfer: Omit<Transfer, 'id'>) => {
      const { newTransfer, newLedgerEntries } = await api.addTransfer(transfer);
      setTransfers(prev => [...prev, newTransfer]);
      setLedger(prev => [...prev, ...newLedgerEntries]);
  };
  const updateTransfer = async (transfer: Transfer) => {
      await api.updateTransfer(transfer);
      setTransfers(prev => prev.map(t => t.id === transfer.id ? transfer : t));
      setLedger(await api.ledger.getAll());
  };
  const deleteTransfer = async (id: number) => {
      await api.deleteTransfer(id);
      setTransfers(prev => prev.filter(t => t.id !== id));
      setLedger(prev => prev.filter(l => l.referenceId !== `transfer-${id}`));
  };
  
  const addClaim = createAdder(setClaims, api.claims.add);
  const updateClaim = async (claim: InsuranceClaim) => {
      const { updatedClaim, newLedgerEntries } = await api.updateClaim(claim);
      setClaims(prev => prev.map(c => c.id === updatedClaim.id ? updatedClaim : c));
      if (newLedgerEntries) {
          setLedger(prev => [...prev, ...newLedgerEntries]);
      }
  };
  const deleteClaim = createDeleter(setClaims, api.claims.remove);
  
  const addPayslip = createAdder(setPayslips, api.payslips.add);
  const updatePayslip = createUpdater(setPayslips, api.payslips.update);
  const deletePayslip = createDeleter(setPayslips, api.payslips.remove);
  const payPayslip = async (payslipId: number, paymentAccountId: number, paymentMethod: string) => {
      const { updatedPayslip, newPayment, newLedgerEntries } = await api.payPayslip(payslipId, paymentAccountId, paymentMethod);
      setPayslips(prev => prev.map(p => p.id === updatedPayslip.id ? updatedPayslip : p));
      setPayments(prev => [...prev, newPayment]);
      setLedger(prev => [...prev, ...newLedgerEntries]);
  };
  const generateDueEmployeePayslips = async (): Promise<number> => {
      const newPayslips = await api.generateDueEmployeePayslips();
      if (newPayslips.length > 0) {
          setPayslips(prev => [...prev, ...newPayslips]);
          const updatedEmployees = await api.employees.getAll();
          setEmployees(updatedEmployees);
      }
      return newPayslips.length;
  };
  
  const addPayableReceivable = createAdder(setPayablesReceivables, api.payablesReceivables.add);
  const updatePayableReceivable = createUpdater(setPayablesReceivables, api.payablesReceivables.update);
  const deletePayableReceivable = createDeleter(setPayablesReceivables, api.payablesReceivables.remove);
  const markAsPaid = async (id: number, paymentMethod: string, paymentAccountId: number) => {
      const { updatedPR, newPayment, newLedgerEntries } = await api.markAsPaid(id, paymentMethod, paymentAccountId);
      setPayablesReceivables(prev => prev.map(pr => pr.id === updatedPR.id ? updatedPR : pr));
      setPayments(prev => [...prev, newPayment]);
      setLedger(prev => [...prev, ...newLedgerEntries]);
  };
  
  // --- Data Management & Tagging ---
  const backupData = () => api.backupData();
  const restoreData = async (jsonData: string) => {
      await api.restoreData(jsonData);
      alert('بازیابی اطلاعات با موفقیت انجام شد. صفحه مجددا بارگذاری می‌شود.');
      window.location.reload();
  };

  const updateTags = async (entityType: string, entityId: number | string, tags: string[]) => {
      const updatedItem = await api.updateTags(entityType, entityId, tags);
      switch (entityType) {
        case 'patient': setPatients(prev => prev.map(i => i.id === entityId ? updatedItem as Patient : i)); break;
        case 'employee': setEmployees(prev => prev.map(i => i.id === entityId ? updatedItem as Employee : i)); break;
        case 'doctor': setDoctors(prev => prev.map(i => i.id === entityId ? updatedItem as Doctor : i)); break;
        case 'supplier': setSuppliers(prev => prev.map(i => i.id === entityId ? updatedItem as Supplier : i)); break;
        case 'invoice': setInvoices(prev => prev.map(i => i.id === entityId ? updatedItem as Invoice : i)); break;
        case 'expense': setExpenses(prev => prev.map(i => i.id === entityId ? updatedItem as Expense : i)); break;
        case 'payment': setPayments(prev => prev.map(i => i.id === entityId ? updatedItem as Payment : i)); break;
        case 'transfer': setTransfers(prev => prev.map(i => i.id === entityId ? updatedItem as Transfer : i)); break;
        case 'payableReceivable': setPayablesReceivables(prev => prev.map(i => i.id === entityId ? updatedItem as PayableReceivable : i)); break;
        case 'document': setDocuments(prev => prev.map(i => i.id === entityId ? updatedItem as Document : i)); break;
        default: console.warn(`updateTags (frontend) not implemented for entityType: ${entityType}`);
      }
  };
  
   if (isDataLoading && currentUser) {
    return <div className="flex justify-center items-center h-screen">در حال بارگذاری اطلاعات...</div>;
  }

  const value: AppContextType = {
    getFormattedDate, formatCurrency, currentUser, isAuthLoading, login, signup, logout,
    clinicName, setClinicName: setClinicNameDB,
    clinicAddress, setClinicAddress: setClinicAddressDB,
    clinicPhone, setClinicPhone: setClinicPhoneDB,
    clinicLogo, setClinicLogo: setClinicLogoDB,
    invoicePrefix, setInvoicePrefix: setInvoicePrefixDB,
    menuConfig, updateMenuConfig: updateMenuConfigDB,
    paymentMethods, addPaymentMethod: addPaymentMethodDB, deletePaymentMethod: deletePaymentMethodDB,
    insuranceCompanies, addInsuranceCompany: addInsuranceCompanyDB, deleteInsuranceCompany: deleteInsuranceCompanyDB,
    contactGroups, addContactGroup: addContactGroupDB, deleteContactGroup: deleteContactGroupDB,
    mainAccountTypes: ['دارایی‌ها', 'بدهی‌ها', 'سرمایه', 'درآمد', 'هزینه'],
    backupData, restoreData,
    chartOfAccounts, addAccount, updateAccount, getAccountBalance, getAccountBalanceWithChildren,
    ledger, addSingleLedgerEntry, deleteLedgerEntry,
    patients, addPatient, updatePatient, deletePatient,
    employees, addEmployee, updateEmployee, deleteEmployee,
    doctors, addDoctor, updateDoctor, deleteDoctor,
    suppliers, addSupplier, updateSupplier, deleteSupplier,
    contacts,
    services, addService, updateService, deleteService,
    inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, updateInventoryQuantity,
    invoices, addInvoice, updateInvoice, deleteInvoice,
    payments, addPayment, updatePayment, deletePayment,
    incomeRecords, addIncomeRecord,
    expenses, addExpense, updateExpense, deleteExpense,
    transfers, addTransfer, updateTransfer, deleteTransfer,
    claims, addClaim, updateClaim, deleteClaim,
    payslips, addPayslip, updatePayslip, deletePayslip, payPayslip, generateDueEmployeePayslips,
    invoiceTemplates, addInvoiceTemplate, updateInvoiceTemplate, deleteInvoiceTemplate,
    payablesReceivables, addPayableReceivable, updatePayableReceivable, deletePayableReceivable, markAsPaid,
    budgets, addBudget, updateBudget, deleteBudget,
    documents, addDocument, updateDocument, deleteDocument,
    updateTags, allTags,
    alertSettings, updateAlertSettings: updateAlertSettingsDB,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
