import React from 'react';
import { render } from '@testing-library/react-native';
import { InteractiveGlobe } from './InteractiveGlobe';

jest.mock('@react-three/fiber/native', () => ({
  Canvas: ({ children, testID }: any) => {
    const { View } = require('react-native');
    return <View testID={testID}>{children}</View>;
  },
  useFrame: () => {},
}));

jest.mock('@/hooks/useAppTheme', () => ({
  useAppTheme: () => ({
    bg: '#000000',
    bgElevated: '#1E1E1E',
    teal: '#00D9FF',
    orange: '#FF9500',
    textPrimary: '#fff',
  }),
}));

describe('InteractiveGlobe', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<InteractiveGlobe />);
    expect(getByTestId('globe-container')).toBeTruthy();
    expect(getByTestId('three-canvas')).toBeTruthy();
  });

  it('applies custom height', () => {
    const { getByTestId } = render(<InteractiveGlobe height={500} />);
    const container = getByTestId('globe-container');
    expect(container.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ height: 500 })])
    );
  });

  it('renders with default height', () => {
    const { getByTestId } = render(<InteractiveGlobe />);
    const container = getByTestId('globe-container');
    expect(container.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ height: 350 })])
    );
  });
});
