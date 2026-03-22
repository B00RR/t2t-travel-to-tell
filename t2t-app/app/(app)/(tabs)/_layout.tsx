import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { useNotifications } from '@/hooks/useNotifications';
import { Palette } from '@/constants/theme';
import { HapticTab } from '@/components/haptic-tab';

function ProfileTabIcon({ color, size }: { color: string; size: number }) {
  const { unreadCount } = useNotifications();
  return (
    <View>
      <Ionicons name="person" size={size} color={color} />
      {unreadCount > 0 && <View style={styles.notifDot} />}
    </View>
  );
}

function CreateTabIcon({ color, focused }: { color: string; focused: boolean }) {
  return (
    <View style={[styles.createBtn, focused && styles.createBtnFocused]}>
      <Ionicons name="add" size={27} color={focused ? Palette.bgPrimary : '#fff'} />
    </View>
  );
}

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.teal,
        tabBarInactiveTintColor: Palette.gray500,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => <View style={styles.tabBarBg} />,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('common.home'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('common.explore'),
          tabBarIcon: ({ color, size }) => <Ionicons name="compass" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: ({ color, focused }) => <CreateTabIcon color={color} focused={focused} />,
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t('common.map'),
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: t('planner.tab'),
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('common.profile'),
          tabBarIcon: ({ color, size }) => <ProfileTabIcon color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    // Floating island: rounded pill that hovers above safe area
    backgroundColor: Palette.bgSurface,
    borderTopWidth: 0,
    borderRadius: 32,
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 22 : 10,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 14 : 10,
    paddingHorizontal: 4,
    height: Platform.OS === 'ios' ? 74 : 64,
    // Deep shadow — the island casts a shadow on the screen below
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.border,
    overflow: 'hidden',
  },
  tabBarBg: {
    flex: 1,
    backgroundColor: Palette.bgSurface,
    borderRadius: 32,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.1,
    marginTop: -2,
  },
  createBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Palette.teal,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    // Teal aura glow — signature of the app
    shadowColor: Palette.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 12,
  },
  createBtnFocused: {
    backgroundColor: '#fff',
    shadowColor: '#ffffff',
    shadowOpacity: 0.5,
  },
  notifDot: {
    position: 'absolute',
    top: -1,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.red,
    borderWidth: 1.5,
    borderColor: Palette.bgSurface,
  },
});
