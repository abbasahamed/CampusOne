import { useEffect, useRef, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  CreditCard,
  GraduationCap,
  Home,
  Sparkles,
} from 'lucide-react';
import { DEMO_STUDENT } from '../data/demoData';
import type { ThemePreference } from '../lib/theme';

interface AppShellProps {
  themePreference: ThemePreference;
  onThemeChange: (next: ThemePreference) => void;
  persistenceFailed: boolean;
  children: ReactNode;
}

const PRIMARY_NAV = [
  { to: '/today', label: 'Today', icon: Home },
  { to: '/academics/attendance', label: 'Academics', icon: GraduationCap, matchPrefix: '/academics' },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/fees', label: 'Fees', icon: CreditCard },
  { to: '/events', label: 'Events', icon: Sparkles },
] as const;

const ACADEMICS_SUBNAV = [
  { to: '/academics/attendance', label: 'Attendance' },
  { to: '/academics/marks', label: 'Marks & Academics' },
] as const;

function ThemeSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: ThemePreference;
  onChange: (next: ThemePreference) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-[0.8125rem] font-medium text-text-secondary">
        Theme
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as ThemePreference)}
        className="min-h-9 rounded-[var(--radius-control)] border border-outline-essential bg-surface px-2.5 py-1 text-[0.8125rem] font-medium text-text-primary"
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}

