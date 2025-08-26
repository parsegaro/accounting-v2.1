import type { Account, Patient, Service, Invoice, Payment, InsuranceClaim, InventoryItem, Employee, InvoiceTemplate, LedgerEntry, Payslip, Supplier, Expense, PayableReceivable, MainAccountType, Doctor, InsuranceCompany, InsuranceClaimItem, IncomeRecord, Transfer, Budget, Commission, Document, User } from '../types';
import { UserRole } from '../types';

export const mockUsers: Omit<User, 'id'>[] = [
    { name: 'مدیر سیستم', email: 'admin@clinic.com', passwordHash: 'nimda', role: UserRole.Admin } // pass: admin
];

export const mockInsuranceCompanies: InsuranceCompany[] = [
    { id: 1, name: 'تامین اجتماعی' },
    { id: 2, name: 'خدمات درمانی' },
    { id: 3, name: 'بیمه ایران' },
    { id: 4, name: 'بیمه آسیا' },
];

export const mockMainAccountTypes: { name: MainAccountType, label: string }[] = [
    { name: 'دارایی‌ها', label: 'دارایی‌ها' },
    { name: 'بدهی‌ها', label: 'بدهی‌ها' },
    { name: 'سرمایه', label: 'سرمایه' },
    { name: 'درآمد', label: 'درآمد' },
    { name: 'هزینه', label: 'هزینه' },
];

export const mockChartOfAccounts: Account[] = [
  // سطح 1: حساب‌های اصلی
  { id: 1, name: 'دارایی‌ها', type: 'دارایی‌ها', code: '1', parentId: null },
  { id: 2, name: 'بدهی‌ها', type: 'بدهی‌ها', code: '2', parentId: null },
  { id: 4, name: 'درآمد', type: 'درآمد', code: '4', parentId: null },
  { id: 5, name: 'هزینه', type: 'هزینه', code: '5', parentId: null },
  
  // سطح 2: زیرمجموعه‌های دارایی‌ها
  { id: 10, name: 'دارایی‌های جاری', type: 'دارایی‌ها', code: '10', parentId: 1 },
  { id: 11, name: 'دارایی‌های ثابت', type: 'دارایی‌ها', code: '11', parentId: 1 },

  // سطح 3: حساب‌های تفصیلی
  { id: 1010, name: 'صندوق کلینیک', type: 'دارایی‌ها', code: '1010', parentId: 10 },
  { id: 1020, name: 'حساب بانک ملت', type: 'دارایی‌ها', code: '1020', parentId: 10 },
  { id: 1030, name: 'حساب‌های دریافتنی', type: 'دارایی‌ها', code: '1030', parentId: 10 },
  
  // سطح 2: زیرمجموعه‌های بدهی‌ها
  { id: 20, name: 'بدهی‌های جاری', type: 'بدهی‌ها', code: '20', parentId: 2 },
  
  // سطح 3: حساب‌های تفصیلی بدهی
  { id: 2010, name: 'حساب‌های پرداختنی', type: 'بدهی‌ها', code: '2010', parentId: 20 },
  { id: 2020, name: 'حقوق پرداختنی', type: 'بدهی‌ها', code: '2020', parentId: 20 },
  
  // سطح 3: حساب‌های تفصیلی درآمد
  { id: 4010, name: 'درآمد خدمات پزشکی', type: 'درآمد', code: '4010', parentId: 4 },
  { id: 4020, name: 'درآمد فروش کالا', type: 'درآمد', code: '4020', parentId: 4 },
  { id: 4030, name: 'درآمد عمومی', type: 'درآمد', code: '4030', parentId: 4 },
  
  // سطح 3: حساب‌های تفصیلی هزینه
  { id: 5010, name: 'هزینه حقوق و دستمزد', type: 'هزینه', code: '5010', parentId: 5 },
  { id: 5020, name: 'هزینه اجاره', type: 'هزینه', code: '5020', parentId: 5 },
  { id: 5030, name: 'هزینه قبوض و نگهداری', type: 'هزینه', code: '5030', parentId: 5 },
  { id: 5040, name: 'هزینه خرید مواد مصرفی', type: 'هزینه', code: '5040', parentId: 5 },
];

