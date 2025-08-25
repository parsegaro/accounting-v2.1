import React from 'react';
import { Transaction } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { CURRENCY } from '../../constants';

interface TransactionItemProps {
  transaction: Transaction;
}

const ArrowUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>;
const ArrowDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17l-5-5m0 0l5-5m-5 5h12" /></svg>;


export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const { chartOfAccounts, formatCurrency } = useAppContext();
  const account = chartOfAccounts.find(a => a.id === transaction.accountId);

  const isIncome = transaction.type === 'درآمد';

  return (
    <div className="flex items-center justify-between p-3 hover:bg-[var(--bg-tertiary)]">
      <div className="flex items-center">
        <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full ${isIncome ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
          {isIncome ? <ArrowUpIcon /> : <ArrowDownIcon />}
        </div>
        <div className="mr-4">
          <p className="text-sm font-medium text-[var(--text-primary)]">{transaction.category}</p>
          <p className="text-xs text-[var(--text-secondary)]">{transaction.description} | {account?.name}</p>
        </div>
      </div>
      <div className="text-left">
          <p className={`text-sm font-semibold ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
            {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)} {CURRENCY}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">{transaction.date}</p>
      </div>
    </div>
  );
};