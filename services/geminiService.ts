import { Question } from "../types";
import { GoogleGenAI, Type } from "@google/genai";

function getClientApiKey(): string {
  return (
    (typeof window !== 'undefined' && localStorage.getItem('user_gemini_api_key')) ||
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    ''
  );
}

function getDefaultSources(topic: string): string[] {
  return [
    `Comprehensive Guide to ${topic}`,
    `Foundational Principles of ${topic}`,
    `Standard Academic Textbook on ${topic}`,
    `${topic} in Practice: Modern Perspectives`,
    `Essential Reference & Case Studies for ${topic}`
  ];
}

function getDefaultSubTopics(topic: string): string[] {
  return [
    `Introduction & Core Concepts of ${topic}`,
    `Historical Evolution and Context`,
    `Fundamental Principles and Theories`,
    `Key Frameworks and Terminology`,
    `Real-world Applications and Examples`,
    `Comparative Analysis and Methodologies`,
    `Common Pitfalls and Best Practices`,
    `Advanced Concepts and Modern Developments`
  ];
}

function getDefaultQuestions(topic: string, subTopic: string, count: number): Question[] {
  const items: Question[] = [];
  for (let i = 1; i <= count; i++) {
    items.push({
      id: Math.random().toString(36).substring(2, 11),
      text: `Regarding ${subTopic}: Which statement best reflects a foundational principle?`,
      options: [
        `It establishes the core baseline necessary for understanding ${topic}.`,
        `It applies exclusively in theoretical setups and has no practical impact.`,
        `It was completely replaced by modern random heuristics.`,
        `It requires third-party proprietary certification to apply.`
      ],
      correctIndex: 0,
      explanation: `Mastering ${subTopic} is essential for connecting deeper concepts across ${topic}.`
    });
  }
  return items;
}

export const generateTopicSuggestions = async (topic: string): Promise<string[]> => {
  try {
    const res = await fetch('/api/gemini/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.sources) && data.sources.length > 0) {
        return data.sources;
      }
    }
  } catch (e) {
    console.warn("Backend /api unreachable, attempting direct client fallback:", e);
  }

  // Client-side fallback if backend is unavailable (e.g. static GitHub Pages)
  const clientKey = getClientApiKey();
  if (clientKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: clientKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Suggest 5 high-quality learning sources for "${topic}". Return JSON array of strings.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      });
      const parsed = JSON.parse(response.text || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (clientErr) {
      console.warn("Client Gemini error:", clientErr);
    }
  }

  return getDefaultSources(topic);
};

export const generateSubTopics = async (topic: string, source: string): Promise<string[]> => {
  try {
    const res = await fetch('/api/gemini/subtopics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, source })
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.subTopics) && data.subTopics.length > 0) {
        return data.subTopics;
      }
    }
  } catch (e) {
    console.warn("Backend /api unreachable, attempting direct client fallback:", e);
  }

  const clientKey = getClientApiKey();
  if (clientKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: clientKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Break down "${topic}" based on "${source}" into 8 structured sub-topics. Return JSON array of strings.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      });
      const parsed = JSON.parse(response.text || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (clientErr) {
      console.warn("Client Gemini error:", clientErr);
    }
  }

  return getDefaultSubTopics(topic);
};

export const generateQuizQuestions = async (
  topic: string, 
  subTopic: string, 
  requestedCount: number
): Promise<Question[]> => {
  try {
    const res = await fetch('/api/gemini/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, subTopic, count: requestedCount })
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        return data.questions;
      }
    }
  } catch (e) {
    console.warn("Backend /api unreachable, attempting direct client fallback:", e);
  }

  const clientKey = getClientApiKey();
  if (clientKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: clientKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate an educational multiple-choice quiz with ${requestedCount} questions about "${subTopic}" (${topic}). Return JSON with text, options (4 strings), correctIndex (0-3), and explanation.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              },
              required: ['text', 'options', 'correctIndex', 'explanation']
            }
          }
        }
      });
      const parsed = JSON.parse(response.text || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((q: any) => ({
          id: Math.random().toString(36).substring(2, 11),
          text: q.text,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation
        }));
      }
    } catch (clientErr) {
      console.warn("Client Gemini error:", clientErr);
    }
  }

  return getDefaultQuestions(topic, subTopic, requestedCount);
};

export const chatWithAI = async (
  history: { role: string; parts: { text: string }[] }[], 
  message: string
): Promise<string> => {
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history, message })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reply) return data.reply;
    }
  } catch (e) {
    console.warn("Backend chat unreachable:", e);
  }

  return `Regarding "${message}": Review the key definitions and quiz questions in your active topic to reinforce your understanding.`;
};
