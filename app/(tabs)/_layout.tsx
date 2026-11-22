import { Tabs } from 'expo-router';

import { AppTabBar } from '@/components/AppTabBar';
import { colors } from '@/theme';

/**
 * Tab shell built on the real Tabs navigator with a custom bar.
 * (The previous hand-rolled <Slot/> + bar shell rendered the bar twice
 * on physical iOS devices; the navigator renders its tabBar exactly once.)
 */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="journal" />
      <Tabs.Screen name="support" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
