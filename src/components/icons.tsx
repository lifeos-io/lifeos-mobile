import Svg, { Circle, Path } from 'react-native-svg';

import { colors, type ColorToken } from '@/theme';

type IconProps = {
  size?: number;
  color?: ColorToken;
};

function stroke(color: ColorToken) {
  return {
    stroke: colors[color],
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
}

/** Görev tab. */
export function EyeIcon({ size = 22, color = 'moon' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M2.5 12c2.4-4 5.6-6 9.5-6s7.1 2 9.5 6c-2.4 4-5.6 6-9.5 6s-7.1-2-9.5-6z" {...stroke(color)} />
      <Circle cx={12} cy={12} r={2.6} fill={colors[color]} />
    </Svg>
  );
}

/** Uydular tab. */
export function SatellitesIcon({ size = 22, color = 'moon' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={7} cy={8} r={2.2} fill={colors[color]} />
      <Circle cx={16.5} cy={7} r={2.2} fill={colors[color]} />
      <Circle cx={12} cy={17} r={2.2} fill={colors[color]} />
    </Svg>
  );
}

/** Telemetri tab. */
export function TelemetryIcon({ size = 22, color = 'moon' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 18l5.5-6 4 3.5L21 6" {...stroke(color)} />
    </Svg>
  );
}

/** Kule tab. */
export function TowerIcon({ size = 22, color = 'moon' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 21V10a7 7 0 0 1 14 0v11" {...stroke(color)} />
      <Path d="M10 21v-6h4v6" {...stroke(color)} />
    </Svg>
  );
}

export function ChevronLeftIcon({ size = 18, color = 'moon' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5l-7 7 7 7" {...stroke(color)} />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 18, color = 'moon' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 5l7 7-7 7" {...stroke(color)} />
    </Svg>
  );
}

export function PlusIcon({ size = 18, color = 'moon' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 5v14M5 12h14" {...stroke(color)} />
    </Svg>
  );
}

export function CheckIcon({ size = 18, color = 'moon' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 12.5l4.5 4.5L19 7.5" {...stroke(color)} />
    </Svg>
  );
}

export function ArrowRightIcon({ size = 18, color = 'moon' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 12h14M13 6l6 6-6 6" {...stroke(color)} />
    </Svg>
  );
}

export function LockIcon({ size = 18, color = 'moon' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 11h12v9H6z" {...stroke(color)} />
      <Path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" {...stroke(color)} />
    </Svg>
  );
}
