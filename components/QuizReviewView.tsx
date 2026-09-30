
import React, { useState } from 'react';
import { Quiz } from '../types';
import { Button } from './Button';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Info, ArrowLeft } from 'lucide-react';

interface QuizReviewViewProps {
  quiz: Quiz;
  onClose: () => void;
}

export const QuizReviewView: React.FC<QuizReviewViewProps> = ({ quiz, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentQuestion = quiz.questions[currentIndex];
  const userAnswer = quiz.userAnswers[currentQuestion.id];
  const isCorrect = userAnswer === currentQuestion.correctIndex;
  
  const totalQuestions = quiz.questions.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="rounded-full w-10 h-10 p-0 text-slate-400 hover:text-indigo-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Reviewing Quiz</h2>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{quiz.subTopic}</h1>
          </div>
        </div>
        <div className="text-slate-500 dark:text-slate-400 font-medium">
          {currentIndex + 1} <span className="text-slate-300 dark:text-slate-600">/</span> {totalQuestions}
        </div>
      </div>

      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-10 mb-6 transition-colors">
        <div className="mb-4 inline-flex">
          {isCorrect ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Correct Answer
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50">
              <XCircle className="w-3 h-3 mr-1" /> Incorrect
            </span>
          )}
        </div>

        <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-8 leading-relaxed">
          {currentQuestion.text}
        </h3>

        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isUserChoice = userAnswer === idx;
            const isCorrectAnswer = currentQuestion.correctIndex === idx;
            
            let statusStyles = "border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 opacity-50";
            let icon = null;

            if (isCorrectAnswer) {
              statusStyles = "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100 opacity-100 ring-1 ring-emerald-500";
              icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
            } else if (isUserChoice && !isCorrect) {
              statusStyles = "border-red-500 bg-red-50/50 dark:bg-red-900/20 text-red-900 dark:text-red-100 opacity-100 ring-1 ring-red-500";
              icon = <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
            }

            return (
              <div
                key={idx}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between ${statusStyles}`}
              >
                <div className="flex items-center">
                   <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 flex-shrink-0
                      ${isCorrectAnswer ? 'border-emerald-600 dark:border-emerald-500' : isUserChoice ? 'border-red-600 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'}`}>
                     {(isCorrectAnswer || (isUserChoice && !isCorrect)) && <div className={`w-3 h-3 rounded-full ${isCorrectAnswer ? 'bg-emerald-600' : 'bg-red-600'}`} />}
                   </div>
                   <span className="text-lg">{option}</span>
                </div>
                {icon}
              </div>
            );
          })}
        </div>
      </div>

      {/* Explanation Box */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-6 mb-8 transition-colors">
        <div className="flex items-center gap-2 mb-3 text-indigo-700 dark:text-indigo-300">
           <Info className="w-5 h-5" />
           <h4 className="font-bold text-sm uppercase tracking-wider">Explanation</h4>
        </div>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
          {currentQuestion.explanation}
        </p>
      </div>

      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          onClick={handlePrevious} 
          disabled={currentIndex === 0}
          className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
        </Button>
        <div className="flex gap-3">
           <Button variant="secondary" onClick={onClose} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
              Close Review
           </Button>
           <Button 
             onClick={handleNext} 
             disabled={currentIndex === totalQuestions - 1}
             className="dark:bg-indigo-600 dark:hover:bg-indigo-500"
           >
             Next Question <ChevronRight className="w-4 h-4 ml-1" />
           </Button>
        </div>
      </div>
    </div>
  );
};
