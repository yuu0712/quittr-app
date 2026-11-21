import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../theme';

interface Props {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
  featured?: boolean;
  flex?: number;
}

export function MetricCard({
  icon,
  iconColor,
  label,
  value,
  featured = false,
  flex = 1,
}: Props) {
  const inner = (
    <>
      <View style={styles.labelRow}>
        <Text style={[styles.icon, { color: iconColor }]}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
    </>
  );

  if (featured) {
    return (
      <LinearGradient
        colors={[colors.featuredBgFrom, colors.featuredBgTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.featured, { flex }]}
      >
        {inner}
      </LinearGradient>
    );
  }
  return <View style={[styles.card, { flex }]}>{inner}</View>;
}

const styles = StyleSheet.create({
  card: {
    minWidth: 0,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 16,
    backgroundColor: colors.cardBg,
  },
  featured: {
    borderColor: colors.featuredBorder,
    backgroundColor: colors.featuredBgTo,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  icon: {
    fontSize: 9,
  },
  label: {
    color: colors.metricLabel,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.45,
  },
  value: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
