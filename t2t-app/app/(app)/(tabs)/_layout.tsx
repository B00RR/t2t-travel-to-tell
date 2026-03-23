import { Tabs } from 'expo-router';
import { MorphingTabBar } from '@/components/MorphingTabBar';

/**
 * 5-tab navigation: Home / Explore / Create / Map / Profile
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
        name="index"
        options={{ title: 'Home' }}
      />
      <Tabs.Screen
        name="explore"
        options={{ title: 'Explore' }}
      />
      <Tabs.Screen
        name="create"
        options={{ title: 'Create' }}
      />
      <Tabs.Screen
        name="map"
        options={{ title: 'Map' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile' }}
      />
      {/* Planner accessible via navigation but not in tab bar */}
      <Tabs.Screen
        name="planner"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
