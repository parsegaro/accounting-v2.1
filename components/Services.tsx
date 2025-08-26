import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { EnhancedTable, Column } from './common/EnhancedTable';
import { Modal } from './common/Modal';
import { ConfirmationModal } from './common/ConfirmationModal';
import CurrencyInput from './common/CurrencyInput';
import type { Service, CommissionRecipient } from '../types';
import { CURRENCY, PencilIcon, TrashIcon } from '../constants';

const ServiceForm = ({ service, onSave, onCancel }: { service: Partial<Service> | null, onSave: (service: Omit<Service, 'id'> | Service) => void, onCancel: () => void }) => {
    const { doctors, employees, insuranceCompanies } = useAppContext();
    const [formData, setFormData] = useState<Partial<Service>>({ 
        tariffs: { 'آزاد': 0 }, 
        commissions: [] 
    });

    const commissionRecipients = useMemo(() => [
        ...doctors.map(d => ({ id: `doctor-${d.id}`, name: d.name, group: 'پزشکان' })),
        ...employees.map(e => ({ id: `employee-${e.id}`, name: e.name, group: 'کارمندان' }))
    ], [doctors, employees]);

    useEffect(() => {
        const allTariffKeys = ['آزاد', ...insuranceCompanies.map(ic => ic.name)];
        const initialTariffs = allTariffKeys.reduce((acc, key) => {
            acc[key] = (service?.tariffs?.[key]) || 0;
            return acc;
        }, {} as { [key: string]: number });

        if (service) {
            setFormData({
                ...service,
                tariffs: initialTariffs,
                commissions: service.commissions || []
            });
        } else {
             setFormData({ 
                tariffs: initialTariffs, 
                commissions: [] 
            });
        }
    }, [service, insuranceCompanies]);
    
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)]";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTariffChange = (name: string, value: number) => {
        setFormData(prev => ({
            ...prev,
            tariffs: { ...prev.tariffs, [name]: value }
        }));
    };

    const handleCommissionChange = (index: number, field: keyof CommissionRecipient, value: string | number) => {
        setFormData(prev => {
            const newCommissions = [...(prev.commissions || [])];
            (newCommissions[index] as any)[field] = value;
            return { ...prev, commissions: newCommissions };
        });
    };

    const addCommissionRecipient = () => {
        setFormData(prev => ({
            ...prev,
            commissions: [...(prev.commissions || []), { personId: '', type: 'percentage', value: 0 }]
        }));
    };

    const removeCommissionRecipient = (index: number) => {
        setFormData(prev => ({
            ...prev,
            commissions: (prev.commissions || []).filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Service);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className={labelClasses}>نام خدمت</label>
                <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} className="form-input mt-1" required />
            </div>
            <fieldset className="border p-4 rounded-md border-[var(--border-secondary)]">
                <legend className="text-sm font-medium text-[var(--text-secondary)] px-2">تعرفه‌ها ({CURRENCY})</legend>
                <div className="space-y-2">
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)]">تعرفه آزاد</label>
                        <CurrencyInput value={formData.tariffs?.['آزاد'] || 0} onValueChange={(value) => handleTariffChange('آزاد', value)} />
                    </div>
                    {insuranceCompanies.map(company => (
                         <div key={company.id}>
                            <label className="block text-xs font-medium text-[var(--text-secondary)]">{company.name}</label>
                            <CurrencyInput value={formData.tariffs?.[company.name] || 0} onValueChange={(value) => handleTariffChange(company.name, value)} />
                        </div>
                    ))}
                </div>
            </fieldset>

            <fieldset className="border p-4 rounded-md border-[var(--border-secondary)]">
                <legend className="text-sm font-medium text-[var(--text-secondary)] px-2">پورسانت‌ها</legend>
                <p className="text-xs text-[var(--text-secondary)] mb-3">می‌توانید برای پزشکان یا کارمندان پورسانت ثابت یا درصدی تعریف کنید.</p>
                <div className="space-y-3">
                   {(formData.commissions || []).map((comm, index) => (
                       <div key={index} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-2 items-center p-2 border border-[var(--border-secondary)] rounded-md">
                           <select value={comm.personId} onChange={e => handleCommissionChange(index, 'personId', e.target.value)} className="form-select">
                                <option value="">انتخاب شخص...</option>
                                {commissionRecipients.map(r => <option key={r.id} value={r.id}>{r.name} ({r.group})</option>)}
                           </select>
                           <div className="flex">
                               <input type="number" value={comm.value} onChange={e => handleCommissionChange(index, 'value', Number(e.target.value))} className="form-input rounded-r-none" min="0"/>
                               <select value={comm.type} onChange={e => handleCommissionChange(index, 'type', e.target.value as 'percentage' | 'fixed')} className="form-select rounded-l-none border-r-0 w-20">
                                   <option value="percentage">%</option>
                                   <option value="fixed">{CURRENCY}</option>
                               </select>
                           </div>
                           <button type="button" onClick={() => removeCommissionRecipient(index)} className="btn btn-sm btn-danger btn-icon justify-self-end">&times;</button>
                       </div>
                   ))}
                </div>
                 <button type="button" onClick={addCommissionRecipient} className="btn btn-sm btn-secondary mt-3">
                   + افزودن دریافت‌کننده پورسانت
                </button>
            </fieldset>

            <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
                <button type="button" onClick={onCancel} className="btn btn-secondary">لغو</button>
                <button type="submit" className="btn btn-primary">ذخیره</button>
            </div>
        </form>
    );
};


