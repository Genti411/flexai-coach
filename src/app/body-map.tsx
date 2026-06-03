import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { StretchCard } from '@/components/stretch-card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { buildResponse } from '@/core/dataset';
import { StretchResponse } from '@/core/types';
import { useTheme } from '@/hooks/use-theme';

const AREAS: { area: string; label: string; top: `${number}%`; left: `${number}%` }[] = [
  { area: 'neck', label: 'Neck', top: '10%', left: '50%' },
  { area: 'shoulders', label: 'Shoulders', top: '18%', left: '26%' },
  { area: 'chest', label: 'Chest', top: '26%', left: '50%' },
  { area: 'lower back', label: 'Lower back', top: '40%', left: '74%' },
  { area: 'hamstrings', label: 'Hamstrings', top: '60%', left: '38%' },
  { area: 'calf', label: 'Calf', top: '82%', left: '62%' },
];

export default function BodyMapScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [area, setArea] = useState<string | null>(null);
  const response: StretchResponse | null = area
    ? buildResponse(area, { wantsWeights: false, difficulty: 'beginner', riskLevel: 'low' })
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <ThemedText type="link">{'‹'} Back</ThemedText>
      </Pressable>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Body map</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">Tap an area to see stretches.</ThemedText>

        <View style={styles.figureWrap}>
          <Svg width="100%" height="100%" viewBox="0 0 100 200" style={StyleSheet.absoluteFill}>
            <Circle cx={50} cy={20} r={12} stroke={theme.textSecondary} strokeWidth={2} fill="none" />
            <Path d="M38 34 L62 34 L60 96 L40 96 Z" stroke={theme.textSecondary} strokeWidth={2} fill="none" />
            <Line x1={38} y1={36} x2={24} y2={80} stroke={theme.textSecondary} strokeWidth={2} />
            <Line x1={62} y1={36} x2={76} y2={80} stroke={theme.textSecondary} strokeWidth={2} />
            <Line x1={45} y1={96} x2={42} y2={180} stroke={theme.textSecondary} strokeWidth={2} />
            <Line x1={55} y1={96} x2={58} y2={180} stroke={theme.textSecondary} strokeWidth={2} />
          </Svg>
          {AREAS.map((a) => (
            <Pressable
              key={a.area}
              onPress={() => setArea(a.area)}
              style={[styles.hotspot, { top: a.top, left: a.left, backgroundColor: area === a.area ? theme.accent : theme.backgroundElement }]}
            >
              <ThemedText type="small" themeColor={area === a.area ? 'accentText' : 'text'}>{a.label}</ThemedText>
            </Pressable>
          ))}
        </View>

        {response && (
          <View style={styles.results}>
            <ThemedText type="smallBold">{area}</ThemedText>
            <ThemedText type="small">{response.summary}</ThemedText>
            {response.recommendations.map((rec, i) => (
              <StretchCard key={`${rec.name}-${i}`} rec={rec} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  back: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  content: { padding: Spacing.three, gap: Spacing.two },
  figureWrap: { height: 360, marginVertical: Spacing.two },
  hotspot: {
    position: 'absolute',
    transform: [{ translateX: -40 }],
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 999,
    minWidth: 80,
    alignItems: 'center',
  },
  results: { gap: Spacing.one, marginTop: Spacing.two },
});
