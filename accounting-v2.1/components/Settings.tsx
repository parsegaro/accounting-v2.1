import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ConfirmationModal } from './common/ConfirmationModal';
import { AlertSettings } from '../types';


// Reusable card component for consistent styling
const SettingsCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-sm animated-card">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 border-b border-[var(--border-primary)] pb-2">
            {title}
        </h2>
        {children}
    </div>
);

const TabButton = ({ isActive, onClick, children }: { isActive: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`whitespace-nowrap py-3 px-4 font-medium text-sm rounded-t-lg transition-colors ${
      isActive
        ? 'bg-[var(--bg-secondary)] border-b-2 border-[var(--accent-primary)] text-[var(--accent-primary)]'
        : 'border-b-2 border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)]'
    }`}
  >
    {children}
  </button>
);

const AlertSettingsTab: React.FC = () => {
    const { alertSettings, updateAlertSettings } = useAppContext();
    
    const handleAlertChange = (key: keyof AlertSettings, value: boolean) => {
        updateAlertSettings({ [key]: value });
    };

    return (
        <SettingsCard title="تنظیمات هشدارها و یادآوری‌ها">
            <div className="space-y-4">
                <p className="text-sm text-[var(--text-secondary)]">
                    هشدارهایی را که می‌خواهید در داشبورد نمایش داده شوند، انتخاب کنید.
                </p>
                <label className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-md">
                    <span className="font-medium">هشدار کمبود موجودی انبار</span>
                    <input 
                        type="checkbox" 
                        className="form-checkbox h-5 w-5"
                        checked={alertSettings.lowInventory}
                        onChange={(e) => handleAlertChange('lowInventory', e.target.checked)} 
                    />
                </label>
                <label className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-md">
                    <span className="font-medium">هشدار فاکتورهای پرداخت نشده (بیش از ۳۰ روز)</span>
                     <input 
                        type="checkbox" 
                        className="form-checkbox h-5 w-5"
                        checked={alertSettings.overdueInvoices}
                        onChange={(e) => handleAlertChange('overdueInvoices', e.target.checked)} 
                    />
                </label>
                <label className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-md">
                    <span className="font-medium">یادآوری سررسید بدهی/طلب</span>
                     <input 
                        type="checkbox" 
                        className="form-checkbox h-5 w-5"
                        checked={alertSettings.upcomingDues}
                        onChange={(e) => handleAlertChange('upcomingDues', e.target.checked)} 
                    />
                </label>
                 <label className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-md">
                    <span className="font-medium">یادآوری فیش‌های حقوقی در انتظار پرداخت</span>
                     <input 
                        type="checkbox" 
                        className="form-checkbox h-5 w-5"
                        checked={alertSettings.pendingPayslips}
                        onChange={(e) => handleAlertChange('pendingPayslips', e.target.checked)} 
                    />
                </label>
            </div>
        </SettingsCard>
    );
};


