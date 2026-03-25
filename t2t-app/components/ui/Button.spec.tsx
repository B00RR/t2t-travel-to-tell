import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button Component', () => {

  describe('Rendering', () => {
    it('should render the title correctly without crashing', () => {
      // Arrange
      const title = 'Esplora Ora';
      const onPressMock = jest.fn();

      // Act
      render(<Button title={title} onPress={onPressMock} />);

      // Assert
      expect(screen.getByText(title)).toBeTruthy();
      expect(screen.getByRole('button')).toBeTruthy();
    });
  });

  describe('Props', () => {
    it('should display "Caricamento…" when loading is true', () => {
      // Arrange
      const title = 'Salva';
      
      // Act
      render(<Button title={title} onPress={jest.fn()} loading={true} />);

      // Assert
      expect(screen.getByText('Caricamento…')).toBeTruthy();
      expect(screen.queryByText(title)).toBeNull();
      // Button must be disabled and busy when loading
      expect(screen.getByRole('button').props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: true, busy: true })
      );
    });

    it('should correctly set accessibility states when disabled', () => {
      render(<Button title="Avanti" onPress={jest.fn()} disabled={true} />);
      
      expect(screen.getByRole('button').props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: true, busy: false })
      );
    });
  });

  describe('User Interactions', () => {
    it('should fire onPress when pressed', () => {
      // Arrange
      const onPressMock = jest.fn();
      render(<Button title="Premi Qui" onPress={onPressMock} />);
      
      // Act
      fireEvent.press(screen.getByRole('button'));

      // Assert
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('should NOT fire onPress when the button is disabled', () => {
      // Arrange
      const onPressMock = jest.fn();
      render(<Button title="Non premibile" onPress={onPressMock} disabled={true} />);
      
      // Act
      fireEvent.press(screen.getByRole('button'));

      // Assert
      expect(onPressMock).not.toHaveBeenCalled();
    });

    it('should NOT fire onPress when the button is loading', () => {
      // Arrange
      const onPressMock = jest.fn();
      render(<Button title="In Caricamento" onPress={onPressMock} loading={true} />);
      
      // Act
      fireEvent.press(screen.getByRole('button'));

      // Assert
      expect(onPressMock).not.toHaveBeenCalled();
    });
  });

});
