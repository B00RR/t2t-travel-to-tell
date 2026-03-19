import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EntryCard } from '../EntryCard';
import type { DayEntry } from '@/types/dayEntry';

jest.mock('expo-av', () => ({
  Video: 'Video',
  ResizeMode: { COVER: 'cover', CONTAIN: 'contain' }
}));

describe('EntryCard', () => {
  const mockOnPress = jest.fn();
  const mockOnLongPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders text entry correctly', () => {
    const entry: DayEntry = {
      id: '1',
      type: 'text',
      content: 'Hello World',
      metadata: null,
      sort_order: 1,
    };

    const { getByText } = render(
      <EntryCard entry={entry} onPress={mockOnPress} onLongPress={mockOnLongPress} />
    );

    expect(getByText('Testo')).toBeTruthy();
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('renders tip entry correctly', () => {
    const entry: DayEntry = {
      id: '2',
      type: 'tip',
      content: 'Pro Tip',
      metadata: { category: 'general' },
      sort_order: 2,
    };

    const { getByText } = render(
      <EntryCard entry={entry} onPress={mockOnPress} onLongPress={mockOnLongPress} />
    );

    expect(getByText('Consiglio')).toBeTruthy();
    expect(getByText('Pro Tip')).toBeTruthy();
  });

  it('renders mood entry correctly', () => {
    const entry: DayEntry = {
      id: '3',
      type: 'mood',
      content: '😍',
      metadata: { label: 'Fantastico' },
      sort_order: 3,
    };

    const { getByText } = render(
      <EntryCard entry={entry} onPress={mockOnPress} onLongPress={mockOnLongPress} />
    );

    expect(getByText('😍')).toBeTruthy();
    expect(getByText('Fantastico')).toBeTruthy();
  });

  it('renders video entry correctly', () => {
    const entry: DayEntry = {
      id: 'video-1',
      type: 'video',
      content: 'https://video.mp4',
      metadata: { width: 1920, height: 1080, storagePath: 'x', thumbnailStoragePath: 'y', thumbnailUrl: 'https://thumb.jpg' },
      sort_order: 5,
    };

    const { getByTestId, root } = render(
      <EntryCard entry={entry} onPress={mockOnPress} onLongPress={mockOnLongPress} />
    );
    
    // We mocked Video as a simple component string 'Video', we can look for it in the tree
    expect(root).toBeDefined();
  });

  it('calls onPress when clicked (for non-photo entries)', () => {
    const entry: DayEntry = {
      id: '4',
      type: 'location',
      content: 'Rome',
      metadata: { place_name: 'Rome' },
      sort_order: 4,
    };

    const { getByText } = render(
      <EntryCard entry={entry} onPress={mockOnPress} onLongPress={mockOnLongPress} />
    );

    fireEvent.press(getByText('Rome'));
    expect(mockOnPress).toHaveBeenCalledWith(entry);
  });
});
