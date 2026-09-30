import React, { useState } from 'react';
import { generateTopicSuggestions, generateSubTopics } from '../services/geminiService';
import { Button } from './Button';
import { ArrowRight, BookOpen, Layers, Loader2, AlertCircle } from 'lucide-react';

interface TopicWizardProps {
  onComplete: (topicName: string, source: string, subTopics: string[]) => void;
  onCancel: () => void;
}

export const TopicWizard: React.FC<TopicWizardProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [topicInput, setTopicInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [suggestedSources, setSuggestedSources] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState('');
  
  const [generatedSubTopics, setGeneratedSubTopics] = useState<string[]>([]);

  const handleTopicSubmit = async () => {
    if (!topicInput.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const sources = await generateTopicSuggestions(topicInput);
      if (sources.length === 0) throw new Error("No sources found");
      setSuggestedSources(sources);
      setStep(2);
    } catch (error: any) {
      console.error("Failed to get sources", error);
      setError(error.message?.includes('403') 
        ? "Access denied. Check if the API key is configured correctly in the environment." 
        : "Failed to generate suggestions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSourceSelect = async (source: string) => {
    setSelectedSource(source);
    setLoading(true);
    setError(null);
    try {
      const subTopics = await generateSubTopics(topicInput, source);
      setGeneratedSubTopics(subTopics);
      setStep(3);
    } catch (error: any) {
      console.error("Failed to get subtopics", error);
      setError(error.message?.includes('403') 
        ? "Access denied. Check API key configuration." 
        : "Failed to generate sub-topics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onComplete(topicInput, selectedSource, generatedSubTopics);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
          <span>Topic</span>
          <span>Source</span>
          <span>Review</span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500 ease-in-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 text-sm text-red-800 dark:text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">What do you want to learn?</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Enter a broad topic like "World War II", "React Hooks", or "Astrophysics".</p>
          </div>
          <div>
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow"
              placeholder="e.g. Introduction to Psychology"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleTopicSubmit()}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onCancel} className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</Button>
            <Button onClick={handleTopicSubmit} disabled={!topicInput.trim() || loading} loading={loading} className="dark:bg-indigo-600 dark:hover:bg-indigo-500">
              Find Sources <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Choose a Source</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Select the best learning material for <strong>{topicInput}</strong>.</p>
          </div>
          
          <div className="grid gap-3">
            {suggestedSources.map((source, idx) => (
              <button
                key={idx}
                onClick={() => handleSourceSelect(source)}
                disabled={loading}
                className="flex items-center text-left w-full p-4 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all group"
              >
                <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-md mr-4 group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors">
                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-indigo-900 dark:group-hover:text-indigo-300">{source}</span>
              </button>
            ))}
          </div>
          
          {loading && (
             <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
             </div>
          )}

          <div className="flex justify-start">
             <Button variant="ghost" onClick={() => setStep(1)} disabled={loading} className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">Back</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Study Plan Generated</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">We've broken down <strong>{selectedSource}</strong> into these sub-topics.</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 max-h-80 overflow-y-auto">
            <ul className="space-y-3">
              {generatedSubTopics.map((sub, idx) => (
                <li key={idx} className="flex items-start">
                  <Layers className="w-5 h-5 text-slate-400 dark:text-slate-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-200">{sub}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-4">
             <Button variant="ghost" onClick={() => setStep(2)} className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">Back</Button>
             <Button onClick={handleFinish} className="dark:bg-indigo-600 dark:hover:bg-indigo-500">Start Learning</Button>
          </div>
        </div>
      )}
    </div>
  );
};