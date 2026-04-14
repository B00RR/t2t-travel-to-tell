import { render } from '@testing-library/react-native';
import { Skeleton, DiaryCardSkeleton, EntryCardSkeleton, ProfileSkeleton } from '../Skeleton';
import { useAppTheme } from '@/hooks/useAppTheme';

// Mock hook
jest.mock('@/hooks/useAppTheme');
jest.mock('react-native-reanimated', () => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: View,
      Text: View,
    },
    View: View,
    useSharedValue: (v: any) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: any) => v,
    withRepeat: (v: any) => v,
    interpolate: (v: any) => v,
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
    expect(render(<Skeleton width={100} height={20} />)).toBeTruthy();
    expect(render(<Skeleton />)).toBeTruthy();
  });

  it('RENDERS DiaryCardSkeleton without crash', () => {
    expect(render(<DiaryCardSkeleton />)).toBeTruthy();
  });

  it('RENDERS EntryCardSkeleton without crash', () => {
    expect(render(<EntryCardSkeleton />)).toBeTruthy();
  });

  it('RENDERS ProfileSkeleton without crash', () => {
    expect(render(<ProfileSkeleton />)).toBeTruthy();
  });
});
