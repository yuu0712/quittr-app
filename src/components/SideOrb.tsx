import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

/**
 * Small dark orb on the left — the previous level.
 * Comp: 91px, 3px border #a3c9d433, dark conic metal gradient.
 * Conic is approximated with a linear metal sweep + inner highlight.
 */
export function SideOrb({ size = 91 }: { size?: number }) {
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 91 91">
        <Defs>
          <LinearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#22353b" />
            <Stop offset="18%" stopColor="#10191c" />
            <Stop offset="34%" stopColor="#33434a" />
            <Stop offset="54%" stopColor="#111a1d" />
            <Stop offset="74%" stopColor="#25373c" />
            <Stop offset="100%" stopColor="#101619" />
          </LinearGradient>
          <LinearGradient id="sheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#78949a" stopOpacity="0.13" />
            <Stop offset="55%" stopColor="#78949a" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Circle cx="45.5" cy="45.5" r="45.5" fill="url(#metal)" />
        <Circle cx="45.5" cy="45.5" r="42.5" fill="url(#sheen)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(163,201,212,0.2)',
    shadowColor: '#a5e8ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    backgroundColor: '#10191c',
  },
});
