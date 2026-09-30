import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
app.use(express.json());

const CANDIDATE_MODELS = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

async function generateWithFallback(params: { contents: string; config?: any }) {
  const ai = getAiClient();
  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed:`, err?.message || err);
      lastError = err;
    }
  }
  throw lastError || new Error('All model candidates failed');
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

function getDefaultQuestions(topic: string, subTopic: string, count: number) {
  const items = [];
  for (let i = 1; i <= count; i++) {
    items.push({
      id: Math.random().toString(36).substring(2, 11),
      text: `Regarding ${subTopic}: Which of the following statements represents a fundamental principle?`,
      options: [
        `It establishes the core baseline necessary for analyzing ${topic}.`,
        `It applies exclusively to theoretical models and has no practical impact.`,
        `It was deprecated in the 19th century and replaced by ad-hoc methods.`,
        `It requires external proprietary software to evaluate accurately.`
      ],
      correctIndex: 0,
      explanation: `Understanding the primary foundation of ${subTopic} is essential for connecting broader insights in ${topic}.`
    });
  }
  return items;
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.post('/api/gemini/sources', async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'Topic is required' });

  try {
    const text = await generateWithFallback({
      contents: `Suggest 5 high-quality learning sources for studying "${topic}". Return only a JSON array of strings.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    const parsed = JSON.parse(text || '[]');
    return res.json({ sources: Array.isArray(parsed) && parsed.length > 0 ? parsed : getDefaultSources(topic) });
  } catch (err: any) {
    return res.json({ sources: getDefaultSources(topic), fallback: true });
  }
});

app.post('/api/gemini/subtopics', async (req, res) => {
  const { topic, source } = req.body;
  if (!topic) return res.status(400).json({ error: 'Topic is required' });

  try {
    const text = await generateWithFallback({
      contents: `Break down "${topic}" based on "${source || 'core curriculum'}" into 8 structured sub-topics. Return only a JSON array of strings.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    const parsed = JSON.parse(text || '[]');
    return res.json({ subTopics: Array.isArray(parsed) && parsed.length > 0 ? parsed : getDefaultSubTopics(topic) });
  } catch (err: any) {
    return res.json({ subTopics: getDefaultSubTopics(topic), fallback: true });
  }
});

app.post('/api/gemini/quiz', async (req, res) => {
  const { topic, subTopic, count } = req.body;
  const requestedCount = Math.min(Math.max(Number(count) || 5, 3), 20);

  const schema = {
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
  };

  try {
    const text = await generateWithFallback({
      contents: `Generate an educational multiple-choice quiz with ${requestedCount} questions about "${subTopic}" (part of "${topic}"). Each question must have 4 options, 1 correctIndex (0-3), and explanation.`,
      config: { responseMimeType: 'application/json', responseSchema: schema }
    });

    const parsed = JSON.parse(text || '[]');
    const questions = (Array.isArray(parsed) && parsed.length > 0 ? parsed : getDefaultQuestions(topic, subTopic, requestedCount)).map((q: any) => ({
      id: Math.random().toString(36).substring(2, 11),
      text: q.text || 'Question text',
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
      explanation: q.explanation || 'Review core concepts.'
    }));

    return res.json({ questions });
  } catch (err: any) {
    return res.json({ questions: getDefaultQuestions(topic, subTopic, requestedCount), fallback: true });
  }
});

app.post('/api/gemini/chat', async (req, res) => {
  const { history, message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const ai = getAiClient();
    for (const model of CANDIDATE_MODELS) {
      try {
        const chat = ai.chats.create({
          model,
          history: Array.isArray(history) ? history : [],
          config: { systemInstruction: 'You are an encouraging learning tutor.' }
        });
        const result = await chat.sendMessage({ message });
        if (result && result.text) return res.json({ reply: result.text });
      } catch (e) { /* try next */ }
    }
    return res.json({ reply: `Regarding "${message}": Review the active topic to reinforce your understanding.` });
  } catch (err: any) {
    return res.json({ reply: `Helpful tip for "${message}": Check the quiz questions to review key concepts.` });
  }
});

export default app;
