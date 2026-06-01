import { fireEvent, render, screen } from '@testing-library/react-native';

import { ConsentGate } from '@/components/consent-gate';

describe('ConsentGate', () => {
  it('shows the disclaimer and an agree control, and calls onAccept when pressed', () => {
    const onAccept = jest.fn();
    render(<ConsentGate onAccept={onAccept} />);
    expect(screen.getByText('Welcome to FlexAI Coach')).toBeTruthy();
    const btn = screen.getByText('I understand and agree');
    fireEvent.press(btn);
    expect(onAccept).toHaveBeenCalledTimes(1);
  });
});
