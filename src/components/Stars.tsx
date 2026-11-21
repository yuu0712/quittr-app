import { StyleSheet, View } from 'react-native';

/** Star specks from the comp's body/.app radial-gradient dots. */
const STARS = [
  { left: '12%', top: '18%', opacity: 0.27 },
  { left: '88%', top: '36%', opacity: 0.22 },
  { left: '27%', top: '68%', opacity: 0.2 },
  { left: '76%', top: '82%', opacity: 0.22 },
  { left: '7%', top: '25%', opacity: 0.21 },
  { left: '91%', top: '48%', opacity: 0.2 },
] as const;

export function Stars() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {STARS.map((s, i) => (
        <View
          key={i}
          style={[
            styles.star,
            { left: s.left, top: s.top, opacity: s.opacity },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#ffffff',
  },
});
