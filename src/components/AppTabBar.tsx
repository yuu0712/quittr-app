import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Minimal shape of the props the Tabs navigator passes to a custom tabBar. */
export interface AppTabBarProps {
  state: {
    index: number;
    routes: readonly { key: string; name: string }[];
  };
  navigateToTab: (routeKey: string) => void;
}

import { colors } from '../theme';

/** Icons / labels are the exact glyphs used in the comp's tabbar. */
const TAB_BY_ROUTE: Readonly<Record<string, { icon: string; label: string }>> = {
  index: { icon: '◆', label: 'Home' },
  progress: { icon: '▥', label: 'Progress' },
  journal: { icon: '▤', label: 'Journal' },
  support: { icon: '▦', label: 'Learn' },
  profile: { icon: '◉', label: 'Profile' },
};

/** Visible bar height above the home-indicator area (comp: 55px). */
const BAR_HEIGHT = 55;

export function AppTabBar({ state, navigateToTab }: AppTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          // Total height grows by the safe-area inset instead of padding
          // squeezing the content, so the row can never wrap or step.
          height: BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {state.routes.map((route, i) => {
        const def = TAB_BY_ROUTE[route.name];
        if (!def) return null;
        const active = state.index === i;
        const tint = active ? colors.tabActive : colors.tabInactive;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) navigateToTab(route.key);
            }}
            style={styles.tab}
          >
            {/* Fixed-size icon box: glyph metrics differ per symbol and
                per platform font, so without this box individual tabs
                sit at different heights (the "stepped" look). */}
            <View style={styles.iconBox}>
              <Text style={[styles.icon, { color: tint }]}>{def.icon}</Text>
            </View>
            <Text style={[styles.label, { color: tint }]} numberOfLines={1}>
              {def.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: colors.tabBarBorder,
    backgroundColor: colors.tabBarBg,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 28,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    lineHeight: 22,
    textAlign: 'center',
    includeFontPadding: false,
  },
  label: {
    fontSize: 9,
    lineHeight: 11,
    marginTop: 1,
  },
});
