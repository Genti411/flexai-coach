import { render, screen } from '@testing-library/react-native';

import { StretchCard } from '@/components/stretch-card';
import { Recommendation } from '@/core/types';

const rec: Recommendation = {
  name: 'Chin Tucks', type: 'mobility', target_muscles: ['deep neck flexors'],
  instructions: ['Sit tall.', 'Pull your chin back.'], sets: 2, reps: 10, duration: '5 seconds each rep',
  equipment: 'none', weighted: false, difficulty: 'beginner', safety_notes: ['Stop if you feel sharp pain.'], media_prompt: 'p',
};

describe('StretchCard', () => {
  it('renders the name, instructions, and an easier/harder control', () => {
    render(<StretchCard rec={rec} onEasier={() => {}} onHarder={() => {}} />);
    expect(screen.getByText('Chin Tucks')).toBeTruthy();
    expect(screen.getByText('Sit tall.')).toBeTruthy();
    expect(screen.getByText('Make easier')).toBeTruthy();
    expect(screen.getByText('Make harder')).toBeTruthy();
  });
});
