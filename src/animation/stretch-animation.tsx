import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';

import { FigureRig } from '@/animation/figure-rig';
import { getTrack } from '@/animation/tracks';
import { Joint, lerpPose, Pose, SKELETON } from '@/animation/poses';
import { useTheme } from '@/hooks/use-theme';

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function Bone({ from, to, a, b, progress, color }: { from: Joint; to: Joint; a: Pose; b: Pose; progress: SharedValue<number>; color: string }) {
  const animatedProps = useAnimatedProps(() => ({
    x1: interpolate(progress.value, [0, 1], [a[from].x, b[from].x]),
    y1: interpolate(progress.value, [0, 1], [a[from].y, b[from].y]),
    x2: interpolate(progress.value, [0, 1], [a[to].x, b[to].x]),
    y2: interpolate(progress.value, [0, 1], [a[to].y, b[to].y]),
  }));
  return <AnimatedLine animatedProps={animatedProps} stroke={color} strokeWidth={3} strokeLinecap="round" />;
}

function Head({ a, b, progress, color }: { a: Pose; b: Pose; progress: SharedValue<number>; color: string }) {
  const animatedProps = useAnimatedProps(() => ({
    cx: interpolate(progress.value, [0, 1], [a.head.x, b.head.x]),
    cy: interpolate(progress.value, [0, 1], [a.head.y, b.head.y]),
  }));
  return <AnimatedCircle animatedProps={animatedProps} r={8} stroke={color} strokeWidth={3} fill="none" />;
}

export function StretchAnimation({ animationId, size = 140 }: { animationId?: string; size?: number }) {
  const theme = useTheme();
  const track = getTrack(animationId);
  const progress = useSharedValue(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => active && setReduceMotion(v));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!track || reduceMotion) return;
    progress.value = 0;
    progress.value = withRepeat(withTiming(1, { duration: track.durationMs }), -1, true);
  }, [track, reduceMotion, progress]);

  if (!track) return null;

  if (reduceMotion) {
    return <FigureRig pose={lerpPose(track.a, track.b, 0.5)} color={theme.text} size={size} />;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 100 120">
      {SKELETON.map(([from, to], i) => (
        <Bone key={i} from={from} to={to} a={track.a} b={track.b} progress={progress} color={theme.text} />
      ))}
      <Head a={track.a} b={track.b} progress={progress} color={theme.text} />
    </Svg>
  );
}
