import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CalendarRange,
  Check,
  GraduationCap,
  Menu,
  Monitor,
  Moon,
  Sun,
  Sunrise,
  Ticket,
  Wallet,
} from 'lucide-react';
import { DEMO_STUDENT } from '../data/demoData';
import type { ResolvedTheme, ThemePreference } from '../lib/theme';
import { Dialog } from '../components/Dialog';
import { ShellChromeContext } from './shellContext';
import './shell.css';

interface AppShellProps {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  onThemeChange: (next: ThemePreference) => void;
  persistenceFailed: boolean;
  children: ReactNode;
}

const primaryNav = [
  { to: '/today', label: 'Today', icon: Sunrise },
  { to: '/academics/attendance', label: 'Academics', icon: GraduationCap },
  { to: '/schedule', label: 'Schedule', icon: CalendarRange },
  { to: '/fees', label: 'Fees', icon: Wallet },
  { to: '/events', label: 'Events', icon: Ticket },
] as const;

const appearances = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const;

const initials = DEMO_STUDENT.name
  .split(' ')
  .map((name) => name[0])
  .join('');

function shouldUseCompactDock(dockListEl?: HTMLUListElement | null): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(min-width: 960px)').matches) return false;

  const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const vw = document.documentElement.clientWidth || window.innerWidth;
  const dockOuter = Math.min(29 * rootPx, vw - 1.5 * rootPx);
  const dockInner = dockOuter - 0.75 * rootPx - 2;
  const availCell = (dockInner - 4 * (0.125 * rootPx)) / primaryNav.length;

  const fontPx = 0.75 * rootPx;
  const fontFamily = getComputedStyle(document.body).fontFamily || 'sans-serif';
  let widestLabel = 0;
  if (typeof document !== 'undefined') {
    const ctx = document.createElement('canvas').getContext('2d');
    if (ctx) {
      ctx.font = `600 ${fontPx}px ${fontFamily}`;
      for (const item of primaryNav) {
        widestLabel = Math.max(widestLabel, ctx.measureText(item.label).width);
      }
    }
  }

  const requiredCell = Math.max(4 * rootPx, Math.ceil(widestLabel) + 1);
  if (availCell < requiredCell) return true;

  if (dockListEl) {
    const labels = dockListEl.querySelectorAll('span');
    if (Array.from(labels).some((el) => el.scrollWidth > el.clientWidth + 1)) {
      return true;
    }
  }
  return false;
}

function BrandWordmark() {
  return (
    <Link to="/today" className="campus-brand">
      <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden="true">
        <rect width="24" height="24" rx="7" fill="var(--cobalt)" />
        <path
          d="M16.5 8.2A5.2 5.2 0 1 0 16.5 15.8"
          fill="none"
          stroke="var(--on-cobalt)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="16.6" cy="12" r="1.5" fill="var(--on-cobalt)" />
      </svg>
      <span>CampusOne</span>
    </Link>
  );
}

