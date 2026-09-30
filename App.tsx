
import React, { useState, useEffect, useRef } from 'react';
import { generateQuizQuestions } from './services/geminiService';
import { updateDataFile, getLocalDataForUser, signOutFromGoogle, isDriveConnected } from './services/googleDrive';
import { loadUserData, saveUserData, setLastActiveUser, getLastActiveUser } from './services/storageService';
import { Dashboard } from './components/Dashboard';
import { TopicWizard } from './components/TopicWizard';
import { QuizView } from './components/QuizView';
import { ResultsView } from './components/ResultsView';
import { QuizReviewView } from './components/QuizReviewView';
import { Statistics } from './components/Statistics';
import { Settings } from './components/Settings';
import { ChatBot } from './components/ChatBot';
import { TutorialOverlay } from './components/TutorialOverlay';
import { LoginScreen } from './components/LoginScreen';
import { Topic, Quiz, AppSettings, Screen, QuizProgress, Question } from './types';
import { Layout, LayoutDashboard, PieChart, Settings as SettingsIcon, Loader2, Cloud, Check, WifiOff, HardDrive, LogOut } from 'lucide-react';

const INITIAL_TOPIC: Topic = {
  id: 'init-1',
  title: 'History of Rome',
  sourceType: 'Custom',
  sourceName: 'SPQR: A History of Ancient Rome',
  subTopics: ['The Founding Myth', 'The Roman Republic', 'Julius Caesar', 'The Early Empire', 'The Fall of Rome'],
  quizzes: [],
  questionBank: {},
  createdAt: new Date().toISOString()
};

const INITIAL_SETTINGS: AppSettings = {
  theme: 'light',
  textSize: 'medium',
  dailyReminder: false,
  reminderTime: '09:00'
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const handleLogin = (email: string) => {
    const stored = loadUserData(email);
    if (stored) {
      setInitialData(stored);
    }
    setLastActiveUser(email);
    setCurrentUser(email);
  };

  const handleDataReady = (data: any) => {
    setInitialData(data);
  };

  const handleLogout = () => {
    signOutFromGoogle();
    setLastActiveUser(null);
    setCurrentUser(null);
    setInitialData(null);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Loading Vault...</h2>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} onDriveConnected={handleDataReady} />;
  }

  return (
    <AuthenticatedApp 
      key={currentUser} 
      currentUser={currentUser} 
      onLogout={handleLogout} 
      initialDriveData={initialData}
    />
  );
}

interface AuthenticatedAppProps {
  currentUser: string;
  onLogout: () => void;
  initialDriveData: any | null;
}

