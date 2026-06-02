import { fireEvent, render, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { StretchCard } from '@/components/stretch-card';
import { Recommendation } from '@/core/types';
import { getRoutines } from '@/lib/routines';

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

  it('saves the stretch to a routine via the inline picker', async () => {
    await AsyncStorage.clear();
    render(<StretchCard rec={base} onEasier={() => {}} onHarder={() => {}} />);
    fireEvent.press(screen.getByText('Save to routine'));
    fireEvent.changeText(screen.getByPlaceholderText('New routine name'), 'My Routine');
    fireEvent.press(screen.getByText('Create'));
    // store write is async; allow microtasks to flush
    await new Promise((r) => setTimeout(r, 0));
    const rs = await getRoutines();
    expect(rs[0]?.name).toBe('My Routine');
    expect(rs[0]?.items[0]?.name).toBe('Chin Tucks');
  });

  it('hides adjust and save controls when no handlers are provided (saved context)', () => {
    render(<StretchCard rec={base} />);
    expect(screen.queryByText('Make easier')).toBeNull();
    expect(screen.queryByText('Save to routine')).toBeNull();
  });
});
