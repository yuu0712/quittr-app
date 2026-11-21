import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  RadialGradient,
  Stop,
} from 'react-native-svg';

/**
 * Central orb — reproduces the layered CSS radial-gradients of the comp:
 *  base linear (pink -> violet -> blue) approximated by the radial stack
 *  teal highlight at 68%/28%, magenta at 31%/15%, blue at 36%/87%,
 *  plus the soft white specular blur at top-right.
 */
export function Orb({ size = 212 }: { size?: number }) {
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 212 212">
        <Defs>
          <RadialGradient id="base" cx="38%" cy="30%" r="90%">
            <Stop offset="0%" stopColor="#ed286e" />
            <Stop offset="55%" stopColor="#5752ed" />
            <Stop offset="100%" stopColor="#168be9" />
          </RadialGradient>
          <RadialGradient id="teal" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#39eac4" />
            <Stop offset="33%" stopColor="#30cbd4" />
            <Stop offset="100%" stopColor="#30cbd4" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="magenta" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#fa2162" />
            <Stop offset="55%" stopColor="#c522a5" />
            <Stop offset="100%" stopColor="#c522a5" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="blue" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#118fea" />
            <Stop offset="60%" stopColor="#2645f7" />
            <Stop offset="100%" stopColor="#2645f7" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="spec" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#d3fff3" stopOpacity="0.28" />
            <Stop offset="100%" stopColor="#d3fff3" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Circle cx="106" cy="106" r="106" fill="url(#base)" />
        {/* ellipse at 36% 87% — blue */}
        <Ellipse cx="76" cy="184" rx="105" ry="105" fill="url(#blue)" />
        {/* ellipse at 31% 15% — magenta / pink */}
        <Ellipse cx="66" cy="32" rx="100" ry="100" fill="url(#magenta)" />
        {/* ellipse at 68% 28% — teal */}
        <Ellipse cx="144" cy="59" rx="62" ry="62" fill="url(#teal)" />
        {/* specular highlight, rotated ellipse top-right */}
        <Ellipse
          cx="158"
          cy="48"
          rx="42"
          ry="24"
          fill="url(#spec)"
          transform="rotate(30 158 48)"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    shadowColor: '#a021a5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.17,
    shadowRadius: 36,
    elevation: 8,
    backgroundColor: '#5752ed',
  },
});
