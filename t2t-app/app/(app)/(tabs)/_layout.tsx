import { Tabs } from 'expo-router';
import { MorphingTabBar } from '@/components/MorphingTabBar';

/**
 * 3-tab navigation: Home / Explore / Profile
 * Terra design — clean, warm, organic tab bar.
 */
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <MorphingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Home' }}
      />
      <Tabs.Screen
        name="explore"
        options={{ title: 'Esplora' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profilo' }}
      />
      {/* Hidden screens — accessible via navigation, not in tab bar */}
      <Tabs.Screen
        name="index"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="create"
        options={{ href: null }}
      />
    </Tabs>
  );
}
