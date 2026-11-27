import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, eyebrow, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-[0.8125rem] font-medium text-text-secondary">
            {eyebrow}
          </p>
        ) : null}
        <h1
          tabIndex={-1}
          className="text-[2rem] leading-[2.375rem] font-bold tracking-[-0.025em] text-text-primary outline-none sm:text-[2.125rem] sm:leading-[2.5rem]"
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 text-[0.9375rem] leading-[1.375rem] text-text-secondary">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export interface SectionHeaderProps {
  title: string;
  supporting?: string;
  action?: ReactNode;
  as?: 'h2' | 'h3';
}

export function SectionHeader({
  title,
  supporting,
  action,
  as: Heading = 'h2',
}: SectionHeaderProps) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="min-w-0">
        <Heading className="text-[1.25rem] leading-[1.625rem] font-semibold tracking-[-0.015em] text-text-primary sm:text-[1.375rem] sm:leading-[1.75rem]">
          {title}
        </Heading>
        {supporting ? (
          <p className="mt-0.5 text-[0.875rem] leading-[1.25rem] text-text-secondary">
            {supporting}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
