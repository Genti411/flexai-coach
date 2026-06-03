import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import Animated, {
  cancelAnimation,
  interpolate,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Line } from 'react-native-svg';

import { FigureRig } from '@/animation/figure-rig';
import { Joint, lerpPose, Pose } from '@/animation/poses';
import { BAR_HALF, BARS, FAR_BONES, FAR_DX, HEAD_R, NEAR_BONES, STROKE } from '@/animation/rig-parts';
import { getTrack } from '@/animation/tracks';
import { useTheme } from '@/hooks/use-theme';

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function Bone({
  from,
  to,
  a,
  b,
  progress,
  color,
  dx = 0,
  opacity = 1,
}: {
  from: Joint;
  to: Joint;
  a: Pose;
  b: Pose;
  progress: SharedValue<number>;
  color: string;
  dx?: number;
  opacity?: number;
}) {
  const animatedProps = useAnimatedProps(() => ({
    x1: interpolate(progress.value, [0, 1], [a[from].x + dx, b[from].x + dx]),
    y1: interpolate(progress.value, [0, 1], [a[from].y, b[from].y]),
    x2: interpolate(progress.value, [0, 1], [a[to].x + dx, b[to].x + dx]),
    y2: interpolate(progress.value, [0, 1], [a[to].y, b[to].y]),
  }));
  return <AnimatedLine animatedProps={animatedProps} stroke={color} strokeWidth={STROKE} strokeLinecap="round" opacity={opacity} />;
}

function Bar({ joint, a, b, progress, color }: { joint: Joint; a: Pose; b: Pose; progress: SharedValue<number>; color: string }) {
  const animatedProps = useAnimatedProps(() => ({
    x1: interpolate(progress.value, [0, 1], [a[joint].x - BAR_HALF, b[joint].x - BAR_HALF]),
    y1: interpolate(progress.value, [0, 1], [a[joint].y, b[joint].y]),
    x2: interpolate(progress.value, [0, 1], [a[joint].x + BAR_HALF, b[joint].x + BAR_HALF]),
    y2: interpolate(progress.value, [0, 1], [a[joint].y, b[joint].y]),
  }));
  return <AnimatedLine animatedProps={animatedProps} stroke={color} strokeWidth={STROKE} strokeLinecap="round" />;
}

function Head({ a, b, progress, color }: { a: Pose; b: Pose; progress: SharedValue<number>; color: string }) {
  const animatedProps = useAnimatedProps(() => ({
    cx: interpolate(progress.value, [0, 1], [a.head.x, b.head.x]),
    cy: interpolate(progress.value, [0, 1], [a.head.y, b.head.y]),
  }));
  return <AnimatedCircle animatedProps={animatedProps} r={HEAD_R} fill={color} />;
}

export function StretchAnimation({ animationId, size = 150 }: { animationId?: string; size?: number }) {
  const theme = useTheme();
  const track = getTrack(animationId);
  const progress = useSharedValue(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => active && setReduceMotion(v));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (!track || reduceMotion) return;
    progress.value = 0;
    progress.value = withRepeat(withTiming(1, { duration: track.durationMs }), -1, true);
    return () => {
      cancelAnimation(progress);
    };
  }, [track, reduceMotion, progress]);

  if (!track) return null;

  if (reduceMotion) {
    return (
      <FigureRig pose={lerpPose(track.a, track.b, 0.5)} color={theme.text} muted={theme.textSecondary} accent={theme.accent} size={size} />
    );
  }

  const { a, b } = track;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 120">
      <Ellipse cx={50} cy={117} rx={16} ry={3} fill={theme.textSecondary} opacity={0.25} />
      {FAR_BONES.map(([from, to], i) => (
        <Bone key={`f${i}`} from={from} to={to} a={a} b={b} progress={progress} color={theme.textSecondary} dx={FAR_DX} opacity={0.55} />
      ))}
      {BARS.map((j, i) => (
        <Bar key={`b${i}`} joint={j} a={a} b={b} progress={progress} color={theme.text} />
      ))}
      {NEAR_BONES.map(([from, to], i) => (
        <Bone key={`n${i}`} from={from} to={to} a={a} b={b} progress={progress} color={theme.text} />
      ))}
      <Head a={a} b={b} progress={progress} color={theme.accent} />
    </Svg>
  );
}
