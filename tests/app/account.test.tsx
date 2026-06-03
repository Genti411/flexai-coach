import { render, screen } from '@testing-library/react-native';

import AccountScreen from '@/app/account';

describe('AccountScreen', () => {
  it('shows the not-configured state when Supabase is unset', async () => {
    render(<AccountScreen />);
    expect(await screen.findByText(/not configured/i)).toBeTruthy();
  });
});