export const mockSuppliers: Supplier[] = [
  { id: 1, name: 'تجهیزات پزشکی سینا', contactPerson: 'آقای شریفی', phone: '021-88776655' },
  { id: 2, name: 'داروخانه رازی', contactPerson: 'دکتر احمدی', phone: '021-44332211' },
];

export const mockPatients: Patient[] = [
    { id: 1, name: 'علی رضایی', nationalId: '1234567890', phone: '09123456789', insuranceCompany: 'تامین اجتماعی', tags: ['پرونده قدیمی'] },
    { id: 2, name: 'مریم حسینی', nationalId: '0987654321', phone: '09129876543', insuranceCompany: 'آزاد' },
    { id: 3, name: 'زهرا احمدی', nationalId: '1122334455', phone: '09121122334', insuranceCompany: 'خدمات درمانی' },
];

export const mockEmployees: Employee[] = [
    { id: 1, name: 'سارا محمدی', role: 'پرستار', salaryType: 'monthly', baseSalary: 12000000, housingAllowance: 1500000, childAllowance: 500000, taxRate: 10, insuranceDeduction: 980000, nextPaymentDate: '1403/05/30' },
    { id: 2, name: 'رضا کریمی', role: 'پذیرش', salaryType: 'hourly', baseSalary: 60000, defaultMonthlyHours: 150, housingAllowance: 1000000, childAllowance: 0, taxRate: 10, insuranceDeduction: 700000, nextPaymentDate: '1403/05/30' },
];

export const mockDoctors: Doctor[] = [
    { id: 1, name: 'دکتر احمد علوی', specialty: 'متخصص داخلی', taxRate: 10, nextPaymentDate: '1403/06/15' },
    { id: 2, name: 'دکتر فاطمه زمانی', specialty: 'متخصص اطفال', taxRate: 10, nextPaymentDate: '1403/06/15' },
];

export const mockExpenses: Expense[] = [
    { 
      id: 1, 
      expenseAccountId: 5010,
      description: 'حقوق خرداد ماه پرسنل', 
      amount: 15000000, 
      date: '1403/04/05', 
      fromAccountId: 1020,
      toEntityId: 'employee-1',
      tags: ['حقوق']
    },
    { 
      id: 2,
      expenseAccountId: 5040,
      description: 'خرید سرنگ و گاز استریل',
      amount: 2500000, 
      date: '1403/04/08', 
      fromAccountId: 1010,
      toEntityId: 'supplier-1',
      tags: ['خرید', 'مصرفی']
    },
];

export const mockPayments: Payment[] = [
    { 
        id: 1, 
        date: '1403/05/08', 
        amount: 140000, 
        method: 'کارت‌خوان', 
        type: 'دریافت', 
        description: 'بابت فاکتور #101', 
        entityId: 'patient-1',
        accountId: 1020,
        invoiceId: 'inv-mock-101',
        tags: ['فاکتور']
    },
    { 
        id: 2, 
        date: '1403/05/10', 
        amount: 50000, 
        method: 'نقدی', 
        type: 'دریافت', 
        description: 'بابت فاکتور #103', 
        entityId: 'patient-3',
        accountId: 1010,
        invoiceId: 'inv-mock-103',
        tags: ['فاکتور', 'نقدی']
    },
];

