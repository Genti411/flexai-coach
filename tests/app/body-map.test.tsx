import { fireEvent, render, screen } from '@testing-library/react-native';

import BodyMapScreen from '@/app/body-map';

describe('BodyMapScreen', () => {
  it('renders all ten area labels', () => {
    render(<BodyMapScreen />);
    for (const label of ['Neck', 'Shoulders', 'Chest', 'Lower back', 'Hamstrings', 'Calf', 'Upper back', 'Hips', 'Wrists', 'Ankles']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it('tapping Neck shows a neck stretch', () => {
    render(<BodyMapScreen />);
    fireEvent.press(screen.getByText('Neck'));
    expect(screen.getByText('Chin Tucks')).toBeTruthy();
  });

  it('tapping Calf shows a calf stretch', () => {
    render(<BodyMapScreen />);
    fireEvent.press(screen.getByText('Calf'));
    expect(screen.getByText('Standing Calf Stretch Against Wall')).toBeTruthy();
  });
});
