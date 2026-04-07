import React from 'react';
import { render } from '@testing-library/react-native';
import { Skeleton, DiaryCardSkeleton, EntryCardSkeleton, ProfileSkeleton } from '../Skeleton';
import { useAppTheme } from '@/hooks/useAppTheme';

// Mock hook
jest.mock('@/hooks/useAppTheme');
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: View,
      Text: View,
    },
    View: View,
    useSharedValue: (v: any) => ({ value: v }),
    useAnimatedStyle: (fn: any) => ({}),
    withTiming: (v: any) => v,
    withRepeat: (v: any) => v,
    interpolate: (v: any, i: any, o: any) => v,
  };
});

describe('Skeleton Components', () => {
  beforeEach(() => {
    (useAppTheme as jest.Mock).mockReturnValue({
      bgSurface: '#FFFFFF',
      bgElevated: '#F0F0F0',
      border: '#CCCCCC',
      scheme: 'light',
    });
  });

  it('RENDERS base Skeleton without crash', () => {
    const { getByTestId, UNSAFE_getByType } = render(<Skeleton width={100} height={20} />);
    // Skeleton component is an Animated.View, we just check it renders
    expect(render(<Skeleton />)).toBeTruthy();
  });

  it('RENDERS DiaryCardSkeleton without crash', () => {
    const { getByText } = render(<DiaryCardSkeleton />);
    expect(render(<DiaryCardSkeleton />)).toBeTruthy();
  });

  it('RENDERS EntryCardSkeleton without crash', () => {
    const { getByText } = render(<EntryCardSkeleton />);
    expect(render(<EntryCardSkeleton />)).toBeTruthy();
  });

  it('RENDERS ProfileSkeleton without crash', () => {
    const { getByText } = render(<ProfileSkeleton />);
    expect(render(<ProfileSkeleton />)).toBeTruthy();
  });
});
