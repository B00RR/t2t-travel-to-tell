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

    expect(getByText('day.mood_question')).toBeTruthy();
    // Verify some expected moods
    expect(getByText('😍')).toBeTruthy();
    expect(getByText('day.moods.fantastic')).toBeTruthy();
    expect(getByText('common.cancel')).toBeTruthy();
  });

  it('calls onSelect with emoji and label when a mood is pressed', () => {
    const { getByText } = render(
      <MoodPickerModal visible={true} onSelect={mockOnSelect} onClose={mockOnClose} />
    );

    fireEvent.press(getByText('😍'));
    expect(mockOnSelect).toHaveBeenCalledWith('😍', 'day.moods.fantastic');
  });

  it('calls onClose when cancel is pressed', () => {
    const { getByText } = render(
      <MoodPickerModal visible={true} onSelect={mockOnSelect} onClose={mockOnClose} />
    );

    fireEvent.press(getByText('common.cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
