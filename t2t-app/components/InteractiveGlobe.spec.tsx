import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { InteractiveGlobe } from './InteractiveGlobe';

// Mocking @react-three/fiber/native because testing WebGL context natively is extremely complex and flaky
jest.mock('@react-three/fiber/native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Canvas: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    useFrame: jest.fn(),
  };
});

describe('InteractiveGlobe Component', () => {
  
  describe('Rendering', () => {
    it('should render the globe container without crashing', () => {
      // Arrange
      render(<InteractiveGlobe />);

      // Assert
      expect(screen.getByTestId('globe-container')).toBeTruthy();
      expect(screen.getByTestId('three-canvas')).toBeTruthy();
    });

    it('should mount with dark theme props without error', () => {
      // Arrange
      render(<InteractiveGlobe isDarkTheme={true} />);

      // Assert
      expect(screen.getByTestId('globe-container')).toBeTruthy();
    });
  });

});
