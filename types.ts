
export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string; // Why the correct answer is right and others are wrong
}

export interface Quiz {
  id: string;
  topicId: string;
  subTopic: string;
  date: string; // ISO string
  questions: Question[];
  userAnswers: Record<string, number>; // questionId -> selectedOptionIndex
  completed: boolean;
  score: number;
  totalQuestions: number;
}

export interface Topic {
  id: string;
  title: string;
  sourceType: 'Custom' | 'AI_Generated';
  sourceName: string;
  subTopics: string[];
  quizzes: Quiz[];
  // Store unused questions here to minimize API calls
  questionBank: Record<string, Question[]>; 
  createdAt: string;
}

export interface QuizProgress {
  quizId: string;
  currentQuestionIndex: number;
  answers: Record<string, number>;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  textSize: 'small' | 'medium' | 'large';
  dailyReminder: boolean;
  reminderTime: string; // Format "HH:MM"
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Feedback {
  id: string;
  text: string;
  date: string;
  status: 'sent' | 'replied';
  adminResponse?: string;
}

export type Screen = 'dashboard' | 'create-topic' | 'quiz' | 'results' | 'review-quiz' | 'statistics' | 'settings' | 'chat';
