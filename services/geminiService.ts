import { Question } from "../types";

export const generateTopicSuggestions = async (topic: string): Promise<string[]> => {
  try {
    const res = await fetch('/api/gemini/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    });

    if (!res.ok) {
      throw new Error(`Server returned error ${res.status}`);
    }

    const data = await res.json();
    return data.sources || [];
  } catch (err: any) {
    console.error("Failed to fetch topic suggestions:", err);
    throw err;
  }
};

export const generateSubTopics = async (topic: string, source: string): Promise<string[]> => {
  try {
    const res = await fetch('/api/gemini/subtopics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, source })
    });

    if (!res.ok) {
      throw new Error(`Server returned error ${res.status}`);
    }

    const data = await res.json();
    return data.subTopics || [];
  } catch (err: any) {
    console.error("Failed to fetch subtopics:", err);
    throw err;
  }
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
      body: JSON.stringify({ 
        topic, 
        subTopic, 
        count: requestedCount 
      })
    });

    if (!res.ok) {
      throw new Error(`Server returned error ${res.status}`);
    }

    const data = await res.json();
    return data.questions || [];
  } catch (err: any) {
    console.error("Failed to fetch quiz questions:", err);
    throw err;
  }
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

    if (!res.ok) {
      throw new Error(`Server returned error ${res.status}`);
    }

    const data = await res.json();
    return data.reply || "I couldn't generate a response.";
  } catch (err: any) {
    console.error("Chat request failed:", err);
    return "I am currently unable to reach the study assistant service. Please check your connection.";
  }
};