export function AppShell({
  themePreference,
  onThemeChange,
  persistenceFailed,
  children,
}: AppShellProps) {
  const { pathname } = useLocation();
  const isAcademics = pathname.startsWith('/academics');
  const mainRef = useRef<HTMLElement>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const heading = mainRef.current?.querySelector('h1');
    if (heading instanceof HTMLElement) {
      heading.focus({ preventScroll: true });
    }
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-canvas text-text-primary min-[960px]:flex">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Desktop sidebar (>= 960px) */}
      <aside className="hidden min-[960px]:flex min-[960px]:w-56 min-[960px]:shrink-0 min-[960px]:flex-col min-[960px]:justify-between min-[960px]:border-r min-[960px]:border-divider min-[960px]:bg-surface min-[960px]:px-4 min-[960px]:py-6 min-[960px]:sticky min-[960px]:top-0 min-[960px]:h-dvh">
        <div className="space-y-6">
          <Link
            to="/today"
            className="flex items-center gap-2.5 rounded-[var(--radius-control)] px-2 py-1 no-underline"
          >
            <span
              aria-hidden="true"
              className="inline-flex h-8 w-8 items-center justify-center rounded-[0.5rem] bg-accent text-[0.875rem] font-extrabold text-text-on-accent"
            >
              C1
            </span>
            <div>
              <span className="block text-[1rem] leading-tight font-bold text-text-primary">
                CampusOne
              </span>
              <span className="block text-[0.75rem] leading-tight text-text-secondary">
                {DEMO_STUDENT.rollNumber}
              </span>
            </div>
          </Link>

          <nav aria-label="Primary" className="space-y-1">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const isParentActive =
                'matchPrefix' in item && item.matchPrefix
                  ? pathname.startsWith(item.matchPrefix)
                  : false;

              return (
                <div key={item.to}>
                  <NavLink
                    to={item.to}
                    end={!('matchPrefix' in item)}
                    className={({ isActive }) => {
                      const active = isActive || isParentActive;
                      return `flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 text-[0.9375rem] no-underline transition-colors duration-150 ${
                        active
                          ? 'bg-surface-secondary font-semibold text-accent'
                          : 'font-medium text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                      }`;
                    }}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>

                  {item.label === 'Academics' ? (
                    <div
                      aria-label="Academics sections"
                      className="mt-1 ml-5 space-y-1 border-l border-divider pl-3"
                    >
                      {ACADEMICS_SUBNAV.map((sub) => (
                        <NavLink
                          key={sub.to}
                          to={sub.to}
                          className={({ isActive }) =>
                            `flex min-h-9 items-center rounded-[var(--radius-control)] px-2.5 py-1.5 text-[0.875rem] no-underline transition-colors duration-150 ${
                              isActive
                                ? 'font-semibold text-accent'
                                : 'font-medium text-text-secondary hover:text-text-primary'
                            }`
                          }
                        >
                          {sub.label}
                        </NavLink>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 border-t border-divider pt-4">
          <ThemeSelect
            id="theme-select-desktop"
            value={themePreference}
            onChange={onThemeChange}
          />
          {persistenceFailed ? (
            <p className="text-[0.75rem] leading-[1rem] text-text-secondary">
              Theme preference applies to this session only.
            </p>
          ) : null}
          <p className="text-[0.75rem] leading-[1rem] text-text-secondary">
            Demo clock: 27 Nov 2026, 09:10 IST
          </p>
        </div>
      </aside>

      {/* Main reading column */}
      <div className="min-w-0 flex-1">
        {/* Mobile header (< 960px) */}
        <header className="border-b border-divider bg-surface px-4 py-3 min-[600px]:px-6 min-[960px]:hidden">
          <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-3">
            <Link to="/today" className="flex items-center gap-2 no-underline">
              <span
                aria-hidden="true"
                className="inline-flex h-7 w-7 items-center justify-center rounded-[0.5rem] bg-accent text-[0.8125rem] font-extrabold text-text-on-accent"
              >
                C1
              </span>
              <span className="text-[0.9375rem] font-bold text-text-primary">
                CampusOne
              </span>
            </Link>
            <ThemeSelect
              id="theme-select-mobile"
              value={themePreference}
              onChange={onThemeChange}
            />
          </div>
          {isAcademics ? (
            <nav
              aria-label="Academics sections"
              className="mx-auto mt-2.5 flex max-w-[1120px] gap-2 border-t border-divider pt-2.5"
            >
              {ACADEMICS_SUBNAV.map((sub) => (
                <NavLink
                  key={sub.to}
                  to={sub.to}
                  className={({ isActive }) =>
                    `inline-flex min-h-9 items-center rounded-[var(--radius-control)] px-3 py-1.5 text-[0.875rem] no-underline transition-colors duration-150 ${
                      isActive
                        ? 'bg-surface-secondary font-semibold text-accent'
                        : 'font-medium text-text-secondary hover:text-text-primary'
                    }`
                  }
                >
                  {sub.label}
                </NavLink>
              ))}
            </nav>
          ) : null}
        </header>

        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="mx-auto w-full max-w-[1120px] px-4 pt-6 pb-[calc(var(--mobile-nav-clearance)+env(safe-area-inset-bottom,0px))] outline-none min-[600px]:px-6 min-[960px]:px-8 min-[960px]:py-8"
        >
          {children}
        </main>
      </div>

      {/* Floating mobile bottom navigation (< 960px) */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto w-[calc(100%-2rem)] max-w-[540px] rounded-[var(--radius-prominent)] border border-divider bg-surface px-1.5 py-1.5 shadow-[var(--shadow-floating)] min-[960px]:hidden"
      >
        <ul className="m-0 flex list-none items-stretch justify-between gap-0.5 p-0">
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const isParentActive =
              'matchPrefix' in item && item.matchPrefix
                ? pathname.startsWith(item.matchPrefix)
                : false;

            return (
              <li key={item.to} className="min-w-0 flex-1">
                <NavLink
                  to={item.to}
                  end={!('matchPrefix' in item)}
                  className={({ isActive }) => {
                    const active = isActive || isParentActive;
                    return `flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-panel)] px-1 py-1.5 text-[0.6875rem] leading-tight no-underline transition-colors duration-150 ${
                      active
                        ? 'bg-surface-secondary font-semibold text-accent'
                        : 'font-medium text-text-secondary hover:text-text-primary'
                    }`;
                  }}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
