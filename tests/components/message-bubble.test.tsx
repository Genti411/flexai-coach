import { render, screen } from '@testing-library/react-native';

import { ChatMessage, MessageBubble } from '@/components/message-bubble';

const textMsg: ChatMessage = { id: '1', role: 'user', kind: 'text', text: 'my neck hurts' };
const recMsg: ChatMessage = {
  id: '2', role: 'assistant', kind: 'response',
  response: {
    disclaimer: 'd', risk_level: 'low', body_area: 'neck', summary: 'These may help.', seek_medical_help_if: ['sharp pain'],
    recommendations: [
      { name: 'Chin Tucks', type: 'mobility', target_muscles: ['neck'], instructions: ['Sit tall.'], sets: 2, reps: 10,
        duration: '5s', equipment: 'none', weighted: false, difficulty: 'beginner', safety_notes: ['Stop if it hurts.'], media_prompt: 'p' },
    ],
  },
};

describe('MessageBubble', () => {
  it('renders a plain text message', () => {
    render(<MessageBubble message={textMsg} onEasier={() => {}} onHarder={() => {}} />);
    expect(screen.getByText('my neck hurts')).toBeTruthy();
  });
  it('renders a response with summary and a stretch card', () => {
    render(<MessageBubble message={recMsg} onEasier={() => {}} onHarder={() => {}} />);
    expect(screen.getByText('These may help.')).toBeTruthy();
    expect(screen.getByText('Chin Tucks')).toBeTruthy();
  });
});
