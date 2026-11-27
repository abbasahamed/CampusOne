import type { ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useShellChrome } from '../app/shellContext';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ReactNode;
  showMobileProfile?: boolean;
  compact?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  showMobileProfile = false,
  compact = false,
}: PageHeaderProps) {
  const chrome = useShellChrome();
  const isDark = chrome?.resolvedTheme === 'dark';

  return (
    <header className="flex flex-wrap items-start justify-between gap-3 pb-5 min-[960px]:items-end min-[960px]:pb-7">
      <div className="min-w-0 flex-1 basis-[12rem]">
        {eyebrow ? (
          <p className="mb-1 text-[0.8125rem] font-medium text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1
          tabIndex={-1}
          className={`page-title ${compact ? 'page-title--compact' : ''} text-foreground outline-none`}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 text-[0.9375rem] leading-snug text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>

      {(actions || chrome) ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 pt-0.5">
          {actions}
          {chrome && (
            <>
              {showMobileProfile && (
                <button
                  type="button"
                  onClick={chrome.onOpenProfile}
                  aria-label="Profile and appearance"
                  className="grid size-10 place-items-center rounded-full bg-cobalt-soft text-[0.8125rem] font-semibold text-cobalt-ink ring-1 ring-hairline transition-transform active:scale-95 min-[960px]:hidden"
                >
                  AM
                </button>
              )}
              <button
                type="button"
                onClick={chrome.onToggleQuickTheme}
                aria-pressed={isDark}
                aria-label={isDark ? 'Switch to light appearance' : 'Switch to dark appearance'}
                title={isDark ? 'Switch to light appearance' : 'Switch to dark appearance'}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-muted-foreground ring-1 ring-hairline transition-colors hover:bg-surface-2 hover:text-foreground active:scale-95 min-[960px]:hidden"
              >
                {isDark ? <Sun className="size-[1.0625rem]" aria-hidden="true" /> : <Moon className="size-[1.0625rem]" aria-hidden="true" />}
              </button>
            </>
          )}
        </div>
      ) : null}
    </header>
  );
}

export interface SectionHeaderProps {
  title: string;
  supporting?: string;
  action?: ReactNode;
  as?: 'h2' | 'h3';
  id?: string;
}

export function SectionHeader({
  title,
  supporting,
  action,
  as: Heading = 'h2',
  id,
}: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <div className="min-w-0">
        <Heading
          id={id}
          className="text-[1.0625rem] leading-snug font-semibold tracking-[-0.02em] text-foreground"
        >
          {title}
        </Heading>
        {supporting ? (
          <p className="mt-0.5 text-[0.8125rem] leading-snug text-muted-foreground">
            {supporting}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
