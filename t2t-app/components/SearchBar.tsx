import React, { useState, useCallback } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Spacing, Radius } from '@/constants/theme';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onFilterPress?: () => void;
  autoFocus?: boolean;
  showFilter?: boolean;
}

export function SearchBar({
  placeholder = 'Cerca...',
  onSearch,
  onFilterPress,
  autoFocus = false,
  showFilter = true,
}: SearchBarProps) {
  const theme = useAppTheme();
  const [query, setQuery] = useState('');

  const handleSubmit = useCallback(() => {
    if (query.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSearch(query.trim());
    }
  }, [query, onSearch]);

  const handleFilter = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFilterPress?.();
  }, [onFilterPress]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bgElevated, borderColor: theme.border }]}>
      <Ionicons name="search" size={18} color={theme.textMuted} style={styles.searchIcon} />
      <TextInput
        style={[styles.input, { color: theme.textPrimary }]}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
        autoFocus={autoFocus}
      />
      {query.length > 0 && (
        <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
          <Ionicons name="close-circle" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      )}
      {showFilter && (
        <TouchableOpacity
          onPress={handleFilter}
          style={[styles.filterBtn, { backgroundColor: theme.tealAlpha15 }]}
        >
          <Ionicons name="options-outline" size={18} color={theme.teal} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 4,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
});

export default SearchBar;
