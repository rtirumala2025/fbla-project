/**
 * ExpensePieChart Component
 * Displays expense breakdown as a pie chart
 */
import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { ExpenseCategory } from '../../types/analytics';

type Props = {
  expenses: ExpenseCategory[];
};

const COLORS = ['#38bdf8', '#6366f1', '#f59e0b', '#10b981', '#fcd34d', '#ec4899'];

const ExpensePieChartComponent: React.FC<Props> = ({ expenses }) => {
  const data = React.useMemo(() => 
    expenses.map((expense) => ({
    name: expense.category,
    value: expense.total,
    })),
    [expenses]
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft" style={{ contain: 'layout style paint', willChange: 'auto' }}>
      <h3 className="text-sm font-semibold text-slate-700">Expense Breakdown</h3>
      <div className="mt-4 h-56" style={{ minHeight: '224px', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%" debounce={200}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius="80%"
              innerRadius="40%"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => value.toFixed(1)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

ExpensePieChartComponent.displayName = 'ExpensePieChart';

export const ExpensePieChart = React.memo(ExpensePieChartComponent);

export default ExpensePieChart;

