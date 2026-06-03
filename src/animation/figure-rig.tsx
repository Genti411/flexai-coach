import Svg, { Circle, Ellipse, Line } from 'react-native-svg';

import { Pose } from '@/animation/poses';
import { BAR_HALF, BARS, FAR_BONES, FAR_DX, HEAD_R, NEAR_BONES, STROKE } from '@/animation/rig-parts';

export function FigureRig({
  pose,
  color,
  muted,
  accent,
  size = 150,
}: {
  pose: Pose;
  color: string;
  muted?: string;
  accent?: string;
  size?: number;
}) {
  const far = muted ?? color;
  const head = accent ?? color;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 120">
      <Ellipse cx={50} cy={117} rx={16} ry={3} fill={far} opacity={0.25} />
      {FAR_BONES.map(([from, to], i) => (
        <Line
          key={`f${i}`}
          x1={pose[from].x + FAR_DX}
          y1={pose[from].y}
          x2={pose[to].x + FAR_DX}
          y2={pose[to].y}
          stroke={far}
          strokeWidth={STROKE}
          strokeLinecap="round"
          opacity={0.55}
        />
      ))}
      {BARS.map((j, i) => (
        <Line
          key={`b${i}`}
          x1={pose[j].x - BAR_HALF}
          y1={pose[j].y}
          x2={pose[j].x + BAR_HALF}
          y2={pose[j].y}
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
      ))}
      {NEAR_BONES.map(([from, to], i) => (
        <Line
          key={`n${i}`}
          x1={pose[from].x}
          y1={pose[from].y}
          x2={pose[to].x}
          y2={pose[to].y}
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
      ))}
      <Circle cx={pose.head.x} cy={pose.head.y} r={HEAD_R} fill={head} />
    </Svg>
  );
}
