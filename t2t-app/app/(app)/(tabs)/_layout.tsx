import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { useNotifications } from '@/hooks/useNotifications';
import { Palette } from '@/constants/theme';

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
      <Ionicons name="add" size={26} color={focused ? Palette.bgPrimary : '#fff'} />
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
        tabBarInactiveTintColor: Palette.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => <View style={styles.tabBarBg} />,
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
    backgroundColor: Palette.bgSurface,
    borderTopColor: Palette.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 10,
    height: Platform.OS === 'ios' ? 88 : 68,
  },
  tabBarBg: {
    flex: 1,
    backgroundColor: Palette.bgSurface,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  createBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Palette.teal,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    shadowColor: Palette.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  createBtnFocused: {
    backgroundColor: '#fff',
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
