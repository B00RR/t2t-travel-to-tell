import React, { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: { label: string; onPress: () => void };
}

interface ToastState extends ToastOptions {
  id: string;
  visible: boolean;
}

interface ToastContextType {
  show: (options: ToastOptions) => void;
  hide: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let toastRef: ToastContextType | null = null;

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}

export function showToast(options: ToastOptions) {
  toastRef?.show(options);
}

export function hideToast() {
  toastRef?.hide();
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppTheme();
  const [toast, setToast] = useState<ToastState | null>(null);
  const animValue = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const show = useCallback((options: ToastOptions) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const id = Math.random().toString(36).slice(2);
    setToast({ ...options, id, visible: true });

    Animated.spring(animValue, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();

    timerRef.current = setTimeout(() => {
      hide();
    }, options.duration ?? 4000);
  }, []);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.timing(animValue, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setToast(null);
    });
  }, []);

  useEffect(() => {
    toastRef = { show, hide };
    return () => { toastRef = null; };
  }, [show, hide]);

  const iconConfig: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
    success: { name: 'checkmark-circle', color: theme.sage },
    error: { name: 'close-circle', color: theme.red },
    warning: { name: 'warning', color: theme.orange },
    info: { name: 'information-circle', color: theme.ocean },
  };

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  const opacity = animValue;

  const toastType = toast?.type ?? 'info';
  const icon = iconConfig[toastType];

  return (
    <ToastContext.Provider value={{ show, hide }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.container,
            { transform: [{ translateY }], opacity },
          ]}
          pointerEvents="box-none"
        >
          <View style={[styles.toast, { backgroundColor: theme.bgSurface, shadowColor: theme.textPrimary }]}>
            <Ionicons name={icon.name} size={22} color={icon.color} />
            <Text style={[styles.message, { color: theme.textPrimary }]} numberOfLines={3}>
              {toast.message}
            </Text>
            {toast.action && (
              <TouchableOpacity onPress={toast.action.onPress} style={styles.actionBtn}>
                <Text style={[styles.actionText, { color: theme.teal }]}>{toast.action.label}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={hide} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute' as any,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    padding: 16,
    paddingTop: 48,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
