import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';

import HistoryScreen from '@/app/history';
import { addHistory } from '@/lib/history';

beforeEach(async () => { await AsyncStorage.clear(); });

describe('HistoryScreen', () => {
  it('shows an empty state when there is no history', async () => {
    render(<HistoryScreen />);
    expect(await screen.findByText(/No history/i)).toBeTruthy();
  });

  it('lists entries and clears them', async () => {
    await addHistory({ ts: '2026-06-02T10:00:00.000Z', query: 'my neck hurts', bodyArea: 'neck', count: 3 });
    render(<HistoryScreen />);
    expect(await screen.findByText('my neck hurts')).toBeTruthy();
    fireEvent.press(screen.getByText('Clear history'));
    await new Promise((r) => setTimeout(r, 0));
    expect(await screen.findByText(/No history/i)).toBeTruthy();
  });
});
