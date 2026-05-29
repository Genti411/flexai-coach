import { getStretchResponse } from '@/core/engine';
import { LlmClient } from '@/core/gemini';
import { StretchResponse } from '@/core/types';

function spyLlm(): { client: LlmClient; calls: number } {
  const state = { calls: 0 };
  const client: LlmClient = {
    async suggest() {
      state.calls += 1;
      return { disclaimer: 'd', risk_level: 'low', body_area: 'general', summary: 'from llm', seek_medical_help_if: [], recommendations: [] } as StretchResponse;
    },
  };
  return { client, get calls() { return state.calls; } } as any;
}

describe('getStretchResponse', () => {
  it('returns a high-risk safety response and never calls the LLM', async () => {
    const llm = spyLlm();
    const res = await getStretchResponse('I have chest pain and numbness', { llm: llm.client });
    expect(res.risk_level).toBe('high');
    expect(res.recommendations).toHaveLength(0);
    expect(llm.calls).toBe(0);
  });
  it('answers a known body area locally without the LLM', async () => {
    const llm = spyLlm();
    const res = await getStretchResponse('my neck is tight', { llm: llm.client });
    expect(res.body_area).toBe('neck');
    expect(res.recommendations.length).toBeGreaterThan(0);
    expect(llm.calls).toBe(0);
  });
  it('falls back to the LLM when the input is unsure', async () => {
    const llm = spyLlm();
    const res = await getStretchResponse('something feels off all over', { llm: llm.client });
    expect(llm.calls).toBe(1);
    expect(res.summary).toBe('from llm');
  });
  it('returns a graceful fallback when the LLM throws', async () => {
    const llm: LlmClient = { async suggest() { throw new Error('no key'); } };
    const res = await getStretchResponse('something feels off all over', { llm });
    expect(res.recommendations).toHaveLength(0);
    expect(res.summary.toLowerCase()).toContain('try');
  });
  it('does not return weighted items when risk is medium even if requested', async () => {
    const res = await getStretchResponse('my chest hurts when lifting, can I use dumbbells', {});
    expect(res.risk_level).toBe('medium');
    expect(res.recommendations.every((r) => !r.weighted)).toBe(true);
  });
  it('blocks LLM responses that self-report high risk, even with recommendations', async () => {
    const llm: LlmClient = {
      async suggest() {
        return {
          disclaimer: 'd',
          risk_level: 'high',
          body_area: 'general',
          summary: 'llm thinks this is serious',
          seek_medical_help_if: [],
          recommendations: [
            { name: 'Bad Idea', type: 'stretch', target_muscles: ['x'], instructions: ['a'], sets: 1, reps: 1, duration: '1s', equipment: 'none', weighted: false, difficulty: 'beginner', safety_notes: ['n'], media_prompt: 'p' },
          ],
        } as StretchResponse;
      },
    };
    const res = await getStretchResponse('something feels off all over', { llm });
    expect(res.risk_level).toBe('high');
    expect(res.recommendations).toHaveLength(0);
  });
});
