// Default route per le tab: redirect alla prima tab (Home)
import { Redirect } from 'expo-router';

export default function TabsIndex() {
  return <Redirect href="/(app)/(tabs)/home" />;
}