const Services = () => {
  const { services, addService, updateService, deleteService, formatCurrency, doctors, employees } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const commissionRecipients = useMemo(() => [
        ...doctors.map(d => ({ id: `doctor-${d.id}`, name: d.name })),
        ...employees.map(e => ({ id: `employee-${e.id}`, name: e.name }))
    ], [doctors, employees]);


  const columns: Column<Service>[] = [
    { header: 'نام خدمت', accessor: 'name', sortKey: 'name' },
    { 
      header: `تعرفه‌ها (${CURRENCY})`, 
      accessor: (item: Service) => (
        <ul className="list-disc list-inside text-xs">
          {Object.entries(item.tariffs).map(([key, value]) => (
            <li key={key}>{`${key}: ${formatCurrency(value)}`}</li>
          ))}
        </ul>
      ),
      searchable: false,
    },
     {
      header: 'دریافت کنندگان پورسانت',
      accessor: (item: Service) => {
        if (!item.commissions || item.commissions.length === 0) {
          return '-';
        }
        return (
          <ul className="list-disc list-inside text-xs">
            {item.commissions.map((comm, index) => {
              const recipient = commissionRecipients.find(r => r.id === comm.personId);
              return (
                <li key={index}>
                  {recipient ? recipient.name : 'نامشخص'}: {comm.type === 'percentage' ? `${comm.value}%` : `${formatCurrency(comm.value)} ${CURRENCY}`}
                </li>
              );
            })}
          </ul>
        );
      },
      searchable: false,
    },
  ];
  
  const resetModals = () => {
      setIsModalOpen(false);
      setIsConfirmModalOpen(false);
      setSelectedService(null);
  };

  const handleOpenModal = (service: Service | null = null) => {
      setSelectedService(service);
      setIsModalOpen(true);
  }

  const handleOpenConfirmModal = (service: Service) => {
      setSelectedService(service);
      setIsConfirmModalOpen(true);
  }

  const handleSaveService = (serviceData: Omit<Service, 'id'> | Service) => {
      if ('id' in serviceData) {
          updateService(serviceData);
      } else {
          addService(serviceData);
      }
      resetModals();
  };
  
  const handleDelete = () => {
      if (selectedService) {
          deleteService(selectedService.id);
      }
      resetModals();
  }
  
  const serviceActions = (service: Service) => (
    <div className="flex space-x-2 space-x-reverse">
        <button onClick={() => handleOpenModal(service)} className="btn btn-sm btn-secondary btn-icon" title="ویرایش"><PencilIcon/></button>
        <button onClick={() => handleOpenConfirmModal(service)} className="btn btn-sm btn-danger btn-icon" title="حذف"><TrashIcon/></button>
    </div>
  );

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">مدیریت خدمات و تعرفه‌ها</h1>
            <button onClick={() => handleOpenModal()} className="btn btn-primary">
                افزودن خدمت جدید
            </button>
        </div>
        <EnhancedTable<Service> 
            columns={columns} 
            data={services} 
            actions={serviceActions} 
            tableName="خدمات-و-تعرفه‌ها"
        />
        <Modal 
            isOpen={isModalOpen} 
            onClose={resetModals} 
            title={selectedService ? 'ویرایش خدمت' : 'افزودن خدمت جدید'}
        >
            <ServiceForm 
                service={selectedService}
                onSave={handleSaveService}
                onCancel={resetModals}
            />
        </Modal>
        {selectedService && (
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={resetModals}
                onConfirm={handleDelete}
                title="تایید حذف خدمت"
                message={`آیا از حذف خدمت «${selectedService.name}» اطمینان دارید؟`}
            />
        )}
    </div>
  );
};

export default Services;