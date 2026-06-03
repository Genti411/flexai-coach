import { render, screen } from '@testing-library/react-native';

import SupportScreen from '@/app/support';

describe('SupportScreen', () => {
  it('renders gear, the affiliate disclosure, and the premium section', () => {
    render(<SupportScreen />);
    expect(screen.getByText('Foam roller')).toBeTruthy();
    expect(screen.getByText('Light dumbbells')).toBeTruthy();
    expect(screen.getByText(/Affiliate disclosure/i)).toBeTruthy();
    expect(screen.getByText(/not medical devices/i)).toBeTruthy();
    expect(screen.getByText(/Premium \(coming soon\)/i)).toBeTruthy();
    expect(screen.getByText(/fully free today/i)).toBeTruthy();
  });
});
