import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SettingsScreen from '@/app/settings';
import { ConsentProvider } from '@/lib/consent-context';
import { getProfile } from '@/lib/store';

function renderSettings() {
  return render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <ConsentProvider>
        <SettingsScreen />
      </ConsentProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(async () => { await AsyncStorage.clear(); });

describe('Settings history toggle', () => {
  it('persists historyEnabled when toggled on', async () => {
    renderSettings();
    fireEvent.press(await screen.findByText(/Save chat history/i));
    await new Promise((r) => setTimeout(r, 0));
    expect((await getProfile()).historyEnabled).toBe(true);
  });
});
