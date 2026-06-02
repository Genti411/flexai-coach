import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';

import RoutinesScreen from '@/app/routines';
import { addToRoutine } from '@/lib/routines';

beforeEach(async () => { await AsyncStorage.clear(); });

const recN = (name: string) => ({
  name, type: 'mobility' as const, target_muscles: ['x'], instructions: ['a'], sets: 1, reps: 1,
  duration: '5s', equipment: 'none', weighted: false, difficulty: 'beginner' as const, safety_notes: ['n'], media_prompt: 'p',
});

describe('RoutinesScreen', () => {
  it('lists saved routines and opens one to show its stretches', async () => {
    await addToRoutine('Morning', recN('Chin Tucks'));
    render(<RoutinesScreen />);
    const item = await screen.findByText('Morning (1)');
    fireEvent.press(item);
    expect(await screen.findByText('Chin Tucks')).toBeTruthy();
  });

  it('shows an empty state when there are no routines', async () => {
    render(<RoutinesScreen />);
    expect(await screen.findByText(/No routines yet/i)).toBeTruthy();
  });
});
