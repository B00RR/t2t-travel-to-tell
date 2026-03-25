import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';

export interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  helperText?: string;
  isDarkTheme?: boolean;
}

export const Input = React.forwardRef<TextInput, InputProps>(({
  label,
  error,
  helperText,
  isDarkTheme = false,
  style,
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const theme = isDarkTheme ? Colors.dark : Colors.light;
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = () => {
    if (error) return theme.error;
    if (isFocused) return theme.tint;
    return theme.border;
  };

  return (
    <View style={styles.container}>
      <Text nativeID={`${label}-label`} style={[styles.label, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <TextInput
        ref={ref}
        {...props}
        accessibilityLabel={label}
        accessibilityLabelledBy={`${label}-label`}
        aria-invalid={!!error}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        placeholderTextColor={theme.textFaint}
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            borderColor: getBorderColor(),
            color: theme.text,
          },
          style,
        ]}
      />
      {error ? (
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.feedbackText, { color: theme.error }]}>
          {error}
        </Text>
      ) : helperText ? (
        <Text style={[styles.feedbackText, { color: theme.textFaint }]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  label: {
    ...Typography.label,
  },
  input: {
    ...Typography.body,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 44, // Strict 44pt touch-target accessibility
  },
  feedbackText: {
    ...Typography.caption,
  },
});
