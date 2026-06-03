import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Home from '@/app/index';
import { getHistory } from '@/lib/history';
import { setProfile } from '@/lib/store';

function renderHome() {
  return render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <Home />
    </SafeAreaProvider>,
  );
}

beforeEach(async () => { await AsyncStorage.clear(); });

describe('Home history logging', () => {
  it('does not log when history is disabled', async () => {
    renderHome();
    fireEvent.press(screen.getByText('Neck tension'));
    expect(await screen.findByText('Chin Tucks')).toBeTruthy();
    expect(await getHistory()).toEqual([]);
  });

  it('logs a history entry when enabled', async () => {
    await setProfile({ historyEnabled: true });
    renderHome();
    fireEvent.press(screen.getByText('Neck tension'));
    expect(await screen.findByText('Chin Tucks')).toBeTruthy();
    await new Promise((r) => setTimeout(r, 0));
    const h = await getHistory();
    expect(h).toHaveLength(1);
    expect(h[0].bodyArea).toBe('neck');
  });
});
