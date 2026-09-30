import React, { useEffect } from 'react';
import { Question } from '../types';
import { Button } from './Button';
import { CheckCircle2, Circle } from 'lucide-react';

interface QuizViewProps {
  subTopic: string;
  questions: Question[];
  initialIndex: number;
  initialAnswers: Record<string, number>;
  onProgressUpdate: (index: number, answers: Record<string, number>) => void;
  onComplete: (answers: Record<string, number>) => void;
  onCancel: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ 
  subTopic, 
  questions, 
  initialIndex,
  initialAnswers,
  onProgressUpdate,
  onComplete, 
  onCancel 
}) => {
  // We use local state just for immediate render, but sync with parent on every change
  // Actually, to be fully controlled, we should just use the props if we passed callbacks for everything.
  // But let's keep local state that initializes from props to avoid prop-drilling lag, 
  // and useEffect to sync up.
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(initialIndex);
  const [answers, setAnswers] = React.useState<Record<string, number>>(initialAnswers);

  useEffect(() => {
    onProgressUpdate(currentQuestionIndex, answers);
  }, [currentQuestionIndex, answers]);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleOptionSelect = (optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      onComplete(answers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const isCurrentAnswered = answers[currentQuestion.id] !== undefined;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Quiz</h2>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{subTopic}</h1>
        </div>
        <div className="text-slate-500 dark:text-slate-400 font-medium">
          {currentQuestionIndex + 1} <span className="text-slate-300 dark:text-slate-600">/</span> {totalQuestions}
        </div>
      </div>

      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-10 mb-8 transition-colors">
        <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-8 leading-relaxed">
          {currentQuestion.text}
        </h3>

        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = answers[currentQuestion.id] === idx;
            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center
                  ${isSelected 
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-500 text-indigo-900 dark:text-indigo-100' 
                    : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 flex-shrink-0
                   ${isSelected ? 'border-indigo-600 dark:border-indigo-500' : 'border-slate-300 dark:border-slate-600'}`}>
                  {isSelected && <div className="w-3 h-3 bg-indigo-600 dark:bg-indigo-500 rounded-full" />}
                </div>
                <span className="text-lg">{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          onClick={handlePrevious} 
          disabled={currentQuestionIndex === 0}
          className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Previous
        </Button>
        <div className="space-x-3">
           <Button 
             variant="secondary" 
             onClick={onCancel}
             className="dark:bg-transparent dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
           >
             Pause / Quit
           </Button>
           <Button 
             onClick={handleNext} 
             disabled={!isCurrentAnswered}
             className="dark:bg-indigo-600 dark:hover:bg-indigo-500"
           >
             {currentQuestionIndex === totalQuestions - 1 ? 'Finish Quiz' : 'Next Question'}
           </Button>
        </div>
      </div>
    </div>
  );
};