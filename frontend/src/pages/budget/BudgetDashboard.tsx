import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { analyticsService, type DateRange } from '../../services/analyticsService';
import SummaryCard from '../../components/budget/SummaryCard';
import Charts from '../../components/budget/Charts';
import TransactionTable from '../../components/budget/TransactionTable';

type Filter = {
  range: DateRange;
  category: 'all' | 'food' | 'toys' | 'health' | 'cleaning' | 'income';
  type: 'all' | 'income' | 'expense';
};

export const BudgetDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const [filter, setFilter] = useState<Filter>({ range: 'week', category: 'all', type: 'all' });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!currentUser) return;
        const data = await analyticsService.getTransactions(currentUser.uid, filter.range);
        setTxns(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load');
        toast.error('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser, filter.range, toast]);

  const filtered = useMemo(() => {
    return txns.filter(t => {
      const typeOk = filter.type === 'all' ? true : filter.type === 'income' ? t.amount > 0 : t.amount < 0;
      const catOk = filter.category === 'all' ? true : (t.category || (t.amount < 0 ? 'expense' : 'income')) === filter.category;
      return typeOk && catOk;
    });
  }, [txns, filter]);

  const totals = useMemo(() => {
    const income = filtered.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expenses = filtered.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    return { income, expenses, net: income - expenses };
  }, [filtered]);

  const pieData = useMemo(() => {
    const cats: Record<string, number> = {};
    filtered.forEach(t => {
      if (t.amount < 0) {
        const cat = t.category || 'other';
        cats[cat] = (cats[cat] || 0) + Math.abs(t.amount);
      }
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const barData = useMemo(() => {
    // Group by day label
    const byDay: Record<string, { income: number; expenses: number }> = {};
    filtered.forEach(t => {
      const d = new Date(t.created_at);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      byDay[label] = byDay[label] || { income: 0, expenses: 0 };
      if (t.amount > 0) byDay[label].income += t.amount; else byDay[label].expenses += Math.abs(t.amount);
    });
    return Object.entries(byDay).map(([name, v]) => ({ name, ...v }));
  }, [filtered]);

  return (
    <div className="min-h-screen bg-cream px-8 pb-12">
      <div className="max-w-[90vw] mx-auto">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-5xl font-black text-charcoal mb-3">Budget Dashboard</h1>
            <p className="text-xl text-gray-600">Track your pet's spending, income, and savings</p>
          </div>
          <div className="flex gap-3" role="group" aria-label="Date range selector">
            {(['today','week','month','all'] as DateRange[]).map(r => (
              <button 
                key={r} 
                onClick={() => setFilter(prev => ({ ...prev, range: r }))} 
                className={`px-6 py-3 rounded-pet text-base font-semibold transition-colors ${
                  filter.range===r
                    ? 'bg-primary text-white shadow-soft' 
                    : 'bg-white border border-gray-200 text-charcoal hover:bg-gray-50'
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-10">
          <SummaryCard title="Total Income" amount={Math.round(totals.income)} icon={<span>💰</span>} />
          <SummaryCard title="Total Expenses" amount={Math.round(totals.expenses)} icon={<span>🧾</span>} />
          <SummaryCard title="Net Savings" amount={Math.round(totals.net)} icon={<span>📈</span>} />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-pet p-8 mb-10 shadow-soft" aria-label="Filters">
          <h3 className="text-2xl font-semibold text-charcoal mb-6">Filter Transactions</h3>
          <div className="flex flex-wrap gap-6 items-center">
            <div className="flex items-center gap-3">
              <label className="text-base font-medium text-gray-700" htmlFor="type">Type</label>
              <select 
                id="type" 
                className="border border-gray-200 rounded-pet px-4 py-2.5 bg-white text-charcoal text-base focus:ring-2 focus:ring-primary focus:border-primary" 
                value={filter.type} 
                onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as Filter['type'] }))}
              >
                <option value="all">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-base font-medium text-gray-700" htmlFor="category">Category</label>
              <select 
                id="category" 
                className="border border-gray-200 rounded-pet px-4 py-2.5 bg-white text-charcoal text-base focus:ring-2 focus:ring-primary focus:border-primary" 
                value={filter.category} 
                onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value as Filter['category'] }))}
              >
                {['all','food','toys','health','cleaning','income'].map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div role="status" aria-live="polite" className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              Loading transactions…
            </div>
          </div>
        ) : error ? (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-pet p-4 text-red-700">
            {error}
          </div>
        ) : (
          <>
            <Charts pieData={pieData} barData={barData} />
            <div className="mt-10">
              <TransactionTable transactions={filtered} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BudgetDashboard;


