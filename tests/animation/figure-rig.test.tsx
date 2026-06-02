import { render } from '@testing-library/react-native';

import { FigureRig } from '@/animation/figure-rig';
import { NEUTRAL } from '@/animation/poses';

describe('FigureRig', () => {
  it('renders an svg for a pose without throwing', () => {
    const { UNSAFE_root } = render(<FigureRig pose={NEUTRAL} color="#000" />);
    expect(UNSAFE_root).toBeTruthy();
  });
});
