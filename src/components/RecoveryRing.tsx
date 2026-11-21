import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';

interface Props {
  /** 0..100 */
  percent: number;
  days: number;
  size?: number;
}

/**
 * Recovery ring from the Progress comp:
 * dark navy track, green gradient arc clockwise from the top,
 * RECOVERY / % / DAY STREAK stacked in the centre.
 */
export function RecoveryRing({ percent, days, size = 300 }: Props) {
  const stroke = 19;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = c * (1 - clamped / 100);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="arc" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#00c9a7" />
            <Stop offset="45%" stopColor="#00e676" />
            <Stop offset="100%" stopColor="#4dff88" />
          </SvgGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#1e2a3f"
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#arc)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.center}>
        <Text style={styles.label}>RECOVERY</Text>
        <Text style={styles.percent}>{clamped}%</Text>
        <Text style={styles.streak}>{days} DAY STREAK</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#8a93a6',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
  },
  percent: {
    marginTop: 6,
    color: '#ffffff',
    fontSize: 62,
    fontWeight: '800',
    lineHeight: 68,
  },
  streak: {
    marginTop: 6,
    color: '#8a93a6',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
});
