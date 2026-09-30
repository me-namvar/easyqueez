import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Topic, Quiz } from '../types';

interface StatisticsProps {
  topics: Topic[];
}

// Colors for the stacked bar chart
const BAR_COLORS = ['#4f46e5', '#ec4899', '#06b6d4', '#84cc16', '#f59e0b', '#6366f1'];

export const Statistics: React.FC<StatisticsProps> = ({ topics }) => {
  // Flatten quizzes for time series
  const allQuizzes: Quiz[] = topics.flatMap(t => t.quizzes)
    .filter(q => q.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Data for Score vs Time (Line Chart)
  const timeSeriesData = allQuizzes.map(q => ({
    date: new Date(q.date).toLocaleDateString(),
    score: Math.round((q.score / q.totalQuestions) * 100),
    topic: q.subTopic
  }));

  // Data for Stacked Bar Chart (Tests per Topic over Time)
  const activityByTopicData = React.useMemo(() => {
    // 1. Group quizzes by date
    const groupedByDate: any = {};
    
    // Get unique topic titles for Legend
    const topicTitles: string[] = Array.from(new Set(topics.map(t => t.title)));

    allQuizzes.forEach(q => {
      const date = new Date(q.date).toLocaleDateString();
      const parentTopic = topics.find(t => t.id === q.topicId);
      const topicName = parentTopic ? parentTopic.title : 'Unknown';

      if (!groupedByDate[date]) {
        groupedByDate[date] = { date };
        // Initialize all topics to 0 for this date
        topicTitles.forEach(t => groupedByDate[date][t] = 0);
      }
      
      const currentCount = groupedByDate[date][topicName];
      groupedByDate[date][topicName] = (typeof currentCount === 'number' ? currentCount : 0) + 1;
    });

    return Object.values(groupedByDate);
  }, [allQuizzes, topics]);

  // Calculate topic mastery
  const topicMastery = topics.map(t => {
    const completedQuizzes = t.quizzes.filter(q => q.completed);
    if (completedQuizzes.length === 0) return null;
    
    const avgScore = completedQuizzes.reduce((acc, q) => acc + (q.score/q.totalQuestions), 0) / completedQuizzes.length;
    return {
      name: t.title,
      mastery: Math.round(avgScore * 100)
    };
  }).filter(Boolean);

  const totalQuestionsAnswered = allQuizzes.reduce((acc, q) => acc + q.totalQuestions, 0);
  const overallAccuracy = allQuizzes.length > 0 
    ? Math.round((allQuizzes.reduce((acc, q) => acc + q.score, 0) / totalQuestionsAnswered) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Quizzes Completed</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{allQuizzes.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Questions</h3>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">{totalQuestionsAnswered}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Overall Accuracy</h3>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{overallAccuracy}%</p>
        </div>
      </div>

      {/* Stacked Bar Chart - Activity by Topic */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Activity by Topic</h3>
        {activityByTopicData.length > 0 ? (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityByTopicData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.3} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(0,0,0,0.05)'}}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b' }}
                />
                <Legend />
                {topics.map((topic, index) => (
                  <Bar 
                    key={topic.id} 
                    dataKey={topic.title} 
                    stackId="a" 
                    fill={BAR_COLORS[index % BAR_COLORS.length]} 
                    radius={index === topics.length - 1 ? [4, 4, 0, 0] : [0,0,0,0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
           <div className="h-[300px] flex items-center justify-center text-slate-400">
             <p>No activity data available yet.</p>
           </div>
        )}
      </div>

      {/* Progress Over Time (Score) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Score History</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeriesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="5 5" vertical={false} strokeOpacity={0.5} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} unit="%" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                formatter={(value: number) => [`${value}%`, 'Score']}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#4f46e5" 
                strokeWidth={3} 
                dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4 }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Topic Mastery (Existing) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Topic Mastery</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topicMastery || []} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid stroke="#e2e8f0" horizontal={true} vertical={false} strokeOpacity={0.5} />
              <XAxis type="number" unit="%" stroke="#94a3b8" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={100} />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="mastery" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};