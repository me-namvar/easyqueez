
import React, { useState, useEffect } from 'react';
import { Layout, Loader2, ShieldCheck, Database, HardDrive, ArrowRight, User, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { initGapiClient, initGisClient, signInWithGoogle, loadFromDrive, getUserProfile } from '../services/googleDrive';
import { getStoredProfiles, getLastActiveUser, loadUserData, UserProfileSummary } from '../services/storageService';

interface LoginScreenProps {
  onLogin: (email: string) => void;
  onDriveConnected: (data: any, fileId: string) => void;
}

// Client ID for Google Authentication (optional external OAuth)
const CLIENT_ID = '1035500000000-example.apps.googleusercontent.com';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onDriveConnected }) => {
  const [emailInput, setEmailInput] = useState<string>('mh.e.namvar@gmail.com');
  const [savedProfiles, setSavedProfiles] = useState<UserProfileSummary[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [showGoogleDetails, setShowGoogleDetails] = useState(false);

  useEffect(() => {
    // Load local profiles
    const profiles = getStoredProfiles();
    setSavedProfiles(profiles);
    const lastUser = getLastActiveUser();
    if (lastUser) {
      setEmailInput(lastUser);
    }

    // Try initializing Google API in background without blocking
    const setupGoogle = async () => {
      try {
        if (typeof window !== 'undefined' && window.gapi && window.google) {
          await initGapiClient();
          initGisClient(CLIENT_ID);
        }
      } catch (e) {
        console.warn("Google OAuth client not configured in this domain.", e);
      }
    };
    setupGoogle();
  }, []);

  const handleProfileLogin = (targetEmail: string) => {
    const trimmed = targetEmail.trim().toLowerCase();
    if (!trimmed) return;
    
    // Load local user-specific data
    const localData = loadUserData(trimmed);
    if (localData) {
      onDriveConnected(localData, `vault-${trimmed}`);
    }
    onLogin(trimmed);
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setGoogleError('');
    try {
      if (CLIENT_ID.includes('example.apps.googleusercontent.com')) {
        throw new Error('Google OAuth requires a production Client ID registered with Google Cloud. Use direct email login below for guaranteed, instant saved progress.');
      }
      await signInWithGoogle();
      const profile = await getUserProfile();
      const driveData = await loadFromDrive();
      
      onDriveConnected(driveData, `vault-${profile.email}`);
      onLogin(profile.email);
    } catch (err: any) {
      console.error(err);
      setGoogleError(
        err?.message || 'Google Sign-in is not configured for this domain yet. Enter your email above to save your progress directly!'
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading Study Vault...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[480px] relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 md:p-10 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 dark:shadow-none mb-6 mx-auto rotate-3">
            <Layout className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">QuizMaster AI</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm font-medium leading-relaxed">
            AI-powered adaptive learning with <strong className="text-indigo-600 dark:text-indigo-400">dedicated user memory</strong>.
          </p>

          {/* Quick email / account sign in form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleProfileLogin(emailInput);
            }} 
            className="text-left space-y-4 mb-6"
          >
            <div>
              <label htmlFor="email-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Your Email / Learning Profile
              </label>
              <div className="relative">
                <input
                  id="email-input"
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. mh.e.namvar@gmail.com"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none text-base flex items-center justify-center gap-2"
            >
              <span>Continue with My Profile</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Saved profiles shortcut */}
          {savedProfiles.length > 0 && (
            <div className="mb-6 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Saved Profiles on this Device
                </span>
                <span className="text-[11px] text-indigo-500 font-semibold">
                  {savedProfiles.length} active
                </span>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {savedProfiles.map((p) => (
                  <button
                    key={p.email}
                    onClick={() => handleProfileLogin(p.email)}
                    className="w-full p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex items-center justify-between text-left group"
                  >
                    <div className="truncate pr-2">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {p.email}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {p.topicCount} topic{p.topicCount === 1 ? '' : 's'} • {p.quizCount} quiz{p.quizCount === 1 ? '' : 'zes'}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Load →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Google Sign In option & status */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            {googleError && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-xs rounded-xl border border-amber-200 dark:border-amber-800/50 flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <div className="flex-1">
                  <p className="font-semibold">Why Google popup failed:</p>
                  <p className="mt-0.5">{googleError}</p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGoogleDetails(!showGoogleDetails)}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline font-medium"
            >
              {showGoogleDetails ? 'Hide Google Drive sign-in option' : 'Need Google Drive Cloud Sync?'}
            </button>

            {showGoogleDetails && (
              <div className="mt-4 space-y-3 animate-in fade-in">
                <Button 
                  onClick={handleGoogleLogin}
                  loading={isGoogleLoading}
                  variant="secondary"
                  className="w-full h-11 rounded-xl font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:border-slate-700 text-sm"
                >
                  {!isGoogleLoading && <img src="https://www.google.com/favicon.ico" className="w-4 h-4 mr-2" alt="Google" />}
                  Try Sign In with Google
                </Button>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Note: Google Workspace OAuth requires client ID authorization. Logging in with your email above saves all progress automatically.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-2">
             <div className="flex items-center gap-2 justify-center text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
               <ShieldCheck className="w-4 h-4" />
               <span>Persistent User Memory & Local Vault</span>
             </div>
             <p className="text-[11px] text-slate-400 leading-relaxed px-2">
               Your topics, custom quiz banks, answers, and scores are automatically saved specifically for your email profile.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
