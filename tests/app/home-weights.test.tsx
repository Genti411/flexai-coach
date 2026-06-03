import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Home from '@/app/index';

function renderHome() {
  return render(
    <SafeAreaProvider
      initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}
    >
      <Home />
    </SafeAreaProvider>,
  );
}

describe('Home light-weights mode', () => {
  it('does not surface weighted exercises by default', async () => {
    renderHome();
    fireEvent.press(screen.getByText('Shoulder soreness'));
    // a beginner shoulder stretch confirms the response rendered
    expect(await screen.findByText('Cross-Body Shoulder Stretch')).toBeTruthy();
    expect(screen.queryByText('Light Dumbbell External Rotation')).toBeNull();
  });

  it('surfaces weighted exercises when Light weights is on', async () => {
    renderHome();
    fireEvent.press(screen.getByText('Light weights: off'));
    fireEvent.press(screen.getByText('Shoulder soreness'));
    expect(await screen.findByText('Light Dumbbell External Rotation')).toBeTruthy();
  });
});
