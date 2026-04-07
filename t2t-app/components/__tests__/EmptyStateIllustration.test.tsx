import React from 'react';
import { render } from '@testing-library/react-native';
import { EmptyStateIllustration } from '../EmptyStateIllustration';
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
    withSequence: (v: any) => v,
    withDelay: (t: any, v: any) => v,
    interpolate: (v: any, i: any, o: any) => v,
    FadeInUp: {
      duration: () => ({
        springify: () => ({}),
      }),
    },
    Easing: {
      inOut: () => ({}),
      ease: {},
    },
  };
});
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('EmptyStateIllustration', () => {
  beforeEach(() => {
    (useAppTheme as jest.Mock).mockReturnValue({
      textPrimary: '#000',
      textMuted: '#666',
      teal: '#008080',
      red: '#FF0000',
      orange: '#FFA500',
      tealAlpha10: 'rgba(0,128,128,0.1)',
      orangeAlpha10: 'rgba(255,165,0,0.1)',
    });
  });

  it('RENDERS correctly with title and subtitle', () => {
    const { getByText } = render(
      <EmptyStateIllustration 
        type="no-diaries" 
        title="Nessun diario" 
        subtitle="Inizia il tuo primo viaggio" 
      />
    );
    
    expect(getByText('Nessun diario')).toBeTruthy();
    expect(getByText('Inizia il tuo primo viaggio')).toBeTruthy();
  });

  it('MOSTRA l\'accent text se fornito', () => {
    const { getByText } = render(
      <EmptyStateIllustration 
        type="no-diaries" 
        title="Vuoto" 
        accent="Nuova avventura?" 
      />
    );
    
    expect(getByText('Nuova avventura?')).toBeTruthy();
  });

  it('CAMBIA colori per il tipo error', () => {
    // We check if it renders without crash for 'error' type
    const { getByText } = render(
      <EmptyStateIllustration 
        type="error" 
        title="Errore di connessione" 
      />
    );
    
    expect(getByText('Errore di connessione')).toBeTruthy();
  });
});
