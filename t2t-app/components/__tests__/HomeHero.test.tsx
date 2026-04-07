import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HomeHero } from '../HomeHero';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useRouter } from 'expo-router';

// Mocks
jest.mock('@/hooks/useAppTheme');
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, def?: string) => def || key,
  }),
}));
jest.mock('@/components/InteractiveGlobe', () => ({
  InteractiveGlobe: 'InteractiveGlobe',
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('HomeHero', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useAppTheme as jest.Mock).mockReturnValue({
      textPrimary: '#000',
      textSecondary: '#333',
      teal: '#008080',
      orange: '#FFA500',
      sage: '#9EB19E',
    });
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('RENDERS correctly with title and CTA', () => {
    const { getByText } = render(<HomeHero />);
    
    expect(getByText('Esplora il mondo')).toBeTruthy();
    expect(getByText('Scopri storie di viaggiatori')).toBeTruthy();
    expect(getByText('Inizia a esplorare')).toBeTruthy();
  });

  it('NAVIGA alla pagina explore quando si preme il CTA', () => {
    const { getByText } = render(<HomeHero />);
    const cta = getByText('Inizia a esplorare');
    
    fireEvent.press(cta);
    expect(mockPush).toHaveBeenCalledWith('/(app)/(tabs)/explore');
  });

  it('MOSTRA le statistiche quando fornite', () => {
    const stats = {
      diaries: 120,
      countries: 15,
      travelers: 1000,
    };
    const { getByText } = render(<HomeHero stats={stats} />);
    
    expect(getByText('120')).toBeTruthy();
    expect(getByText('15')).toBeTruthy();
    expect(getByText('1000')).toBeTruthy();
    expect(getByText('Diari')).toBeTruthy();
    expect(getByText('Paesi')).toBeTruthy();
    expect(getByText('Viaggiatori')).toBeTruthy();
  });
});
