
import React, { useRef } from 'react';
import { AppSettings } from '../types';
import { Moon, Sun, Bell, Clock, LogOut, UserCircle, Download, Upload, ShieldAlert, Database } from 'lucide-react';
import { Button } from './Button';

interface SettingsProps {
  settings: AppSettings;
  currentUser: string;
  onUpdate: (settings: AppSettings) => void;
  onLogout: () => void;
  onImport: (data: any) => void;
  allData: any;
}

export const Settings: React.FC<SettingsProps> = ({ settings, currentUser, onUpdate, onLogout, onImport, allData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (key: keyof AppSettings, value: any) => {
    onUpdate({ ...settings, [key]: value });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(allData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `quizmaster_backup_${currentUser}_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.topics && Array.isArray(json.topics)) {
          if (window.confirm("This will overwrite your current progress with the data from the file. Proceed?")) {
            onImport(json);
          }
        } else {
          alert("Invalid backup file format.");
        }
      } catch (err) {
        alert("Failed to read the file. Ensure it's a valid JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleToggleReminder = async (checked: boolean) => {
    if (checked) {
      if (!("Notification" in window)) {
        alert("This browser does not support desktop notifications");
        return;
      }

      if (Notification.permission === "granted") {
         enableReminder();
      } else if (Notification.permission === "denied") {
        alert("Notifications are blocked in your browser settings. Please enable them manually for this site to use reminders.");
        onUpdate({ ...settings, dailyReminder: false });
      } else {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          enableReminder();
        } else {
          onUpdate({ ...settings, dailyReminder: false });
        }
      }
    } else {
      onUpdate({ ...settings, dailyReminder: false });
    }
  };

  const enableReminder = () => {
    const timeToSet = settings.reminderTime || '09:00';
    onUpdate({ 
      ...settings, 
      dailyReminder: true, 
      reminderTime: timeToSet 
    });

    new Notification("Reminders Active", {
      body: `You will be reminded daily at ${timeToSet}.`,
      icon: "/favicon.ico"
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8 transition-colors">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <UserCircle className="w-8 h-8" />
             </div>
             <div>
               <h2 className="text-xl font-bold text-slate-900 dark:text-white">Account</h2>
               <p className="text-slate-500 dark:text-slate-400">{currentUser}</p>
             </div>
           </div>
           <Button variant="outline" onClick={onLogout} className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
             <LogOut className="w-4 h-4 mr-2" /> Sign Out
           </Button>
         </div>
      </div>

      {/* Cloud Vault Management */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 transition-colors">
        <div className="flex items-center gap-3 mb-8">
           <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
             <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
           </div>
           <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Cloud Vault</h2>
        </div>
        
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          Your data is automatically saved to this browser's persistent database. 
          Use **Export** to create a backup that you can use on other devices or if you clear your browser history.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button onClick={handleExport} variant="secondary" className="h-14 font-bold rounded-xl border-slate-200 dark:border-slate-700">
            <Download className="w-5 h-5 mr-3" /> Export History
          </Button>
          
          <Button onClick={handleImportClick} variant="secondary" className="h-14 font-bold rounded-xl border-slate-200 dark:border-slate-700">
            <Upload className="w-5 h-5 mr-3" /> Import History
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
          />
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 transition-colors">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Preferences</h2>
        
        <div className="space-y-8">
          <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                 {settings.theme === 'light' ? <Sun className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
              </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">Appearance</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Select your preferred theme</p>
              </div>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button 
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${settings.theme === 'light' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                onClick={() => handleChange('theme', 'light')}
              >
                Light
              </button>
              <button 
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${settings.theme === 'dark' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                onClick={() => handleChange('theme', 'dark')}
              >
                Dark
              </button>
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                   <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">Daily Reminder</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Get reminded to take a quiz</p>
                </div>
              </div>
               <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.dailyReminder}
                  onChange={(e) => handleToggleReminder(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500"></div>
              </label>
            </div>

            {settings.dailyReminder && (
              <div className="flex items-center justify-between pl-14 pt-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Reminder Time</span>
                </div>
                <input
                  type="time"
                  value={settings.reminderTime}
                  onChange={(e) => handleChange('reminderTime', e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-8 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/50 rounded-2xl">
         <div className="flex items-center gap-3 mb-4 text-red-700 dark:text-red-400">
           <ShieldAlert className="w-5 h-5" />
           <h3 className="font-bold">Danger Zone</h3>
         </div>
         <p className="text-xs text-red-600/80 dark:text-red-400/80 mb-6">
           Clearing your history will permanently delete all topics, quiz results, and progress for this account from the browser database.
         </p>
         <Button 
           variant="danger" 
           size="sm" 
           onClick={() => {
             if (window.confirm("Permanently delete ALL data for this account? This cannot be undone.")) {
               onImport({topics: [], settings: INITIAL_SETTINGS, activeQuiz: null, quizProgress: null});
             }
           }}
          >
           Clear All Account Data
         </Button>
      </div>
    </div>
  );
};

const INITIAL_SETTINGS: AppSettings = {
  theme: 'light',
  textSize: 'medium',
  dailyReminder: false,
  reminderTime: '09:00'
};
