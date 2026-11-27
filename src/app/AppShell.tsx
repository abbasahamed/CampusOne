import { useEffect, useRef, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { CalendarDays, Compass, GraduationCap, LayoutGrid, Wallet } from 'lucide-react';
import { DEMO_STUDENT } from '../data/demoData';
import type { ThemePreference } from '../lib/theme';
import { AppearanceControl } from './AppearanceControl';
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

const academicsNav = [
  { to: '/academics/attendance', label: 'Attendance' },
  { to: '/academics/marks', label: 'Marks & Academics' },
] as const;

function Brand() {
  return (
    <Link to="/today" className="campus-brand">
      <img src="/campusone.svg" width="36" height="36" alt="" />
      <span>Campus<span className="campus-brand-accent">One</span></span>
    </Link>
  );
}

function AcademicLinks() {
  return academicsNav.map(({ to, label }) => (
    <NavLink key={to} to={to} end>{label}</NavLink>
  ));
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
  const previousPath = useRef(pathname);
  const appearance = {
    value: themePreference,
    onChange: onThemeChange,
  };

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
          {primaryNav.map(({ to, label, icon: Icon }) => (
            <div key={to}>
              <Link
                to={to}
                className="sidebar-link"
                data-selected={pathname === to || (label === 'Academics' && isAcademics)}
                aria-current={pathname === to && label !== 'Academics' ? 'page' : undefined}
              >
                <Icon size={20} aria-hidden="true" />
                {label}
              </Link>
              {label === 'Academics' && isAcademics && (
                <div className="academic-links"><AcademicLinks /></div>
              )}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <AppearanceControl {...appearance} />
          {persistenceFailed && <p className="appearance-notice" role="status">Theme applies to this session only.</p>}
          <div className="sidebar-student">
            <span className="student-monogram" aria-hidden="true">
              {DEMO_STUDENT.name.split(' ').map((name) => name[0]).join('')}
            </span>
            <div>
              <strong>{DEMO_STUDENT.name}</strong>
              <span>{DEMO_STUDENT.rollNumber}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="campus-content">
        <header className="mobile-header">
          <div className="mobile-header-inner">
            <Brand />
            <AppearanceControl {...appearance} />
          </div>
          {persistenceFailed && <p className="appearance-notice" role="status">Theme applies to this session only.</p>}
          {isAcademics && (
            <nav aria-label="Academics sections" className="academic-links"><AcademicLinks /></nav>
          )}
        </header>

        <main id="main-content" ref={mainRef} tabIndex={-1} className="campus-main">
          {children}
        </main>
      </div>

      <nav aria-label="Primary" className="campus-dock">
        <ul>
          {primaryNav.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                data-selected={pathname === to || (label === 'Academics' && isAcademics)}
                aria-current={pathname === to ? 'page' : undefined}
              >
                <Icon size={20} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
