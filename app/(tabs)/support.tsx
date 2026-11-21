import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stars } from '@/components/Stars';
import {
  ARTICLES,
  START_HERE,
  articlesByCategory,
  type Article,
  type ArticleCategory,
} from '@/data/articles';
import { colors } from '@/theme';

type View_ =
  | { kind: 'home' }
  | { kind: 'category'; category: ArticleCategory | 'All'; label: string }
  | { kind: 'article'; article: Article };

interface Tile {
  label: string;
  emoji: string;
  gradient: [string, string];
  category: ArticleCategory | 'All';
}

const TILES: Tile[] = [
  { label: 'Meditate', emoji: '🧘', gradient: ['#f97316', '#ea580c'], category: 'Mind' },
  { label: 'Sleep', emoji: '🌙', gradient: ['#8b5cf6', '#6d28d9'], category: 'Sleep' },
  { label: 'Articles', emoji: '📰', gradient: ['#ec4899', '#db2777'], category: 'All' },
  { label: 'Guides', emoji: '🪜', gradient: ['#0ea5e9', '#2563eb'], category: 'Guides' },
];

function Thumb({ article, size = 64 }: { article: Article; size?: number }) {
  return (
    <LinearGradient
      colors={article.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.thumb, { width: size, height: size, borderRadius: size * 0.22 }]}
    >
      <Text style={{ fontSize: size * 0.44 }}>{article.emoji}</Text>
    </LinearGradient>
  );
}

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [view, setView] = useState<View_>({ kind: 'home' });

  const openArticle = (article: Article) => setView({ kind: 'article', article });
  const openCategory = (category: ArticleCategory | 'All', label: string) =>
    setView({ kind: 'category', category, label });

  /* ── article reader ─────────────────────────────────────── */
  if (view.kind === 'article') {
    const a = view.article;
    return (
      <View style={[styles.root, { paddingTop: Math.max(23, insets.top) }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => setView({ kind: 'home' })} hitSlop={10}>
            <Text style={styles.back}>‹ Learn</Text>
          </Pressable>
          <LinearGradient
            colors={a.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Text style={styles.heroEmoji}>{a.emoji}</Text>
            <Text style={styles.heroCategory}>
              {a.category} · {a.minutes} min read
            </Text>
            <Text style={styles.heroTitle}>{a.title}</Text>
            <Text style={styles.heroSub}>{a.subtitle}</Text>
          </LinearGradient>
          {a.body.map((block, i) =>
            block.type === 'h' ? (
              <Text key={i} style={styles.bodyH}>
                {block.text}
              </Text>
            ) : (
              <Text key={i} style={styles.bodyP}>
                {block.text}
              </Text>
            ),
          )}
          {a.id === 'how-tapering-works' && (
            <Pressable
              style={styles.cta}
              onPress={() => router.push('/taper-setup')}
            >
              <Text style={styles.ctaText}>Start a taper →</Text>
            </Pressable>
          )}
          <Text style={styles.footnote}>
            General information, not medical advice. If quitting affects a
            health condition or medication, talk to a doctor or pharmacist.
          </Text>
        </ScrollView>
      </View>
    );
  }

  /* ── category list ──────────────────────────────────────── */
  if (view.kind === 'category') {
    const list = articlesByCategory(view.category);
    return (
      <View style={[styles.root, { paddingTop: Math.max(23, insets.top) }]}>
        <Stars />
        <Pressable onPress={() => setView({ kind: 'home' })} hitSlop={10}>
          <Text style={styles.back}>‹ Learn</Text>
        </Pressable>
        <Text style={styles.title}>{view.label}</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {list.map((a) => (
            <Pressable
              key={a.id}
              style={styles.row}
              onPress={() => openArticle(a)}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{a.title}</Text>
                <Text style={styles.rowSub}>
                  {a.subtitle} · {a.minutes} min
                </Text>
              </View>
              <Thumb article={a} />
            </Pressable>
          ))}
          {list.length === 0 && (
            <Text style={styles.bodyP}>No articles here yet.</Text>
          )}
        </ScrollView>
      </View>
    );
  }

  /* ── learn home ─────────────────────────────────────────── */
  return (
    <View style={[styles.root, { paddingTop: Math.max(23, insets.top) }]}>
      <Stars />
      <View style={styles.header}>
        <Text style={styles.title}>Learn</Text>
        <Text style={styles.info}>ⓘ Info</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.tiles}>
          {TILES.map((tile) => (
            <Pressable
              key={tile.label}
              style={styles.tileWrap}
              onPress={() => openCategory(tile.category, tile.label)}
            >
              <LinearGradient
                colors={tile.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tile}
              >
                <Text style={styles.tileEmoji}>{tile.emoji}</Text>
                <Text style={styles.tileLabel}>{tile.label}</Text>
              </LinearGradient>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>Start here</Text>
        <View>
          {START_HERE.map((a, i) => (
            <View key={a.id} style={styles.startRow}>
              <View style={styles.rail}>
                <View style={styles.dot} />
                {i < START_HERE.length - 1 && <View style={styles.line} />}
              </View>
              <Pressable style={styles.startMain} onPress={() => openArticle(a)}>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{a.title}</Text>
                  <Text style={styles.rowSub}>
                    {a.subtitle}
                    {'\n'}
                    {a.category} · {a.minutes} min
                  </Text>
                </View>
                <Thumb article={a} />
              </Pressable>
            </View>
          ))}
        </View>

        <Text style={styles.section}>All articles</Text>
        {ARTICLES.map((a) => (
          <Pressable key={a.id} style={styles.row} onPress={() => openArticle(a)}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{a.title}</Text>
              <Text style={styles.rowSub}>
                {a.category} · {a.minutes} min read
              </Text>
            </View>
            <Thumb article={a} size={52} />
          </Pressable>
        ))}
        <View style={{ height: 18 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0e23', paddingHorizontal: 22 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  info: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  back: { color: colors.muted, fontSize: 15, marginBottom: 12 },
  section: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 22,
    marginBottom: 12,
  },

  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tileWrap: { width: '48%', flexGrow: 1 },
  tile: {
    height: 64,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tileEmoji: { fontSize: 19 },
  tileLabel: { color: '#ffffff', fontSize: 16, fontWeight: '800' },

  startRow: { flexDirection: 'row', gap: 12 },
  rail: { alignItems: 'center', width: 12, paddingTop: 22 },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.gold,
  },
  line: { flex: 1, width: 2, backgroundColor: '#2a2f4a', marginTop: 4 },
  startMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  rowText: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: 15.5, fontWeight: '700' },
  rowSub: { color: colors.muted, fontSize: 12.5, lineHeight: 18, marginTop: 3 },
  thumb: { alignItems: 'center', justifyContent: 'center' },

  hero: { borderRadius: 22, padding: 22, marginBottom: 18 },
  heroEmoji: { fontSize: 40, marginBottom: 10 },
  heroCategory: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 6,
    lineHeight: 30,
  },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 5 },
  bodyH: {
    color: colors.text,
    fontSize: 16.5,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 6,
  },
  bodyP: { color: '#c6c9d4', fontSize: 14.5, lineHeight: 22, marginBottom: 10 },
  cta: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  ctaText: { color: '#06240f', fontSize: 15.5, fontWeight: '800' },
  footnote: {
    color: colors.mutedDim,
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 18,
    marginBottom: 26,
  },
});
