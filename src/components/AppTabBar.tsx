import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme';

interface TabDef {
  href: Href;
  match: string;
  icon: string;
  label: string;
}

/** Icons / labels are the exact glyphs used in the comp's tabbar. */
const TABS: readonly TabDef[] = [
  { href: '/', match: '/', icon: '◆', label: 'Home' },
  { href: '/progress', match: '/progress', icon: '▥', label: 'Progress' },
  { href: '/journal', match: '/journal', icon: '▤', label: 'Journal' },
  { href: '/support', match: '/support', icon: '▦', label: 'Learn' },
  { href: '/profile', match: '/profile', icon: '◉', label: 'Profile' },
] as const;

export function AppTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: Math.max(1, insets.bottom > 0 ? 4 : 1) },
      ]}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.match;
        const tint = active ? colors.tabActive : colors.tabInactive;
        return (
          <Pressable
            key={tab.label}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) router.replace(tab.href);
            }}
            style={styles.tab}
          >
            <Text style={[styles.icon, { color: tint }]}>{tab.icon}</Text>
            <Text style={[styles.label, { color: tint }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 3,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: colors.tabBarBorder,
    backgroundColor: colors.tabBarBg,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  icon: {
    fontSize: 21,
    lineHeight: 24,
  },
  label: {
    fontSize: 9,
  },
});
