import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, Compass, GraduationCap, LayoutGrid, Wallet, ChevronRight, Monitor, Moon, Sun, Check } from 'lucide-react';
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
  { to: '/fees', label: 'Fees', icon: Wallet, ChevronRight, Monitor, Moon, Sun, Check },
  { to: '/events', label: 'Events', icon: Compass },
] as const;

const appearances = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const;

const initials = DEMO_STUDENT.name.split(' ').map((name) => name[0]).join('');

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
  const previousPath = useRef(pathname);
  const [profileOpen, setProfileOpen] = useState(false);

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

      <nav aria-label="Primary" className="campus-dock">
        <ul>
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
      </nav>
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
