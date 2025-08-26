export enum UserRole {
  Admin = 'admin',
  Accountant = 'accountant',
  Doctor = 'doctor',
}

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash?: string; // In a real app, never store plain text passwords
  role: UserRole;
}

export type MainAccountType = 'دارایی‌ها' | 'بدهی‌ها' | 'سرمایه' | 'درآمد' | 'هزینه';

export interface Account {
  id: number;
  name: string;
  type: MainAccountType;
  code: string;
  parentId: number | null;
  // Balance will be calculated on the fly
}

export interface Expense {
  id: number;
  expenseAccountId: number;
  description: string;
  amount: number;
  date: string;
  fromAccountId: number;
  toEntityId: string;
  tags?: string[];
  attachments?: { name: string; dataUrl: string }[];
}

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  taxRate: number; // Percentage
  tags?: string[];
  phone?: string;
  bankAccountNumber?: string;
  iban?: string;
  nextPaymentDate?: string; // Added for automated payroll
}

export interface Employee {
  id: number;
  name: string;
  role: string;
  salaryType: 'monthly' | 'hourly';
  baseSalary: number; // Monthly rate or hourly rate
  defaultMonthlyHours?: number; // Added for hourly employees
  housingAllowance: number;
  childAllowance: number;
  taxRate: number; // Percentage
  insuranceDeduction: number;
  tags?: string[];
  phone?: string;
  bankAccountNumber?: string;
  iban?: string;
  nextPaymentDate?: string;
}

export interface InsuranceCompany {
  id: number;
  name: string;
}

export interface Patient {
  id: number;
  name: string;
  nationalId: string;
  phone: string;
  insuranceCompany: string;
  insuranceId?: string;
  address?: string;
  birthDate?: string;
  tags?: string[];
  bankAccountNumber?: string;
  iban?: string;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  tags?: string[];
  bankAccountNumber?: string;
  iban?: string;
}

export type ContactType = 'patient' | 'employee' | 'supplier' | 'doctor' | 'custom';

export interface ContactGroup {
  id: string;
  name: string;
}

export interface Contact {
  id: string; // Composite ID like 'patient-1', 'doctor-1'
  name: string;
  type: ContactType;
  group: string; // Group name like 'بیماران', 'پزشکان'
  rawId: number;
}

export interface CommissionRecipient {
  personId: string; // e.g., 'doctor-1', 'employee-2'
  type: 'percentage' | 'fixed';
  value: number;
}

export interface Service {
  id: number;
  name: string;
  tariffs: { [key: string]: number };
  commissions?: CommissionRecipient[];
  clinicSharePercentage?: number; // Optional, can be calculated
}

export type InvoiceItem = {
  type: 'service';
  id: number;
  name: string;
  quantity: number;
  price: number;
  doctorId?: number; 
} | {
  type: 'inventory';
  id: number;
  name: string;
  quantity: number;
  price: number;
} | {
  type: 'template';
  id: number; // This will be the template ID
  name: string;
  quantity: number;
  price: number; // This will be total price for the item line (unit price * quantity)
};

export interface Invoice {
  id: string;
  recipientName: string; // Changed from patientName, no patientId needed
  date: string;
  items: InvoiceItem[];
  totalAmount: number;
  discount: number;
  insuranceShare: number;
  patientShare: number;
  paidAmount: number;
  status: 'پرداخت شده' | 'پرداخت ناقص' | 'در انتظار پرداخت';
  tags?: string[];
  attachments?: { name: string; dataUrl: string }[];
  tariffType: string; // e.g., 'آزاد', 'تامین اجتماعی'
}

export interface Payment {
    id: number;
    date: string;
    amount: number;
    method: string;
    type: 'دریافت' | 'پرداخت';
    description: string;
    entityId: string; 
    accountId: number;
    invoiceId?: string;
    payableReceivableId?: number;
    tags?: string[];
    attachments?: { name: string; dataUrl: string }[];
}

export type InsuranceClaimItem = {
    type: 'service' | 'inventory';
    itemId: number;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
} | {
    type: 'template';
    templateId: number;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
};

export interface InsuranceClaim {
    id: number;
    insuranceCompanyId: number;
    submissionDate: string;
    receivedDate?: string;
    items: InsuranceClaimItem[];
    expectedAmount: number;
    receivedAmount?: number;
    status: 'آماده ارسال' | 'ارسال شده' | 'در حال بررسی' | 'پرداخت شده' | 'رد شده';
    attachments?: { name: string; dataUrl: string }[];
    notes?: string;
}


export interface InventoryItem {
    id: number;
    name: string;
    quantity: number;
    reorderPoint: number;
    purchasePrice: number;
    salePrice: number;
}

export type TemplateItem = {
  type: 'service';
  id: number;
  quantity: number;
} | {
  type: 'inventory';
  id: number;
  quantity: number;
};

export interface InvoiceTemplate {
  id: number;
  name:string;
  items: TemplateItem[];
}

export interface IncomeRecord {
  id: number;
  date: string;
  items: InvoiceItem[];
  totalAmount: number;
  paymentMethod: string;
  paymentAccountId: number;
  description: string;
  paymentId: number;
}

export interface LedgerEntry {
  id: number;
  date: string;
  description: string;
  accountId: number;
  debit: number;
  credit: number;
  referenceId?: string;
}

export interface Commission {
    id: number;
    personId: string; // e.g., 'doctor-1'
    amount: number;
    date: string;
    serviceName: string;
    incomeRecordId: number;
    status: 'unpaid' | 'paid';
    payslipId?: number;
}

export interface Payslip {
  id: number;
  employeeId: number; // Can also be doctorId, will be handled by logic
  employeeName: string; // Or Doctor Name
  date: string;
  payPeriod: string;
  baseSalary: number; // Could be calculated from hourly rate or commission base
  hoursWorked?: number;
  housingAllowance: number;
  childAllowance: number;
  commissionTotal: number;
  otherAllowances: number;
  totalEarnings: number;
  taxDeduction: number;
  insuranceDeduction: number;
  otherDeductions: number;
  advanceDeduction: number;
  totalDeductions: number;
  netPayable: number;
  status: 'در انتظار پرداخت' | 'پرداخت شده';
  paymentId?: number;
  commissionIds?: number[];
}

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: 'درآمد' | 'هزینه';
  category: string;
  accountId: number; 
  entityName?: string;
}

export interface Transfer {
  id: number;
  date: string;
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  description: string;
  tags?: string[];
}

export interface PayableReceivable {
    id: number;
    type: 'payable' | 'receivable';
    entityId: string;
    description: string;
    amount: number;
    issueDate: string;
    dueDate: string;
    status: 'در انتظار' | 'پرداخت شده';
    paymentId?: number;
    tags?: string[];
    attachments?: { name: string; dataUrl: string }[];
}

export interface Budget {
  id: number;
  name: string;
  expenseAccountId: number;
  limit: number;
  period: 'monthly' | 'yearly';
  startDate: string;
}

export interface MenuConfig {
  href: string;
  text: string;
  icon: React.ReactNode;
  isVisible: boolean;
  order: number;
}

export interface Document {
  id: number;
  name: string;
  uploadDate: string;
  description: string;
  fileData: string; // Base64 data URL
  fileType: string;
  entityId?: string; // e.g. 'patient-1', 'invoice-inv-123'
  tags?: string[];
}

export interface AlertSettings {
  lowInventory: boolean;
  overdueInvoices: boolean;
  upcomingDues: boolean;
  pendingPayslips: boolean;
}