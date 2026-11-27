interface AttendanceRingProps {
  percentage: number | null;
  targetPercentage: number;
  meetsTarget: boolean;
  size?: 'hero' | 'mini';
  label: string;
}

export function AttendanceRing({
  percentage,
  targetPercentage,
  meetsTarget,
  size = 'hero',
  label,
}: AttendanceRingProps) {
  const isHero = size === 'hero';
  const dim = isHero ? 148 : 34;
  const strokeWidth = isHero ? 11 : 4;
  const radius = (dim - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = percentage === null ? 0 : Math.max(0, Math.min(100, percentage));
  const dashOffset = circumference * (1 - clampedPct / 100);

  const targetClamped = Math.max(0, Math.min(100, targetPercentage));
  const targetAngle = (targetClamped / 100) * 2 * Math.PI - Math.PI / 2;
  const cx = dim / 2;
  const cy = dim / 2;
  const innerR = radius - strokeWidth * 0.55;
  const outerR = radius + strokeWidth * 0.55;
  const tx1 = cx + innerR * Math.cos(targetAngle);
  const ty1 = cy + innerR * Math.sin(targetAngle);
  const tx2 = cx + outerR * Math.cos(targetAngle);
  const ty2 = cy + outerR * Math.sin(targetAngle);

  const strokeColor =
    percentage === null
      ? 'var(--color-outline-essential)'
      : meetsTarget
        ? 'var(--color-accent)'
        : 'var(--color-warning)';

  return (
    <div
      className={`att-ring att-ring--${size}`}
      role="img"
      aria-label={label}
    >
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} aria-hidden="true">
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--color-surface-secondary)"
          strokeWidth={strokeWidth}
        />
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
        />
        {isHero && (
          <line
            x1={tx1}
            y1={ty1}
            x2={tx2}
            y2={ty2}
            stroke="var(--color-text-primary)"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
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
