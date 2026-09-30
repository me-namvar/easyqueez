
import React from 'react';
import { Quiz } from '../types';
import { Button } from './Button';
import { CheckCircle, XCircle, Search } from 'lucide-react';

interface ResultsViewProps {
  quiz: Quiz;
  onBack: () => void;
  onEnterReview?: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ quiz, onBack, onEnterReview }) => {
  const percentage = Math.round((quiz.score / quiz.totalQuestions) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 text-center transition-colors">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-50 dark:bg-slate-800 mb-6 border-4 border-indigo-100 dark:border-indigo-900/50 relative">
          <span className={`text-3xl font-bold ${percentage >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
            {percentage}%
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Quiz Completed!</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          You scored {quiz.score} out of {quiz.totalQuestions} on {quiz.subTopic}.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onBack} variant="secondary" className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">Return to Dashboard</Button>
          {onEnterReview && (
            <Button onClick={onEnterReview} className="dark:bg-indigo-600 dark:hover:bg-indigo-500">
              <Search className="w-4 h-4 mr-2" /> Interactive Review
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white px-2">Detailed Analysis</h2>
        
        {quiz.questions.map((q, idx) => {
          const userAnswer = quiz.userAnswers[q.id];
          const isCorrect = userAnswer === q.correctIndex;

          return (
            <div key={q.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
              <div className="p-6">
                <div className="flex items-start gap-4 mb-5">
                   <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${isCorrect ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                     {idx + 1}
                   </span>
                   <h3 className="text-lg font-medium text-slate-900 dark:text-white leading-relaxed mt-0.5">{q.text}</h3>
                </div>

                <div className="space-y-3 pl-12">
                   {q.options.map((option, optIdx) => {
                       // Determine styling for this option
                       let optionStyle = "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300";
                       let icon = null;

                       if (optIdx === q.correctIndex) {
                           // This is the correct answer -> GREEN
                           optionStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500";
                           icon = <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />;
                       } else if (optIdx === userAnswer && !isCorrect) {
                           // User chose this and it was wrong -> RED
                           optionStyle = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 ring-1 ring-red-500";
                           icon = <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />;
                       } else if (optIdx !== userAnswer) {
                           // Neutral option, slightly dim if user answered something else
                           optionStyle += " opacity-60";
                       }

                       return (
                           <div key={optIdx} className={`p-4 rounded-lg border flex items-center justify-between ${optionStyle}`}>
                               <span className="text-sm md:text-base">{option}</span>
                               {icon}
                           </div>
                       );
                   })}
                </div>

                {/* Explanation Box */}
                <div className="mt-5 pl-12">
                     <div className="text-sm bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-xl text-indigo-800 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50">
                        <span className="font-bold block mb-1 uppercase text-xs tracking-wider opacity-80">Explanation</span>
                        {q.explanation}
                     </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
