import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Text,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageLightboxProps {
  visible: boolean;
  uri: string | null;
  caption?: string | null;
  onClose: () => void;
}

/**
 * Fullscreen image viewer. Tap anywhere or the close button to dismiss.
 * The backdrop fades in/out so it feels like a natural camera roll
 * expand. No gesture zoom in v1 — contained `resizeMode: "contain"` is
 * enough for photography at phone scale and avoids the reanimated
 * pinch-gesture dance.
 */
export function ImageLightbox({ visible, uri, caption, onClose }: ImageLightboxProps) {
  const { t } = useTranslation();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 200 });
  }, [visible, opacity]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!uri) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('lightbox.close')}
        >
          <View style={styles.center} pointerEvents="box-none">
            <Image
              source={{ uri }}
              style={styles.image}
              resizeMode="contain"
            />
            {caption ? (
              <View style={styles.captionWrap} pointerEvents="none">
                <Text style={styles.caption} numberOfLines={3}>
                  {caption}
                </Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('lightbox.close')}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.9,
  },
  captionWrap: {
    position: 'absolute',
    bottom: 48,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  caption: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
