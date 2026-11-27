import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  Check,
  ChevronRight,
  Compass,
  GraduationCap,
  LayoutGrid,
  Menu,
  Monitor,
  Moon,
  Sun,
  Wallet,
} from 'lucide-react';
import { DEMO_STUDENT } from '../data/demoData';
import type { ThemePreference } from '../lib/theme';
import { Dialog } from '../components/Dialog';
import './shell.css';

interface AppShellProps {
  themePreference: ThemePreference;
  onThemeChange: (next: ThemePreference) => void;
  persistenceFailed: boolean;
  children: ReactNode;
}

const primaryNav = [
  { to: '/today', label: 'Today', icon: LayoutGrid },
  { to: '/academics/attendance', label: 'Academics', icon: GraduationCap },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/fees', label: 'Fees', icon: Wallet },
  { to: '/events', label: 'Events', icon: Compass },
] as const;

const appearances = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const;

const initials = DEMO_STUDENT.name.split(' ').map((name) => name[0]).join('');

function isViewportScaledTooNarrow(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(min-width: 960px)').matches) return false;
  const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  return window.innerWidth < rootPx * 19.75;
}

function Brand() {
  return (
    <Link to="/today" className="campus-brand">
      <img src="/campusone.svg" width="36" height="36" alt="" />
      <span>Campus<span className="campus-brand-accent">One</span></span>
    </Link>
  );
}

export function AppShell({
  themePreference,
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
  const [compactDock, setCompactDock] = useState<boolean>(() => isViewportScaledTooNarrow());

  const activeNav =
    primaryNav.find((item) => pathname === item.to || (item.label === 'Academics' && isAcademics)) ??
    primaryNav[0];
  const ActiveNavIcon = activeNav.icon;

  const measureDockFit = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(min-width: 960px)').matches) {
      setCompactDock(false);
      setNavMenuOpen(false);
      return;
    }
    if (isViewportScaledTooNarrow()) {
      setCompactDock(true);
      return;
    }
    const list = dockListRef.current;
    if (!list) {
      setCompactDock(false);
      return;
    }
    const labels = list.querySelectorAll('span');
    const clipped = Array.from(labels).some((el) => el.scrollWidth > el.clientWidth + 1);
    setCompactDock(clipped);
  }, []);

  useLayoutEffect(() => {
    const id = window.requestAnimationFrame(measureDockFit);
    return () => window.cancelAnimationFrame(id);
  }, [measureDockFit]);

  useEffect(() => {
    const handleEnvironmentChange = () => {
      if (isViewportScaledTooNarrow()) {
        setCompactDock(true);
      } else {
        setCompactDock(false);
        window.requestAnimationFrame(measureDockFit);
      }
    };

    window.addEventListener('resize', handleEnvironmentChange);
    const ro =
      typeof ResizeObserver !== 'undefined' && dockListRef.current
        ? new ResizeObserver(() => window.requestAnimationFrame(measureDockFit))
        : null;
    if (ro && dockListRef.current) ro.observe(dockListRef.current);

    const mo =
      typeof MutationObserver !== 'undefined'
        ? new MutationObserver(() => handleEnvironmentChange())
        : null;
    mo?.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });

    void document.fonts?.ready.then(() => {
      window.requestAnimationFrame(measureDockFit);
    });

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
    <div className="campus-shell">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <aside className="campus-sidebar">
        <Brand />
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
                  <Icon size={20} strokeWidth={selected ? 2.2 : 1.75} aria-hidden="true" />
                  {label}
                </Link>
              </div>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button type="button" className="sidebar-student" aria-label="Profile and appearance" onClick={() => setProfileOpen(true)}>
            <span className="student-monogram" aria-hidden="true">{initials}</span>
            <span className="profile-name">
              <strong>{DEMO_STUDENT.name}</strong>
              <span>Profile & appearance</span>
            </span>
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        </div>
      </aside>

      <div className="campus-content">
        <main id="main-content" ref={mainRef} tabIndex={-1} className="campus-main">
          {pathname === '/today' && (
            <button type="button" className="mobile-profile student-monogram" aria-label="Profile and appearance" onClick={() => setProfileOpen(true)}>
              {initials}
            </button>
          )}
          {children}
        </main>
      </div>

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
                    <Icon size={20} strokeWidth={selected ? 2.2 : 1.75} fill={selected && label === 'Today' ? 'currentColor' : 'none'} aria-hidden="true" />
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
      <Dialog open={profileOpen} onClose={() => setProfileOpen(false)} title="Profile & appearance">
        <div className="profile-sheet">
          <div className="profile-identity">
            <span className="student-monogram" aria-hidden="true">{initials}</span>
            <div><strong>{DEMO_STUDENT.name}</strong><p>{DEMO_STUDENT.program}</p></div>
          </div>
          <h3>Appearance</h3>
          <div className="appearance-group" role="group" aria-label="Appearance">
            {appearances.map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" aria-pressed={themePreference === value} onClick={() => onThemeChange(value)}>
                <Icon size={19} aria-hidden="true" />
                <span>{label}</span>
                {themePreference === value && <Check size={18} aria-hidden="true" />}
              </button>
            ))}
          </div>
          {persistenceFailed && <p className="profile-note" role="status">Appearance applies to this session only.</p>}
          <p className="profile-note">CampusOne demo. Student records, payments and registrations are simulated.</p>
        </div>
      </Dialog>
    </div>
  );
}
