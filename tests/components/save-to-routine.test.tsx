import { fireEvent, render, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SaveToRoutine } from '@/components/save-to-routine';
import { addToRoutine } from '@/lib/routines';

beforeEach(async () => { await AsyncStorage.clear(); });

const recX = {
  name: 'a', type: 'mobility' as const, target_muscles: ['x'], instructions: ['a'], sets: 1, reps: 1,
  duration: '5s', equipment: 'none', weighted: false, difficulty: 'beginner' as const, safety_notes: ['n'], media_prompt: 'p',
};

describe('SaveToRoutine', () => {
  it('lists existing routine names and calls onSave when one is tapped', async () => {
    await addToRoutine('Morning', recX);
    const onSave = jest.fn();
    render(<SaveToRoutine onSave={onSave} />);
    const chip = await screen.findByText('Morning');
    fireEvent.press(chip);
    expect(onSave).toHaveBeenCalledWith('Morning');
  });

  it('creates a new routine name from the input', () => {
    const onSave = jest.fn();
    render(<SaveToRoutine onSave={onSave} />);
    fireEvent.changeText(screen.getByPlaceholderText('New routine name'), 'Evening');
    fireEvent.press(screen.getByText('Create'));
    expect(onSave).toHaveBeenCalledWith('Evening');
  });
});
