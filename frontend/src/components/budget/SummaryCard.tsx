import React from 'react';

type Props = {
  title: string;
  amount: number;
  delta?: number; // positive or negative change compared to previous period
  icon?: React.ReactNode;
  testId?: string;
};

export const SummaryCard: React.FC<Props> = ({ title, amount, delta, icon, testId }) => {
  const isPositive = typeof delta === 'number' ? delta >= 0 : undefined;
  return (
    <div className="bg-white rounded-pet p-8 shadow-soft hover:shadow-lg transition-shadow" aria-label={title} data-testid={testId}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-600 uppercase tracking-wide">{title}</h3>
        <div aria-hidden className="text-4xl">{icon}</div>
      </div>
      <div className="text-5xl font-black text-charcoal mb-3" aria-live="polite">
        ${amount.toLocaleString()}
      </div>
      {typeof delta === 'number' && (
        <div className={`text-base font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{delta}
        </div>
      )}
    </div>
  );
};

export default SummaryCard;


