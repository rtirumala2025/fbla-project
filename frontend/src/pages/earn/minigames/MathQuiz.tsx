import React, { useMemo, useState } from 'react';
import { minigameService, type GameResult } from '../../../services/minigameService';

type Props = { onComplete?: (result: GameResult) => void };

function generateQuestions(count: number) {
  return Array.from({ length: count }).map(() => {
    const a = Math.floor(Math.random()*10)+1;
    const b = Math.floor(Math.random()*10)+1;
    const op = ['+','-','×'][Math.floor(Math.random()*3)];
    const answer = op==='+'?a+b:op==='-'?a-b:a*b;
    return { a, b, op, answer };
  });
}

export const MathQuiz: React.FC<Props> = ({ onComplete }) => {
  const questions = useMemo(() => generateQuestions(10), []);
  const [answers, setAnswers] = useState<string[]>(Array(10).fill(''));
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    const correct = answers.reduce((s, ans, i) => s + ((Number(ans) === questions[i].answer) ? 1 : 0), 0);
    const score = Math.round((correct/10)*100);
    const result = minigameService.computeRewards(score, 'normal');
    setSubmitted(true);
    onComplete?.(result);
  };

  return (
    <div className="min-h-screen px-6 pb-10">
      <div className="max-w-xl mx-auto ds-card p-4">
        <h2 className="text-xl font-bold mb-3">Math Quiz</h2>
        <form className="grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          {questions.map((q, i) => (
            <label key={i} className="flex items-center gap-2">
              <span className="w-24" aria-hidden>{q.a} {q.op} {q.b} =</span>
              <input aria-label={`Question ${i+1}`} inputMode="numeric" className="border border-slate-300 rounded-pet px-3 py-2 w-full" value={answers[i]} onChange={e => setAnswers(prev => { const copy = [...prev]; copy[i] = e.target.value; return copy; })} />
            </label>
          ))}
          <div className="col-span-2 flex gap-2 mt-2">
            <button className="btn-primary" type="submit">Submit</button>
            <button type="button" className="px-3 py-2 rounded-pet border border-slate-300" onClick={() => onComplete?.({ score: 0, coinsEarned: 0, happinessGain: 0 })}>Skip for demo</button>
          </div>
        </form>
        {submitted && <div className="mt-2 text-slate-600">Submitted!</div>}
      </div>
    </div>
  );
};

export default MathQuiz;


