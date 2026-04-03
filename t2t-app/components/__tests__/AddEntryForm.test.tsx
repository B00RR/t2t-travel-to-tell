import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { AddEntryForm } from '../AddEntryForm';

// Mock vector icons to avoid act(...) warnings and module resolution issues
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock react-i18next so that we can easily check translation keys
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock useAppTheme for theme-based components
jest.mock('@/hooks/useAppTheme', () => ({
  useAppTheme: () => ({
    teal: '#C85A42',
    orange: '#D99632',
    red: '#C84242',
    bgElevated: '#FAF6F0',
    bgSurface: '#F0EBE3',
    textPrimary: '#141210',
    textSecondary: '#6B6560',
    textMuted: '#9E9890',
    border: '#E5E0D8',
  }),
}));

describe('AddEntryForm', () => {
  const mockOnChangeText = jest.fn();
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    value: '',
    onChangeText: mockOnChangeText,
    onSave: mockOnSave,
    onCancel: mockOnCancel,
    saving: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly for text type', () => {
    const { getByText, getByPlaceholderText, UNSAFE_getAllByType } = render(
      <AddEntryForm type="text" {...defaultProps} />
    );

    // Title and placeholder derived from translation keys
    expect(getByText('day.new_text')).toBeTruthy();

    // Check icon configuration — for type="text" there are 2 Ionicons:
    // one in the AddEntryForm header, one inside RichTextInput toolbar
    const icons = UNSAFE_getAllByType('Ionicons' as any);
    expect(icons.length).toBeGreaterThanOrEqual(1);
    expect(icons[0].props.name).toBe('document-text');
    expect(icons[0].props.color).toBe('#C85A42');

    // The input is rendered by RichTextInput (numberOfLines=6, multiline=true)
    const input = getByPlaceholderText('day.placeholder_text');
    expect(input).toBeTruthy();
    expect(input.props.multiline).toBe(true);
    expect(input.props.numberOfLines).toBe(6);
  });

  it('renders correctly for tip type', () => {
    const { getByText, getByPlaceholderText, UNSAFE_getByType } = render(
      <AddEntryForm type="tip" {...defaultProps} />
    );

    expect(getByText('day.new_tip')).toBeTruthy();
    expect(getByPlaceholderText('day.placeholder_tip')).toBeTruthy();

    const icon = UNSAFE_getByType('Ionicons' as any);
    expect(icon.props.name).toBe('bulb');
    expect(icon.props.color).toBe('#D99632');
  });

  it('renders correctly for location type', () => {
    const { getByText, getByPlaceholderText, UNSAFE_getByType } = render(
      <AddEntryForm type="location" {...defaultProps} />
    );

    expect(getByText('day.new_location')).toBeTruthy();

    const icon = UNSAFE_getByType('Ionicons' as any);
    expect(icon.props.name).toBe('location');
    expect(icon.props.color).toBe('#C84242');

    const input = getByPlaceholderText('day.placeholder_location');
    expect(input).toBeTruthy();
    expect(input.props.multiline).toBe(false);
    expect(input.props.numberOfLines).toBe(1);
  });

  it('calls onChangeText when typing', () => {
    const { getByPlaceholderText } = render(
      <AddEntryForm type="text" {...defaultProps} />
    );

    const input = getByPlaceholderText('day.placeholder_text');
    fireEvent.changeText(input, 'New entry content');

    expect(mockOnChangeText).toHaveBeenCalledWith('New entry content');
  });

  it('calls onSave when save button is pressed and value is not empty', () => {
    const { getByText } = render(
      <AddEntryForm type="text" {...defaultProps} value="Valid input" />
    );

    const saveBtnText = getByText('common.save');
    fireEvent.press(saveBtnText); // Press the text, which is inside the TouchableOpacity

    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is pressed', () => {
    const { getByText } = render(
      <AddEntryForm type="text" {...defaultProps} />
    );

    const cancelBtnText = getByText('common.cancel');
    fireEvent.press(cancelBtnText);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('save button is disabled when value is empty', () => {
    const { getByText } = render(
      <AddEntryForm type="text" {...defaultProps} value="   " /> // Only spaces
    );

    const saveBtnText = getByText('common.save');
    fireEvent.press(saveBtnText);

    // Should not be called because button is disabled (!value.trim())
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('shows ActivityIndicator and disables save button when saving is true', () => {
    const { queryByText, UNSAFE_getByType } = render(
      <AddEntryForm type="text" {...defaultProps} value="Valid input" saving={true} />
    );

    // Save text should not be visible
    expect(queryByText('common.save')).toBeNull();

    // The ActivityIndicator should be rendered
    const activityIndicator = UNSAFE_getByType(ActivityIndicator);
    expect(activityIndicator).toBeTruthy();

    // Verify it is disabled (the parent TouchableOpacity shouldn't trigger onSave)
    fireEvent.press(activityIndicator); // or trying to press anywhere in the button area
    expect(mockOnSave).not.toHaveBeenCalled();
  });
});
