import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';

export interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  isDarkTheme?: boolean;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button = ({
  onPress,
  title,
  variant = 'primary',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  isDarkTheme = false,
  accessibilityLabel,
}: ButtonProps) => {
  const theme = isDarkTheme ? Colors.dark : Colors.light;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : 1,
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, { damping: 10, stiffness: 150 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, { damping: 10, stiffness: 150 });
    }
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return theme.tint;
      case 'secondary': return theme.surfaceElevated;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      default: return theme.tint;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.textFaint;
    switch (variant) {
      case 'primary': return '#FFFFFF'; // Legible against primary tint
      case 'secondary': return theme.text;
      case 'outline': return theme.text;
      case 'ghost': return theme.tintSecondary;
      default: return '#FFFFFF';
    }
  };

  const borderStyle: ViewStyle = variant === 'outline' ? {
    borderWidth: 1,
    borderColor: theme.border,
  } : {};

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      accessibilityLabel={accessibilityLabel || title}
      style={[
        styles.base,
        { backgroundColor: getBackgroundColor() },
        borderStyle,
        animatedStyle,
        style,
      ]}
    >
      {leftIcon && leftIcon}
      <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
        {loading ? 'Caricamento…' : title}
      </Text>
      {rightIcon && rightIcon}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // minimum 44pt touch target Apple HIG
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.sm, // 8dp
    gap: Spacing.sm,
  },
  text: {
    ...Typography.label,
    textAlign: 'center',
  },
});

export default Button;
