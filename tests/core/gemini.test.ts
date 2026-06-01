import { GeminiClient } from '@/core/gemini';
import { StretchResponse } from '@/core/types';

const sample: StretchResponse = {
  disclaimer: 'd', risk_level: 'low', body_area: 'neck', summary: 's', seek_medical_help_if: ['x'],
  recommendations: [
    { name: 'Chin Tucks', type: 'mobility', target_muscles: ['neck'], instructions: ['a'], sets: 2, reps: 10,
      duration: '5s', equipment: 'none', weighted: false, difficulty: 'beginner', safety_notes: ['stop if it hurts'], media_prompt: 'p' },
  ],
};

function fakeFetch(body: unknown) {
  return async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(body) }] } }] }) }) as unknown as Response;
}

describe('GeminiClient', () => {
  it('parses a valid JSON response into a StretchResponse', async () => {
    const client = new GeminiClient('FAKE_KEY', fakeFetch(sample));
    const res = await client.suggest('my neck is weird');
    expect(res.body_area).toBe('neck');
  });
  it('throws when the API key is missing', async () => {
    const client = new GeminiClient(undefined, fakeFetch(sample));
    await expect(client.suggest('x')).rejects.toThrow();
  });
  it('throws when the payload fails validation', async () => {
    const client = new GeminiClient('FAKE_KEY', fakeFetch({ nonsense: true }));
    await expect(client.suggest('x')).rejects.toThrow();
  });
});
