export interface ProgressBarProps {
  label: string;
  value: number;
  max?: number;
  valueText?: string;
  tone?: 'accent' | 'success' | 'warning' | 'error';
}

const fillClasses: Record<NonNullable<ProgressBarProps['tone']>, string> = {
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
};

export function ProgressBar({
  label,
  value,
  max = 100,
  valueText,
  tone = 'accent',
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.max(0, Math.min(value, safeMax));
  const percent = (clamped / safeMax) * 100;
  const displayValue = valueText ?? `${Math.round(percent)}%`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-[0.875rem] leading-[1.25rem]">
        <span className="font-medium text-text-primary">{label}</span>
        <span className="tabular-nums font-semibold text-text-secondary">{displayValue}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={clamped}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-secondary"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-150 ${fillClasses[tone]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