export const mockServices: Service[] = [
    { id: 1, name: 'ویزیت عمومی', tariffs: { 'آزاد': 150000, 'تامین اجتماعی': 70000, 'خدمات درمانی': 65000 } },
    { 
      id: 2, name: 'ویزیت تخصصی', 
      tariffs: { 'آزاد': 300000, 'تامین اجتماعی': 120000, 'خدمات درمانی': 110000 }, 
      commissions: [{ personId: 'doctor-1', type: 'percentage', value: 35 }]
    },
    { 
      id: 3, name: 'تزریقات', 
      tariffs: { 'آزاد': 50000, 'تامین اجتماعی': 20000, 'خدمات درمانی': 18000 },
      commissions: [{ personId: 'employee-1', type: 'fixed', value: 5000 }]
    },
    { id: 4, name: 'سرم تراپی', tariffs: { 'آزاد': 100000, 'تامین اجتماعی': 45000, 'خدمات درمانی': 40000 } },
];

export const mockInvoices: Invoice[] = [
    { 
        id: 'inv-mock-101', recipientName: 'علی رضایی', date: '1403/05/08',
        items: [{ type: 'service', id: 2, name: 'ویزیت تخصصی', quantity: 1, price: 120000, doctorId: 1 }, { type: 'service', id: 3, name: 'تزریقات', quantity: 1, price: 20000 }],
        totalAmount: 140000, discount: 0, insuranceShare: 210000, patientShare: 140000, paidAmount: 140000, status: 'پرداخت شده', tariffType: 'تامین اجتماعی'
    },
    { 
        id: 'inv-mock-102', recipientName: 'مریم حسینی', date: '1403/05/09',
        items: [{ type: 'service', id: 1, name: 'ویزیت عمومی', quantity: 1, price: 150000, doctorId: 2 }],
        totalAmount: 150000, discount: 10000, insuranceShare: 0, patientShare: 140000, paidAmount: 0, status: 'در انتظار پرداخت', tags: ['پیگیری شود'], tariffType: 'آزاد'
    },
     { 
        id: 'inv-mock-103', recipientName: 'زهرا احمدی', date: '1403/05/10',
        items: [{ type: 'service', id: 4, name: 'سرم تراپی', quantity: 2, price: 80000, doctorId: 1 }],
        totalAmount: 80000, discount: 0, insuranceShare: 120000, patientShare: 80000, paidAmount: 50000, status: 'پرداخت ناقص', tariffType: 'خدمات درمانی'
    }
];

export const mockLedger: LedgerEntry[] = [
    { id: 1, date: '1403/05/08', description: 'دریافت بابت فاکتور #101 از علی رضایی', accountId: 1020, debit: 140000, credit: 0, referenceId: 'payment-1' },
    { id: 2, date: '1403/05/08', description: 'تسویه فاکتور #101', accountId: 1030, debit: 0, credit: 140000, referenceId: 'payment-1' },
    { id: 3, date: '1403/04/08', description: 'خرید سرنگ و گاز استریل از تجهیزات پزشکی سینا', accountId: 5040, debit: 2500000, credit: 0, referenceId: 'expense-2' },
    { id: 4, date: '1403/04/08', description: 'پرداخت از صندوق بابت خرید مواد مصرفی', accountId: 1010, debit: 0, credit: 2500000, referenceId: 'expense-2' },
    { id: 5, date: '1403/05/12', description: 'سند دستی: اصلاح حساب', accountId: 5020, debit: 50000, credit: 0 },
];

export const mockClaims: InsuranceClaim[] = [
    { 
        id: 1, 
        insuranceCompanyId: 1, // تامین اجتماعی
        submissionDate: '1403/05/09', 
        status: 'ارسال شده',
        expectedAmount: 140000,
        items: [
            { type: 'service', itemId: 2, description: 'ویزیت تخصصی', quantity: 1, unitPrice: 120000, totalPrice: 120000 },
            { type: 'service', itemId: 3, description: 'تزریقات', quantity: 1, unitPrice: 20000, totalPrice: 20000 }
        ],
        notes: 'شامل فاکتورهای ابتدای ماه.',
    },
    { 
        id: 2, 
        insuranceCompanyId: 2, // خدمات درمانی
        submissionDate: '1403/05/11', 
        status: 'در حال بررسی',
        expectedAmount: 80000,
        items: [
            { type: 'service', itemId: 4, description: 'سرم تراپی', quantity: 2, unitPrice: 40000, totalPrice: 80000 }
        ]
    },
];

