import React from 'react';
import { useAppContext } from '../context/AppContext';
import { MenuIcon } from '../constants';

interface HeaderProps {
    toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
    const { getFormattedDate } = useAppContext();
    return (
        <header className="bg-[var(--bg-secondary)] shadow-sm p-4 flex justify-between items-center print-hidden border-b border-[var(--border-primary)] h-[68px]">
            <div className="flex items-center">
                <button onClick={toggleSidebar} className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] ml-4">
                    <span className="sr-only">Open sidebar</span>
                    <MenuIcon />
                </button>
                 <h2 className="text-xl font-semibold text-[var(--text-primary)]">سیستم یکپارچه حسابداری</h2>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
                <div className="text-sm text-[var(--text-secondary)]">
                    <span>امروز: </span>
                    <span className="font-semibold text-[var(--text-primary)]">{getFormattedDate()}</span>
                </div>
            </div>
        </header>
    );
};

export default Header;