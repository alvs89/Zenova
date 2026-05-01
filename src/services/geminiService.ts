import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;
let currentApiKey: string | null = null;
let currentApiKeySource: 'user' | 'default' | null = null;

const API_KEY_STORAGE_KEY = 'zenova_gemini_api_key';
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];

function getStoredUserApiKey(): string {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem(API_KEY_STORAGE_KEY)?.trim() || '';
}

function getAI(): GoogleGenAI {
  const userKey = getStoredUserApiKey();
  const envKey = process.env.GEMINI_API_KEY?.trim() || '';
  const keyToUse = userKey || envKey;
  const keySource = userKey ? 'user' : 'default';

  if (!aiInstance || currentApiKey !== keyToUse || currentApiKeySource !== keySource) {
    if (!keyToUse) {
      throw new Error("No Gemini API Key found. Please add it in Settings.");
    }
    aiInstance = new GoogleGenAI({ apiKey: keyToUse });
    currentApiKey = keyToUse;
    currentApiKeySource = keySource;
  }
  return aiInstance;
}

function getApiKeySource(): 'user' | 'default' | null {
  return currentApiKeySource || (getStoredUserApiKey() ? 'user' : null);
}

function isQuotaError(error: any): boolean {
  const message = error?.message?.toLowerCase() || '';
  return error?.message?.includes('429') || message.includes('quota') || message.includes('exhausted');
}

async function generateContentWithFallback(request: any) {
  let lastError: any;

  for (const model of GEMINI_MODELS) {
    try {
      return await getAI().models.generateContent({
        ...request,
        model,
      });
    } catch (error: any) {
      lastError = error;
      if (!isQuotaError(error)) {
        throw error;
      }
      console.warn(`Gemini quota error for ${model}, trying next model if available.`, error);
    }
  }

  throw lastError;
}

const getInstructions = () => [
  `The current date is: ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`,
  "You are a friendly, encouraging, and highly capable study assistant for a student platform called Zenova.",
  "Your goals:",
  "1. Explain concepts simply and clearly, using analogies when helpful.",
  "2. Provide concise summaries of notes if provided.",
  "3. Generate quiz questions if requested.",
  "4. Keep the tone very supportive, like a smart, motivating peer or mentor. Use occasional emojis.",
  "5. Empathize with student struggles (stress, procrastination, burnout).",
  "6. IMPORTANT: Always format your output cleanly using standard Markdown.",
  "7. When using bold text, do NOT put spaces inside the asterisks (e.g., use **Bold** instead of ** Bold **).",
  "8. Do not use '###' for headings, use bolding or plain lists instead to keep the output aesthetically pleasing.",
  "9. Space out your paragraphs cleanly."
].join('\n');

export async function generateChatResponse(messages: { role: string; content: string; attachments?: {mimeType: string, data: string}[] }[], context?: string, signal?: AbortSignal): Promise<string> {
  try {
    const formattedMessages = messages.map(msg => {
      const parts: any[] = [{ text: msg.content }];
      if (msg.attachments) {
        for (const act of msg.attachments) {
          parts.push({
            inlineData: {
              mimeType: act.mimeType,
              data: act.data
            }
          });
        }
      }
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: parts
      };
    });

    let systemInstruction = getInstructions();
    if (context) {
      systemInstruction += `\n\nAdditional Context:\n${context}`;
    }

    const response = await generateContentWithFallback({
      contents: formattedMessages,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        tools: [{ googleSearch: {} }],
        httpOptions: signal ? { signal } as any : undefined,
      }
    });

    return response.text || "I'm having trouble thinking right now. Could you try asking again?";
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw error;
    }
    console.error("Gemini API Error:", error);
    let errorMessage = "Oops! I ran into a bit of trouble connecting to my brain.\n\n";
    if (isQuotaError(error)) {
      if (getApiKeySource() === 'user') {
        errorMessage += "*(I used the Gemini API key saved in Settings and tried the available Flash models, but Google still returned a quota limit. Please check that this key has Gemini API quota available in Google AI Studio, or try another key.)*";
      } else {
        errorMessage += "*(It looks like the default AI quota has been exceeded. You can add your own free Gemini API Key in the **Settings** menu by clicking on the gear icon!)*";
      }
    } else {
      errorMessage += `*(Error Details: ${error.message}. If this persists, try adding your own Gemini API Key in the **Settings** menu.)*`;
    }
    return errorMessage;
  }
}

export async function generateChatTitle(firstMessage: string): Promise<string> {
  try {
    const response = await generateContentWithFallback({
      contents: `Generate a concise, 3-5 word title for a chat session starting with this message: "${firstMessage}". Do not use quotes or formatting. Just output the title.`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text?.trim() || "New Chat";
  } catch (error) {
    console.error("Gemini Title API Error:", error);
    return "New Chat";
  }
}

export async function suggestStudySchedule(tasks: any[]): Promise<string> {
  try {
    const prompt = `I am a student using Zenova. Here are my current tasks:
${JSON.stringify(tasks, null, 2)}
Please suggest a brief, optimized study schedule for today based on these tasks. Prioritize 'urgent' and 'important' items.
Keep it encouraging and structured (e.g., morning/afternoon block or Pomodoro sessions). Respond in Markdown. Do NOT use HTML <br> tags, use standard markdown spacing.`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        temperature: 0.5,
      }
    });

    return response.text || "I couldn't generate a schedule right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate a study schedule.";
  }
}