export function AppShell({
  themePreference,
  resolvedTheme,
  onThemeChange,
  persistenceFailed,
  children,
}: AppShellProps) {
  const { pathname } = useLocation();
  const isAcademics = pathname.startsWith('/academics/');
  const mainRef = useRef<HTMLElement>(null);
  const dockListRef = useRef<HTMLUListElement>(null);
  const previousPath = useRef(pathname);
  const [profileOpen, setProfileOpen] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [compactDock, setCompactDock] = useState<boolean>(() => shouldUseCompactDock());

  const activeNav =
    primaryNav.find((item) => pathname === item.to || (item.label === 'Academics' && isAcademics)) ??
    primaryNav[0];
  const ActiveNavIcon = activeNav.icon;

  const onToggleQuickTheme = useCallback(() => {
    onThemeChange(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, onThemeChange]);

  const chromeValue = useMemo(
    () => ({
      resolvedTheme,
      onToggleQuickTheme,
      onOpenProfile: () => setProfileOpen(true),
    }),
    [resolvedTheme, onToggleQuickTheme],
  );

  const measureDockFit = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(min-width: 960px)').matches) {
      setCompactDock(false);
      setNavMenuOpen(false);
      return;
    }
    setCompactDock(shouldUseCompactDock(dockListRef.current));
  }, []);

  useLayoutEffect(() => {
    const id = window.requestAnimationFrame(measureDockFit);
    return () => window.cancelAnimationFrame(id);
  }, [measureDockFit]);

  useEffect(() => {
    const handleEnvironmentChange = () => {
      window.requestAnimationFrame(measureDockFit);
    };

    window.addEventListener('resize', handleEnvironmentChange);
    const ro =
      typeof ResizeObserver !== 'undefined' && dockListRef.current
        ? new ResizeObserver(handleEnvironmentChange)
        : null;
    if (ro && dockListRef.current) ro.observe(dockListRef.current);

    const mo =
      typeof MutationObserver !== 'undefined'
        ? new MutationObserver(handleEnvironmentChange)
        : null;
    mo?.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });

    void document.fonts?.ready.then(handleEnvironmentChange);

    return () => {
      window.removeEventListener('resize', handleEnvironmentChange);
      ro?.disconnect();
      mo?.disconnect();
    };
  }, [compactDock, measureDockFit]);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    window.scrollTo(0, 0);
    mainRef.current?.querySelector('h1')?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <ShellChromeContext.Provider value={chromeValue}>
      <div className="campus-shell">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <aside className="campus-sidebar">
          <BrandWordmark />
          <nav aria-label="Primary" className="sidebar-nav">
            {primaryNav.map(({ to, label, icon: Icon }) => {
              const selected = pathname === to || (label === 'Academics' && isAcademics);
              return (
                <div key={to}>
                  <Link
                    to={to}
                    className="sidebar-link"
                    data-selected={selected}
                    aria-current={pathname === to && label !== 'Academics' ? 'page' : undefined}
                  >
                    <Icon size={18} strokeWidth={selected ? 2.2 : 1.8} aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                </div>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <button
              type="button"
              className="sidebar-student"
              aria-label="Profile and appearance"
              onClick={() => setProfileOpen(true)}
            >
              <span className="student-monogram" aria-hidden="true">
                {initials}
              </span>
              <span className="profile-name">
                <strong>{DEMO_STUDENT.name}</strong>
                <span>Semester 5 · CSE</span>
              </span>
            </button>
            <button
              type="button"
              onClick={onToggleQuickTheme}
              aria-pressed={resolvedTheme === 'dark'}
              aria-label={
                resolvedTheme === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance'
              }
              title={
                resolvedTheme === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance'
              }
              className="sidebar-theme-btn"
            >
              {resolvedTheme === 'dark' ? (
                <Sun size={17} aria-hidden="true" />
              ) : (
                <Moon size={17} aria-hidden="true" />
              )}
            </button>
          </div>
        </aside>

        <div className="campus-content">
          <main id="main-content" ref={mainRef} tabIndex={-1} className="campus-main">
            <div key={pathname.startsWith('/academics/') ? '/academics' : pathname} className="screen-enter">
              {children}
            </div>
          </main>
        </div>

        <div className="campus-dock-scrim" aria-hidden="true" />
        <nav
          aria-label="Primary"
          className={compactDock ? 'campus-dock campus-dock--compact' : 'campus-dock'}
        >
          {compactDock ? (
            <div className="compact-dock-bar">
              <span className="compact-dock-current">
                <ActiveNavIcon size={20} strokeWidth={2.2} aria-hidden="true" />
                <span>{activeNav.label}</span>
              </span>
              <button
                type="button"
                className="compact-dock-trigger"
                aria-haspopup="dialog"
                aria-expanded={navMenuOpen}
                aria-label={`Navigation menu, current page ${activeNav.label}`}
                onClick={() => setNavMenuOpen(true)}
              >
                <Menu size={18} aria-hidden="true" />
                <span>Menu</span>
              </button>
            </div>
          ) : (
            <ul ref={dockListRef}>
              {primaryNav.map(({ to, label, icon: Icon }) => {
                const selected = pathname === to || (label === 'Academics' && isAcademics);
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      data-selected={selected}
                      aria-current={pathname === to ? 'page' : undefined}
                    >
                      <Icon
                        size={21}
                        strokeWidth={selected ? 2.15 : 1.75}
                        aria-hidden="true"
                      />
                      <span>{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        <Dialog
          open={navMenuOpen}
          onClose={() => setNavMenuOpen(false)}
          title="Navigation"
          description="Jump to any CampusOne section."
        >
          <nav aria-label="All destinations" className="compact-nav-list">
            {primaryNav.map(({ to, label, icon: Icon }) => {
              const selected = pathname === to || (label === 'Academics' && isAcademics);
              return (
                <Link
                  key={to}
                  to={to}
                  className="compact-nav-link"
                  data-selected={selected}
                  aria-current={pathname === to ? 'page' : undefined}
                  onClick={() => setNavMenuOpen(false)}
                >
                  <Icon size={20} strokeWidth={selected ? 2.2 : 1.75} aria-hidden="true" />
                  <span>{label}</span>
                  {selected && <Check size={18} aria-hidden="true" />}
                </Link>
              );
            })}
          </nav>
        </Dialog>

        <Dialog
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          title="Profile & appearance"
        >
          <div className="profile-sheet">
            <div className="profile-identity">
              <span className="student-monogram" aria-hidden="true">
                {initials}
              </span>
              <div>
                <strong>{DEMO_STUDENT.name}</strong>
                <p>
                  {DEMO_STUDENT.rollNumber} · {DEMO_STUDENT.program}
                </p>
              </div>
            </div>
            <h3>Appearance</h3>
            <div className="appearance-group" role="group" aria-label="Appearance">
              {appearances.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={themePreference === value}
                  onClick={() => onThemeChange(value)}
                >
                  <Icon size={19} aria-hidden="true" />
                  <span>{label}</span>
                  {themePreference === value && <Check size={18} aria-hidden="true" />}
                </button>
              ))}
            </div>
            {persistenceFailed && (
              <p className="profile-note" role="status">
                Browser storage is blocked or full. Theme changes stay active only until reload.
              </p>
            )}
          </div>
        </Dialog>
      </div>
    </ShellChromeContext.Provider>
  );
}
