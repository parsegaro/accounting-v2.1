import React from 'react';
import { useAppContext } from '../context/AppContext';
import { LogoutIcon } from '../constants';

interface SidebarProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  isDesktop: boolean;
  currentPath: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setSidebarOpen, isDesktop, currentPath }) => {
  const { menuConfig, clinicName, currentUser, logout } = useAppContext();

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const visibleMenuItems = menuConfig
    .filter(item => item.isVisible)
    .sort((a, b) => a.order - b.order);
    
  const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
  const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;

  const sidebarWidthClass = isDesktop ? (isSidebarOpen ? 'lg:w-64' : 'lg:w-20') : 'w-64';
  const mobileTransformClass = !isDesktop ? (isSidebarOpen ? 'translate-x-0' : 'translate-x-full') : '';


  return (
    <aside className={`transform fixed inset-y-0 right-0 z-30 bg-[var(--bg-secondary)] text-[var(--text-primary)] h-screen flex flex-col shadow-lg print-hidden transition-transform duration-300 ease-in-out ${sidebarWidthClass} ${mobileTransformClass}`}>
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)] h-[68px]">
        <h2 className={`text-2xl font-bold text-center text-[var(--text-primary)] whitespace-nowrap overflow-hidden transition-opacity ${(!isSidebarOpen && isDesktop) && 'opacity-0'}`}>
          {clinicName}
        </h2>
        {isDesktop && (
          <button onClick={toggleSidebar} className="p-1 rounded-full hover:bg-[var(--bg-tertiary)]">
            {isSidebarOpen ? <ChevronRightIcon/> : <ChevronLeftIcon/>}
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto overflow-x-hidden pr-2 pt-4">
        <ul className="space-y-2">
          {visibleMenuItems.map(link => (
            <li key={link.href}>
              <a
                href={link.href}
                className={`flex items-center p-3 rounded-lg transition-colors text-base font-medium group ${
                  (currentPath === link.href || (currentPath === '#/' && link.href === '#/'))
                    ? 'bg-[var(--accent-primary)] text-[var(--text-primary)] shadow-md'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                }`}
                title={link.text}
              >
                <span className="ml-3 group-hover:scale-110 transition-transform">{link.icon}</span>
                <span className={`transition-opacity whitespace-nowrap ${(!isSidebarOpen && isDesktop) && 'hidden'}`}>{link.text}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
        
        {currentUser && (
            <div className="p-4 border-t border-[var(--border-primary)]">
                <div className="flex items-center">
                    <div className={`flex-1 overflow-hidden transition-opacity ${(!isSidebarOpen && isDesktop) && 'hidden'}`}>
                        <p className="font-semibold text-sm truncate">{currentUser.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{currentUser.role}</p>
                    </div>
                    <button onClick={logout} className="btn btn-secondary btn-icon" title="خروج">
                        <LogoutIcon />
                    </button>
                </div>
            </div>
        )}
    </aside>
  );
};

export default Sidebar;