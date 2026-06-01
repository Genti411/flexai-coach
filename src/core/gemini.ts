import { DISCLAIMER, StretchResponse } from './types';
import { validateResponse } from './validate';

export interface LlmClient {
  suggest(input: string): Promise<StretchResponse>;
}

type FetchFn = typeof fetch;

const MODEL = 'gemini-2.0-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are a cautious fitness mobility assistant. The user describes muscle tension, soreness, or cramps. Respond ONLY with JSON matching this shape:
{"disclaimer": string, "risk_level": "low"|"medium"|"high", "body_area": string, "summary": string, "seek_medical_help_if": string[], "recommendations": [{"name": string, "type": "mobility"|"stretch"|"strength", "target_muscles": string[], "instructions": string[], "sets": number, "reps": number, "duration": string, "equipment": string, "weighted": boolean, "difficulty": "beginner"|"intermediate"|"advanced", "safety_notes": string[], "media_prompt": string}]}
Rules: 3-5 gentle, beginner-friendly recommendations. Never diagnose. Only suggest weighted exercises when clearly safe and requested. Always include safety_notes telling the user to stop if they feel sharp pain, numbness, tingling, or dizziness. Set disclaimer to a short general-fitness disclaimer.`;

export class GeminiClient implements LlmClient {
  constructor(
    private readonly apiKey: string | undefined,
    private readonly fetchFn: FetchFn = fetch,
  ) {}

  async suggest(input: string): Promise<StretchResponse> {
    if (!this.apiKey) throw new Error('Gemini API key not configured');

    const res = await this.fetchFn(`${ENDPOINT}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nUser: ${input}` }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!res.ok) throw new Error(`Gemini request failed: ${res.status}`);
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini returned no content');

    const parsed = JSON.parse(text) as unknown;
    if (!validateResponse(parsed)) throw new Error('Gemini returned an invalid payload');
    return { ...parsed, disclaimer: parsed.disclaimer || DISCLAIMER };
  }
}

export const geminiClient = new GeminiClient(process.env.EXPO_PUBLIC_GEMINI_API_KEY);
