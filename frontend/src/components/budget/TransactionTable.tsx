import React, { useMemo, useState } from 'react';

export type Txn = {
  id: string;
  created_at: string;
  item_name: string;
  amount: number;
  category?: string;
};

function downloadCSV(rows: Txn[]) {
  const header = ['Date', 'Description', 'Category', 'Amount'];
  const csv = [header.join(',')]
    .concat(rows.map(r => [r.created_at, r.item_name, r.category || '', r.amount].join(',')))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'transactions.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const TransactionTable: React.FC<{
  transactions: Txn[];
}> = ({ transactions }) => {
  const [sortKey, setSortKey] = useState<'created_at' | 'amount'>('created_at');
  const [sortDir, setSortDir] = useState<'ascending' | 'descending'>('descending');

  const sorted = useMemo(() => {
    const copy = [...transactions];
    copy.sort((a, b) => {
      const aVal = sortKey === 'amount' ? a.amount : new Date(a.created_at).getTime();
      const bVal = sortKey === 'amount' ? b.amount : new Date(b.created_at).getTime();
      return sortDir === 'ascending' ? aVal - bVal : bVal - aVal;
    });
    return copy;
  }, [transactions, sortKey, sortDir]);

  const toggleSort = (key: 'created_at' | 'amount') => {
    if (sortKey === key) setSortDir(prev => (prev === 'ascending' ? 'descending' : 'ascending'));
    else { setSortKey(key); setSortDir('ascending'); }
  };

  return (
    <div className="bg-white rounded-pet p-8 shadow-soft" aria-label="Transaction History">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold text-charcoal">Transaction History</h3>
        <button 
          className="bg-primary text-white px-6 py-3 rounded-pet text-base font-semibold hover:bg-primary/90 transition-colors shadow-soft" 
          onClick={() => downloadCSV(sorted)} 
          aria-label="Export transactions as CSV"
        >
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-base">
          <thead>
            <tr className="text-left text-gray-600 border-b-2 border-gray-200">
              <th 
                className="py-4 px-5 cursor-pointer hover:text-charcoal transition-colors font-semibold text-base" 
                onClick={() => toggleSort('created_at')} 
                aria-sort={sortKey==='created_at'?sortDir:'none'}
              >
                Date
              </th>
              <th className="py-4 px-5 font-semibold text-base">Description</th>
              <th className="py-4 px-5 font-semibold text-base">Category</th>
              <th 
                className="py-4 px-5 cursor-pointer text-right hover:text-charcoal transition-colors font-semibold text-base" 
                onClick={() => toggleSort('amount')} 
                aria-sort={sortKey==='amount'?sortDir:'none'}
              >
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((tx, index) => (
              <tr key={tx.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                <td className="py-4 px-5 whitespace-nowrap text-gray-700" aria-label={`Date ${new Date(tx.created_at).toLocaleString()}`}>
                  {new Date(tx.created_at).toLocaleString()}
                </td>
                <td className="py-4 px-5 text-charcoal font-medium">{tx.item_name}</td>
                <td className="py-4 px-5">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 capitalize">
                    {tx.category || (tx.amount < 0 ? 'expense' : 'income')}
                  </span>
                </td>
                <td className={`py-4 px-5 text-right font-semibold text-lg ${tx.amount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;