export const mockInventory: InventoryItem[] = [
    { id: 1, name: 'سرنگ ۵ سی‌سی', quantity: 150, reorderPoint: 50, purchasePrice: 10000, salePrice: 15000 },
    { id: 2, name: 'گاز استریل', quantity: 80, reorderPoint: 40, purchasePrice: 3000, salePrice: 5000 },
    { id: 3, name: 'آنژیوکت صورتی', quantity: 35, reorderPoint: 20, purchasePrice: 18000, salePrice: 25000 },
];

export const mockInvoiceTemplates: InvoiceTemplate[] = [
    { id: 1, name: 'پکیج سرماخوردگی', items: [{ type: 'service', id: 1, quantity: 1 }, { type: 'service', id: 4, quantity: 1 }] },
    { id: 2, name: 'تزریقات عمومی', items: [{ type: 'service', id: 3, quantity: 1 }, { type: 'inventory', id: 1, quantity: 1 }] },
];

export const mockPayslips: Payslip[] = [
    {
        id: 1, employeeId: 1, employeeName: 'سارا محمدی', date: '1403/05/05', payPeriod: 'مرداد 1403',
        baseSalary: 12000000, housingAllowance: 1500000, childAllowance: 500000, otherAllowances: 0, commissionTotal: 0,
        totalEarnings: 14000000,
        taxDeduction: 1400000, insuranceDeduction: 980000, advanceDeduction: 0, otherDeductions: 0,
        totalDeductions: 2380000,
        netPayable: 11620000,
        status: 'در انتظار پرداخت',
    }
];

export const mockPayablesReceivables: PayableReceivable[] = [
    { id: 1, type: 'payable', entityId: 'supplier-2', description: 'بابت خرید داروهای ماه گذشته', amount: 4500000, issueDate: '1403/05/01', dueDate: '1403/06/01', status: 'در انتظار' },
    { id: 2, type: 'receivable', entityId: 'patient-2', description: 'طلب بابت خدمات آتی', amount: 1200000, issueDate: '1403/05/15', dueDate: '1403/05/25', status: 'در انتظار' },
];

export const mockBudgets: Budget[] = [
    { id: 1, name: 'بودجه ماهانه مواد مصرفی', expenseAccountId: 5040, limit: 5000000, period: 'monthly', startDate: '1403/05/01' },
    { id: 2, name: 'بودجه ماهانه قبوض و نگهداری', expenseAccountId: 5030, limit: 2000000, period: 'monthly', startDate: '1403/05/01' },
    { id: 3, name: 'بودجه سالانه اجاره', expenseAccountId: 5020, limit: 120000000, period: 'yearly', startDate: '1403/01/01' },
];

export const mockDocuments: Document[] = [
  {
    id: 1,
    name: 'آزمایش خون بیمار رضایی',
    uploadDate: '1403/05/01',
    description: 'نتیجه آزمایش خون کامل مربوط به پرونده پزشکی آقای علی رضایی.',
    fileData: 'data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovT3V0bGluZXMgMiAwIFIKL1BhZ2VzIDMgMCBS...',
    fileType: 'application/pdf',
    entityId: 'patient-1',
    tags: ['آزمایش', 'خون']
  },
  {
    id: 2,
    name: 'قرارداد تجهیزات پزشکی',
    uploadDate: '1403/04/15',
    description: 'قرارداد خرید دستگاه سونوگرافی از شرکت تجهیزات پزشکی سینا.',
    fileData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AAn/C/9s=',
    fileType: 'image/jpeg',
    entityId: 'supplier-1',
    tags: ['قرارداد', 'خرید']
  }
];

export const mockCommissions: Commission[] = []; // Initially empty
export const mockIncomeRecords: IncomeRecord[] = []; // Initially empty
export const mockTransfers: Transfer[] = []; // Initially empty