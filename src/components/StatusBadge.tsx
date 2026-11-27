import type { ReactNode } from 'react';

export type StatusTone = 'neutral' | 'accent' | 'success' | 'warning' | 'error';

export interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  icon?: ReactNode;
}

const toneTextClasses: Record<StatusTone, string> = {
  neutral: 'text-text-secondary',
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
};

export function StatusBadge({ label, tone = 'neutral', icon }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border border-divider bg-surface px-2.5 py-1 text-[0.8125rem] leading-[1.125rem] font-semibold ${toneTextClasses[tone]}`}
    >
      {icon ? (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {icon}
        </span>
      ) : null}
      <span>{label}</span>
    </span>
  );
}
