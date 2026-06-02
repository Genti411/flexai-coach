import { fireEvent, render, screen } from '@testing-library/react-native';

import { StretchCard } from '@/components/stretch-card';
import { Recommendation } from '@/core/types';

const base: Recommendation = {
  name: 'Chin Tucks',
  type: 'mobility',
  target_muscles: ['deep neck flexors'],
  instructions: ['Sit tall.', 'Pull your chin back.'],
  sets: 2,
  reps: 10,
  duration: '5 seconds each rep',
  equipment: 'none',
  weighted: false,
  difficulty: 'beginner',
  safety_notes: ['Stop if you feel sharp pain.'],
  media_prompt: 'p',
  animationId: 'chinTuck',
};

describe('StretchCard', () => {
  it('renders the name, instructions, and easier/harder controls', () => {
    render(<StretchCard rec={base} onEasier={() => {}} onHarder={() => {}} />);
    expect(screen.getByText('Chin Tucks')).toBeTruthy();
    expect(screen.getByText('Sit tall.')).toBeTruthy();
    expect(screen.getByText('Make easier')).toBeTruthy();
    expect(screen.getByText('Make harder')).toBeTruthy();
  });

  it('shows an enabled "Show animation" control when a valid animationId is present, and toggles it', () => {
    render(<StretchCard rec={base} onEasier={() => {}} onHarder={() => {}} />);
    const btn = screen.getByText('Show animation');
    expect(btn).toBeTruthy();
    fireEvent.press(btn); // expand
    expect(screen.getByText('Hide animation')).toBeTruthy();
  });

  it('hides the animation control when there is no animationId (e.g. LLM result)', () => {
    const noAnim: Recommendation = { ...base, animationId: undefined };
    render(<StretchCard rec={noAnim} onEasier={() => {}} onHarder={() => {}} />);
    expect(screen.queryByText('Show animation')).toBeNull();
  });
});
