import { Tabs } from 'expo-router';
import { MorphingTabBar } from '@/components/MorphingTabBar';

/**
 * 3-tab immersive navigation: Discover / Create / You
 * Uses custom MorphingTabBar — minimal, floating, glassmorphic.
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
        name="index"
        options={{ title: 'Discover' }}
      />
      <Tabs.Screen
        name="create"
        options={{ title: '' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'You' }}
      />
      {/* Hidden screens — still accessible via navigation but not shown in tab bar */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
