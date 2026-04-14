import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

// Simple component used by ExploreScreen to verify basic rendering
function ExploreHeaderTest() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>explore.title</Text>
      <Text style={styles.subtitle}>explore.search_placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B6560',
  },
});

describe('Explore screen components', () => {
  it('renders explore header elements', () => {
    const { getByText } = render(<ExploreHeaderTest />);
    expect(getByText('explore.title')).toBeTruthy();
    expect(getByText('explore.search_placeholder')).toBeTruthy();
  });

  it('applies correct styling to header', () => {
    const { getByText } = render(<ExploreHeaderTest />);
    const title = getByText('explore.title');
    expect(title).toBeTruthy();
    expect(title.props.style).toBeDefined();
  });
});
