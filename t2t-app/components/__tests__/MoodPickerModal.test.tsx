import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MoodPickerModal } from '../MoodPickerModal';

describe('MoodPickerModal', () => {
  const mockOnSelect = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when visible', () => {
    const { getByText } = render(
      <MoodPickerModal visible={true} onSelect={mockOnSelect} onClose={mockOnClose} />
    );

    expect(getByText('Come ti senti oggi?')).toBeTruthy();
    // Verify some expected moods
    expect(getByText('😍')).toBeTruthy();
    expect(getByText('Fantastico')).toBeTruthy();
    expect(getByText('Annulla')).toBeTruthy();
  });

  it('calls onSelect with emoji and label when a mood is pressed', () => {
    const { getByText } = render(
      <MoodPickerModal visible={true} onSelect={mockOnSelect} onClose={mockOnClose} />
    );

    fireEvent.press(getByText('😍'));
    expect(mockOnSelect).toHaveBeenCalledWith('😍', 'Fantastico');
  });

  it('calls onClose when cancel is pressed', () => {
    const { getByText } = render(
      <MoodPickerModal visible={true} onSelect={mockOnSelect} onClose={mockOnClose} />
    );

    fireEvent.press(getByText('Annulla'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
