import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PassportCard } from '../PassportCard';
import { useAppTheme } from '@/hooks/useAppTheme';

// Mock hook
jest.mock('@/hooks/useAppTheme');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockStats = {
  diaries: 10,
  followers: 120,
  following: 85,
};

const defaultProps = {
  displayName: 'John Doe',
  username: 'johndoe',
  avatarUrl: 'https://example.com/avatar.jpg',
  bio: 'Travel enthusiast',
  travelStyle: 'Adventurer',
  memberSince: '2024-01-01',
  countries: ['Italy', 'France', 'Japan'],
  stats: mockStats,
  isOwnProfile: true,
};

describe('PassportCard', () => {
  beforeEach(() => {
    (useAppTheme as jest.Mock).mockReturnValue({
      bgSurface: '#FFFFFF',
      textPrimary: '#000000',
      textSecondary: '#666666',
      textMuted: '#999999',
      teal: '#008080',
      navy: '#000080',
      passGold: '#D4AF37',
      isDark: false,
    });
  });

  it('RENDERS correctly with user info', () => {
    const { getByText } = render(<PassportCard {...defaultProps} />);
    
    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('@johndoe')).toBeTruthy();
    expect(getByText('Adventurer')).toBeTruthy();
  });

  it('MOSTRA le statistiche correttamente', () => {
    const { getByText } = render(<PassportCard {...defaultProps} />);
    
    expect(getByText('10')).toBeTruthy();
    expect(getByText('120')).toBeTruthy();
    expect(getByText('85')).toBeTruthy();
  });

  it('CHIAMA onEditPress quando si preme il tasto edit (proprio profilo)', () => {
    const onEditPress = jest.fn();
    const { getByTestId } = render(
      <PassportCard {...defaultProps} onEditPress={onEditPress} />
    );
    
    const editBtn = getByTestId('passport-edit-btn');
    fireEvent.press(editBtn);
    expect(onEditPress).toHaveBeenCalled();
  });

  it('CHIAMA onFollowPress quando si preme follow (profilo altrui)', () => {
    const onFollowPress = jest.fn();
    const { getByTestId } = render(
      <PassportCard {...defaultProps} isOwnProfile={false} onFollowPress={onFollowPress} />
    );
    
    const followBtn = getByTestId('passport-follow-btn');
    fireEvent.press(followBtn);
    expect(onFollowPress).toHaveBeenCalled();
  });

  it('MOSTRA gli stamp dei paesi', () => {
    const { getByText } = render(<PassportCard {...defaultProps} />);
    expect(getByText('Italy')).toBeTruthy();
    expect(getByText('France')).toBeTruthy();
    expect(getByText('Japan')).toBeTruthy();
  });
});