const Settings: React.FC = () => {
    const { 
        clinicName, setClinicName,
        clinicAddress, setClinicAddress,
        clinicPhone, setClinicPhone,
        clinicLogo, setClinicLogo,
        invoicePrefix, setInvoicePrefix,
        paymentMethods, addPaymentMethod, deletePaymentMethod,
        insuranceCompanies, addInsuranceCompany, deleteInsuranceCompany,
        contactGroups, addContactGroup, deleteContactGroup,
        menuConfig, updateMenuConfig,
        backupData, restoreData
    } = useAppContext();
    
    // --- Local State for Forms ---
    const [activeTab, setActiveTab] = useState('general');
    const [localClinicName, setLocalClinicName] = useState(clinicName);
    const [localClinicAddress, setLocalClinicAddress] = useState(clinicAddress);
    const [localClinicPhone, setLocalClinicPhone] = useState(clinicPhone);
    const [localInvoicePrefix, setLocalInvoicePrefix] = useState(invoicePrefix);
    const [localMenuConfig, setLocalMenuConfig] = useState(menuConfig);

    const [newMethod, setNewMethod] = useState('');
    const [newInsuranceCompany, setNewInsuranceCompany] = useState('');
    const [newContactGroup, setNewContactGroup] = useState('');
    
    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
    const [backupFileContent, setBackupFileContent] = useState<string | null>(null);


    // --- Handlers ---
    const handleClinicInfoSave = (e: React.FormEvent) => {
        e.preventDefault();
        setClinicName(localClinicName);
        setClinicAddress(localClinicAddress);
        setClinicPhone(localClinicPhone);
        alert('اطلاعات کلینیک با موفقیت ذخیره شد.');
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                setClinicLogo(loadEvent.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddMethod = (e: React.FormEvent) => {
        e.preventDefault();
        addPaymentMethod(newMethod.trim());
        setNewMethod('');
    };

    const handleAddInsuranceCompany = (e: React.FormEvent) => {
        e.preventDefault();
        addInsuranceCompany(newInsuranceCompany.trim());
        setNewInsuranceCompany('');
    };

     const handleAddContactGroup = (e: React.FormEvent) => {
        e.preventDefault();
        addContactGroup(newContactGroup.trim());
        setNewContactGroup('');
    };
    
    const handleMenuVisibilityChange = (href: string, isVisible: boolean) => {
        setLocalMenuConfig(prev => prev.map(item => item.href === href ? {...item, isVisible} : item));
    }
    
    const handleMenuOrderChange = (href: string, direction: 'up' | 'down') => {
        const sortedConfig = [...localMenuConfig].sort((a,b) => a.order - b.order);
        const currentIndex = sortedConfig.findIndex(item => item.href === href);
        if (direction === 'up' && currentIndex > 0) {
            [sortedConfig[currentIndex], sortedConfig[currentIndex - 1]] = [sortedConfig[currentIndex - 1], sortedConfig[currentIndex]];
        } else if (direction === 'down' && currentIndex < sortedConfig.length - 1) {
             [sortedConfig[currentIndex], sortedConfig[currentIndex + 1]] = [sortedConfig[currentIndex + 1], sortedConfig[currentIndex]];
        }
        setLocalMenuConfig(sortedConfig.map((item, index) => ({ ...item, order: index })));
    };

    const handleMenuConfigSave = () => {
        updateMenuConfig(localMenuConfig);
        alert('تنظیمات منو با موفقیت ذخیره شد.');
    };
    
    const handleBackup = async () => {
        const jsonData = await backupData();
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const date = new Date().toISOString().slice(0, 10);
        link.href = url;
        link.download = `clinic_backup_${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleRestoreFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setBackupFileContent(content);
                setIsRestoreConfirmOpen(true);
            };
            reader.readAsText(file);
        }
        // Reset the input value to allow selecting the same file again
        event.target.value = '';
    };
    
    const confirmRestore = () => {
        if (backupFileContent) {
            restoreData(backupFileContent);
        }
        setIsRestoreConfirmOpen(false);
        setBackupFileContent(null);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-6">تنظیمات</h1>
             <div className="border-b border-[var(--border-primary)] mb-6">
                <nav className="-mb-px flex space-x-4 space-x-reverse" aria-label="Tabs">
                    <TabButton isActive={activeTab === 'general'} onClick={() => setActiveTab('general')}>عمومی</TabButton>
                    <TabButton isActive={activeTab === 'financial'} onClick={() => setActiveTab('financial')}>مالی</TabButton>
                    <TabButton isActive={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')}>هشدارها</TabButton>
                    <TabButton isActive={activeTab === 'customization'} onClick={() => setActiveTab('customization')}>شخصی‌سازی</TabButton>
                    <TabButton isActive={activeTab === 'data'} onClick={() => setActiveTab('data')}>داده‌ها</TabButton>
                </nav>
            </div>

            <div className="space-y-8">
                {activeTab === 'general' && (
                     <SettingsCard title="اطلاعات کلینیک">
                        <form onSubmit={handleClinicInfoSave} className="space-y-4">
                            <div>
                                <label htmlFor="clinicName" className="block text-sm font-medium text-[var(--text-secondary)]">نام کلینیک</label>
                                <input type="text" id="clinicName" value={localClinicName} onChange={(e) => setLocalClinicName(e.target.value)} className="form-input mt-1" required />
                            </div>
                            <div>
                                <label htmlFor="clinicAddress" className="block text-sm font-medium text-[var(--text-secondary)]">آدرس</label>
                                <textarea id="clinicAddress" value={localClinicAddress} onChange={(e) => setLocalClinicAddress(e.target.value)} className="form-textarea mt-1" rows={2} />
                            </div>
                             <div>
                                <label htmlFor="clinicPhone" className="block text-sm font-medium text-[var(--text-secondary)]">تلفن</label>
                                <input type="tel" id="clinicPhone" value={localClinicPhone} onChange={(e) => setLocalClinicPhone(e.target.value)} className="form-input mt-1" />
                            </div>
                            <div>
                                <label htmlFor="clinicLogo" className="block text-sm font-medium text-[var(--text-secondary)]">لوگو</label>
                                <input type="file" id="clinicLogo" onChange={handleLogoUpload} accept="image/*" className="form-input block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-900/50 file:text-blue-300 hover:file:bg-blue-900" />
                                {clinicLogo && <img src={clinicLogo} alt="لوگوی کلینیک" className="mt-4 h-20 w-auto rounded bg-white p-1" />}
                            </div>
                            <div className="flex justify-end mt-4">
                               <button type="submit" className="btn btn-primary">ذخیره اطلاعات</button>
                            </div>
                        </form>
                    </SettingsCard>
                )}
                {activeTab === 'financial' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-8">
                            <SettingsCard title="تنظیمات فاکتور">
                                <form onSubmit={(e) => { e.preventDefault(); setInvoicePrefix(localInvoicePrefix); alert('پیشوند فاکتور ذخیره شد.'); }} className="space-y-4">
                                    <div>
                                        <label htmlFor="invoicePrefix" className="block text-sm font-medium text-[var(--text-secondary)]">پیشوند شماره فاکتور</label>
                                        <input type="text" id="invoicePrefix" value={localInvoicePrefix} onChange={(e) => setLocalInvoicePrefix(e.target.value)} className="form-input mt-1" placeholder="مثلا: F-" />
                                    </div>
                                    <div className="flex justify-end mt-4">
                                    <button type="submit" className="btn btn-primary">ذخیره</button>
                                    </div>
                                </form>
                            </SettingsCard>
                            <SettingsCard title="مدیریت شرکت‌های بیمه">
                                <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                                    {insuranceCompanies.map(company => (
                                        <div key={company.id} className="flex justify-between items-center bg-[var(--bg-tertiary)] p-2 rounded-md">
                                            <span className="font-medium">{company.name}</span>
                                            <button onClick={() => deleteInsuranceCompany(company.id)} className="text-red-400 hover:text-red-300 text-sm font-bold">حذف</button>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleAddInsuranceCompany} className="mt-6 flex space-x-2 space-x-reverse border-t border-[var(--border-primary)] pt-4">
                                    <input type="text" value={newInsuranceCompany} onChange={(e) => setNewInsuranceCompany(e.target.value)} placeholder="شرکت بیمه جدید" className="form-input flex-grow" required />
                                    <button type="submit" className="btn btn-primary">افزودن</button>
                                </form>
                            </SettingsCard>
                        </div>
                        <div>
                             <SettingsCard title="مدیریت روش‌های پرداخت">
                                <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                                    {paymentMethods.map(method => (
                                        <div key={method} className="flex justify-between items-center bg-[var(--bg-tertiary)] p-2 rounded-md">
                                            <span className="font-medium">{method}</span>
                                            <button onClick={() => deletePaymentMethod(method)} className="text-red-400 hover:text-red-300 text-sm font-bold">حذف</button>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleAddMethod} className="mt-6 flex space-x-2 space-x-reverse border-t border-[var(--border-primary)] pt-4">
                                    <input type="text" value={newMethod} onChange={(e) => setNewMethod(e.target.value)} placeholder="روش پرداخت جدید" className="form-input flex-grow" required />
                                    <button type="submit" className="btn btn-primary">افزودن</button>
                                </form>
                            </SettingsCard>
                        </div>
                    </div>
                )}
                {activeTab === 'alerts' && <AlertSettingsTab />}
                 {activeTab === 'customization' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                             <SettingsCard title="مدیریت گروه‌های طرف حساب">
                                <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                                    {contactGroups.map(group => (
                                        <div key={group.id} className="flex justify-between items-center bg-[var(--bg-tertiary)] p-2 rounded-md">
                                            <span className="font-medium">{group.name}</span>
                                            {group.id.startsWith('custom-') && (
                                            <button onClick={() => deleteContactGroup(group.id)} className="text-red-400 hover:text-red-300 text-sm font-bold">حذف</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleAddContactGroup} className="mt-6 flex space-x-2 space-x-reverse border-t border-[var(--border-primary)] pt-4">
                                    <input type="text" value={newContactGroup} onChange={(e) => setNewContactGroup(e.target.value)} placeholder="گروه جدید" className="form-input flex-grow" required />
                                    <button type="submit" className="btn btn-primary">افزودن</button>
                                </form>
                            </SettingsCard>
                        </div>
                        <div>
                            <SettingsCard title="تنظیمات منو">
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    {localMenuConfig.sort((a,b) => a.order - b.order).map(item => {
                                        const isSettingsItem = item.href === '#/settings';
                                        return (
                                            <div key={item.href} className={`flex justify-between items-center p-2 rounded-md ${isSettingsItem ? 'bg-[var(--border-primary)] opacity-70' : 'bg-[var(--bg-tertiary)]'}`}>
                                                <div className="flex items-center">
                                                    <input type="checkbox" checked={item.isVisible} onChange={(e) => handleMenuVisibilityChange(item.href, e.target.checked)} className="form-checkbox h-5 w-5 ml-4" disabled={isSettingsItem} />
                                                    <span className={`font-medium ${!item.isVisible ? 'text-[var(--text-secondary)]' : ''}`}>{item.text}</span>
                                                </div>
                                                <div className="flex space-x-1 space-x-reverse">
                                                    <button onClick={() => handleMenuOrderChange(item.href, 'up')} className="btn btn-sm btn-icon btn-secondary" disabled={isSettingsItem}>▲</button>
                                                    <button onClick={() => handleMenuOrderChange(item.href, 'down')} className="btn btn-sm btn-icon btn-secondary" disabled={isSettingsItem}>▼</button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="flex justify-end mt-6 border-t border-[var(--border-primary)] pt-4">
                                    <button onClick={handleMenuConfigSave} className="btn btn-primary">ذخیره تنظیمات منو</button>
                                </div>
                            </SettingsCard>
                        </div>
                    </div>
                 )}
                 {activeTab === 'data' && (
                     <SettingsCard title="پشتیبان‌گیری و بازیابی اطلاعات">
                        <div className="space-y-4">
                            <p className="text-sm text-[var(--text-secondary)]">
                                از تمام اطلاعات برنامه یک فایل پشتیبان تهیه کنید. این فایل را می‌توانید بعدا برای بازیابی اطلاعات استفاده کنید.
                            </p>
                            <button onClick={handleBackup} className="btn btn-primary">
                                تهیه فایل پشتیبان
                            </button>
                            <div className="border-t border-[var(--border-primary)] pt-4 mt-4">
                                <p className="text-sm text-[var(--text-secondary)]">
                                    اطلاعات خود را از یک فایل پشتیبان بازیابی کنید. <strong className="text-red-400">توجه:</strong> این کار تمام اطلاعات فعلی را پاک کرده و اطلاعات فایل پشتیبان را جایگزین می‌کند.
                                </p>
                                <input type="file" accept=".json" onChange={handleRestoreFileSelect} className="form-input mt-2 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-900/50 file:text-indigo-300 hover:file:bg-indigo-900" />
                            </div>
                        </div>
                    </SettingsCard>
                 )}
            </div>
            {isRestoreConfirmOpen && (
                <ConfirmationModal
                    isOpen={isRestoreConfirmOpen}
                    onClose={() => {setIsRestoreConfirmOpen(false); setBackupFileContent(null);}}
                    onConfirm={confirmRestore}
                    title="تایید بازیابی اطلاعات"
                    message="آیا مطمئن هستید؟ تمام اطلاعات فعلی شما پاک شده و با اطلاعات فایل پشتیبان جایگزین خواهد شد. این عمل قابل بازگشت نیست."
                />
            )}
        </div>
    );
};

export default Settings;