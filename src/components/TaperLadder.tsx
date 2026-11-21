import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

import { plannedMg, type TaperWeek } from '../lib/taperPlan';
import { colors } from '../theme';

interface Props {
  weeks: TaperWeek[];
  currentIndex: number;
  baselineCount: number;
}

function weekLabel(w: TaperWeek): string {
  if (w.kind === 'strength') {
    return w.mgPlan.map((p) => `${p.mg}×${p.count}`).join(' + ');
  }
  return `${w.limit}/day`;
}

/** Step chart of the taper ladder: one row per week, bar width = limit. */
export function TaperLadder({ weeks, currentIndex, baselineCount }: Props) {
  const max = Math.max(1, baselineCount);
  const chartW = 260;
  const chartH = 64;
  const points = weeks
    .map((w, i) => {
      const x = weeks.length <= 1 ? 0 : (i / (weeks.length - 1)) * chartW;
      const y = chartH - (plannedMg(w) / Math.max(1, plannedMg(weeks[0] ?? w))) * (chartH - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <View>
      <Svg width="100%" height={chartH} viewBox={`0 0 ${chartW} ${chartH}`}>
        <Polyline
          points={points}
          fill="none"
          stroke={colors.green}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.rows}>
        {weeks.map((w) => {
          const isCurrent = w.index === currentIndex;
          const isPast = w.index < currentIndex;
          return (
            <View
              key={w.index}
              style={[styles.row, isCurrent && styles.rowCurrent]}
            >
              <Text style={[styles.week, isCurrent && styles.textCurrent]}>
                W{w.index + 1}
                {w.held ? ' · held' : ''}
              </Text>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${Math.max(4, (w.limit / max) * 100)}%`,
                      backgroundColor: isPast
                        ? colors.mutedDim
                        : colors.green,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.label, isCurrent && styles.textCurrent]}>
                {weekLabel(w)}
              </Text>
            </View>
          );
        })}
        <View style={styles.row}>
          <Text style={styles.week}>Goal</Text>
          <View style={styles.track} />
          <Text style={[styles.label, { color: colors.gold }]}>Zero Day</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rows: { marginTop: 10, gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  rowCurrent: { backgroundColor: '#131c2e' },
  week: { color: colors.muted, fontSize: 11, fontWeight: '700', width: 52 },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.progressTrack,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 3 },
  label: { color: colors.muted, fontSize: 11.5, width: 86, textAlign: 'right' },
  textCurrent: { color: colors.text },
});
