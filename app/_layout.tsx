import { Slot } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppTabBar } from '@/components/AppTabBar';
import { colors } from '@/theme';

/**
 * Tab shell: content + the comp's 55px bottom tab bar.
 * A custom bar (not the native one) is required to match the comp 1:1.
 */
export default function TabsLayout() {
  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Slot />
      </View>
      <AppTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1 },
});
