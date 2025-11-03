import React from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

type PieDatum = { name: string; value: number; color?: string };
type BarDatum = { name: string; income: number; expenses: number };

export const Charts: React.FC<{
  pieData: PieDatum[];
  barData: BarDatum[];
}> = ({ pieData, barData }) => {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="bg-white rounded-pet p-8 shadow-soft" aria-label="Expense Breakdown Chart">
        <h3 className="text-2xl font-bold text-charcoal mb-6">Expense Breakdown</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={pieData} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                outerRadius={120}
                innerRadius={60}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || ['#FF8B5A','#FFD166','#06D6A0','#4CC9F0','#B5179E'][index % 5]} />
                ))}
              </Pie>
              <ReTooltip 
                formatter={(value: any) => [`$${value}`, 'Amount']}
                labelStyle={{ color: '#2D3142' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 6px 18px rgba(45,49,66,0.08)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-pet p-8 shadow-soft" aria-label="Spending vs Income Chart">
        <h3 className="text-2xl font-bold text-charcoal mb-6">Spending vs Income</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Legend />
              <ReTooltip 
                formatter={(value: any, name: string) => [`$${value}`, name]}
                labelStyle={{ color: '#2D3142' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 6px 18px rgba(45,49,66,0.08)'
                }}
              />
              <Bar dataKey="income" fill="#06D6A0" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#FF8B5A" name="Expenses" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Charts;


