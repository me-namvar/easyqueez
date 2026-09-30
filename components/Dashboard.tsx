
import React, { useState, useEffect } from 'react';
import { Topic, Quiz } from '../types';
import { Button } from './Button';
import { Plus, BookOpen, ChevronRight, PlayCircle, History, Play, Trash2, Search } from 'lucide-react';

interface DashboardProps {
  topics: Topic[];
  onNewTopic: () => void;
  onStartQuiz: (topicId: string, subTopic: string, numQuestions: number) => void;
  onViewResults: (quiz: Quiz) => void;
  onDeleteTopic: (topicId: string) => void;
  activeQuiz: Quiz | null;
  onResumeQuiz: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  topics, 
  onNewTopic, 
  onStartQuiz, 
  onViewResults,
  onDeleteTopic,
  activeQuiz,
  onResumeQuiz
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [numQuestions, setNumQuestions] = useState<number>(5);

  // Effect to manage selection when topics change (e.g., deletion)
  useEffect(() => {
    if (topics.length > 0) {
      // If no selection, or selected ID no longer exists, select the first one
      if (!selectedTopicId || !topics.find(t => t.id === selectedTopicId)) {
        setSelectedTopicId(topics[0].id);
      }
    } else {
      setSelectedTopicId(null);
    }
  }, [topics, selectedTopicId]);

  const selectedTopic = topics.find(t => t.id === selectedTopicId);

  const handleStartQuiz = (subTopic: string) => {
    if (selectedTopic) {
      onStartQuiz(selectedTopic.id, subTopic, numQuestions);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Learning</h1>
           <p className="text-slate-500 dark:text-slate-400 mt-1">Pick a topic to continue your journey.</p>
        </div>
        <div className="flex gap-3">
          {activeQuiz && (
            <Button onClick={onResumeQuiz} variant="secondary" className="border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">
              <Play className="w-4 h-4 mr-2 fill-current" /> Resume Quiz
            </Button>
          )}
          <Button onClick={onNewTopic} className="shadow-lg shadow-indigo-200 dark:shadow-none">
            <Plus className="w-5 h-5 mr-2" /> New Topic
          </Button>
        </div>
      </div>

      {topics.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/30 mb-4">
            <BookOpen className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No topics yet</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 mb-6">Start your first learning journey by creating a topic.</p>
          <Button onClick={onNewTopic}>Create First Topic</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Topic List */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Topics</h3>
            {topics.map(topic => (
              <div key={topic.id} className="relative group">
                <button
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between pr-12
                    ${selectedTopicId === topic.id 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm'
                    }`}
                >
                  <div className="truncate">
                     <p className={`font-semibold ${selectedTopicId === topic.id ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                       {topic.title}
                     </p>
                     <p className={`text-xs mt-1 truncate ${selectedTopicId === topic.id ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}>
                       {topic.sourceName}
                     </p>
                  </div>
                  <ChevronRight className={`w-5 h-5 flex-shrink-0 ${selectedTopicId === topic.id ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-600 group-hover:opacity-0 transition-opacity'}`} />
                </button>
                
                <button
                   onClick={(e) => { e.stopPropagation(); onDeleteTopic(topic.id); }}
                   className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10
                      ${selectedTopicId === topic.id 
                        ? 'text-indigo-100 hover:bg-indigo-500 hover:text-white' 
                        : 'text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400'
                      }`}
                   title="Delete Topic"
                >
                   <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Topic Details */}
          <div className="lg:col-span-8">
            {selectedTopic && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedTopic.title}</h2>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                     <span>Questions per quiz:</span>
                     <select 
                       value={numQuestions}
                       onChange={(e) => setNumQuestions(Number(e.target.value))}
                       className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                     >
                       <option value={5}>5</option>
                       <option value={10}>10</option>
                       <option value={20}>20</option>
                     </select>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" /> 
                    Available Sub-topics
                  </h3>
                  <div className="grid gap-3 mb-8">
                    {selectedTopic.subTopics.map((sub, idx) => {
                      const bankCount = selectedTopic.questionBank?.[sub]?.length || 0;
                      
                      // Calculate sub-topic progress (Best score achieved)
                      const subTopicQuizzes = selectedTopic.quizzes.filter(q => q.subTopic === sub && q.completed);
                      const bestScore = subTopicQuizzes.length > 0 
                        ? Math.max(...subTopicQuizzes.map(q => (q.score / q.totalQuestions) * 100)) 
                        : 0;
                      const roundedBestScore = Math.round(bestScore);

                      return (
                        <div key={idx} className="flex flex-col p-4 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                           <div className="flex items-center justify-between mb-3">
                              <div className="flex flex-col">
                                <span className="text-slate-700 dark:text-slate-300 text-sm font-semibold">{sub}</span>
                                {bankCount > 0 && (
                                  <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{bankCount} questions ready</span>
                                )}
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleStartQuiz(sub)}
                                className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 h-8 text-xs"
                              >
                                <PlayCircle className="w-3.5 h-3.5 mr-1" /> Quiz
                              </Button>
                           </div>

                           {/* Mini Progress Bar */}
                           <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full relative overflow-hidden group/progress">
                              <div 
                                className="h-full bg-indigo-500 dark:bg-indigo-600 transition-all duration-700 ease-out rounded-full shadow-[0_0_8px_rgba(99,102,241,0.3)]"
                                style={{ width: `${roundedBestScore}%` }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 group-hover/progress:text-indigo-900 dark:group-hover/progress:text-white transition-colors">
                                  {roundedBestScore}%
                                </span>
                              </div>
                           </div>
                        </div>
                      );
                    })}
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                    <History className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                    Recent Activity
                  </h3>
                  {selectedTopic.quizzes.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">No quizzes taken yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedTopic.quizzes.slice().reverse().map((quiz) => (
                        <div key={quiz.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <div>
                             <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{quiz.subTopic}</p>
                             <p className="text-xs text-slate-500 dark:text-slate-500">{new Date(quiz.date).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-bold ${(quiz.score/quiz.totalQuestions) >= 0.7 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                              {Math.round((quiz.score / quiz.totalQuestions) * 100)}%
                            </span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => onViewResults(quiz)} 
                              className="dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700"
                            >
                              <Search className="w-3.5 h-3.5 mr-1.5" /> Review
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
