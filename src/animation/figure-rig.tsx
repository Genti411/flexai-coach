import Svg, { Circle, Line } from 'react-native-svg';

import { Pose, SKELETON } from '@/animation/poses';

export function FigureRig({ pose, color, size = 140 }: { pose: Pose; color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 120">
      {SKELETON.map(([from, to], i) => (
        <Line
          key={i}
          x1={pose[from].x}
          y1={pose[from].y}
          x2={pose[to].x}
          y2={pose[to].y}
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
        />
      ))}
      <Circle cx={pose.head.x} cy={pose.head.y} r={8} stroke={color} strokeWidth={3} fill="none" />
    </Svg>
  );
}
