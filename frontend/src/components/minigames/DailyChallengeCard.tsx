import React from 'react';

type Props = {
  challengeText: string;
  progress?: string;
};

export const DailyChallengeCard: React.FC<Props> = ({ challengeText, progress }) => (
  <div className="rounded-3xl border border-indigo-200 bg-indigo-50/60 p-4 shadow-soft">
    <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">Daily Challenge</h3>
    <p className="mt-2 text-sm text-indigo-900">{challengeText}</p>
    {progress && <p className="mt-1 text-xs text-indigo-600">{progress}</p>}
  </div>
);

export default DailyChallengeCard;

