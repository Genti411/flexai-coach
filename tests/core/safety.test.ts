import { classifyRisk, highRiskResponse } from '@/core/safety';

describe('classifyRisk', () => {
  it.each([
    'I have sharp pain in my back',
    'my arm is numb',
    'numbness and tingling in my hand',
    'my leg is swollen and painful',
    "I can't move my shoulder",
    'I got injured in a fall',
    'I have chest pain',
    'shortness of breath after exercise',
    'sudden severe pain',
  ])('flags high risk: "%s"', (input) => {
    expect(classifyRisk(input).risk).toBe('high');
  });

  it.each([
    'my back pain keeps coming back',
    'my shoulder hurts when lifting',
    'persistent tightness for weeks',
  ])('flags medium risk: "%s"', (input) => {
    expect(classifyRisk(input).risk).toBe('medium');
  });

  it.each([
    'my neck is tight',
    'hamstrings are sore',
    'post workout recovery stretches',
  ])('flags low risk: "%s"', (input) => {
    expect(classifyRisk(input).risk).toBe('low');
  });

  it('builds a high-risk response with no recommendations', () => {
    const res = highRiskResponse();
    expect(res.risk_level).toBe('high');
    expect(res.recommendations).toHaveLength(0);
    expect(res.summary.length).toBeGreaterThan(0);
  });
});