const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({ currentUser, onLogout, initialDriveData }) => {
  const storedUser = loadUserData(currentUser);
  const [topics, setTopics] = useState<Topic[]>(initialDriveData?.topics || storedUser?.topics || [INITIAL_TOPIC]);
  const [settings, setSettings] = useState<AppSettings>(initialDriveData?.settings || storedUser?.settings || INITIAL_SETTINGS);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(initialDriveData?.activeQuiz || storedUser?.activeQuiz || null);
  const [quizProgress, setQuizProgress] = useState<QuizProgress | null>(initialDriveData?.quizProgress || storedUser?.quizProgress || null);

  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [viewingResult, setViewingResult] = useState<Quiz | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(() => new Date().toLocaleTimeString());
  const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOfflineMode(false);
    const handleOffline = () => setIsOfflineMode(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [showTutorial, setShowTutorial] = useState(() => localStorage.getItem(`qm_${currentUser}_tutorial_seen`) !== 'true');

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveData = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      // 1. Immediately persist to per-user dedicated local vault
      saveUserData(currentUser, {
        user: currentUser,
        topics,
        settings,
        activeQuiz,
        quizProgress
      });

      // 2. Only sync to Google Drive vault if Google Drive is authenticated
      if (isDriveConnected()) {
        try {
          await updateDataFile(`vault-${currentUser}`, {
            user: currentUser,
            topics,
            settings,
            activeQuiz,
            quizProgress,
            lastUpdated: new Date().toISOString()
          });
        } catch {
          // Drive sync is optional
        }
      }

      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) { 
      console.error("Vault save failed", e); 
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(saveData, 1500);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [topics, settings, activeQuiz, quizProgress]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', settings.theme === 'dark');
    if (settings.textSize === 'small') root.style.fontSize = '14px';
    else if (settings.textSize === 'large') root.style.fontSize = '18px';
    else root.style.fontSize = '16px';
  }, [settings]);

  const handleTutorialComplete = (dontShowAgain: boolean) => {
    if (dontShowAgain) localStorage.setItem(`qm_${currentUser}_tutorial_seen`, 'true');
    setShowTutorial(false);
  };

  const handleCreateTopic = (name: string, source: string, subTopics: string[]) => {
    const newTopic: Topic = {
      id: Date.now().toString(),
      title: name,
      sourceType: 'AI_Generated',
      sourceName: source,
      subTopics: subTopics,
      quizzes: [],
      questionBank: {},
      createdAt: new Date().toISOString()
    };
    setTopics(prev => [...prev, newTopic]);
    setCurrentScreen('dashboard');
  };

  const handleDeleteTopic = (topicId: string) => {
    if (window.confirm("Delete this topic from the cloud?")) {
      setTopics(prev => prev.filter(t => t.id !== topicId));
      if (activeQuiz?.topicId === topicId) {
        setActiveQuiz(null);
        setQuizProgress(null);
        setCurrentScreen('dashboard');
      }
    }
  };

  const handleImportData = (data: any) => {
    if (data.topics) {
      setTopics(data.topics);
      if (data.settings) setSettings(data.settings);
      if (data.activeQuiz) setActiveQuiz(data.activeQuiz);
      if (data.quizProgress) setQuizProgress(data.quizProgress);
      setCurrentScreen('dashboard');
    }
  };

  const handleStartQuiz = async (topicId: string, subTopic: string, numQuestions: number) => {
    setIsLoadingQuiz(true);
    try {
      const topic = topics.find(t => t.id === topicId);
      if (!topic) return;
      let questionsForQuiz: Question[] = [];
      let updatedBank = { ...topic.questionBank };
      const existingQuestions = updatedBank[subTopic] || [];
      if (existingQuestions.length >= numQuestions) {
        questionsForQuiz = existingQuestions.slice(0, numQuestions);
        updatedBank[subTopic] = existingQuestions.slice(numQuestions);
      } else {
        const fetchedQuestions = await generateQuizQuestions(topic.title, subTopic, numQuestions);
        questionsForQuiz = fetchedQuestions.slice(0, numQuestions);
        updatedBank[subTopic] = [...existingQuestions, ...fetchedQuestions.slice(numQuestions)];
      }
      setTopics(prev => prev.map(t => t.id === topicId ? { ...t, questionBank: updatedBank } : t));
      const newQuiz: Quiz = {
        id: Date.now().toString(),
        topicId,
        subTopic,
        date: new Date().toISOString(),
        questions: questionsForQuiz,
        userAnswers: {},
        completed: false,
        score: 0,
        totalQuestions: questionsForQuiz.length
      };
      setActiveQuiz(newQuiz);
      setQuizProgress({ quizId: newQuiz.id, currentQuestionIndex: 0, answers: {} });
      setCurrentScreen('quiz');
    } catch (error) {
      alert("Error starting quiz. Are you online?");
    } finally { setIsLoadingQuiz(false); }
  };

  const handleCompleteQuiz = (answers: Record<string, number>) => {
    if (!activeQuiz) return;
    let score = 0;
    activeQuiz.questions.forEach(q => { if (answers[q.id] === q.correctIndex) score++; });
    const completedQuiz: Quiz = { ...activeQuiz, userAnswers: answers, completed: true, score };
    setTopics(prev => prev.map(t => t.id === activeQuiz.topicId ? { ...t, quizzes: [...t.quizzes, completedQuiz] } : t));
    setViewingResult(completedQuiz);
    setActiveQuiz(null);
    setQuizProgress(null);
    setCurrentScreen('results');
  };

  const renderContent = () => {
    if (isLoadingQuiz) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI is crafting your quiz...</h2>
        </div>
      );
    }
    switch (currentScreen) {
      case 'dashboard':
        return <Dashboard topics={topics} onNewTopic={() => setCurrentScreen('create-topic')} onStartQuiz={handleStartQuiz} onDeleteTopic={handleDeleteTopic} onViewResults={(q) => { setViewingResult(q); setCurrentScreen('results'); }} activeQuiz={activeQuiz} onResumeQuiz={() => setCurrentScreen('quiz')} />;
      case 'create-topic':
        return <TopicWizard onComplete={handleCreateTopic} onCancel={() => setCurrentScreen('dashboard')} />;
      case 'quiz':
        return activeQuiz && quizProgress ? <QuizView subTopic={activeQuiz.subTopic} questions={activeQuiz.questions} initialIndex={quizProgress.currentQuestionIndex} initialAnswers={quizProgress.answers} onProgressUpdate={(i, a) => setQuizProgress({quizId: activeQuiz.id, currentQuestionIndex: i, answers: a})} onComplete={handleCompleteQuiz} onCancel={() => setCurrentScreen('dashboard')} /> : null;
      case 'results':
        return viewingResult ? <ResultsView quiz={viewingResult} onEnterReview={() => setCurrentScreen('review-quiz')} onBack={() => { setViewingResult(null); setCurrentScreen('dashboard'); }} /> : null;
      case 'review-quiz':
        return viewingResult ? <QuizReviewView quiz={viewingResult} onClose={() => setCurrentScreen('dashboard')} /> : null;
      case 'statistics':
        return <Statistics topics={topics} />;
      case 'settings':
        return <Settings 
          settings={settings} 
          currentUser={currentUser} 
          onUpdate={setSettings} 
          onLogout={onLogout} 
          onImport={handleImportData}
          allData={{topics, settings, activeQuiz, quizProgress}}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors font-sans overflow-x-hidden">
      <aside className="hidden md:flex w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col fixed inset-y-0 left-0 z-20 shadow-xl shadow-slate-200/50 dark:shadow-none">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
            <Layout className="w-8 h-8" />
            <span className="font-black text-2xl tracking-tighter italic">QuizMaster<span className="text-slate-900 dark:text-white">.AI</span></span>
          </div>
        </div>
        
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
             <div className="flex items-center gap-3 overflow-hidden">
               <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-200 dark:shadow-none flex-shrink-0">
                 {currentUser.charAt(0).toUpperCase()}
               </div>
               <div className="overflow-hidden">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">User Memory</p>
                 <p className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate max-w-[130px]" title={currentUser}>{currentUser}</p>
               </div>
             </div>
             <button 
               onClick={onLogout}
               title="Switch user profile" 
               className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700 rounded-lg transition-colors"
             >
               <LogOut className="w-4 h-4" />
             </button>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-3">
          <button onClick={() => setCurrentScreen('dashboard')} className={`flex items-center w-full px-5 py-4 rounded-2xl font-bold transition-all ${currentScreen === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800'}`}>
            <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
          </button>
          <button onClick={() => setCurrentScreen('statistics')} className={`flex items-center w-full px-5 py-4 rounded-2xl font-bold transition-all ${currentScreen === 'statistics' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800'}`}>
            <PieChart className="w-5 h-5 mr-3" /> Statistics
          </button>
          <button onClick={() => setCurrentScreen('settings')} className={`flex items-center w-full px-5 py-4 rounded-2xl font-bold transition-all ${currentScreen === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800'}`}>
            <SettingsIcon className="w-5 h-5 mr-3" /> Settings
          </button>
        </nav>
        
        <div className="p-4 mx-6 mb-8 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 flex flex-col gap-2">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                <HardDrive className="w-4 h-4" /> User Memory Vault
              </div>
              <div className="flex items-center gap-2">
                {isOfflineMode && <WifiOff className="w-3 h-3 text-red-400" />}
                {isSaving ? <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" /> : <Check className="w-4 h-4 text-emerald-500" />}
              </div>
           </div>
           <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
             {isSaving ? 'Syncing changes...' : 'Saved to Profile Vault'}
           </p>
           {lastSaved && !isSaving && (
             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Last save: {lastSaved}</p>
           )}
        </div>
      </aside>

      <main className="flex-1 md:ml-72 min-h-screen">
        <div className="w-full max-w-6xl mx-auto p-6 md:p-12 mb-24 md:mb-0">
          {renderContent()}
        </div>
      </main>

      <div className="md:hidden fixed bottom-6 left-6 right-6 h-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl z-40 flex items-center justify-around px-4">
         <button onClick={() => setCurrentScreen('dashboard')} className={`p-3 rounded-2xl ${currentScreen === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><LayoutDashboard className="w-6 h-6" /></button>
         <button onClick={() => setCurrentScreen('statistics')} className={`p-3 rounded-2xl ${currentScreen === 'statistics' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><PieChart className="w-6 h-6" /></button>
         <button onClick={() => setCurrentScreen('settings')} className={`p-3 rounded-2xl ${currentScreen === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><SettingsIcon className="w-6 h-6" /></button>
      </div>

      <ChatBot />
      {showTutorial && <TutorialOverlay onComplete={handleTutorialComplete} />}
    </div>
  );
};
