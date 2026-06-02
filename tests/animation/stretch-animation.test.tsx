import { render } from '@testing-library/react-native';

import { StretchAnimation } from '@/animation/stretch-animation';

describe('StretchAnimation', () => {
  it('renders for a known animationId without throwing', () => {
    const { UNSAFE_root } = render(<StretchAnimation animationId="chinTuck" />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders nothing for an unknown id', () => {
    const { toJSON } = render(<StretchAnimation animationId="nope" />);
    expect(toJSON()).toBeNull();
  });
});
