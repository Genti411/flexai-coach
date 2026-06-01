import { buildResponse } from './dataset';
import { geminiClient, LlmClient } from './gemini';
import { matchInput } from './matcher';
import { classifyRisk, highRiskResponse } from './safety';
import { DISCLAIMER, StretchResponse } from './types';
import { sanitize, validateResponse } from './validate';

export interface EngineDeps {
  llm?: LlmClient;
}

function fallbackResponse(): StretchResponse {
  return {
    disclaimer: DISCLAIMER,
    risk_level: 'low',
    body_area: 'unknown',
    summary:
      "I'm not sure I caught that. Try telling me which area feels tense - for example: neck, " +
      'lower back, calf, shoulders, hamstrings, or chest - or pick one of the suggestions.',
    seek_medical_help_if: [],
    recommendations: [],
  };
}

export async function getStretchResponse(input: string, deps: EngineDeps = {}): Promise<StretchResponse> {
  const safety = classifyRisk(input);
  if (safety.risk === 'high') return highRiskResponse();

  const match = matchInput(input);
  if (match.bodyArea) {
    return buildResponse(match.bodyArea, { wantsWeights: match.wantsWeights, difficulty: match.difficulty, riskLevel: safety.risk });
  }

  const llm = deps.llm ?? geminiClient;
  try {
    const res = await llm.suggest(input);
    if (validateResponse(res)) {
      // The LLM is an untrusted source: if it judges the input high-risk, enforce
      // the safety block regardless of what recommendations it returned.
      if (res.risk_level === 'high') return highRiskResponse();
      return sanitize(res, safety.risk);
    }
  } catch {
    // fall through to graceful fallback
  }
  return fallbackResponse();
}
