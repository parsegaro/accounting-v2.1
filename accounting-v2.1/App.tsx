import React, { useState, useEffect, useLayoutEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import PageNotFound from './components/PageNotFound';
import Reports from './components/Reports';
import Patients from './components/Patients';
import Doctors from './components/Doctors';
import Invoices from './components/Invoices';
import Services from './components/Services';
import Transactions from './components/Payments';
import Transfers from './components/Transfers';
import Insurance from './components/Insurance';
import Inventory from './components/Inventory';
import Employees from './components/Employees';
import Payroll from './components/Payroll';
import Ledger from './components/Ledger';
import Templates from './components/Templates';
import ChartOfAccounts from './components/accounts/ChartOfAccounts';
import Contacts from './components/contacts/Contacts';
import PayablesReceivables from './components/PayablesReceivables';
import Settings from './components/Settings';
import Income from './components/Income';
import Budget from './components/Budget';
import BankReconciliation from './components/BankReconciliation';
import DocumentCenter from './components/DocumentCenter';
import Login from './components/Login';
import { useAppContext } from './context/AppContext';

// A simple hash-based router
const routes: { [key: string]: React.ComponentType } = {
  '/': Dashboard,
  '/chart-of-accounts': ChartOfAccounts,
  '/contacts': Contacts,
  '/reports': Reports,
  '/patients': Patients,
  '/doctors': Doctors,
  '/income': Income,
  '/invoices': Invoices,
  '/transactions': Transactions,
  '/bank-reconciliation': BankReconciliation,
  '/transfers': Transfers,
  '/payables-receivables': PayablesReceivables,
  '/documents': DocumentCenter,
  '/services': Services,
  '/insurance': Insurance,
  '/inventory': Inventory,
  '/employees': Employees,
  '/payroll': Payroll,
  '/budget': Budget,
  '/ledger': Ledger,
  '/templates': Templates,
  '/settings': Settings,
};

const useWindowSize = () => {
    const [size, setSize] = useState([0, 0]);
    useLayoutEffect(() => {
        function updateSize() {
            setSize([window.innerWidth, window.innerHeight]);
        }
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);
    return size;
};

const MainApp = () => {
  const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || '/');
  const [width] = useWindowSize();
  const isDesktop = width > 1024;
  
  const [isSidebarOpen, setSidebarOpen] = useState(isDesktop);

  useEffect(() => {
    setSidebarOpen(isDesktop);
  }, [isDesktop]);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.slice(1) || '/');
      if (!isDesktop) {
        setSidebarOpen(false); // Close sidebar on mobile navigation
      }
    };
    
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [isDesktop]);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const Component = routes[currentPath] || PageNotFound;
  const safeCurrentPath = routes[currentPath] ? `#${currentPath}` : '#/';

  return (
     <div className="flex min-h-screen">
       <Sidebar 
          isSidebarOpen={isSidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          isDesktop={isDesktop} 
          currentPath={safeCurrentPath} 
        />
       {!isDesktop && isSidebarOpen && <div onClick={toggleSidebar} className="fixed inset-0 bg-black/50 z-20" aria-hidden="true"></div>}
      
      <div className={`flex-1 flex flex-col transition-all duration-300 overflow-hidden ${isDesktop ? (isSidebarOpen ? 'mr-64' : 'mr-20') : 'mr-0'}`}>
        <Header toggleSidebar={toggleSidebar} />
        <main className="p-4 sm:p-6 flex-1 overflow-y-auto">
          <div className="w-full mx-auto">
            <Component />
          </div>
        </main>
      </div>
    </div>
  )
}

const App = () => {
  const { currentUser, isAuthLoading } = useAppContext();

  if (isAuthLoading) {
    return <div className="flex justify-center items-center h-screen">در حال بارگذاری...</div>;
  }
  
  if (!currentUser) {
    return <Login />;
  }

  return <MainApp />;
};

export default App;