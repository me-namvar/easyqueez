import React, { useState } from 'react';
import { Button } from './Button';
import { Check, BookOpen, List, PlayCircle } from 'lucide-react';

interface TutorialOverlayProps {
  onComplete: (dontShowAgain: boolean) => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  const [isKnown, setIsKnown] = useState(false);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-8 border border-slate-200 dark:border-slate-700 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="text-center mb-8 relative z-10">
           <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
             Learn easy!
           </h2>
           <p className="text-xl text-indigo-600 dark:text-indigo-400 font-medium">
             Just write your topic and start!
           </p>
        </div>

        <div className="space-y-6 mb-10 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl shadow-sm">1</div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <List className="w-5 h-5 text-slate-400" /> Create Topic
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-snug">Click "New Topic" and type what you want to learn.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl shadow-sm">2</div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-slate-400" /> Select Source
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-snug">Choose a book or course suggested by AI.</p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl shadow-sm">3</div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-slate-400" /> Start Quiz
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-snug">Take quizzes and track your progress!</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
           <label className="flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
             <div className="relative flex items-center">
               <input 
                 type="checkbox" 
                 checked={isKnown}
                 onChange={(e) => setIsKnown(e.target.checked)}
                 className="peer w-6 h-6 rounded-md border-2 border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 checked:bg-indigo-600 checked:border-indigo-600 transition-all"
               />
               <Check className="w-4 h-4 text-white absolute top-1 left-1 opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={3} />
             </div>
             <span className="ml-3 font-medium text-slate-700 dark:text-slate-300 select-none">I know it</span>
           </label>
           
           <Button onClick={() => onComplete(isKnown)} className="w-full py-4 text-lg font-bold shadow-lg shadow-indigo-200 dark:shadow-none">
             Get Started
           </Button>
        </div>
      </div>
    </div>
  );
};