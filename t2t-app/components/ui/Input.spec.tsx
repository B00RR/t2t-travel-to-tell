import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Input } from './Input';

describe('Input Component', () => {

  describe('Rendering', () => {
    it('should render the label and the input independently', () => {
      // Arrange
      const labelText = 'Nome Viaggio';
      
      // Act
      render(<Input label={labelText} placeholder="Digita qui..." />);

      // Assert
      expect(screen.getByText(labelText)).toBeTruthy();
      expect(screen.getByPlaceholderText('Digita qui...')).toBeTruthy();
    });
  });

  describe('Props', () => {
    it('should display error message and not helpertext when error is provided', () => {
      // Arrange
      const label = 'Email';
      const errorMessage = 'Email non valida';
      const helperMsg = 'Mettiti all\'opera';

      // Act
      render(<Input label={label} error={errorMessage} helperText={helperMsg} />);

      // Assert
      expect(screen.getByText(errorMessage)).toBeTruthy();
      expect(screen.queryByText(helperMsg)).toBeNull();
      
      const inputNode = screen.getByLabelText(label);
      expect(inputNode.props.accessibilityInvalid).toBe(true);
    });

    it('should display helpertext when there is no error', () => {
      // Arrange
      const label = 'Password';
      const helperMessage = 'Minimo 8 caratteri';

      // Act
      render(<Input label={label} helperText={helperMessage} />);

      // Assert
      expect(screen.getByText(helperMessage)).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('should handle text changes', () => {
      // Arrange
      const mockOnChangeText = jest.fn();
      const label = 'Bio';
      render(<Input label={label} onChangeText={mockOnChangeText} />);

      // Act
      const input = screen.getByLabelText(label);
      fireEvent.changeText(input, 'Nuova Bio');

      // Assert
      expect(mockOnChangeText).toHaveBeenCalledWith('Nuova Bio');
    });

    it('should call onFocus and onBlur when interacting with the input', () => {
        // Arrange
        const mockOnFocus = jest.fn();
        const mockOnBlur = jest.fn();
        const label = 'Search';
        render(<Input label={label} onFocus={mockOnFocus} onBlur={mockOnBlur} />);
        
        // Act
        const input = screen.getByLabelText(label);
        fireEvent(input, 'focus');
        fireEvent(input, 'blur');
  
        // Assert
        expect(mockOnFocus).toHaveBeenCalledTimes(1);
        expect(mockOnBlur).toHaveBeenCalledTimes(1);
    });
  });

});
