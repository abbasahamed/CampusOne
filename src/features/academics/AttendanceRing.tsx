import { useId } from 'react';

interface AttendanceRingProps {
  percentage: number | null;
  targetPercentage: number;
  meetsTarget: boolean;
  standing?: 'below' | 'exact' | 'above' | 'unrecorded';
  size?: 'hero' | 'compact' | 'mini';
  label: string;
}

export function AttendanceRing({
  percentage,
  targetPercentage,
  meetsTarget,
  standing,
  size = 'hero',
  label,
}: AttendanceRingProps) {
  const gradId = useId();
  const isHero = size === 'hero';
  const isCompact = size === 'compact';
  const dim = isHero ? 164 : isCompact ? 56 : 32;
  const strokeWidth = isHero ? 12 : isCompact ? 5.5 : 3.5;
  const radius = (dim - strokeWidth) / 2 - (isHero ? 4 : 0);
  const circumference = 2 * Math.PI * radius;
  const clampedPct = percentage === null ? 0 : Math.max(0, Math.min(100, percentage));
  const dashOffset = circumference * (1 - clampedPct / 100);

  const resolvedStanding =
    standing ?? (percentage === null ? 'unrecorded' : meetsTarget ? 'above' : 'below');

  const targetClamped = Math.max(0, Math.min(100, targetPercentage));
  const targetAngle = (targetClamped / 100) * 2 * Math.PI - Math.PI / 2;
  const cx = dim / 2;
  const cy = dim / 2;

  const innerR = radius - strokeWidth * 0.45;
  const outerR = radius + strokeWidth * 0.45;
  const tx1 = cx + innerR * Math.cos(targetAngle);
  const ty1 = cy + innerR * Math.sin(targetAngle);
  const tx2 = cx + outerR * Math.cos(targetAngle);
  const ty2 = cy + outerR * Math.sin(targetAngle);

  const useCobaltGradient = isHero && percentage !== null && resolvedStanding !== 'below';
  const strokeColor = useCobaltGradient
    ? `url(#${gradId})`
    : resolvedStanding === 'unrecorded'
      ? 'var(--color-outline-essential)'
      : resolvedStanding === 'below'
        ? 'var(--color-warning)'
        : resolvedStanding === 'exact'
          ? 'var(--color-ring-exact)'
          : 'var(--color-accent)';

  return (
    <div
      className={`att-ring att-ring--${size}`}
      role="img"
      aria-label={label}
    >
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} aria-hidden="true">
        {useCobaltGradient && (
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-accent)" />
              <stop offset="100%" stopColor="#4f74ff" />
            </linearGradient>
          </defs>
        )}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--color-divider)"
          strokeWidth={strokeWidth}
        />
        {percentage !== null && clampedPct > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            className="att-ring-arc"
            style={{ '--ring-circumference': circumference } as React.CSSProperties}
          />
        )}
        {(isHero || isCompact || resolvedStanding === 'exact') && targetClamped > 0 && (
          <>
            <line
              x1={tx1}
              y1={ty1}
              x2={tx2}
              y2={ty2}
              stroke="var(--color-surface)"
              strokeWidth={isHero ? 5 : isCompact ? 3 : 2.25}
              strokeLinecap="round"
            />
            <line
              x1={tx1}
              y1={ty1}
              x2={tx2}
              y2={ty2}
              stroke="var(--color-text-primary)"
              strokeWidth={isHero ? 2.5 : isCompact ? 1.75 : 1.35}
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
      {isHero && (
        <div className="att-ring-center" aria-hidden="true">
          <strong className="tabular-nums">
            {percentage !== null ? `${percentage.toFixed(1)}%` : '—'}
          </strong>
          <span>{Math.round(targetClamped)}% min</span>
        </div>
      )}
    </div>
  );
}
