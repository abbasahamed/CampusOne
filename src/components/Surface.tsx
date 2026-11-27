import type { HTMLAttributes, ReactNode } from 'react';

type SurfaceTone = 'default' | 'secondary' | 'prominent';

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  tone?: SurfaceTone;
  ruled?: boolean;
  children: ReactNode;
}

const toneClasses: Record<SurfaceTone, string> = {
  default: 'bg-surface border border-divider rounded-[var(--radius-panel)]',
  secondary: 'bg-surface-secondary border border-divider rounded-[var(--radius-panel)]',
  prominent: 'bg-surface border border-divider rounded-[var(--radius-prominent)]',
};

export function Surface({
  tone = 'default',
  ruled = false,
  className = '',
  children,
  ...props
}: SurfaceProps) {
  return (
    <div className={`${toneClasses[tone]} p-4 sm:p-6 ${className}`} {...props}>
      {ruled ? <div className="cobalt-rule">{children}</div> : children}
    </div>
  );
}
